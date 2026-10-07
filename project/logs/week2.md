# Week 2 — Preprocessing Pipeline
**Week:** 2 (4 Jul – 10 Jul 2026)
**Area:** Train/test split, SMOTE, feature scaling, unit tests

---

## What I set out to do

Before training any model I needed to prepare the data properly. This week had three steps: split the data into training and test sets, apply SMOTE to fix the class imbalance, and scale the Amount and Time features.

The reason I need to do this before any modelling is that both XGBoost and MLP must train and be evaluated on the exact same data. If I did the preprocessing separately for each model the comparison would not be fair. I save everything as pickle files once, and both models load the same files.

---

## What I did

### Train/test split

I split the data 80/20 using `train_test_split` with `stratify=y`. The stratify argument makes sure both sets keep the same fraud ratio of 0.17%. Without it I might end up with almost all 492 fraud cases in training and very few in the test set, which would give misleading evaluation numbers.

The test set is never touched again after this split. It is purely for measuring how well the final model performs on data it has never seen.

### SMOTE

After the split I applied SMOTE to the training set only. The dataset has 578 genuine transactions for every 1 fraud case. A model trained on that imbalance would just predict "genuine" every time and be right 99.8% of the time — but it would miss all the real fraud.

SMOTE generates synthetic fraud examples by interpolating between real fraud cases. It creates new, realistic fraud samples until fraud and genuine are equal in number. After SMOTE, the training set had 227,451 fraud and 227,451 genuine cases — a 50/50 balance.

I applied SMOTE only to the training set. The test set must stay at the original fraud rate of 0.17% so the evaluation reflects what the model would face in real life.

### Scaling

V1 to V28 are already PCA-normalised — their values sit between -3 and +3. But Amount ranges from £0 to £25,691 and Time ranges from 0 to 172,792 seconds.

If I fed those large raw numbers into the model alongside the small V values, the model might treat Amount as more important just because its numbers are bigger. I used `StandardScaler` to rescale Amount and Time to mean 0 and standard deviation 1, putting them on the same scale as V1–V28.

I fitted the scaler on the training set only, then used it to transform both the training and test sets. If I had fitted on the full dataset, test set information would have leaked into training.

### Saved artifacts

I saved 5 files to `artifacts/`:
- `X_train.pkl` and `y_train.pkl` — training data that both models load
- `X_test.pkl` and `y_test.pkl` — test data used to evaluate both models
- `scaler.pkl` — the fitted scaler, reused at inference time

I also saved `split_info.json` — a plain JSON file with the split metadata. This is used by the unit tests instead of loading the pickle files directly.

### Unit tests

I wrote 3 tests in `tests/test_preprocessing.py`:
- Test 1: checks the test set is 20% of the original row count — confirms the split ratio is correct
- Test 2: checks the test set fraud rate is still around 0.17% — confirms I did NOT apply SMOTE to the test set
- Test 3: checks the scaler's Amount mean does not match the full dataset mean — confirms the scaler was fitted on training data only

All 3 tests passed.

---

## What I found

After preprocessing the training set had 454,902 rows (227,451 fraud + 227,451 genuine). The test set had 56,962 rows with a fraud rate of 0.172% — matching the original dataset rate.

The scaler's mean for Amount was 98.87. The full dataset mean was 88.35. These are different because SMOTE added synthetic fraud cases to the training set. Fraud transactions tend to be small amounts, so adding more of them pulled the training mean down slightly from the original. This difference is what Test 3 checks — if they were the same, it would mean the scaler was incorrectly fitted on the full dataset.

---

## Issues I ran into

The first test run failed. pytest was using the system Python instead of the project venv. This caused a pandas version mismatch when loading the pickle files. I fixed it by running `uv add --dev pytest` to install pytest inside the project venv.

I then rewrote the tests to read from `split_info.json` instead of loading the pickle files. This avoids version compatibility issues entirely.

I named a value in `split_info.json` as `train_amount_mean_before_smote`. This was wrong — by that point in the code I had already scaled Amount, so the value saved was close to 0. I renamed it to `full_dataset_amount_mean` and saved the correct value from before any split. I also corrected the test logic: it now checks that the scaler mean DIFFERS from the full dataset mean, not that it matches.

---

## What is next

Week 3 is XGBoost training. I load the same pickle files, try a small range of hyperparameters, evaluate on the test set using FPR as the primary metric, and save the model and results.
