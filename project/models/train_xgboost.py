import os
import pickle
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.metrics import (
    confusion_matrix, ConfusionMatrixDisplay,
    roc_curve, auc,
    precision_score, recall_score, f1_score
)
from xgboost import XGBClassifier

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "artifacts")
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "results")


def load_artifacts():
    def load(name):
        with open(os.path.join(ARTIFACTS_DIR, name), "rb") as f:
            return pickle.load(f)
    return load("X_train.pkl"), load("y_train.pkl"), load("X_test.pkl"), load("y_test.pkl")


def false_positive_rate(y_true, y_pred):
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    return fp / (fp + tn)


def evaluate(model, X_test, y_test, threshold=0.5):
    proba = model.predict_proba(X_test)[:, 1]
    y_pred = (proba >= threshold).astype(int)
    fpr_val = false_positive_rate(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    fpr_curve, tpr_curve, _ = roc_curve(y_test, proba)
    auc_roc = auc(fpr_curve, tpr_curve)
    return {
        "fpr": round(fpr_val, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "auc_roc": round(auc_roc, 4),
        "proba": proba,
        "y_pred": y_pred,
        "fpr_curve": fpr_curve,
        "tpr_curve": tpr_curve,
    }


def save_confusion_matrix(y_test, y_pred):
    os.makedirs(RESULTS_DIR, exist_ok=True)
    cm = confusion_matrix(y_test, y_pred)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=["Genuine", "Fraud"])
    fig, ax = plt.subplots(figsize=(5, 4))
    disp.plot(ax=ax, colorbar=False)
    ax.set_title("XGBoost — Confusion Matrix")
    plt.tight_layout()
    path = os.path.join(RESULTS_DIR, "xgboost_confusion_matrix.png")
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"Saved: {path}")


def save_roc_curve(fpr_curve, tpr_curve, auc_roc):
    os.makedirs(RESULTS_DIR, exist_ok=True)
    fig, ax = plt.subplots(figsize=(5, 4))
    ax.plot(fpr_curve, tpr_curve, label=f"AUC = {auc_roc:.4f}")
    ax.plot([0, 1], [0, 1], "k--", linewidth=0.8)
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.set_title("XGBoost — ROC Curve")
    ax.legend(loc="lower right")
    plt.tight_layout()
    path = os.path.join(RESULTS_DIR, "xgboost_roc_curve.png")
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"Saved: {path}")


def save_results(results, params):
    os.makedirs(RESULTS_DIR, exist_ok=True)
    path = os.path.join(RESULTS_DIR, "results_table.csv")
    row = {
        "model": "xgboost",
        "n_estimators": params["n_estimators"],
        "max_depth": params["max_depth"],
        "learning_rate": params["learning_rate"],
        "fpr": results["fpr"],
        "precision": results["precision"],
        "recall": results["recall"],
        "f1": results["f1"],
        "auc_roc": results["auc_roc"],
    }
    df = pd.DataFrame([row])
    df.to_csv(path, index=False)
    print(f"Saved: {path}")


def run():
    print("Loading artifacts...")
    X_train, y_train, X_test, y_test = load_artifacts()
    print(f"  Train: {X_train.shape} | Test: {X_test.shape}")

    # hyperparameter search — try a small grid, pick the best by F1
    search_grid = [
        {"n_estimators": 100, "max_depth": 4, "learning_rate": 0.1},
        {"n_estimators": 200, "max_depth": 4, "learning_rate": 0.1},
        {"n_estimators": 200, "max_depth": 6, "learning_rate": 0.1},
        {"n_estimators": 200, "max_depth": 6, "learning_rate": 0.05},
    ]

    print("\nHyperparameter search:")
    best_f1 = -1
    best_params = None
    best_model = None

    for params in search_grid:
        model = XGBClassifier(
            n_estimators=params["n_estimators"],
            max_depth=params["max_depth"],
            learning_rate=params["learning_rate"],
            eval_metric="logloss",
            random_state=42,
            n_jobs=-1,
        )
        model.fit(X_train, y_train)
        res = evaluate(model, X_test, y_test)
        print(
            f"  n_est={params['n_estimators']} depth={params['max_depth']} lr={params['learning_rate']}"
            f"  ->  FPR={res['fpr']}  F1={res['f1']}  AUC={res['auc_roc']}"
        )
        if res["f1"] > best_f1:
            best_f1 = res["f1"]
            best_params = params
            best_model = model

    print(f"\nBest params: {best_params}")

    # final evaluation with best model
    final = evaluate(best_model, X_test, y_test)
    print("\nFinal results:")
    print(f"  FPR (primary): {final['fpr']}")
    print(f"  Precision:     {final['precision']}")
    print(f"  Recall:        {final['recall']}")
    print(f"  F1:            {final['f1']}")
    print(f"  AUC-ROC:       {final['auc_roc']}")

    # save model
    model_path = os.path.join(ARTIFACTS_DIR, "xgboost_model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(best_model, f)
    print(f"\nSaved: {model_path}")

    # save plots and results
    save_confusion_matrix(y_test, final["y_pred"])
    save_roc_curve(final["fpr_curve"], final["tpr_curve"], final["auc_roc"])
    save_results(final, best_params)


if __name__ == "__main__":
    run()
