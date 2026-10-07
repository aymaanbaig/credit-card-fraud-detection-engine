import os
import pickle

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "artifacts")

# Each mock user is pre-linked to a real X_test row.
# The profile fields are used by the SHAP explanation to produce
# personalised sentences referencing the user's actual history.

MOCK_USERS = {
    "alice": {
        "name": "Alice Johnson",
        "card_last4": "4242",
        "address": "London, UK",
        "profile": "Long-established account. Regular small grocery purchases. Low transaction velocity.",
        "test_row_index": 14999,  # genuine row, model score 0.000000
        "risk_level": "low",
        "account_age_years": 8,
        "typical_spend": 35.00,
        "usual_merchant": "Groceries",
        "recent_tx_count": 2,
        "normal_tx_count": "2-3 per week",
    },
    "bob": {
        "name": "Bob Smith",
        "card_last4": "5555",
        "address": "Manchester, UK",
        "profile": "Relatively new account. Frequent electronics purchases. Higher transaction velocity.",
        "test_row_index": 37511,  # fraud row, model score 0.999998
        "risk_level": "high",
        "account_age_years": 2,
        "typical_spend": 120.00,
        "usual_merchant": "Electronics",
        "recent_tx_count": 8,
        "normal_tx_count": "2-3 per week",
    },
    "carol": {
        "name": "Carol Davies",
        "card_last4": "9999",
        "address": "Birmingham, UK",
        "profile": "New account. Online purchases from unusual locations. Atypical spending pattern.",
        "test_row_index": 50636,  # fraud row, model score 0.999997
        "risk_level": "high",
        "account_age_years": 1,
        "typical_spend": 60.00,
        "usual_merchant": "Clothing",
        "recent_tx_count": 11,
        "normal_tx_count": "1-2 per week",
    },
}


def get_user(user_id: str) -> dict | None:
    return MOCK_USERS.get(user_id)


def list_users() -> list[dict]:
    return [{"id": k, **v} for k, v in MOCK_USERS.items()]


def build_features(user_id: str, scaled_amount: float, scaled_time: float) -> dict:
    """Load the user's pre-linked X_test row, swap in submitted Amount and Time."""
    user = MOCK_USERS.get(user_id)
    if not user:
        raise ValueError(f"Unknown user: {user_id}")

    with open(os.path.join(ARTIFACTS_DIR, "X_test.pkl"), "rb") as f:
        X_test = pickle.load(f)

    row = X_test.iloc[user["test_row_index"]].to_dict()
    row["Amount"] = scaled_amount
    row["Time"] = scaled_time
    return row
