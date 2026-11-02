# A Hybrid Credit Card Fraud Detection System Using Rule-Based and Machine Learning Approaches with Explainable AI

## Project Overview

Credit card fraud detection is a challenging problem for financial institutions. Systems must identify suspicious transactions while minimising false positives that can disrupt legitimate customer activity and create additional work for fraud analysts.

This MSc Advanced Computer Science dissertation project explores a hybrid fraud detection approach that combines rule-based checks with machine learning and explainable AI techniques.

The system is designed to use a rule engine to identify transactions that meet predefined fraud conditions, while machine learning models identify potentially fraudulent patterns that may not be captured by fixed rules.

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

- Export transaction
