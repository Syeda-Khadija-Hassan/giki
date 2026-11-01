# backend/tests/test_gate_pass.py
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.security import generate_pass_signature

# Use in-memory SQLite database for testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    client.post("/api/auth/seed")


def test_student_registration_validation():
    # 1. Valid institutional email accepted
    valid_res = client.post(
        "/api/auth/register",
        json={
            "full_name": "Amina Khan",
            "email": "u2024999@giki.edu.pk",
            "registration_number": "2024999",
            "student_phone": "+923001234500",
            "parent_name": "Tariq Khan",
            "parent_phone": "+923009876500",
            "hostel": "Hostel 8",
            "room_number": "101",
            "password": "password123",
        },
    )
    assert valid_res.status_code == 201

    # 2. Gmail rejected for student account
    gmail_res = client.post(
        "/api/auth/register",
        json={
            "full_name": "Fake Student",
            "email": "fake.student@gmail.com",
            "registration_number": "2024001",
            "student_phone": "+923001234501",
            "parent_name": "Parent",
            "parent_phone": "+923009876501",
            "hostel": "Hostel 8",
            "room_number": "102",
            "password": "password123",
        },
    )
    assert gmail_res.status_code == 422 or gmail_res.status_code == 400

    # 3. Registration number mismatch rejected
    mismatch_res = client.post(
        "/api/auth/register",
        json={
            "full_name": "Mismatch Student",
            "email": "u2024888@giki.edu.pk",
            "registration_number": "2024777",  # Mismatched!
            "student_phone": "+923001234502",
            "parent_name": "Parent",
            "parent_phone": "+923009876502",
            "hostel": "Hostel 8",
            "room_number": "103",
            "password": "password123",
        },
    )
    assert mismatch_res.status_code == 422 or mismatch_res.status_code == 400


def test_complete_approval_and_qr_workflow():
    # 1. Login as student
    login_res = client.post(
        "/api/auth/login",
        json={"email": "u2024626@giki.edu.pk", "password": "student123"},
    )
    assert login_res.status_code == 200
    student_token = login_res.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # 2. Submit exit request
    now = datetime.utcnow()
    dep_time = (now + timedelta(hours=2)).isoformat()
    ret_time = (now + timedelta(hours=8)).isoformat()

    req_res = client.post(
        "/api/student/passes",
        headers=student_headers,
        json={
            "reason": "Family gathering in Islamabad",
            "destination": "Islamabad F-7",
            "departure_time": dep_time,
            "expected_return_time": ret_time,
        },
    )
    assert req_res.status_code == 201
    pass_data = req_res.json()
    pass_id = pass_data["id"]
    assert pass_data["status"] == "PENDING"
    assert pass_data["parent_consent_status"] == "NOT_REQUESTED"
    assert pass_data["signed_token"] is None  # Must remain NULL!

    # 3. Login as Warden
    w_login = client.post(
        "/api/auth/login",
        json={"email": "warden@giki.edu.pk", "password": "warden123"},
    )
    assert w_login.status_code == 200
    warden_token = w_login.json()["access_token"]
    warden_headers = {"Authorization": f"Bearer {warden_token}"}

    # 4. Warden attempts to APPROVE before parent consent -> MUST FAIL!
    premature_approve = client.patch(
        f"/api/warden/passes/{pass_id}/decision",
        headers=warden_headers,
        json={"decision": "APPROVED", "remarks": "Approved prematurely"},
    )
    assert premature_approve.status_code == 400

    # 5. Warden initiates parent consent via WhatsApp
    consent_req_res = client.post(
        f"/api/warden/passes/{pass_id}/request-parent-consent",
        headers=warden_headers,
    )
    assert consent_req_res.status_code == 200
    assert consent_req_res.json()["parent_consent_status"] in ["AWAITING_RESPONSE", "MESSAGE_PENDING"]

    # 6. Simulate Parent YES reply
    sim_res = client.post(
        "/api/whatsapp/simulate-reply",
        json={"pass_id": pass_id, "response_type": "YES"},
    )
    assert sim_res.status_code == 200
    assert sim_res.json()["consent_status"] == "YES"

    # 7. Warden approves with mandatory remarks
    approve_res = client.patch(
        f"/api/warden/passes/{pass_id}/decision",
        headers=warden_headers,
        json={"decision": "APPROVED", "remarks": "Parent confirmed via WhatsApp. Permission granted."},
    )
    assert approve_res.status_code == 200
    approved_pass = approve_res.json()
    assert approved_pass["status"] == "APPROVED"
    assert approved_pass["signed_token"] is not None
    assert approved_pass["signed_token"].startswith("GW-PASS-")

    # 8. Student attempt to access warden queue must be rejected with 403 Forbidden
    student_access_warden = client.get("/api/warden/passes", headers=student_headers)
    assert student_access_warden.status_code == 403

    # 9. Student attempt to verify gate passes must be rejected with 403 Forbidden
    student_access_gate = client.post(
        "/api/gate/verify",
        headers=student_headers,
        json={"signed_token": approved_pass["signed_token"]},
    )
    assert student_access_gate.status_code == 403

    # 10. Warden attempt to submit student pass must be rejected with 403 Forbidden
    warden_access_student = client.post(
        "/api/student/passes",
        headers=warden_headers,
        json={
            "reason": "Warden cannot submit",
            "destination": "Nowhere",
            "departure_time": dep_time,
            "expected_return_time": ret_time,
        },
    )
    assert warden_access_student.status_code == 403

    # 11. Authorized Gate security verifies pass
    verify_res = client.post(
        "/api/gate/verify",
        headers=warden_headers,
        json={"signed_token": approved_pass["signed_token"]},
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["success"] is True

    # 12. Tampered token rejected
    tampered_token = approved_pass["signed_token"] + "TAMPERED"
    tampered_res = client.post(
        "/api/gate/verify",
        headers=warden_headers,
        json={"signed_token": tampered_token},
    )
    assert tampered_res.status_code == 401
