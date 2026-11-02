# A Hybrid Credit Card Fraud Detection System Using Rule-Based and Machine Learning Approaches with Explainable AI

## Project Overview

Credit card fraud detection is a challenging problem for financial institutions. Systems must identify suspicious transactions while minimising false positives that can disrupt legitimate customer activity and create additional work for fraud analysts.

This MSc Advanced Computer Science dissertation project explores a hybrid fraud detection approach that combines rule-based checks with machine learning and explainable AI techniques.

The system uses a rule engine to evaluate transactions against predefined fraud conditions, while machine learning models identify potentially fraudulent patterns that may not be captured by fixed rules.

The project uses the Kaggle Credit Card Fraud Detection dataset to train and evaluate two models:

- **XGBoost:** A gradient-boosted decision-tree model.
- **Multi-Layer Perceptron (MLP):** A neural network model.

SMOTE is used to address class imbalance on the training data. Model performance is evaluated using precision, recall, F1-score, false positive rate, ROC-AUC and precision-recall analysis.

The project also explores SHAP-based explainability to interpret model predictions and a React-based dashboard for presenting flagged transactions and related information.

The main focus is understanding the trade-off between detecting fraudulent transactions and incorrectly flagging legitimate ones, rather than relying on accuracy alone.

## Project Objectives

### Essential Requirements

- **Rule Engine:** Evaluate transactions against configurable rules, including transaction amount, velocity and location-related conditions.
- **Model Training:** Train and compare XGBoost and MLP models using the Kaggle Credit Card Fraud Detection dataset.
- **Imbalance Handling:** Apply SMOTE to the training data to address class imbalance.
- **Model Evaluation:** Evaluate models using false positive rate, precision, recall, F1-score and ROC-AUC.
- **Precision-Recall Analysis:** Generate precision-recall curves to examine model performance at different decision thresholds.
- **Explainable AI:** Use SHAP to analyse the contribution of features to model predictions.
- **Hybrid Pipeline:** Combine rule-based checks and machine learning scores into a fraud detection workflow.
- **Analyst Dashboard:** Provide a React interface for presenting flagged transactions, risk scores and relevant detection information.
- **Analyst Feedback:** Explore recording analyst decisions on flagged transactions.

### Desirable Requirements

- Allow decision thresholds to be configured and evaluated.
- Support rule configuration without requiring changes to application code.
- Maintain a history of explanations and analyst decisions.
- Provide filtering and sorting of flagged transactions.
- Include a model comparison view.

### Optional Extensions

- Export transaction reports and explanations as PDF files.
- Generate alerts for high-risk transactions.
- Evaluate an additional model, such as Random Forest.
- Provide an overall feature-importance summary.

## Technology Stack

- **Programming Languages:** Python, JavaScript
- **Machine Learning:** XGBoost, Multi-Layer Perceptron (MLP), scikit-learn
- **Explainable AI:** SHAP
- **Data Processing:** Pandas, NumPy, imbalanced-learn
- **Backend:** FastAPI
- **Frontend:** React, Vite
- **Testing:** Pytest

## Repository Structure

```text
credit-card-fraud-detection-engine/
├── project/
│   ├── data/
│   ├── database/
│   ├── frontend/
│   ├── models/
│   │   ├── results/
│   │   └── logs/
│   ├── notebooks/
│   ├── pipeline/
│   ├── preprocessing/
│   ├── services/
│   │   ├── ml_scoring/
│   │   ├── rule_engine/
│   │   └── shap/
│   └── tests/
├── FAQ.md
└── README.md
```

## Dataset

The project uses the **Kaggle Credit Card Fraud Detection dataset**.

The raw dataset is not included in this repository. Download it from Kaggle and follow the preprocessing instructions in the project documentation.

## Model Evaluation

The project investigates model performance using metrics suited to imbalanced fraud detection datasets:

- Precision
- Recall
- F1-score
- False positive rate
- ROC-AUC
- Precision-recall curves
- Confusion matrices

Evaluation plots and model outputs are stored in the model results directory where generated.

## Project Status

This repository contains the codebase and supporting documentation for my MSc individual dissertation project.

The objectives listed above describe the intended project scope. Some features may represent planned extensions rather than completed functionality. Refer to the source code and evaluation results for the current implementation status.

## Author

**Aymaan Baig Mohammed**

MSc Advanced Computer Science  
University of Leicester

[GitHub Profile](https://github.com/aymaanbaig)
