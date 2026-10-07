# Hybrid Fraud Detection System
**CO7201 Individual Project — MSc Computing**

Hybrid credit card fraud detection combining a rule-based engine with XGBoost and MLP models, SHAP explainability, and a React analyst dashboard.

---

## Prerequisites

- Python 3.11+
- [uv](https://docs.astral.sh/uv/) (Python package manager)

Install uv on Windows:
```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

---

## Setup

```powershell
# 1. Clone the repo
git clone <repo-url>
cd project

# 2. Install all dependencies from the lockfile
uv sync
```


## Running the EDA Notebook

```powershell
uv run jupyter notebook
```

Open `notebooks/eda.ipynb` in the browser and run all cells.

---

## Running the Preprocessing Pipeline

```powershell
uv run python preprocessing/preprocess.py
```

This will:
- Split the data 80/20 (train/test)
- Apply SMOTE to the training set
- Scale `Amount` and `Time` on training data only
- Save all outputs to `artifacts/`

Run this once before running any model training scripts. The `artifacts/` folder must exist before running tests.

To run the preprocessing tests:

```powershell
uv run pytest tests/test_preprocessing.py -v
```

---

## Training the XGBoost Model

Run the preprocessing pipeline first (see above). Then:

```powershell
uv run python models/train_xgboost.py
```

This will:
- Load the preprocessed data from `artifacts/`
- Try 4 hyperparameter combinations and pick the best by F1
- Evaluate on the test set — FPR, precision, recall, F1, AUC-ROC
- Save the trained model to `artifacts/xgboost_model.pkl`
- Save a confusion matrix and ROC curve to `models/results/`
- Save the results to `models/results/results_table.csv`

---

## Training the MLP Model

Run the preprocessing pipeline and XGBoost training first. Then:

```powershell
uv run python models/train_mlp.py
```

This will:
- Load the same preprocessed data from `artifacts/`
- Try 4 hidden layer configurations and pick the best by F1
- Evaluate on the test set — FPR, precision, recall, F1, AUC-ROC
- Save the trained model to `artifacts/mlp_model.pkl`
- Save a confusion matrix to `models/results/`
- Draw a precision-recall curve comparing XGBoost and MLP
- Append MLP results to `models/results/results_table.csv`

---

## Running the SHAP Explainer (sample check)

Run after both models are trained:

```powershell
uv run python shap/explainer.py
```

This will:
- Load the XGBoost model and run SHAP on 100 test transactions — prints top 5 features and plain-English explanation for transaction 0
- Load the MLP model and run SHAP (KernelExplainer) on 3 test transactions — takes about a minute
- Print plain-English explanation for both models

Note: MLP SHAP values are in probability space (small, e.g. -0.029). XGBoost SHAP values are in log-odds space (larger, e.g. -4.187). Both are correct — do not compare magnitudes across models.