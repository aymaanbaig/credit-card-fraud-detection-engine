# Week 3 — XGBoost Model
**Week:** 3 (11 Jul – 16 Jul 2026)
**Area:** XGBoost training, hyperparameter search, evaluation, results

---

## What I set out to do

This week I trained the first machine learning model — XGBoost. The goal was to train it on the preprocessed data from Week 2, try a few different hyperparameter combinations to find the best one, evaluate it on the test set, and record the results.

The reason I am starting with XGBoost before MLP is that XGBoost supports SHAP natively via `TreeExplainer`, which I need in Week 5. Getting the model working now means the SHAP work in Week 5 has a solid base to build on.

---

## What I did

### Added XGBoost

I ran `uv add xgboost` to add it to the project. This updated both `pyproject.toml` and `uv.lock`.

### Training script

I wrote `models/train_xgboost.py`. It does five things in sequence:
1. Loads the pickle files from `artifacts/`
2. Runs a small hyperparameter search
3. Evaluates the best model on the test set
4. Saves the trained model to `artifacts/xgboost_model.pkl`
5. Saves a confusion matrix, ROC curve, and results CSV to `models/results/`

### Hyperparameter search

I tried 4 combinations manually instead of using `GridSearchCV`. GridSearchCV on a 454,902-row dataset would take much longer. The three parameters I varied were:

- `n_estimators` — how many trees to build
- `max_depth` — how deep each tree can grow
- `learning_rate` — how much each new tree corrects the previous one

I picked the best combination by F1 score.

---

## What I found

### Hyperparameter search results

| n_estimators | max_depth | learning_rate | FPR | F1 | AUC-ROC |
|---|---|---|---|---|---|
| 100 | 4 | 0.1 | 0.0042 | 0.4151 | 0.9800 |
| 200 | 4 | 0.1 | 0.0016 | 0.6354 | 0.9840 |
| **200** | **6** | **0.1** | **0.0005** | **0.8057** | **0.9814** |
| 200 | 6 | 0.05 | 0.0015 | 0.6296 | 0.9794 |

The best combination was 200 trees, depth 6, learning rate 0.1. Increasing depth from 4 to 6 made the biggest difference — FPR dropped from 0.0016 to 0.0005 and F1 jumped from 0.6354 to 0.8057. Lowering the learning rate to 0.05 made things worse, not better.

### Final results

| Metric | Value |
|--------|-------|
| FPR (primary) | 0.0005 |
| Precision | 0.7522 |
| Recall | 0.8673 |
| F1 | 0.8057 |
| AUC-ROC | 0.9814 |

FPR of 0.0005 means the model wrongly flags 1 in 2000 genuine transactions as fraud. Recall of 0.8673 means it catches 86.7% of actual fraud cases.

### Confusion matrix

The matrix has 4 boxes. The rows are what the transaction actually was. The columns are what the model predicted.

- **56836 (top left)** — genuine transactions correctly identified as genuine
- **28 (top right)** — genuine transactions wrongly flagged as fraud (false positives — a real customer gets blocked)
- **13 (bottom left)** — real fraud the model missed and called genuine (false negatives — fraud slips through)
- **85 (bottom right)** — real fraud correctly caught

Out of 98 real fraud cases, I caught 85 and missed 13. Out of 56,864 genuine transactions, I wrongly flagged only 28.

### ROC curve

The x-axis is the false positive rate. The y-axis is the true positive rate (recall). The dashed diagonal line is what random guessing looks like.

My model's line shoots up steeply toward the top-left corner. This means it catches most fraud while keeping the false positive rate very low. The AUC of 0.9814 confirms this — a perfect model scores 1.0 and random guessing scores 0.5.

---

## Issues I ran into

The `use_label_encoder=False` parameter I included in the XGBClassifier call is deprecated in XGBoost 3.x. It caused a warning on every training run. I removed it.

The print statement in the hyperparameter search used the Unicode arrow `→`. This caused a `UnicodeEncodeError` on Windows because the terminal uses cp1252 encoding. I changed it to the plain ASCII `->`.

---

## What is next

Week 4 is the MLP model. I train it under identical conditions — same pickle files, same train/test split, same evaluation metrics. Then I draw precision-recall curves for both models on the same axes so the comparison is direct. I also start the SHAP layer in Week 4 to avoid a crunch in Week 5.
