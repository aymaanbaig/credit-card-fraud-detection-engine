import os
import json

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "artifacts")


def load_info():
    with open(os.path.join(ARTIFACTS_DIR, "split_info.json")) as f:
        return json.load(f)


def test_test_set_is_20_percent():
    info = load_info()
    expected = info["original_rows"] * 0.2
    assert abs(info["test_rows"] - expected) <= 1


def test_smote_not_applied_to_test_set():
    info = load_info()
    # original fraud rate is 0.1727% — test set must stay close to that
    assert 0.001 < info["test_fraud_rate"] < 0.003


def test_scaler_fitted_on_training_data_only():
    info = load_info()
    # scaler was fitted on the training set after SMOTE, not on the full dataset
    # SMOTE adds synthetic fraud cases (lower amounts) so the training mean shifts
    # scaler_amount_mean must NOT equal the full dataset mean — if it did, the scaler
    # was incorrectly fitted on the full dataset
    assert abs(info["scaler_amount_mean"] - info["full_dataset_amount_mean"]) > 1
