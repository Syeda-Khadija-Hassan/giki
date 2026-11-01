# backend/app/routes/warden.py
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, UserRole, GatePass, RequestStatus, ParentConsentStatus, WhatsAppDeliveryStatus
from ..schemas import GatePassResponse, WardenDecisionRequest, mask_phone_number
from ..security import require_role, generate_pass_signature
from ..services.whatsapp_service import (
    send_whatsapp_parent_consent,
    generate_confirmation_reference,
)

router = APIRouter(prefix="/api/warden/passes", tags=["Warden Gate Passes"])


def format_warden_pass_response(p: GatePass, u: User) -> GatePassResponse:
    return GatePassResponse(
        id=p.id,
        student_id=p.student_id,
        student_name=u.full_name,
        student_email=u.email,
        registration_number=u.registration_number,
        student_phone=u.student_phone,
        hostel=u.hostel,
        room_number=u.room_number,
        parent_name=u.parent_name,
        parent_phone_masked=mask_phone_number(u.parent_phone),
        reason=p.reason,
        destination=p.destination,
        departure_time=p.departure_time,
        expected_return_time=p.expected_return_time,
        status=p.status,
        parent_consent_status=p.parent_consent_status,
        parent_response_at=p.parent_response_at,
        parent_message_status=p.parent_message_status,
        parent_message_sent_at=p.parent_message_sent_at,
        parent_message_error=p.parent_message_error,
        confirmation_reference=p.confirmation_reference,
        warden_id=p.warden_id,
        warden_remarks=p.warden_remarks,
        warden_decision_at=p.warden_decision_at,
        signed_token=p.signed_token,
        approved_at=p.approved_at,
        actual_exit_time=p.actual_exit_time,
        actual_return_time=p.actual_return_time,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


@router.get("", response_model=List[GatePassResponse])
def get_all_passes_for_warden(
    current_user: User = Depends(require_role(UserRole.WARDEN)),
    db: Session = Depends(get_db),
):
    passes = (
        db.query(GatePass)
        .join(User, GatePass.student_id == User.id)
        .order_by(GatePass.created_at.desc())
        .all()
    )
    result = []
    for p in passes:
        student = db.query(User).filter(User.id == p.student_id).first()
        result.append(format_warden_pass_response(p, student))
    return result


@router.get("/{pass_id}", response_model=GatePassResponse)
def get_pass_by_id(
    pass_id: int,
    current_user: User = Depends(require_role(UserRole.WARDEN)),
    db: Session = Depends(get_db),
):
    gate_pass = db.query(GatePass).filter(GatePass.id == pass_id).first()
    if not gate_pass:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gate pass not found.")
    student = db.query(User).filter(User.id == gate_pass.student_id).first()
    return format_warden_pass_response(gate_pass, student)


@router.post("/{pass_id}/request-parent-consent", response_model=GatePassResponse)
async def request_parent_consent(
    pass_id: int,
    current_user: User = Depends(require_role(UserRole.WARDEN)),
    db: Session = Depends(get_db),
):
    gate_pass = db.query(GatePass).filter(GatePass.id == pass_id).first()
    if not gate_pass:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gate pass not found.")

    if gate_pass.status != RequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot request parent consent for pass in status '{gate_pass.status.value}'.",
        )

    student = db.query(User).filter(User.id == gate_pass.student_id).first()
    if not student.parent_phone or not student.parent_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student has no registered parent contact information.",
        )

    # Generate secure correlation reference
    conf_ref = generate_confirmation_reference()
    gate_pass.confirmation_reference = conf_ref
    gate_pass.parent_consent_status = ParentConsentStatus.MESSAGE_PENDING
    gate_pass.parent_message_status = WhatsAppDeliveryStatus.QUEUED
    db.commit()

    # Trigger outbound WhatsApp dispatch
    delivery_status, msg_id, error_or_info = await send_whatsapp_parent_consent(
        parent_phone=student.parent_phone,
        parent_name=student.parent_name,
        student_name=student.full_name,
        registration_number=student.registration_number,
        destination=gate_pass.destination,
        reason=gate_pass.reason,
        departure_time=gate_pass.departure_time,
        expected_return_time=gate_pass.expected_return_time,
        confirmation_ref=conf_ref,
    )

    gate_pass.parent_message_status = delivery_status
    gate_pass.parent_message_sent_at = datetime.utcnow()
    gate_pass.parent_message_error = error_or_info if delivery_status == WhatsAppDeliveryStatus.FAILED else None

    if delivery_status in [WhatsAppDeliveryStatus.SENT, WhatsAppDeliveryStatus.DELIVERED]:
        gate_pass.parent_consent_status = ParentConsentStatus.AWAITING_RESPONSE
    else:
        gate_pass.parent_consent_status = ParentConsentStatus.DELIVERY_FAILED

    db.commit()
    db.refresh(gate_pass)
    return format_warden_pass_response(gate_pass, student)


@router.patch("/{pass_id}/decision", response_model=GatePassResponse)
def make_warden_decision(
    pass_id: int,
    req: WardenDecisionRequest,
    current_user: User = Depends(require_role(UserRole.WARDEN)),
    db: Session = Depends(get_db),
):
    gate_pass = db.query(GatePass).filter(GatePass.id == pass_id).first()
    if not gate_pass:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gate pass not found.")

    if gate_pass.status != RequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Pass is already finalized with status '{gate_pass.status.value}'. Duplicate decisions prohibited.",
        )

    student = db.query(User).filter(User.id == gate_pass.student_id).first()

    # Mandatory remarks enforcement
    if not req.remarks or len(req.remarks.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mandatory remarks are required for all warden decisions.",
        )

    # REJECTION CAN OCCUR AT ANY TIME
    if req.decision == RequestStatus.REJECTED:
        gate_pass.status = RequestStatus.REJECTED
        gate_pass.warden_id = current_user.id
        gate_pass.warden_remarks = req.remarks.strip()
        gate_pass.warden_decision_at = datetime.utcnow()
        gate_pass.signed_token = None
        db.commit()
        db.refresh(gate_pass)
        return format_warden_pass_response(gate_pass, student)

    # APPROVAL STRICTLY REQUIRES PARENTAL YES
    if req.decision == RequestStatus.APPROVED:
        if gate_pass.parent_consent_status == ParentConsentStatus.NO:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent/Guardian denied permission. This request cannot be approved.",
            )
        if gate_pass.parent_consent_status != ParentConsentStatus.YES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot approve request: Mandatory parent WhatsApp consent has not been granted (status is not YES).",
            )

        now = datetime.utcnow()
        gate_pass.status = RequestStatus.APPROVED
        gate_pass.warden_id = current_user.id
        gate_pass.warden_remarks = req.remarks.strip()
        gate_pass.warden_decision_at = now
        gate_pass.approved_at = now

        # Generate cryptographic HMAC-SHA256 signed gate pass token
        signed_token = generate_pass_signature(
            pass_id=gate_pass.id,
            student_id=gate_pass.student_id,
            destination=gate_pass.destination,
            departure_time=gate_pass.departure_time,
            expected_return_time=gate_pass.expected_return_time,
            approved_at=now,
        )
        gate_pass.signed_token = signed_token

        db.commit()
        db.refresh(gate_pass)
        return format_warden_pass_response(gate_pass, student)

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid decision.")
