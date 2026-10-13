import os
import unittest

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SESSION_COOKIE_SECURE"] = "false"

from fastapi.testclient import TestClient

from backend.main import FRONTEND_DIST_PATH, app


class AuthenticationTests(unittest.TestCase):
    def setUp(self):
        self.client_context = TestClient(app)
        self.client = self.client_context.__enter__()

    def tearDown(self):
        self.client_context.__exit__(None, None, None)

    def test_signup_restores_and_revokes_session(self):
        response = self.client.post(
            "/auth/signup",
            json={"email": "  Person@Example.com ", "password": "strong-password"},
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["user"]["email"], "person@example.com")
        self.assertIn("httponly", response.headers["set-cookie"].lower())
        self.assertEqual(self.client.get("/auth/me").json()["user"]["email"], "person@example.com")

        self.assertEqual(self.client.post("/auth/logout").status_code, 200)
        self.assertIsNone(self.client.get("/auth/me").json()["user"])

    def test_signin_rejects_bad_password_and_accepts_valid_password(self):
        self.client.post(
            "/auth/signup",
            json={"email": "login@example.com", "password": "strong-password"},
        )
        self.client.post("/auth/logout")

        rejected = self.client.post(
            "/auth/login",
            json={"email": "login@example.com", "password": "incorrect-password"},
        )
        self.assertEqual(rejected.status_code, 401)
        unknown = self.client.post(
            "/auth/login",
            json={"email": "unknown@example.com", "password": "incorrect-password"},
        )
        self.assertEqual(unknown.status_code, 401)

        accepted = self.client.post(
            "/auth/login",
            json={"email": "login@example.com", "password": "strong-password"},
        )
        self.assertEqual(accepted.status_code, 200)
        self.assertEqual(accepted.json()["user"]["email"], "login@example.com")

    def test_signup_rejects_duplicate_email(self):
        credentials = {"email": "duplicate@example.com", "password": "strong-password"}
        self.assertEqual(self.client.post("/auth/signup", json=credentials).status_code, 201)
        duplicate = self.client.post("/auth/signup", json=credentials)
        self.assertEqual(duplicate.status_code, 409)

    def test_invalid_email_and_short_password_are_rejected(self):
        response = self.client.post(
            "/auth/signup",
            json={"email": "not-an-email", "password": "short"},
        )
        self.assertEqual(response.status_code, 422)

    def test_predictions_are_saved_to_database(self):
        response = self.client.post(
            "/predict",
            json={"PM2.5": 55.4, "PM10": 110.2, "NO2": 34.5, "CO": 1.05, "SO2": 12.3, "O3": 29.8},
        )

        self.assertEqual(response.status_code, 200)
        history = self.client.get("/predictions?limit=1")
        self.assertEqual(history.status_code, 200)
        self.assertEqual(history.json()["total_records"], 1)
        self.assertEqual(history.json()["history"][0]["inputs"]["PM2.5"], 55.4)

    def test_root_serves_built_frontend(self):
        if not os.path.isfile(os.path.join(FRONTEND_DIST_PATH, "index.html")):
            self.skipTest("Build the frontend before checking combined frontend/API serving.")

        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn('id="root"', response.text)

    def test_model_evaluation_endpoint_returns_required_data(self):
        response = self.client.get("/model-info")
        self.assertEqual(response.status_code, 200)

        model_info = response.json()
        self.assertEqual(model_info["model_name"], "Gradient Boosting Regressor")
        self.assertIn("R2_Score", model_info["best_metrics"])
        self.assertTrue(model_info["all_model_evaluations"])
        self.assertTrue(model_info["feature_importance"])


if __name__ == "__main__":
    unittest.main()
