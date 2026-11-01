# backend/app/routes/gate.py
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import GatePass, RequestStatus, ParentConsentStatus, User, UserRole
from ..schemas import GateVerifyRequest, GateActionResponse
from ..security import verify_pass_signature, require_role

router = APIRouter(prefix="/api/gate", tags=["Gate Checkpoint Security"])


@router.post("/verify", response_model=GateActionResponse)
def verify_gate_pass(
    req: GateVerifyRequest,
    current_user: User = Depends(require_role(UserRole.SECURITY, UserRole.WARDEN)),
    db: Session = Depends(get_db),
):
    token = req.signed_token.strip()
    if not token or not token.startswith("GW-PASS-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid gate pass format. Must follow format 'GW-PASS-{id}-{signature}'.",
        )

    parts = token.split("-")
    if len(parts) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed token structure.",
        )

    try:
        pass_id = int(parts[2])
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid pass ID encoded in token.",
        )

    gate_pass = db.query(GatePass).filter(GatePass.id == pass_id).first()
    if not gate_pass:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No gate pass record found for the provided token.",
        )

    student = db.query(User).filter(User.id == gate_pass.student_id).first()

    # Precondition check 1: Status must be APPROVED
    if gate_pass.status != RequestStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Pass is not valid for campus exit. Current status is '{gate_pass.status.value}'.",
        )

    # Precondition check 2: Parent consent must be YES
    if gate_pass.parent_consent_status != ParentConsentStatus.YES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Security violation: Parental consent was not granted for this pass.",
        )

    # Precondition check 3: Cryptographic HMAC signature integrity
    if not gate_pass.approved_at or not verify_pass_signature(
        token=token,
        pass_id=gate_pass.id,
        student_id=gate_pass.student_id,
        destination=gate_pass.destination,
        departure_time=gate_pass.departure_time,
        expected_return_time=gate_pass.expected_return_time,
        approved_at=gate_pass.approved_at,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tampered or counterfeit digital token! Cryptographic HMAC-SHA256 signature verification failed.",
        )

    # Precondition check 4: Has the return window elapsed?
    now = datetime.utcnow()
    if now > gate_pass.expected_return_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Expired pass. Expected return time was {gate_pass.expected_return_time.isoformat()}.",
        )

    # Precondition check 5: Check if pass is already completed
    if gate_pass.actual_return_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This gate pass has already been used and completed (student already returned).",
        )

    return GateActionResponse(
        success=True,
        message="Pass verified: Authenticated, parental consent confirmed, and valid cryptographic signature.",
        pass_id=gate_pass.id,
        student_name=student.full_name if student else "Unknown Student",
        registration_number=student.registration_number if student else None,
        destination=gate_pass.destination,
        departure_time=gate_pass.departure_time,
        expected_return_time=gate_pass.expected_return_time,
        action_time=now,
        action_type="VERIFIED",
    )


@router.post("/exit", response_model=GateActionResponse)
def log_student_exit(
    req: GateVerifyRequest,
    current_user: User = Depends(require_role(UserRole.SECURITY, UserRole.WARDEN)),
    db: Session = Depends(get_db),
):
    # First verify
    verify_resp = verify_gate_pass(req, current_user, db)
    gate_pass = db.query(GatePass).filter(GatePass.id == verify_resp.pass_id).first()

    if gate_pass.actual_exit_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student has already exited campus at {gate_pass.actual_exit_time.isoformat()}.",
        )

    now = datetime.utcnow()
    gate_pass.actual_exit_time = now
    db.commit()

    return GateActionResponse(
        success=True,
        message="Student exit recorded successfully at main gate.",
        pass_id=gate_pass.id,
        student_name=verify_resp.student_name,
        registration_number=verify_resp.registration_number,
        destination=gate_pass.destination,
        departure_time=gate_pass.departure_time,
        expected_return_time=gate_pass.expected_return_time,
        action_time=now,
        action_type="EXIT",
    )


@router.post("/return", response_model=GateActionResponse)
def log_student_return(
    req: GateVerifyRequest,
    current_user: User = Depends(require_role(UserRole.SECURITY, UserRole.WARDEN)),
    db: Session = Depends(get_db),
):
    parts = req.signed_token.strip().split("-")
    if len(parts) < 4:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed token.")

    pass_id = int(parts[2])
    gate_pass = db.query(GatePass).filter(GatePass.id == pass_id).first()
    if not gate_pass:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pass not found.")

    student = db.query(User).filter(User.id == gate_pass.student_id).first()

    if not gate_pass.actual_exit_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student has not yet logged departure from campus.",
        )

    if gate_pass.actual_return_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student return has already been logged previously.",
        )

    now = datetime.utcnow()
    gate_pass.actual_return_time = now
    db.commit()

    return GateActionResponse(
        success=True,
        message="Student return to campus confirmed and recorded.",
        pass_id=gate_pass.id,
        student_name=student.full_name if student else "Unknown Student",
        registration_number=student.registration_number if student else None,
        destination=gate_pass.destination,
        departure_time=gate_pass.departure_time,
        expected_return_time=gate_pass.expected_return_time,
        action_time=now,
        action_type="RETURN",
    )
