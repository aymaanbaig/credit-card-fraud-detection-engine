import os
import pickle
import warnings
import numpy as np
import shap
import xgboost as xgb

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "artifacts")


def load(name):
    with open(os.path.join(ARTIFACTS_DIR, name), "rb") as f:
        return pickle.load(f)


def get_shap_values_xgboost(model, X_sample):
    """Generate SHAP values for XGBoost using its native SHAP support.

    XGBoost 3.x has SHAP built in via pred_contribs=True.
    This avoids the base_score parsing bug in shap.TreeExplainer with XGBoost 3.x.
    Returns shape (n_samples, n_features) — bias column is dropped.
    """
    dmatrix = xgb.DMatrix(X_sample)
    contribs = model.get_booster().predict(dmatrix, pred_contribs=True)
    return contribs[:, :-1]


def get_shap_values_mlp(model, X_sample, X_background):
    """Generate SHAP values for MLP using KernelExplainer.

    KernelExplainer works with any model — it only needs a predict function.
    It is model-agnostic but slower than TreeExplainer.
    X_background is a small sample of training data used as the SHAP baseline.
    Returns shape (n_samples, n_features) — SHAP values for the fraud class (class 1).
    """
    # wrap predict_proba so KernelExplainer gets fraud probability only
    def predict_fraud_proba(X):
        return model.predict_proba(X)[:, 1]

    explainer = shap.KernelExplainer(predict_fraud_proba, X_background)
    # nsamples controls accuracy vs speed — 100 is enough for a sample check
    shap_values = explainer.shap_values(X_sample, nsamples=100, silent=True)
    return shap_values


def top_features(shap_values_row, feature_names, top_n=5):
    """Return the top N features sorted by absolute SHAP value for one transaction."""
    pairs = list(zip(feature_names, shap_values_row))
    pairs.sort(key=lambda x: abs(x[1]), reverse=True)
    return pairs[:top_n]


def plain_english(shap_values_row, feature_names, top_n=5):
    """Convert SHAP values for one transaction into plain-English sentences.

    V1-V28 have no real-world names due to PCA anonymisation.
    Explanations describe direction and magnitude only.
    """
    features = top_features(shap_values_row, feature_names, top_n)
    sentences = []
    for feature, value in features:
        direction = "toward fraud" if value < 0 else "away from fraud"
        abs_val = abs(value)
        if abs_val > 1.0:
            strength = "strongly"
        elif abs_val > 0.3:
            strength = "moderately"
        else:
            strength = "slightly"
        sentences.append(
            f"Feature {feature} pushed the fraud score {strength} {direction} (SHAP value: {value:.3f})."
        )
    return sentences


def explain_transaction(model_name, shap_values_row, feature_names):
    """Print top features and plain-English explanation for one transaction."""
    print(f"\n--- {model_name} explanation ---")
    top = top_features(shap_values_row, feature_names)
    print("Top 5 contributing features:")
    for feature, value in top:
        direction = "-> fraud" if value < 0 else "-> genuine"
        print(f"  {feature:6s}  SHAP={value:+.4f}  {direction}")
    print("\nPlain-English explanation:")
    for s in plain_english(shap_values_row, feature_names):
        print(f"  {s}")


def run_xgboost_check():
    print("=== XGBoost SHAP check ===")
    model = load("xgboost_model.pkl")
    X_test = load("X_test.pkl")
    X_sample = X_test.iloc[:10]
    feature_names = list(X_test.columns)

    shap_values = get_shap_values_xgboost(model, X_sample)
    print(f"SHAP values shape: {shap_values.shape}")
    explain_transaction("XGBoost", shap_values[0], feature_names)


def run_mlp_check():
    warnings.filterwarnings("ignore", category=UserWarning)
    print("\n=== MLP SHAP check (KernelExplainer - this takes a minute) ===")
    model = load("mlp_model.pkl")
    X_train = load("X_train.pkl")
    X_test = load("X_test.pkl")
    feature_names = list(X_test.columns)

    # small background sample — KernelExplainer uses this as the baseline
    # convert to numpy to avoid sklearn feature name warning
    X_background = X_train.iloc[:100].to_numpy()
    # run on 3 test transactions only — KernelExplainer is slow
    X_sample = X_test.iloc[:3].to_numpy()

    shap_values = get_shap_values_mlp(model, X_sample, X_background)
    print(f"SHAP values shape: {np.array(shap_values).shape}")
    explain_transaction("MLP", shap_values[0], feature_names)


if __name__ == "__main__":
    run_xgboost_check()
    run_mlp_check()
