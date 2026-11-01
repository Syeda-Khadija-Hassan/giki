# backend/app/routes/whatsapp_webhook.py
from datetime import datetime
import json
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, Response, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import GatePass, RequestStatus, ParentConsentStatus, User, WhatsAppDeliveryStatus
from ..schemas import WhatsAppSimulateRequest
from ..services.whatsapp_service import (
    WHATSAPP_VERIFY_TOKEN,
    verify_meta_webhook_signature,
    WHATSAPP_SIMULATION_MODE,
)

router = APIRouter(tags=["WhatsApp Webhook & Simulation"])


@router.get("/api/webhooks/whatsapp")
def verify_meta_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
):
    """Meta Cloud API Webhook verification challenge."""
    if hub_mode == "subscribe" and hub_verify_token == WHATSAPP_VERIFY_TOKEN:
        return Response(content=hub_challenge, media_type="text/plain")
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Verification token mismatch or invalid subscription mode.",
    )


@router.post("/api/webhooks/whatsapp")
async def receive_meta_whatsapp_webhook(
    request: Request,
    x_hub_signature_256: Optional[str] = Header(None, alias="X-Hub-Signature-256"),
    db: Session = Depends(get_db),
):
    """
    Receives incoming WhatsApp replies from parents.
    Enforces HMAC-SHA256 signature verification and idempotent processing.
    """
    raw_body = await request.body()

    # In production or non-simulation mode, signature check is strictly required
    if not WHATSAPP_SIMULATION_MODE or x_hub_signature_256:
        if not verify_meta_webhook_signature(raw_body, x_hub_signature_256 or ""):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid X-Hub-Signature-256 signature.",
            )

    try:
        data = json.loads(raw_body.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload.")

    # Parse standard Meta Cloud WhatsApp structure
    entries = data.get("entry", [])
    for entry in entries:
        changes = entry.get("changes", [])
        for change in changes:
            value = change.get("value", {})
            messages = value.get("messages", [])
            for msg in messages:
                from_phone = msg.get("from")  # e.g. "923009876543"
                normalized_phone = f"+{from_phone}" if from_phone and not from_phone.startswith("+") else from_phone
                text_obj = msg.get("text", {})
                raw_text = (text_obj.get("body") or "").strip().upper()
                msg_id = msg.get("id", "")

                # Find the pending pass associated with this parent's phone number
                student = db.query(User).filter(User.parent_phone == normalized_phone).first()
                if not student:
                    continue

                # Find the most recent active or awaiting pass for this student
                gate_pass = (
                    db.query(GatePass)
                    .filter(
                        GatePass.student_id == student.id,
                        GatePass.status == RequestStatus.PENDING,
                    )
                    .order_by(GatePass.created_at.desc())
                    .first()
                )

                if not gate_pass:
                    continue

                # Idempotency check: duplicate message ID
                if gate_pass.parent_response_message_id == msg_id:
                    continue

                now = datetime.utcnow()
                if raw_text == "YES" or "YES" in raw_text:
                    gate_pass.parent_consent_status = ParentConsentStatus.YES
                    gate_pass.parent_response_at = now
                    gate_pass.parent_response_message_id = msg_id
                    gate_pass.parent_message_status = WhatsAppDeliveryStatus.READ
                elif raw_text == "NO" or "NO" in raw_text:
                    gate_pass.parent_consent_status = ParentConsentStatus.NO
                    gate_pass.parent_response_at = now
                    gate_pass.parent_response_message_id = msg_id
                    gate_pass.parent_message_status = WhatsAppDeliveryStatus.READ
                # If message is not YES or NO, keep awaiting response

                db.commit()

    return {"status": "success", "processed": True}


@router.post("/api/whatsapp/simulate-reply")
def simulate_parent_reply(
    req: WhatsAppSimulateRequest,
    db: Session = Depends(get_db),
):
    """
    Development simulation endpoint for testing without real WhatsApp credentials.
    Clearly records that the response was simulated.
    """
    gate_pass = db.query(GatePass).filter(GatePass.id == req.pass_id).first()
    if not gate_pass:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pass not found.")

    if gate_pass.status != RequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Pass is already finalized as '{gate_pass.status.value}'. Cannot modify finalized pass.",
        )

    now = datetime.utcnow()
    reply_normalized = req.response_type.strip().upper()
    sim_msg_id = f"wamid.SIMULATED_REPLY_{now.timestamp()}"

    if reply_normalized == "YES":
        gate_pass.parent_consent_status = ParentConsentStatus.YES
        gate_pass.parent_response_at = now
        gate_pass.parent_response_message_id = sim_msg_id
        gate_pass.parent_message_status = WhatsAppDeliveryStatus.READ
        db.commit()
        return {
            "success": True,
            "simulated": True,
            "consent_status": "YES",
            "message": "Parent consent recorded as YES (Development Simulation). Ready for warden decision.",
        }
    elif reply_normalized == "NO":
        gate_pass.parent_consent_status = ParentConsentStatus.NO
        gate_pass.parent_response_at = now
        gate_pass.parent_response_message_id = sim_msg_id
        gate_pass.parent_message_status = WhatsAppDeliveryStatus.READ
        db.commit()
        return {
            "success": True,
            "simulated": True,
            "consent_status": "NO",
            "message": "Parent denied consent (Development Simulation). Request is now ineligible for approval.",
        }
    else:
        # Custom or ambiguous response
        return {
            "success": False,
            "simulated": True,
            "consent_status": gate_pass.parent_consent_status.value,
            "message": f"Received '{req.response_type}'. Only 'YES' or 'NO' are valid consent decisions. Pass remains awaiting response.",
        }
