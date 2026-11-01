# backend/app/routes/auth.py
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, UserRole
from ..schemas import (
    StudentRegisterRequest,
    LoginRequest,
    TokenResponse,
    UserProfileResponse,
    mask_phone_number,
)
from ..security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_student(req: StudentRegisterRequest, db: Session = Depends(get_db)):
    # Check duplicate email
    existing_user = db.query(User).filter(User.email == req.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An account with email {req.email} already exists.",
        )

    # Check duplicate registration number
    existing_reg = db.query(User).filter(User.registration_number == req.registration_number).first()
    if existing_reg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration number {req.registration_number} is already registered.",
        )

    user = User(
        full_name=req.full_name,
        email=req.email,
        hashed_password=get_password_hash(req.password),
        role=UserRole.STUDENT,
        registration_number=req.registration_number,
        student_phone=req.student_phone,
        parent_name=req.parent_name,
        parent_phone=req.parent_phone,
        hostel=req.hostel,
        room_number=req.room_number,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": user.id, "role": user.role.value})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
    )


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid institutional email or password.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact hostel administration.",
        )

    token = create_access_token(data={"sub": user.id, "role": user.role.value})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
    )


@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserProfileResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        role=current_user.role,
        registration_number=current_user.registration_number,
        student_phone=current_user.student_phone,
        parent_name=current_user.parent_name,
        parent_phone_masked=mask_phone_number(current_user.parent_phone),
        hostel=current_user.hostel,
        room_number=current_user.room_number,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
    )


@router.post("/seed")
def seed_database(db: Session = Depends(get_db)):
    """Idempotently seed default student and warden demonstration accounts."""
    seeded = []

    # Student demo account per prompt
    student = db.query(User).filter(User.email == "u2024626@giki.edu.pk").first()
    if not student:
        student = User(
            full_name="Syeda Khadija Hassan",
            email="u2024626@giki.edu.pk",
            hashed_password=get_password_hash("student123"),
            role=UserRole.STUDENT,
            registration_number="2024626",
            student_phone="+923001234567",
            parent_name="Syed Hassan (Father)",
            parent_phone="+923009876543",
            hostel="Hostel 8",
            room_number="204",
            is_active=True,
        )
        db.add(student)
        seeded.append("Student: u2024626@giki.edu.pk (pwd: student123)")

    # Warden demo account
    warden = db.query(User).filter(User.email == "warden@giki.edu.pk").first()
    if not warden:
        warden = User(
            full_name="Hostel 8 Chief Warden",
            email="warden@giki.edu.pk",
            hashed_password=get_password_hash("warden123"),
            role=UserRole.WARDEN,
            registration_number=None,
            student_phone="+923007654321",
            parent_name=None,
            parent_phone=None,
            hostel="Hostel 8",
            room_number="Office 1",
            is_active=True,
        )
        db.add(warden)
        seeded.append("Warden: warden@giki.edu.pk (pwd: warden123)")

    # Gate Security demo account
    security = db.query(User).filter(User.email == "security@giki.edu.pk").first()
    if not security:
        security = User(
            full_name="Main Gate Security Officer",
            email="security@giki.edu.pk",
            hashed_password=get_password_hash("security123"),
            role=UserRole.SECURITY,
            registration_number=None,
            student_phone="+923001122334",
            parent_name=None,
            parent_phone=None,
            hostel=None,
            room_number="Main Gate Guard Post",
            is_active=True,
        )
        db.add(security)
        seeded.append("Security: security@giki.edu.pk (pwd: security123)")

    db.commit()
    return {"message": "Database seeded successfully.", "accounts": seeded}
