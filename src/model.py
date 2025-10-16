# model.py
from utils import prepare_features_from_raw
import pandas as pd
import numpy as np
import joblib
import json
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report

# 1) Load the cleaned dataset
CSV_PATH = "dataset/transactions_clean.csv"
df = pd.read_csv(CSV_PATH)

# 2) X, y
X = df.drop(columns=["is_fraud"])
y = df["is_fraud"]

# 3) Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 4) Logistic Regression
lr = LogisticRegression(max_iter=1000, random_state=42, class_weight="balanced").fit(X_train, y_train)
lr_pred = lr.predict(X_test)

# 5) Random Forest
rf = RandomForestClassifier(
    n_estimators=200, random_state=42, class_weight="balanced_subsample"
).fit(X_train, y_train)
rf_pred = rf.predict(X_test)

# 6) Metrics
def print_metrics(name, y_true, y_pred):
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    print(f"\n{name} Performance:")
    print(f"  Accuracy : {acc:.3f}")
    print(f"  Precision: {prec:.3f}")
    print(f"  Recall   : {rec:.3f}")
    print(f"  F1 Score : {f1:.3f}")
    print("  Confusion Matrix:\n", confusion_matrix(y_true, y_pred))

print_metrics("Logistic Regression", y_test, lr_pred)
print_metrics("Random Forest", y_test, rf_pred)

# 7) Single-row sanity check
i = 3
x_one_df = X_test.iloc[[i]]
y_true = y_test.iloc[i]
p_lr_one = float(lr.predict_proba(x_one_df)[0][1])
p_rf_one = float(rf.predict_proba(x_one_df)[0][1])
print("\nSingle-row sanity check:")
print(f"  Actual Fraud: {y_true}")
print(f"  LR Fraud Prob: {p_lr_one:.3f}")
print(f"  RF Fraud Prob: {p_rf_one:.3f}")

# 8) SAVE MODELS
joblib.dump(lr, "models/lr_fraud_model.joblib")
joblib.dump(rf, "models/rf_fraud_model.joblib")
print("\n✅ Saved models → models/lr_fraud_model.joblib and models/rf_fraud_model.joblib")

# 9) Optional: local custom input test using helper
custom = {
    "amount": 350.0,
    "category": "Food",
    "merchant": "ShopSmart",
    "timestamp": "2025-10-10 14:30:00",
    "location": "New York",
    "device": "Mobile",
    "card_present": 1,
    "cvv_present": 1,
    "card_bin": 453212,
    "ip_address": "192.168.1.45",
    "chargeback_history": 1,
}
x_new_df = prepare_features_from_raw(custom)
print("\n=== Custom Input Prediction ===")
print("Logistic Regression Fraud Probability:", float(lr.predict(x_new_df)[0]))
print("Random Forest Fraud Probability      :", float(rf.predict(x_new_df)[0]))


