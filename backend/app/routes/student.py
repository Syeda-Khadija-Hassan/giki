# backend/app/routes/student.py
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, UserRole, GatePass, RequestStatus, ParentConsentStatus, WhatsAppDeliveryStatus
from ..schemas import GatePassCreateRequest, GatePassResponse, mask_phone_number
from ..security import require_role

router = APIRouter(prefix="/api/student/passes", tags=["Student Gate Passes"])


def format_pass_response(p: GatePass, u: User) -> GatePassResponse:
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
        signed_token=p.signed_token if p.status == RequestStatus.APPROVED else None,
        approved_at=p.approved_at,
        actual_exit_time=p.actual_exit_time,
        actual_return_time=p.actual_return_time,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


@router.post("", response_model=GatePassResponse, status_code=status.HTTP_201_CREATED)
def create_exit_request(
    req: GatePassCreateRequest,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db),
):
    # Validation 1: Student must have registered contact numbers
    if not current_user.student_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student account missing registered contact number. Update profile first.",
        )
    if not current_user.parent_phone or not current_user.parent_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parent/guardian name and WhatsApp contact number are mandatory for exit requests.",
        )

    # Validation 2: Return must be later than departure
    if req.expected_return_time <= req.departure_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expected return time must be strictly later than departure time.",
        )

    # Validation 3: Departure must not be in the past
    now = datetime.utcnow()
    if req.departure_time < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Departure time cannot be in the past.",
        )

    new_pass = GatePass(
        student_id=current_user.id,
        reason=req.reason.strip(),
        destination=req.destination.strip(),
        departure_time=req.departure_time,
        expected_return_time=req.expected_return_time,
        status=RequestStatus.PENDING,
        parent_consent_status=ParentConsentStatus.NOT_REQUESTED,
        parent_message_status=WhatsAppDeliveryStatus.NOT_SENT,
        signed_token=None,  # Strictly NULL until final approval
    )
    db.add(new_pass)
    db.commit()
    db.refresh(new_pass)

    return format_pass_response(new_pass, current_user)


@router.get("", response_model=List[GatePassResponse])
def get_my_requests(
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db),
):
    passes = (
        db.query(GatePass)
        .filter(GatePass.student_id == current_user.id)
        .order_by(GatePass.created_at.desc())
        .all()
    )
    return [format_pass_response(p, current_user) for p in passes]


@router.get("/{pass_id}", response_model=GatePassResponse)
def get_my_request_by_id(
    pass_id: int,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db),
):
    gate_pass = (
        db.query(GatePass)
        .filter(GatePass.id == pass_id, GatePass.student_id == current_user.id)
        .first()
    )
    if not gate_pass:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exit pass not found or access denied.",
        )
    return format_pass_response(gate_pass, current_user)
