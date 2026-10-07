import os
import yaml
from fastapi import FastAPI
from pydantic import BaseModel
from services.rule_engine.rules import check_amount, check_night_transaction, check_high_risk_feature

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "rules_config.yaml")

app = FastAPI(title="Rule Engine Service")


def load_config():
    with open(CONFIG_PATH, "r") as f:
        return yaml.safe_load(f)


class TransactionRequest(BaseModel):
    transaction_id: str
    amount: float
    time: float
    v14: float


class RuleEngineResponse(BaseModel):
    transaction_id: str
    flagged: bool
    triggered_rules: list[str]
    reasons: list[str]


@app.post("/check", response_model=RuleEngineResponse)
def check_transaction(transaction: TransactionRequest):
    config = load_config()
    results = []

    if config["amount_rule"]["enabled"]:
        results.append(
            check_amount(transaction.amount, config["amount_rule"]["max_amount"])
        )

    if config["night_transaction_rule"]["enabled"]:
        r = config["night_transaction_rule"]
        results.append(
            check_night_transaction(
                transaction.time,
                r["night_start_second"],
                r["night_end_second"],
                r["day_seconds"],
            )
        )

    if config["high_risk_feature_rule"]["enabled"]:
        results.append(
            check_high_risk_feature(
                transaction.v14,
                config["high_risk_feature_rule"]["v14_threshold"],
            )
        )

    triggered = [r for r in results if r.flagged]

    return RuleEngineResponse(
        transaction_id=transaction.transaction_id,
        flagged=len(triggered) > 0,
        triggered_rules=[r.rule_name for r in triggered],
        reasons=[r.reason for r in triggered],
    )


@app.get("/health")
def health():
    return {"status": "ok"}
