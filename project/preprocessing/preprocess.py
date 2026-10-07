import os
import json
import pickle
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "creditcard.csv")
ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "artifacts")


def save(obj, filename):
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    with open(os.path.join(ARTIFACTS_DIR, filename), "wb") as f:
        pickle.dump(obj, f)


def run():
    df = pd.read_csv(DATA_PATH)

    X = df.drop(columns=["Class"])
    y = df["Class"]

    # stratified split preserves the 0.17% fraud ratio in both sets
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # apply SMOTE to training set only — never touch the test set
    smote = SMOTE(random_state=42)
    X_train, y_train = smote.fit_resample(X_train, y_train)

    # scale only Amount and Time — V1-V28 are already PCA-normalised
    scaler = StandardScaler()
    X_train[["Amount", "Time"]] = scaler.fit_transform(X_train[["Amount", "Time"]])
    X_test[["Amount", "Time"]] = scaler.transform(X_test[["Amount", "Time"]])

    save(X_train, "X_train.pkl")
    save(X_test, "X_test.pkl")
    save(y_train, "y_train.pkl")
    save(y_test, "y_test.pkl")
    save(scaler, "scaler.pkl")

    # save split metadata for tests — avoids version-sensitive pickle loading
    info = {
        "original_rows": len(df),
        "test_rows": len(X_test),
        "test_fraud_count": int(y_test.sum()),
        "test_fraud_rate": float(y_test.sum() / len(y_test)),
        "scaler_amount_mean": float(scaler.mean_[0]),
        "full_dataset_amount_mean": float(X["Amount"].mean()),
    }
    with open(os.path.join(ARTIFACTS_DIR, "split_info.json"), "w") as f:
        json.dump(info, f, indent=2)

    print(f"Training set: {X_train.shape} | Fraud: {y_train.sum()} | Genuine: {(y_train == 0).sum()}")
    print(f"Test set:     {X_test.shape} | Fraud: {y_test.sum()} | Genuine: {(y_test == 0).sum()}")
    print("Saved: X_train.pkl, X_test.pkl, y_train.pkl, y_test.pkl, scaler.pkl, split_info.json")


if __name__ == "__main__":
    run()
