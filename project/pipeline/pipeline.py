import os
import yaml
from services.rule_engine.rules import check_amount, check_night_transaction, check_micro_transaction, check_personal_amount
from services.ml_scoring.scorer import score_transaction

RULES_CONFIG_PATH = os.path.join(
    os.path.dirname(__file__), "..", "services", "rule_engine", "rules_config.yaml"
)

FRAUD_THRESHOLD = 0.5


def load_rules_config():
    with open(RULES_CONFIG_PATH, "r") as f:
        return yaml.safe_load(f)


def run_rules(transaction: dict, config: dict, raw_amount: float = None, raw_time: float = None, typical_spend: float = None) -> tuple[bool, list[str], list[str]]:
    """Run all enabled rules against the transaction.

    raw_amount / raw_time: original unscaled values — rules must check readable amounts,
    not the scaled values passed to the ML model. Falls back to transaction["Amount"] if not provided.
    typical_spend: cardholder's normal spend from their profile — used by personal_amount rule.
    Returns (any_fired, triggered_rule_names, reason_strings)
    """
    amount = raw_amount if raw_amount is not None else transaction["Amount"]
    time_val = raw_time if raw_time is not None else transaction["Time"]
    results = []

    if config["amount_rule"]["enabled"]:
        results.append(check_amount(amount, config["amount_rule"]["max_amount"]))

    if config["night_transaction_rule"]["enabled"]:
        r = config["night_transaction_rule"]
        results.append(
            check_night_transaction(
                time_val,
                r["night_start_second"],
                r["night_end_second"],
                r["day_seconds"],
            )
        )

    if config["micro_transaction_rule"]["enabled"]:
        results.append(
            check_micro_transaction(amount, config["micro_transaction_rule"]["max_amount"])
        )

    if config.get("personal_amount_rule", {}).get("enabled") and typical_spend:
        results.append(
            check_personal_amount(amount, typical_spend, config["personal_amount_rule"]["multiplier"])
        )

    triggered = [r for r in results if r.flagged]
    return (
        len(triggered) > 0,
        [r.rule_name for r in triggered],
        [r.reason for r in triggered],
    )


def decide(rules_fired: bool, risk_score: float, threshold: float) -> str:
    """Combination logic — documented clearly for the dissertation.

    Both agree fraud  → fraud
    Only one signals  → uncertain
    Both agree genuine → genuine
    """
    model_flagged = risk_score >= threshold
    if rules_fired and model_flagged:
        return "fraud"
    if rules_fired or model_flagged:
        return "uncertain"
    return "genuine"


def run_pipeline(transaction: dict, model_name: str = "xgboost", threshold: float = FRAUD_THRESHOLD, user_ctx: dict = None, raw_amount: float = None, raw_time: float = None, typical_spend: float = None) -> dict:
    """Run the full hybrid pipeline for one transaction.

    transaction: dict containing at minimum Amount, Time, V14, and all
                 30 model features (V1-V28, Amount, Time scaled)
    Returns: { transaction_id, decision, risk_score, model_used,
               triggered_rules, rule_reasons, shap_explanation }
    """
    config = load_rules_config()

    rules_fired, triggered_rules, rule_reasons = run_rules(transaction, config, raw_amount=raw_amount, raw_time=raw_time, typical_spend=typical_spend)
    scoring = score_transaction(transaction, model_name, user_ctx=user_ctx)

    decision = decide(rules_fired, scoring["risk_score"], threshold)

    return {
        "transaction_id": transaction.get("transaction_id", "unknown"),
        "decision": decision,
        "risk_score": scoring["risk_score"],
        "model_used": scoring["model_used"],
        "triggered_rules": triggered_rules,
        "rule_reasons": rule_reasons,
        "shap_explanation": scoring["shap_explanation"],
    }
