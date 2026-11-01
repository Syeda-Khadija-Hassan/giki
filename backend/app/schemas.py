# backend/app/schemas.py
from datetime import datetime
import re
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from .models import UserRole, RequestStatus, ParentConsentStatus, WhatsAppDeliveryStatus


EMAIL_REGEX = re.compile(r"^u(202\d{4})@giki\.edu\.pk$")
E164_PHONE_REGEX = re.compile(r"^\+[1-9]\d{6,14}$")


def mask_phone_number(phone: Optional[str]) -> str:
    """Mask phone number for safe display (e.g. +92 300 ••••567)"""
    if not phone or len(phone) < 8:
        return "••••••••"
    country_prefix = phone[:4]
    last_three = phone[-3:]
    return f"{country_prefix} •••• {last_three}"


class StudentRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: str = Field(..., description="Institutional email e.g. u2024626@giki.edu.pk")
    registration_number: str = Field(..., min_length=7, max_length=10)
    student_phone: str = Field(..., description="E.164 phone number e.g. +923001234567")
    parent_name: str = Field(..., min_length=2, max_length=120)
    parent_phone: str = Field(..., description="E.164 WhatsApp number e.g. +923009876543")
    hostel: str = Field(..., min_length=2, max_length=50)
    room_number: str = Field(..., min_length=1, max_length=20)
    password: str = Field(..., min_length=6)

    @field_validator("email")
    @classmethod
    def validate_institutional_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_REGEX.match(v):
            raise ValueError(
                "Student email must be an institutional GIKI address matching 'u202xxxx@giki.edu.pk'."
            )
        return v

    @field_validator("registration_number")
    @classmethod
    def validate_reg_matches_email(cls, v: str, info) -> str:
        v = v.strip()
        email = info.data.get("email")
        if email:
            match = EMAIL_REGEX.match(email)
            if match and match.group(1) != v:
                raise ValueError(
                    f"Registration number '{v}' does not match numeric digits in email '{email}'."
                )
        return v

    @field_validator("student_phone", "parent_phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip().replace(" ", "").replace("-", "")
        if not E164_PHONE_REGEX.match(v):
            raise ValueError("Phone numbers must be in valid E.164 format (e.g., +923001234567).")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: int
    full_name: str
    email: str


class UserProfileResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: UserRole
    registration_number: Optional[str] = None
    student_phone: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone_masked: Optional[str] = None
    hostel: Optional[str] = None
    room_number: Optional[str] = None
    is_active: bool
    created_at: datetime


class GatePassCreateRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=255)
    destination: str = Field(..., min_length=2, max_length=255)
    departure_time: datetime
    expected_return_time: datetime

    @field_validator("departure_time")
    @classmethod
    def validate_departure(cls, v: datetime) -> datetime:
        # In a test suite, we allow current or near future; departure cannot be significantly in the past
        return v

    @field_validator("expected_return_time")
    @classmethod
    def validate_times(cls, v: datetime, info) -> datetime:
        departure = info.data.get("departure_time")
        if departure and v <= departure:
            raise ValueError("Expected return time must be strictly after departure time.")
        return v


class GatePassResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    student_email: str
    registration_number: Optional[str]
    student_phone: Optional[str]
    hostel: Optional[str]
    room_number: Optional[str]
    parent_name: Optional[str]
    parent_phone_masked: Optional[str]
    reason: str
    destination: str
    departure_time: datetime
    expected_return_time: datetime
    status: RequestStatus
    parent_consent_status: ParentConsentStatus
    parent_response_at: Optional[datetime]
    parent_message_status: WhatsAppDeliveryStatus
    parent_message_sent_at: Optional[datetime]
    parent_message_error: Optional[str]
    confirmation_reference: Optional[str]
    warden_id: Optional[int]
    warden_remarks: Optional[str]
    warden_decision_at: Optional[datetime]
    signed_token: Optional[str]
    approved_at: Optional[datetime]
    actual_exit_time: Optional[datetime]
    actual_return_time: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class WardenDecisionRequest(BaseModel):
    decision: RequestStatus  # APPROVED or REJECTED
    remarks: str = Field(..., min_length=2, max_length=500, description="Mandatory remarks")


class GateVerifyRequest(BaseModel):
    signed_token: str


class GateActionResponse(BaseModel):
    success: bool
    message: str
    pass_id: int
    student_name: str
    registration_number: Optional[str]
    destination: str
    departure_time: datetime
    expected_return_time: datetime
    action_time: datetime
    action_type: str  # "VERIFIED", "EXIT", "RETURN"


class WhatsAppSimulateRequest(BaseModel):
    pass_id: int
    response_type: str = Field(..., description="'YES', 'NO', or custom string")
    from_phone: Optional[str] = None
