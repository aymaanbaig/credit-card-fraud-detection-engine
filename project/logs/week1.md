# Week 1 — Environment Setup + EDA
**Week:** 1 (27 Jun – 3 Jul 2026)
**Area:** Project setup, dataset exploration

---

## What I set out to do

I had not looked at the dataset yet and had no project structure in place. The goal this week was simple — set up the environment properly and understand what the data looks like before doing any modelling.

I needed to know how many transactions there are, how many are fraud, which features need scaling, and whether there are any missing values. Without this I cannot plan the preprocessing in Week 2.

---

## What I did

### Environment setup

I initialised the project using `uv init`. I chose uv because it manages the Python environment and dependencies through a lockfile — the same way pnpm works in JavaScript projects. This means anyone who clones the repo gets the exact same package versions just by running `uv sync`.

I added only the libraries needed for Week 1: `pandas`, `numpy`, `matplotlib`, `seaborn`, `jupyter`, `ipykernel`. I did not add scikit-learn or xgboost yet — those go in later weeks only.

### Dataset download

I downloaded `creditcard.csv` from Kaggle and placed it in `data/`. The file is 150MB so it is excluded from git via `.gitignore`.

### EDA notebook

I created `notebooks/eda.ipynb` and worked through the data in 8 cells:
- Shape and dtypes
- Null check
- Class distribution (how many fraud vs genuine)
- Bar chart of class imbalance
- Amount and Time distributions
- Top 10 features correlated with the fraud label

---

## What I found

The dataset has 284,807 transactions and only 492 are fraud. That is a fraud rate of 0.1727% — about 1 in 578 transactions. This is a severe class imbalance. If I trained a model on this raw data it would just learn to say "genuine" every time and be right 99.8% of the time, but it would miss all the fraud. I will need SMOTE in Week 2 to fix this.

There are zero missing values across all 31 columns. No imputation is needed.

V1 to V28 are PCA-transformed by the original bank. They are already normalised — their values sit between roughly -3 and +3. Only `Amount` and `Time` need scaling in Week 2 because their raw ranges are very large.

The top features most correlated with fraud (by absolute Pearson r):

| Feature | Correlation |
|---------|------------|
| V17 | 0.326 |
| V14 | 0.303 |
| V12 | 0.261 |
| V10 | 0.217 |
| V16 | 0.197 |

Fraud transactions tend to be small amounts. Median fraud amount is £9 vs £22 for genuine. Fraudsters seem to prefer small transactions, possibly to avoid triggering alerts.

---

## Issues I ran into

I started by writing `pyproject.toml` by hand. I then realised this would cause issues with the lockfile. I deleted it and redid it properly using `uv init` to make sure the lockfile was generated correctly from the start.

`uv init` defaulted to project name `project` and `requires-python = ">=3.12"`. I corrected both — the name to `fraud-detection` and the Python version to `>=3.11` to match the tech stack.

`uv init` also generated a `main.py` stub. I deleted it as it is not part of this project structure.

---

## What is next

Week 2 is the preprocessing pipeline — stratified train/test split, SMOTE on the training set only, and scaling Amount and Time. I also need to write unit tests to confirm the preprocessing was done correctly.
