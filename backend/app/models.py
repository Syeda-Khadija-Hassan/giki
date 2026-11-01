# backend/app/models.py
from datetime import datetime
import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from .database import Base


class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    WARDEN = "WARDEN"
    SECURITY = "SECURITY"


class RequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ParentConsentStatus(str, enum.Enum):
    NOT_REQUESTED = "NOT_REQUESTED"
    MESSAGE_PENDING = "MESSAGE_PENDING"
    AWAITING_RESPONSE = "AWAITING_RESPONSE"
    YES = "YES"
    NO = "NO"
    DELIVERY_FAILED = "DELIVERY_FAILED"


class WhatsAppDeliveryStatus(str, enum.Enum):
    NOT_SENT = "NOT_SENT"
    QUEUED = "QUEUED"
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    READ = "READ"
    FAILED = "FAILED"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    registration_number = Column(String(20), unique=True, nullable=True, index=True)
    student_phone = Column(String(30), nullable=True)
    parent_name = Column(String(120), nullable=True)
    parent_phone = Column(String(30), nullable=True)
    hostel = Column(String(50), nullable=True)
    room_number = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    passes = relationship("GatePass", back_populates="student", foreign_keys="GatePass.student_id")


class GatePass(Base):
    __tablename__ = "gate_passes"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    reason = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)
    departure_time = Column(DateTime, nullable=False)
    expected_return_time = Column(DateTime, nullable=False)
    
    # Workflow statuses
    status = Column(Enum(RequestStatus), default=RequestStatus.PENDING, nullable=False, index=True)
    parent_consent_status = Column(
        Enum(ParentConsentStatus), default=ParentConsentStatus.NOT_REQUESTED, nullable=False, index=True
    )
    parent_response_at = Column(DateTime, nullable=True)
    parent_response_message_id = Column(String(100), nullable=True)
    
    parent_message_status = Column(
        Enum(WhatsAppDeliveryStatus), default=WhatsAppDeliveryStatus.NOT_SENT, nullable=False
    )
    parent_message_sent_at = Column(DateTime, nullable=True)
    parent_message_error = Column(Text, nullable=True)
    confirmation_reference = Column(String(64), unique=True, nullable=True, index=True)

    warden_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    warden_remarks = Column(Text, nullable=True)
    warden_decision_at = Column(DateTime, nullable=True)

    # HMAC-SHA256 signed gate pass token, only populated after both parent YES and warden APPROVED
    signed_token = Column(String(255), unique=True, nullable=True, index=True)
    approved_at = Column(DateTime, nullable=True)

    # Physical gate checkpoint tracking
    actual_exit_time = Column(DateTime, nullable=True)
    actual_return_time = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    student = relationship("User", back_populates="passes", foreign_keys=[student_id])
    warden = relationship("User", foreign_keys=[warden_id])
