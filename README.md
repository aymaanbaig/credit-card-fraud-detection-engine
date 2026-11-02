## Project title: A Hybrid Fraud Detection System: Combining Rule-Based and Deep Learning Approaches with Explainable AI



### Project description:
Credit card fraud is a big problem. Every year banks and customers lose billions of pounds to it, and catching it as it happens is still one of the hardest jobs in financial technology. Most systems today fall into one of two camps. Some use fixed rules that run very fast but cannot learn or adapt. Others use machine learning that can spot complex patterns but cannot explain why they made a decision. Both have a weakness, and neither one solves the problem on its own. I want to build a system called a Hybrid Fraud Detection System that uses both approaches together. A rule engine handles the simple, fast checks, and a deep learning model handles the harder patterns that rules miss. The deep learning part trains and compares two models, an XGBoost baseline and a Multi-Layer Perceptron, on the Kaggle Credit Card Fraud dataset. On top of this I will add a SHAP explainability layer that turns each decision into a plain-English reason, and a React dashboard where analysts can see the flagged transactions and give their verdict. The main focus is comparing the two models on false positive rate rather than accuracy, since every false alarm blocks a real customer and adds work for an analyst.

### List of requirements (objectives):

Essential:
- Rule Engine: The system must check each transaction against configurable rules for velocity, location anomaly and amount threshold, and return a decision.
- Model Training: The system must train an XGBoost model and a Multi-Layer Perceptron on the Kaggle Credit Card Fraud dataset.
- Imbalance Handling: The system must apply SMOTE oversampling to the training set only.
- Model Evaluation: The system must report false positive rate, precision, recall, F1 score and AUC-ROC for both models.
- Precision-Recall Curves: The system must produce precision-recall curves for both models at different thresholds.
- SHAP Explanations: The system must produce SHAP feature importance values for each flagged transaction.
- Plain-English Output: The system must turn the SHAP values into plain-English explanations for each flagged transaction.
- Hybrid Pipeline: The system must combine the rule engine and the model into one pipeline that gives a single decision per transaction.
- Analyst Dashboard: The system must provide a React dashboard showing flagged transactions, risk scores, triggered rules and SHAP explanations.
- Analyst Feedback: The dashboard must let analysts record a verdict on each flagged transaction.

Desirable:
- Configurable Thresholds: Analysts should be able to change the decision threshold and see how the results change.
- Rule Management: The rules in the rule engine should be editable without changing the code.
- Explanation History: Past explanations and verdicts should be stored so they can be reviewed later.
- Filtering and Sorting: The dashboard should let analysts filter and sort flagged transactions by risk score or rule.
- Model Comparison View: The dashboard should show a simple comparison of the two models results side by side.

Optional:
- Export Reports: The system may let analysts export a flagged transaction and its explanation as a PDF.
- Alerts: The system may send an alert when a high-risk transaction is detected.
- Extra Model: The system may add a third model, such as a Random Forest, to the comparison.
- Feature Importance Summary: The system may show an overall view of which features matter most across many transactions.

### Information about this repository:
This repository contains all code and documentation for the CO7201 Individual Project dissertation. The main software artefacts are organised as follows:

- /backend — Python FastAPI services for the rule engine, ML scoring and SHAP explainability
- /models — XGBoost and MLP model training scripts and saved model files
- /frontend — React analyst dashboard
- /data — Dataset preprocessing scripts (raw data not included — download from Kaggle)
- /docs — Project proposal, preliminary report and dissertation write-up
- /tests — Unit and integration tests

Commits are made after each working feature or integration milestone with concise descriptive messages.
