import os
import pickle
import importlib.util

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "artifacts")

# load explainer module directly to avoid conflict with installed shap package name
_spec = importlib.util.spec_from_file_location(
    "explainer",
    os.path.join(os.path.dirname(__file__), "..", "..", "shap", "explainer.py"),
)
_explainer_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_explainer_mod)


def _load(name):
    with open(os.path.join(ARTIFACTS_DIR, name), "rb") as f:
        return pickle.load(f)


def load_models():
    xgb_model = _load("xgboost_model.pkl")
    mlp_model = _load("mlp_model.pkl")
    X_train = _load("X_train.pkl")
    feature_names = list(_load("X_test.pkl").columns)
    return xgb_model, mlp_model, X_train, feature_names


def score_transaction(transaction_features: dict, model_name: str = "xgboost") -> dict:
    """Score one transaction and return risk score + SHAP explanation.

    transaction_features: dict of {feature_name: value} for all 30 features
    model_name: "xgboost" or "mlp"
    Returns: { risk_score, model_used, shap_explanation }
    """
    xgb_model, mlp_model, X_train, feature_names = load_models()

    import pandas as pd
    X = pd.DataFrame([transaction_features])[feature_names]

    if model_name == "xgboost":
        risk_score = float(xgb_model.predict_proba(X)[0][1])
        shap_values = _explainer_mod.get_shap_values_xgboost(xgb_model, X)
    else:
        risk_score = float(mlp_model.predict_proba(X)[0][1])
        X_background = X_train.iloc[:100].to_numpy()
        shap_values = _explainer_mod.get_shap_values_mlp(
            mlp_model, X.to_numpy(), X_background
        )

    explanation = _explainer_mod.plain_english(shap_values[0], feature_names)

    return {
        "risk_score": round(risk_score, 4),
        "model_used": model_name,
        "shap_explanation": explanation,
    }
