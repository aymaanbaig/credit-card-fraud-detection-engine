from dataclasses import dataclass


@dataclass
class RuleResult:
    flagged: bool
    rule_name: str
    reason: str


def check_amount(amount: float, max_amount: float) -> RuleResult:
    """Flag if transaction amount exceeds the configured threshold.

    Threshold default is £500 — based on dataset genuine median of ~£22.
    Fraud cases cluster at small amounts (median £9), but very large amounts
    are also a strong signal for card testing and account takeover fraud.
    """
    if amount > max_amount:
        return RuleResult(
            flagged=True,
            rule_name="amount",
            reason=f"Transaction amount {amount:.2f} exceeds threshold of {max_amount:.2f} - unusually high for this dataset (genuine median ~22)",
        )
    return RuleResult(flagged=False, rule_name="amount", reason="")


def check_night_transaction(time_seconds: float, night_start: int, night_end: int, day_seconds: int) -> RuleResult:
    """Flag if transaction falls in the high-risk night window (default 00:00–05:00).

    Time field in the dataset is seconds elapsed since the first transaction.
    Modulo day_seconds gives position within the current day cycle.
    Night window default is 0–18000 seconds (midnight to 5am).
    """
    time_of_day = time_seconds % day_seconds
    if night_start <= time_of_day <= night_end:
        hours = int(time_of_day // 3600)
        minutes = int((time_of_day % 3600) // 60)
        return RuleResult(
            flagged=True,
            rule_name="night_transaction",
            reason=f"Transaction at {hours:02d}:{minutes:02d} - falls in high-risk night window (00:00-05:00), associated with higher fraud rates",
        )
    return RuleResult(flagged=False, rule_name="night_transaction", reason="")


def check_high_risk_feature(v14: float, v14_threshold: float) -> RuleResult:
    """Flag if V14 is below the configured threshold.

    V14 has the second-highest absolute Pearson correlation with fraud (r = -0.303)
    from the Week 1 EDA. Strongly negative V14 values are a reliable fraud signal.
    Threshold default is -5.0, set from the distribution of fraud cases in the dataset.
    V1-V28 are PCA-anonymised — no real-world name is known for V14.
    """
    if v14 < v14_threshold:
        return RuleResult(
            flagged=True,
            rule_name="high_risk_feature",
            reason=(
                f"V14 (transaction velocity) = {v14:.4f}, below threshold {v14_threshold:.1f} - "
                f"strongly negative V14 indicates rapid successive transactions, typical of stolen card use"
            ),
        )
    return RuleResult(flagged=False, rule_name="high_risk_feature", reason="")
