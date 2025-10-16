import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import joblib
import json
import os

# === 1) LOAD DATA ===
CSV_PATH = "dataset/transactions.csv"
df = pd.read_csv(CSV_PATH)

# === INITIAL SNAPSHOT ===
print("\n=== INITIAL HEAD ===")
print(df.head())

print("\n=== INITIAL INFO ===")
print(df.info())

print("\n=== INITIAL MISSING VALUES ===")
print(df.isnull().sum())

# === 2) CLEAN & FORMAT FIELDS ===

# Clean amount column (remove $ and commas, convert to float)
df["amount"] = df["amount"].replace(r"[\$,]", "", regex=True).astype(float)

# Trim whitespace from string columns
str_cols = df.select_dtypes(include="object").columns
df[str_cols] = df[str_cols].apply(lambda x: x.str.strip())

# === 3) HANDLE MISSING VALUES ===
# Fill missing categorical columns with mode
for col in ["category", "device", "notes"]:
    if df[col].isnull().sum() > 0:
        df[col] = df[col].fillna(df[col].mode()[0])

# Fill missing numeric columns (if any)
df["amount"] = df["amount"].fillna(df["amount"].median())

# === 4) REMOVE DUPLICATES ===
before = df.shape
df = df.drop_duplicates()
after = df.shape
print(f"\nDropped duplicates: {before} → {after}")

# === 5) OUTLIER HANDLING (IQR method) ===
def iqr_clip(series, k=1.5):
    q1, q3 = series.quantile([0.25, 0.75])
    iqr = q3 - q1
    lower = q1 - k * iqr
    upper = q3 + k * iqr
    return lower, upper

low_amt, high_amt = iqr_clip(df["amount"])
df["amount"] = df["amount"].clip(lower=low_amt, upper=high_amt)

# === 6) FEATURE ENGINEERING ===
df["transaction_hour"] = pd.to_datetime(df["timestamp"]).dt.hour
df["transaction_day"] = pd.to_datetime(df["timestamp"]).dt.day
df["is_high_amount"] = (df["amount"] > df["amount"].median()).astype(int)
df["has_notes"] = df["notes"].apply(lambda x: 0 if pd.isna(x) or x.strip() == "" else 1)
df["card_info_match"] = ((df["card_present"] == True) & (df["cvv_present"] == True)).astype(int)

# === 7) ONE-HOT ENCODE CATEGORICALS ===
cat_cols = ["merchant", "category", "location", "device"]
df = pd.get_dummies(df, columns=cat_cols, drop_first=False, dtype=int)

# === 8) SCALE NUMERIC FEATURES ===
numeric_cols = ["amount", "chargeback_history", "transaction_hour", "transaction_day"]
scaler = StandardScaler()
df[numeric_cols] = scaler.fit_transform(df[numeric_cols])

# Save scaler
os.makedirs("models", exist_ok=True)
joblib.dump(scaler, "models/transaction_scaler.pkl")

# === 9) DROP IDENTIFIER AND NON-NUMERIC COLUMNS ===
drop_cols = [
    "transaction_id",
    "user_id",
    "merchant_id",
    "auth_code",
    "card_pan",
    "card_expiry",
    "email",
    "phone",
    "notes",
    "ip_address"  
]
df = df.drop(columns=[c for c in drop_cols if c in df.columns])

# === 10) VERIFY ALL FEATURES ARE NUMERIC ===
non_numeric_cols = df.select_dtypes(exclude=["number"]).columns.tolist()
if non_numeric_cols:
    print("\n⚠️ Found non-numeric columns:", non_numeric_cols)
    print("Attempting to encode them automatically...")

    # One-hot encode any remaining object columns
    df = pd.get_dummies(df, columns=non_numeric_cols, drop_first=False, dtype=int)

# === 11) SAVE TRAINING COLUMN ORDER ===
TRAIN_COLUMNS = df.drop(columns=["is_fraud"]).columns.tolist()
json.dump(TRAIN_COLUMNS, open("models/train_columns.json", "w"))

# === 12) FINAL SNAPSHOT ===
print("\n=== FINAL CLEAN HEAD ===")
print(df.head())

print("\n=== FINAL CLEAN INFO ===")
print(df.info())

print("\n=== FINAL MISSING VALUES ===")
print(df.isnull().sum())

# === 13) SAVE CLEAN DATASET ===
OUT_PATH = "dataset/transactions_clean.csv"
df.to_csv(OUT_PATH, index=False)
print(f"\n✅ Cleaned dataset saved to {OUT_PATH}")