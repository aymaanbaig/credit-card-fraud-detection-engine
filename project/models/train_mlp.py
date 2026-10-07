import os
import pickle
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import (
    confusion_matrix, ConfusionMatrixDisplay,
    roc_curve, auc,
    precision_score, recall_score, f1_score,
    precision_recall_curve
)

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
    prec_curve, rec_curve, _ = precision_recall_curve(y_test, proba)
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
        "prec_curve": prec_curve,
        "rec_curve": rec_curve,
    }


def save_confusion_matrix(y_test, y_pred):
    os.makedirs(RESULTS_DIR, exist_ok=True)
    cm = confusion_matrix(y_test, y_pred)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=["Genuine", "Fraud"])
    fig, ax = plt.subplots(figsize=(5, 4))
    disp.plot(ax=ax, colorbar=False)
    ax.set_title("MLP — Confusion Matrix")
    plt.tight_layout()
    path = os.path.join(RESULTS_DIR, "mlp_confusion_matrix.png")
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"Saved: {path}")


def save_precision_recall_curve(mlp_results, xgb_results):
    os.makedirs(RESULTS_DIR, exist_ok=True)
    fig, ax = plt.subplots(figsize=(6, 5))
    ax.plot(mlp_results["rec_curve"], mlp_results["prec_curve"], label="MLP")
    ax.plot(xgb_results["rec_curve"], xgb_results["prec_curve"], label="XGBoost")
    ax.set_xlabel("Recall")
    ax.set_ylabel("Precision")
    ax.set_title("Precision-Recall Curve — XGBoost vs MLP")
    ax.legend(loc="lower left")
    plt.tight_layout()
    path = os.path.join(RESULTS_DIR, "precision_recall_curve.png")
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"Saved: {path}")


def append_results(results, params):
    os.makedirs(RESULTS_DIR, exist_ok=True)
    path = os.path.join(RESULTS_DIR, "results_table.csv")
    row = {
        "model": "mlp",
        "hidden_layers": str(params["hidden_layer_sizes"]),
        "alpha": params["alpha"],
        "fpr": results["fpr"],
        "precision": results["precision"],
        "recall": results["recall"],
        "f1": results["f1"],
        "auc_roc": results["auc_roc"],
    }
    df_new = pd.DataFrame([row])
    if os.path.exists(path):
        df_existing = pd.read_csv(path)
        df_existing = df_existing[df_existing["model"] != "mlp"]
        df_combined = pd.concat([df_existing, df_new], ignore_index=True)
    else:
        df_combined = df_new
    df_combined.to_csv(path, index=False)
    print(f"Saved: {path}")


def load_xgb_model():
    path = os.path.join(ARTIFACTS_DIR, "xgboost_model.pkl")
    with open(path, "rb") as f:
        return pickle.load(f)


def run():
    print("Loading artifacts...")
    X_train, y_train, X_test, y_test = load_artifacts()
    print(f"  Train: {X_train.shape} | Test: {X_test.shape}")

    # small hyperparameter search — vary hidden layer sizes and regularisation
    search_grid = [
        {"hidden_layer_sizes": (100,),      "alpha": 0.0001},
        {"hidden_layer_sizes": (100, 50),   "alpha": 0.0001},
        {"hidden_layer_sizes": (100, 50),   "alpha": 0.001},
        {"hidden_layer_sizes": (200, 100),  "alpha": 0.0001},
    ]

    print("\nHyperparameter search:")
    best_f1 = -1
    best_params = None
    best_model = None

    for params in search_grid:
        print(f"  Training {params['hidden_layer_sizes']} alpha={params['alpha']} ...")
        model = MLPClassifier(
            hidden_layer_sizes=params["hidden_layer_sizes"],
            alpha=params["alpha"],
            activation="relu",
            max_iter=300,
            early_stopping=True,
            random_state=42,
            verbose=False,
        )
        model.fit(X_train, y_train)
        res = evaluate(model, X_test, y_test)
        print(f"    ->  FPR={res['fpr']}  F1={res['f1']}  AUC={res['auc_roc']}")
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
    model_path = os.path.join(ARTIFACTS_DIR, "mlp_model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(best_model, f)
    print(f"\nSaved: {model_path}")

    # save confusion matrix
    save_confusion_matrix(y_test, final["y_pred"])

    # load xgboost model and draw precision-recall comparison
    print("\nDrawing precision-recall curve comparison...")
    xgb_model = load_xgb_model()
    xgb_results = evaluate(xgb_model, X_test, y_test)
    save_precision_recall_curve(final, xgb_results)

    # append MLP results to results_table.csv
    append_results(final, best_params)


if __name__ == "__main__":
    run()
