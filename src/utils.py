# utils.py
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime

# Load saved preprocessing assets
TRAIN_COLUMNS = json.load(open("models/train_columns.json"))
SCALER = joblib.load("models/transaction_scaler.pkl")

def prepare_features_from_raw(record: dict) -> pd.DataFrame:
    """
    Convert raw transaction record (amount, category, merchant, etc.)
    into a model-ready 1-row DataFrame that matches training columns.
    """

    # --- Extract fields with defaults ---
    amount = float(record.get("amount", 0.0))
    category = str(record.get("category", "Other"))
    merchant = str(record.get("merchant", "Unknown"))
    timestamp = pd.to_datetime(record.get("timestamp", datetime.now()))
    location = str(record.get("location", "Unknown"))
    device = str(record.get("device", "Unknown"))
    card_present = int(record.get("card_present", 0))
    cvv_present = int(record.get("cvv_present", 0))
    card_bin = int(record.get("card_bin", 0))
    ip_address = str(record.get("ip_address", "0.0.0.0"))
    chargeback_history = float(record.get("chargeback_history", 0))

    # --- Feature engineering ---
    transaction_hour = timestamp.hour
    transaction_day = timestamp.day
    is_high_amount = 1 if amount > 500 else 0
    card_info_match = 1 if (card_present and cvv_present) else 0

    # --- Initialize row with zeros ---
    row = {col: 0.0 for col in TRAIN_COLUMNS}

    # --- Fill numeric features ---
    for name, val in [
        ("amount", amount),
        ("chargeback_history", chargeback_history),
        ("transaction_hour", transaction_hour),
        ("transaction_day", transaction_day),
        ("is_high_amount", is_high_amount),
        ("card_info_match", card_info_match),
    ]:
        if name in row:
            row[name] = float(val)

    # --- Binary features ---
    if "card_present" in row:
        row["card_present"] = card_present
    if "cvv_present" in row:
        row["cvv_present"] = cvv_present

    # --- One-hot categorical features ---
    for prefix, value in {
        "merchant": merchant,
        "category": category,
        "location": location,
        "device": device,
    }.items():
        col = f"{prefix}_{value}"
        if col in row:
            row[col] = 1.0

    # --- Build dataframe with same columns ---
    df_one = pd.DataFrame([row], columns=TRAIN_COLUMNS)

    # --- Scale numeric features ---
    if hasattr(SCALER, "feature_names_in_"):
        cols_to_scale = list(SCALER.feature_names_in_)
        df_one[cols_to_scale] = SCALER.transform(df_one[cols_to_scale])

    return df_one
