# Week 4 — MLP Model + SHAP Start
**Week:** 4 (17 Jul – 22 Jul 2026)
**Area:** MLP training, precision-recall comparison, SHAP integration (XGBoost)

---

## What I set out to do

Two things this week. First, train the MLP model under the exact same conditions as XGBoost — same pickle files, same split, same evaluation metrics. Second, start the SHAP layer by getting it working on XGBoost and confirming the values make sense.

The reason I need to do MLP under identical conditions is that the dissertation comparison has to be fair. If I use different data or a different preprocessing approach for each model, the results cannot be compared directly.

Week 5 is only 3 days, so I started SHAP in Week 4 to avoid a crunch before the interim report deadline.

---

## What I did

### MLP training

I wrote `models/train_mlp.py` following the same structure as the XGBoost script. It loads the same pickle files from `artifacts/`, runs a small hyperparameter search, evaluates the best model, and saves the results.

The parameters I varied were:
- `hidden_layer_sizes` — how many neurons in each layer, and how many layers
- `alpha` — regularisation strength (higher alpha = simpler model, less overfitting)

I used `early_stopping=True` so the model stops automatically when it stops improving on the validation set. This prevents overtraining without needing to set max_iter manually.

I tried 4 combinations:

| hidden_layer_sizes | alpha | FPR | F1 | AUC-ROC |
|---|---|---|---|---|
| (100,) | 0.0001 | 0.0007 | 0.7500 | 0.9690 |
| **(100, 50)** | **0.0001** | **0.0005** | **0.7962** | **0.9711** |
| (100, 50) | 0.001 | 0.0005 | 0.7905 | 0.9687 |
| (200, 100) | 0.0001 | 0.0005 | 0.7864 | 0.9633 |

Best: two layers (100 neurons, then 50), alpha=0.0001.

### Precision-recall comparison chart

The MLP script also loads the XGBoost model and draws both models' precision-recall curves on the same axes. This is saved to `models/results/precision_recall_curve.png` and goes directly into the dissertation.

### SHAP — XGBoost

I created `shap/explainer.py`. The file has three functions:
- `get_shap_values` — generates SHAP values for a batch of transactions
- `top_features` — returns the top N features sorted by their absolute SHAP value for one transaction
- `plain_english` — converts those top features into readable sentences

I confirmed SHAP is working by running it on 100 test transactions and printing the output for the first one.

---

## What I found

### MLP results (best model)

| Metric | MLP | XGBoost |
|--------|-----|---------|
| FPR (primary) | 0.0005 | 0.0005 |
| Precision | 0.7434 | 0.7522 |
| Recall | 0.8571 | 0.8673 |
| F1 | 0.7962 | 0.8057 |
| AUC-ROC | 0.9711 | 0.9814 |

Both models have the same FPR of 0.0005. XGBoost has a slightly higher F1 and AUC-ROC. The MLP is close but XGBoost performs better overall on this dataset. This is what goes into the dissertation comparison.

### What the comparison means (dissertation findings)

**FPR is identical — 0.0005 for both.**
This is the primary metric. Neither model is better than the other at avoiding false positives. Both will wrongly flag only 1 in 2000 genuine transactions. For an analyst using the system, both feel the same on this measure.

**XGBoost catches more fraud.**
XGBoost recall is 0.8673 vs MLP recall of 0.8571. XGBoost catches about 10 more fraud cases per 10,000 than MLP. That is a small difference but a real one.

**XGBoost separates fraud from genuine better overall.**
AUC-ROC measures how well a model separates the two classes across all possible thresholds — not just the default 0.5. XGBoost scores 0.9814 vs MLP's 0.9711. The gap is 0.01. It is not dramatic but it is consistent — XGBoost is the stronger model across the board.

**Why XGBoost outperforms MLP on this dataset.**
This is a common result for tabular data. Tree-based models like XGBoost tend to perform better than neural networks when the features are already pre-processed — in this case, V1–V28 are already PCA-normalised. The MLP has nothing to learn from the raw feature interactions because that structure has already been reduced by PCA. XGBoost's tree structure handles this kind of data well.

**Why the comparison still matters.**
The research contribution is not just picking a winner. It is showing, with evidence, how the two models behave differently on the same dataset under the same conditions. The precision-recall curve comparison is especially important — it shows the trade-off each model makes between catching fraud (recall) and avoiding false alarms (precision) at every possible threshold.

### SHAP output for one transaction

The top 5 features pushing transaction 0 toward fraud were:

| Feature | SHAP Value | Direction |
|---------|-----------|-----------|
| V4 | -4.187 | toward fraud |
| V14 | -2.551 | toward fraud |
| V7 | -1.103 | toward fraud |
| V11 | -0.950 | toward fraud |
| Amount | -0.583 | toward fraud |

All top features pushed toward fraud, which makes sense — transaction 0 is likely a fraud case. V4 and V14 are among the top correlated features from the EDA in Week 1, so seeing them here confirms the SHAP values are picking up the right signals.

The plain-English output for this transaction:
- "Feature V4 pushed the fraud score strongly toward fraud (SHAP value: -4.187)."
- "Feature V14 pushed the fraud score strongly toward fraud (SHAP value: -2.551)."

Note: V1–V28 have no real names because the bank anonymised them using PCA. The explanations describe direction and magnitude only — this limitation is acknowledged in the dissertation.

---

## Issues I ran into

### shap version conflicts

Installing shap was difficult. Three different failures before finding a version that works:

- `shap` (latest, 0.52.0) — pulled numba 0.53.1 which does not support Python 3.12. Failed to build.
- `shap==0.46.0` — numba version was compatible (0.66.0), but shap's colour module crashed with numpy 2.x due to a `np.floating` dtype change in numpy 2.0.
- `shap==0.47.0` and `shap==0.48.0` — installed correctly but `shap.TreeExplainer` failed with `ValueError: could not convert string to float: '[5E-1]'`. This is because XGBoost 3.x changed the internal format of `base_score` from `0.5` to `[5E-1]`, and those shap versions cannot parse the new format.

The fix was to stop using `shap.TreeExplainer` entirely and use XGBoost's own native SHAP implementation instead. XGBoost 3.x has SHAP built in via `model.get_booster().predict(dmatrix, pred_contribs=True)`. This bypasses shap's parser completely and returns the same SHAP contribution values directly.

---

## What is next

Week 5 is finishing the SHAP layer. I need to extend `shap/explainer.py` to also handle the MLP model using `shap.KernelExplainer`, and make sure the plain-English conversion function is complete and tested. The interim report is due at the end of Week 5.
