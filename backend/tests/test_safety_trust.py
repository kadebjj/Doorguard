"""
Safety & Trust Layer Backend Tests for DoorGuard.

Covers:
- Emergency contacts (GET/PUT) with role-based 403
- SOS alerts (create/list/resolve) with contacts_notified count
- Incident reports (create/list)
- Session safety check-in/checkout with cross-user 403
- Trainer profile background_check_status & id_verified defaults
- Regression: register, login, list trainers, get trainer by id, book session
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://trainer-marketplace-11.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

# Test client provided in /app/memory/test_credentials.md (has emergency contact + history)
EXISTING_CLIENT_EMAIL = os.environ.get("TEST_CLIENT_EMAIL", "client_sft_1781136145@test.com")
EXISTING_CLIENT_PASSWORD = os.environ.get("TEST_CLIENT_PASSWORD", "Test1234!")
DEFAULT_TEST_PASSWORD = os.environ.get("TEST_CLIENT_PASSWORD", "Test1234!")


# ----------------- Helpers / Fixtures -----------------

def _ts():
    return f"{int(time.time() * 1000)}{uuid.uuid4().hex[:4]}"


def _register(role: str, prefix: str):
    email = f"test_{prefix}_{_ts()}@test.com"
    payload = {
        "email": email,
        "password": DEFAULT_TEST_PASSWORD,
        "full_name": f"TEST {role.title()} {prefix}",
        "role": role,
        "city": "Austin",
    }
    r = requests.post(f"{API}/auth/register", json=payload, timeout=20)
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and "user" in data
    return data, payload


@pytest.fixture(scope="module")
def client_user():
    data, payload = _register("client", "client")
    return {"token": data["token"], "user": data["user"], "password": payload["password"]}


@pytest.fixture(scope="module")
def trainer_user():
    data, payload = _register("trainer", "trainer")
    return {"token": data["token"], "user": data["user"], "password": payload["password"]}


@pytest.fixture(scope="module")
def other_client_user():
    data, _ = _register("client", "other")
    return {"token": data["token"], "user": data["user"]}


def _h(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ----------------- Regression: auth -----------------

class TestAuthRegression:
    def test_login_existing_seeded_client(self):
        r = requests.post(f"{API}/auth/login", json={
            "email": EXISTING_CLIENT_EMAIL, "password": EXISTING_CLIENT_PASSWORD
        }, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user"]["role"] == "client"
        assert "token" in data

    def test_me_endpoint(self, client_user):
        r = requests.get(f"{API}/auth/me", headers=_h(client_user["token"]), timeout=20)
        assert r.status_code == 200
        assert r.json()["email"] == client_user["user"]["email"]


# ----------------- Trainer trust signals -----------------

class TestTrainerTrustSignals:
    def test_new_trainer_has_bg_check_cleared_and_id_verified(self, trainer_user):
        tp = trainer_user["user"].get("trainer_profile") or {}
        assert tp.get("background_check_status") == "cleared", tp
        assert tp.get("id_verified"), tp

    def test_list_trainers_returns_trust_fields(self, trainer_user):
        r = requests.get(f"{API}/trainers", timeout=20)
        assert r.status_code == 200
        trainers = r.json()
        assert isinstance(trainers, list) and len(trainers) > 0
        # find the trainer we just created
        match = next((t for t in trainers if t["id"] == trainer_user["user"]["id"]), None)
        assert match is not None, "Newly registered trainer missing from /api/trainers"
        tp = match.get("trainer_profile") or {}
        assert tp.get("background_check_status") == "cleared"
        assert tp.get("id_verified")

    def test_get_trainer_by_id_has_trust_fields(self, trainer_user):
        r = requests.get(f"{API}/trainers/{trainer_user['user']['id']}", timeout=20)
        assert r.status_code == 200
        tp = r.json().get("trainer_profile") or {}
        assert tp.get("background_check_status") == "cleared"
        assert tp.get("id_verified")


# ----------------- Emergency contacts -----------------

class TestEmergencyContacts:
    def test_put_emergency_contacts_as_client(self, client_user):
        payload = {"contacts": [
            {"name": "Jane Doe", "phone": "+15551234567", "relationship": "spouse"},
            {"name": "John Doe", "phone": "+15559876543", "relationship": "brother"},
        ]}
        r = requests.put(f"{API}/safety/emergency-contacts",
                         headers=_h(client_user["token"]), json=payload, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "contacts" in data
        assert len(data["contacts"]) == 2
        assert data["contacts"][0]["name"] == "Jane Doe"

    def test_get_emergency_contacts_returns_saved(self, client_user):
        r = requests.get(f"{API}/safety/emergency-contacts",
                         headers=_h(client_user["token"]), timeout=20)
        assert r.status_code == 200
        contacts = r.json()["contacts"]
        assert len(contacts) == 2
        names = [c["name"] for c in contacts]
        assert "Jane Doe" in names and "John Doe" in names

    def test_put_emergency_contacts_as_trainer_forbidden(self, trainer_user):
        payload = {"contacts": [{"name": "X", "phone": "+15551110000"}]}
        r = requests.put(f"{API}/safety/emergency-contacts",
                         headers=_h(trainer_user["token"]), json=payload, timeout=20)
        assert r.status_code == 403, f"Expected 403, got {r.status_code}: {r.text}"


# ----------------- SOS Alerts -----------------

class TestSOSAlerts:
    def test_trigger_sos_returns_contacts_notified_count(self, client_user):
        # client already has 2 contacts saved by TestEmergencyContacts
        r = requests.post(f"{API}/safety/sos",
                         headers=_h(client_user["token"]),
                         json={"message": "TEST_SOS_TRIGGER",
                               "latitude": 30.2672, "longitude": -97.7431},
                         timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("contacts_notified") == 2, data
        assert "alert" in data and data["alert"]["status"] == "active"
        # save for later
        TestSOSAlerts.created_alert_id = data["alert"]["id"]

    def test_list_alerts_sorted_newest_first(self, client_user):
        # create a second alert to verify sort
        time.sleep(1)
        r2 = requests.post(f"{API}/safety/sos",
                          headers=_h(client_user["token"]),
                          json={"message": "TEST_SOS_TRIGGER_2"}, timeout=20)
        assert r2.status_code == 200
        second_id = r2.json()["alert"]["id"]

        r = requests.get(f"{API}/safety/alerts",
                         headers=_h(client_user["token"]), timeout=20)
        assert r.status_code == 200
        alerts = r.json()
        assert isinstance(alerts, list) and len(alerts) >= 2
        # newest first
        assert alerts[0]["created_at"] >= alerts[1]["created_at"]
        assert alerts[0]["id"] == second_id

    def test_resolve_alert(self, client_user):
        alert_id = getattr(TestSOSAlerts, "created_alert_id", None)
        assert alert_id, "No alert id from earlier test"
        r = requests.put(f"{API}/safety/alerts/{alert_id}/resolve",
                         headers=_h(client_user["token"]), timeout=20)
        assert r.status_code == 200, r.text
        # verify status changed
        rl = requests.get(f"{API}/safety/alerts",
                          headers=_h(client_user["token"]), timeout=20)
        target = next(a for a in rl.json() if a["id"] == alert_id)
        assert target["status"] == "resolved"
        assert "resolved_at" in target

    def test_resolve_other_users_alert_404(self, client_user, other_client_user):
        alert_id = getattr(TestSOSAlerts, "created_alert_id", None)
        r = requests.put(f"{API}/safety/alerts/{alert_id}/resolve",
                         headers=_h(other_client_user["token"]), timeout=20)
        # Endpoint scopes by user_id -> not found
        assert r.status_code == 404


# ----------------- Incident reports -----------------

class TestIncidentReports:
    def test_create_report_under_review(self, client_user):
        r = requests.post(f"{API}/safety/report",
                         headers=_h(client_user["token"]),
                         json={"concern_type": "safety",
                               "description": "TEST_REPORT trainer late and unsafe driving"},
                         timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["report"]["status"] == "under_review"
        assert data["report"]["concern_type"] == "safety"
        TestIncidentReports.report_id = data["report"]["id"]

    def test_list_my_reports(self, client_user):
        r = requests.get(f"{API}/safety/reports",
                         headers=_h(client_user["token"]), timeout=20)
        assert r.status_code == 200
        reports = r.json()
        assert isinstance(reports, list) and len(reports) >= 1
        ids = [x["id"] for x in reports]
        assert getattr(TestIncidentReports, "report_id") in ids


# ----------------- Session safety check-in/out -----------------

@pytest.fixture(scope="module")
def booked_session(client_user, trainer_user):
    payload = {
        "trainer_id": trainer_user["user"]["id"],
        "category": "personal_training",
        "scheduled_date": "2026-02-01",
        "scheduled_time": "10:00",
        "location_address": "TEST 123 Main St, Austin TX",
        "notes": "TEST booking for safety checkin",
    }
    r = requests.post(f"{API}/sessions/book",
                      headers=_h(client_user["token"]), json=payload, timeout=20)
    assert r.status_code == 200, r.text
    sess = r.json()["session"]
    return sess


class TestSessionCheckInOut:
    def test_book_session_succeeds(self, booked_session):
        assert booked_session["id"]
        assert booked_session["status"] == "pending"
        assert booked_session["price"] == 75.00

    def test_checkin_by_owner(self, client_user, booked_session):
        r = requests.post(f"{API}/sessions/{booked_session['id']}/checkin",
                         headers=_h(client_user["token"]), timeout=20)
        assert r.status_code == 200, r.text
        assert "checked_in_at" in r.json()

    def test_checkin_persisted(self, client_user, booked_session):
        r = requests.get(f"{API}/sessions/client",
                         headers=_h(client_user["token"]), timeout=20)
        assert r.status_code == 200
        sess = next(s for s in r.json() if s["id"] == booked_session["id"])
        assert sess.get("safety_checked_in")
        assert sess.get("checked_in_at")
    def test_checkout_by_owner(self, client_user, booked_session):
        r = requests.post(f"{API}/sessions/{booked_session['id']}/checkout",
                         headers=_h(client_user["token"]), timeout=20)
        assert r.status_code == 200, r.text
        assert "checked_out_at" in r.json()

    def test_checkout_persisted(self, client_user, booked_session):
        r = requests.get(f"{API}/sessions/client",
                         headers=_h(client_user["token"]), timeout=20)
        sess = next(s for s in r.json() if s["id"] == booked_session["id"])
        assert sess.get("safety_checked_out")
        assert sess.get("checked_out_at")

    def test_checkin_by_other_user_forbidden(self, other_client_user, booked_session):
        r = requests.post(f"{API}/sessions/{booked_session['id']}/checkin",
                         headers=_h(other_client_user["token"]), timeout=20)
        assert r.status_code == 403, f"Expected 403, got {r.status_code}: {r.text}"

    def test_checkout_by_other_user_forbidden(self, other_client_user, booked_session):
        r = requests.post(f"{API}/sessions/{booked_session['id']}/checkout",
                         headers=_h(other_client_user["token"]), timeout=20)
        assert r.status_code == 403

    def test_checkin_by_trainer_forbidden(self, trainer_user, booked_session):
        # Trainer is the assigned trainer but not the client -> should still 403
        r = requests.post(f"{API}/sessions/{booked_session['id']}/checkin",
                         headers=_h(trainer_user["token"]), timeout=20)
        assert r.status_code == 403


# ----------------- Auth on safety endpoints -----------------

class TestSafetyAuth:
    def test_sos_requires_auth(self):
        r = requests.post(f"{API}/safety/sos", json={"message": "x"}, timeout=20)
        assert r.status_code in (401, 403)

    def test_emergency_contacts_requires_auth(self):
        r = requests.get(f"{API}/safety/emergency-contacts", timeout=20)
        assert r.status_code in (401, 403)
