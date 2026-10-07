import pickle
import os
import time as time_module
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pipeline.pipeline import run_pipeline
from pipeline.store import append_flagged, get_all, get_by_id
from pipeline.mock_users import get_user, list_users, build_features

app = FastAPI(title="Fraud Detection Pipeline")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "artifacts")

def _load_scaler():
    with open(os.path.join(ARTIFACTS_DIR, "scaler.pkl"), "rb") as f:
        return pickle.load(f)


# --- Customer endpoints ---

class SubmitRequest(BaseModel):
    user_id: str
    amount: float
    merchant_name: str
    merchant_category: str


@app.get("/users")
def users():
    return list_users()


@app.post("/submit")
def submit(request: SubmitRequest):
    user = get_user(request.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    scaler = _load_scaler()

    # scale amount and time using the training scaler
    # scaler was fitted on [Amount, Time] columns
    current_time_seconds = float(time_module.time() % 86400)
    scaled = scaler.transform([[request.amount, current_time_seconds]])[0]
    scaled_amount = float(scaled[0])
    scaled_time = float(scaled[1])

    features = build_features(request.user_id, scaled_amount, scaled_time)
    transaction_id = f"{request.user_id}_{int(time_module.time())}"
    transaction = {"transaction_id": transaction_id, **features}

    user_ctx = {
        "name": user["name"],
        "card_last4": user.get("card_last4"),
        "account_age_years": user.get("account_age_years"),
        "typical_spend": user.get("typical_spend"),
        "usual_merchant": user.get("usual_merchant"),
        "recent_tx_count": user.get("recent_tx_count"),
        "normal_tx_count": user.get("normal_tx_count"),
        "address": user.get("address"),
        "submitted_amount": request.amount,
        "submitted_category": request.merchant_category,
    }

    result = run_pipeline(transaction, user_ctx=user_ctx, raw_amount=request.amount, raw_time=current_time_seconds, typical_spend=user.get("typical_spend"))

    record = {
        **result,
        "user_id": request.user_id,
        "user_name": user["name"],
        "card_last4": user["card_last4"],
        "raw_amount": request.amount,
        "merchant_name": request.merchant_name,
        "merchant_category": request.merchant_category,
        "submitted_at": datetime.utcnow().isoformat(),
    }

    record = append_flagged(record)

    return record


# --- Admin endpoints ---

@app.get("/admin/flagged")
def admin_flagged():
    return get_all()


@app.get("/admin/flagged/{flagged_id}")
def admin_flagged_detail(flagged_id: int):
    record = get_by_id(flagged_id)
    if not record:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return record


@app.get("/pipeline/health")
def health():
    return {"status": "ok"}
