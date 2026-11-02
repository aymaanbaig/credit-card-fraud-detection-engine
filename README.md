# Hybrid Credit Card Fraud Detection System

A hybrid fraud detection system combining rule-based checks, machine learning and explainable AI to identify suspicious credit card transactions and help analysts understand fraud predictions.

## Project Overview

Credit card fraud detection is challenging because financial institutions need to identify fraudulent transactions while minimising false positives that can disrupt legitimate customer activity.

This project was developed as part of my MSc Advanced Computer Science dissertation at the University of Leicester. It implements a hybrid approach that combines configurable rule-based checks with machine learning models and explainable AI techniques.

The system uses the **Kaggle Credit Card Fraud Detection dataset** and includes two machine learning models:

- **XGBoost:** A gradient-boosted decision-tree model.
- **Multi-Layer Perceptron (MLP):** A neural network model.

SMOTE is used to address class imbalance during model training. Model performance is assessed using precision, recall, F1-score, false positive rate, ROC-AUC and precision-recall analysis.

The project also incorporates SHAP-based explainability and plain-English explanations to help interpret model predictions.

## Key Features

- **Rule-Based Detection:** Evaluates transactions against predefined fraud detection rules.
- **Machine Learning:** Uses XGBoost and MLP models to identify potentially fraudulent transaction patterns.
- **Data Preprocessing:** Prepares transaction data for model training and evaluation.
- **Class Imbalance Handling:** Uses SMOTE on training data.
- **Model Evaluation:** Measures performance using metrics suitable for imbalanced classification.
- **Explainable AI:** Uses SHAP to examine feature contributions to model predictions.
- **Plain-English Explanations:** Makes fraud predictions easier to interpret.
- **Hybrid Detection Pipeline:** Combines rule-based checks and machine learning outputs.
- **Analyst Dashboard:** Provides a React-based interface for reviewing flagged transactions and related information.

## Technology Stack

| Area | Technologies |
|---|---|
| Programming | Python, JavaScript |
| Machine Learning | XGBoost, Multi-Layer Perceptron, scikit-learn |
| Explainable AI | SHAP |
| Data Processing | Pandas, NumPy |
| Imbalanced Learning | imbalanced-learn, SMOTE |
| Backend | FastAPI |
| Frontend | React, Vite |
| Database | PostgreSQL, SQLAlchemy |
| Testing | Pytest |
| Package Management | uv |

## System Architecture

The system is organised into the following main components:

1. **React Frontend:** Provides the analyst-facing interface.
2. **Backend Services:** Expose application functionality through FastAPI.
3. **Rule Engine:** Evaluates transactions against configured detection rules.
4. **Machine Learning Scoring:** Generates fraud predictions using XGBoost and MLP.
5. **Explainability Layer:** Uses SHAP to interpret model predictions.
6. **Hybrid Pipeline:** Combines rule-based and model outputs.
7. **Database:** Stores relevant transaction and analysis information.

## Model Evaluation

The project uses evaluation measures suited to fraud detection, where fraudulent transactions represent a small proportion of the dataset.

The evaluation includes:

- Precision
- Recall
- F1-score
- False positive rate
- ROC-AUC
- Precision-recall curves
- Confusion matrices

These metrics help assess the balance between identifying fraudulent transactions and incorrectly flagging legitimate ones.

## Dataset

The project uses the **Kaggle Credit Card Fraud Detection dataset**.

The raw dataset is not included in this repository. Download it separately from Kaggle and follow the project's data preparation instructions.

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
├── .gitignore
├── FAQ.md
└── README.md
```

## Project Status

**Completed MSc dissertation project.**

The project brings together rule-based fraud detection, machine learning and explainable AI in a hybrid fraud detection workflow.

The implementation and supporting documentation are available in this repository.

## Author

**Aymaan Baig Mohammed**

MSc Advanced Computer Science  
University of Leicester

[GitHub Profile](https://github.com/aymaanbaig)
