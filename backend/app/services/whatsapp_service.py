# backend/app/services/whatsapp_service.py
import hashlib
import hmac
import os
import secrets
from datetime import datetime
from typing import Dict, Any, Tuple
import httpx
from ..models import WhatsAppDeliveryStatus

WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
WHATSAPP_APP_SECRET = os.getenv("WHATSAPP_APP_SECRET", "mock_app_secret_giki_women")
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "giki_women_whatsapp_verify_token_2026")
WHATSAPP_API_VERSION = os.getenv("WHATSAPP_API_VERSION", "v21.0")
WHATSAPP_SIMULATION_MODE = os.getenv("WHATSAPP_SIMULATION_MODE", "true").lower() == "true"


def generate_confirmation_reference() -> str:
    """Generate a high-entropy, secure unique reference for correlation."""
    return f"REF-{secrets.token_hex(16).upper()}"


def build_parent_consent_message(
    parent_name: str,
    student_name: str,
    registration_number: str,
    destination: str,
    reason: str,
    departure_str: str,
    return_str: str,
    confirmation_ref: str,
) -> str:
    return (
        f"GIKI FOR WOMEN — PARENT CONSENT REQUEST\n\n"
        f"Dear {parent_name},\n\n"
        f"Your daughter {student_name}, Registration No. {registration_number}, has requested permission to leave campus.\n\n"
        f"Exit Details:\n"
        f"Destination: {destination}\n"
        f"Reason: {reason}\n"
        f"Departure: {departure_str}\n"
        f"Expected Return: {return_str}\n"
        f"Reference: {confirmation_ref}\n\n"
        f"Please confirm whether you grant permission for this exit request.\n\n"
        f"Reply:\n"
        f"YES — I grant permission.\n"
        f"NO — I do not grant permission.\n\n"
        f"Your response will be securely recorded and forwarded to the hostel warden for the final decision.\n\n"
        f"Academic Prototype — This system does not provide official GIKI authorization."
    )


async def send_whatsapp_parent_consent(
    parent_phone: str,
    parent_name: str,
    student_name: str,
    registration_number: str,
    destination: str,
    reason: str,
    departure_time: datetime,
    expected_return_time: datetime,
    confirmation_ref: str,
) -> Tuple[WhatsAppDeliveryStatus, str, str]:
    """
    Sends WhatsApp message via Meta Cloud API or enters simulation mode.
    Returns: (delivery_status, message_id_or_ref, error_or_preview)
    """
    dep_str = departure_time.strftime("%A, %d %b %Y at %I:%M %p")
    ret_str = expected_return_time.strftime("%A, %d %b %Y at %I:%M %p")

    message_body = build_parent_consent_message(
        parent_name=parent_name,
        student_name=student_name,
        registration_number=registration_number or "N/A",
        destination=destination,
        reason=reason,
        departure_str=dep_str,
        return_str=ret_str,
        confirmation_ref=confirmation_ref,
    )

    # If simulation mode is active or token is placeholder
    if WHATSAPP_SIMULATION_MODE or not WHATSAPP_ACCESS_TOKEN or WHATSAPP_ACCESS_TOKEN.startswith("your_"):
        simulated_msg_id = f"wamid.SIMULATED_{secrets.token_hex(8)}"
        return (
            WhatsAppDeliveryStatus.SENT,
            simulated_msg_id,
            f"[DEVELOPMENT SIMULATION] Outbound message generated for {parent_phone}:\n{message_body}",
        )

    url = f"https://graph.facebook.com/{WHATSAPP_API_VERSION}/{WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": parent_phone.replace("+", ""),
        "type": "text",
        "text": {"body": message_body},
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                msg_id = data.get("messages", [{}])[0].get("id", f"wamid.{secrets.token_hex(8)}")
                return WhatsAppDeliveryStatus.SENT, msg_id, ""
            else:
                err_text = resp.text
                return WhatsAppDeliveryStatus.FAILED, "", f"Meta API error ({resp.status_code}): {err_text}"
    except Exception as exc:
        return WhatsAppDeliveryStatus.FAILED, "", f"HTTP connection failure: {str(exc)}"


def verify_meta_webhook_signature(raw_body: bytes, signature_header: str) -> bool:
    """Validate X-Hub-Signature-256 against raw body using WHATSAPP_APP_SECRET."""
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    signature_hash = signature_header.split("sha256=")[1]
    expected_hash = hmac.new(
        WHATSAPP_APP_SECRET.encode("utf-8"), raw_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature_hash, expected_hash)
