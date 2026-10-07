# Week 5 — SHAP Layer + Plain-English Conversion
**Week:** 5 (23 Jul – 25 Jul 2026)
**Area:** SHAP for MLP using KernelExplainer, plain-English conversion, warnings fix

---

## What I set out to do

Finish the SHAP layer started in Week 4. Week 4 got SHAP working for XGBoost. Week 5 was extending it to the MLP model using `shap.KernelExplainer`, and making sure the plain-English conversion function worked for both models.

Week 5 is only 3 days. The interim report is due at the end of this week. Requirements #2 through #6 must be done before I write anything up.

---

## What I did

- I added `get_shap_values_mlp()` to `shap/explainer.py` — uses `shap.KernelExplainer` with a 100-row background sample from the training set
- I added `run_mlp_check()` to test MLP SHAP on 3 transactions — prints shape, top features, and plain-English explanation
- I added `warnings.filterwarnings("ignore", category=UserWarning)` inside `run_mlp_check()` to suppress the sklearn feature name warning
- I confirmed both `run_xgboost_check()` and `run_mlp_check()` run without errors

The `plain_english()` and `explain_transaction()` functions already worked for any model — they just take SHAP values and feature names, so no model-specific changes were needed there.

---

## What I found

### MLP SHAP output (transaction 0 from test set)

| Feature | SHAP Value | Direction |
|---------|-----------|-----------|
| V7 | -0.029 | toward fraud |
| V23 | -0.012 | toward fraud |
| V12 | +0.008 | away from fraud |

### Why MLP SHAP values are much smaller than XGBoost values

XGBoost native SHAP returns values in log-odds space. These are unbounded — values like -4.187 are normal. KernelExplainer wraps a predict_proba function that returns values between 0 and 1. SHAP values from KernelExplainer therefore sum to the probability output, which means they are all much smaller. Both are correct — they are just on different scales.

This matters for the dissertation. I cannot directly compare SHAP magnitudes between XGBoost and MLP. I can only compare the rank order of features — which features matter most for each model.

### What the plain-English output looks like

For a transaction where the top feature is V7 with SHAP = -0.029:

> "Feature V7 pushed the fraud score slightly toward fraud (SHAP value: -0.029)."

The strength thresholds are:
- SHAP absolute value > 1.0 → "strongly"
- SHAP absolute value > 0.3 → "moderately"
- SHAP absolute value ≤ 0.3 → "slightly"

For MLP all outputs will say "slightly" because the values are all < 0.3 in probability space. For XGBoost, the top features often say "strongly" because values like -4.187 are common in log-odds space.

I acknowledged this limitation in the code and will explain it in the dissertation.

---

## Issues I ran into

### sklearn feature name warning

When KernelExplainer calls `predict_proba` internally, it passes numpy arrays. The MLP was trained on pandas DataFrames with named columns. sklearn prints a UserWarning every time: "X does not have valid feature names, but MLPClassifier was fitted with feature names."

The warning fires multiple times because KernelExplainer calls predict_proba many times internally (once per background sample). It does not affect the results — the model runs fine. I suppressed it with `warnings.filterwarnings("ignore", category=UserWarning)` at the top of `run_mlp_check()`.

I had also converted the input arrays to numpy (`.to_numpy()`) in Week 4, which reduced but did not eliminate the warnings. The `filterwarnings` call clears the remaining ones.

### KernelExplainer is slow

Even with 100 background samples and `nsamples=100`, explaining 3 transactions takes about a minute. This is expected — KernelExplainer is model-agnostic and runs many perturbations to estimate SHAP values. For the final pipeline, MLP SHAP will need to be computed on a small sample only, not on every transaction in real time.

---

## Deviations from plan

None. The plan said to use `KernelExplainer` for MLP if `TreeExplainer` was not compatible — that is exactly what I did. Both models have working SHAP output.

The one thing I noted for the dissertation: the different scales of XGBoost and MLP SHAP values make direct comparison of magnitudes impossible. I can compare which features appear in the top 5 for each model, but not compare the raw SHAP numbers side by side.

---

## What is next

Week 6 is the rule engine. I will build a standalone FastAPI service with three configurable rules: velocity, location, and amount. All thresholds go in a YAML config file — no hardcoded values.

Requirements #2 through #6 are now complete:
- #2 Preprocessing — done (W2)
- #3 XGBoost — done (W3)
- #4 MLP — done (W4)
- #5 SHAP layer — done (W4 + W5)
- #6 Plain-English explanations — done (W5)
