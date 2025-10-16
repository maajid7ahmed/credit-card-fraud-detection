# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
from utils import prepare_features_from_raw  # uses saved scaler + columns

app = Flask(__name__)
CORS(app)   # enable CORS for frontend access

# === Load trained models once at startup ===
MODELS = {
    "lr": joblib.load("models/lr_fraud_model.joblib"),
    "rf": joblib.load("models/rf_fraud_model.joblib"),
}


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Fraud Detection API",
        "endpoints": {
            "POST /predict?model=lr|rf": {
                "expects_json": {
                    "amount": "number (e.g. 350.0)",
                    "category": "string (e.g. 'Food')",
                    "merchant": "string (e.g. 'ShopSmart')",
                    "timestamp": "ISO datetime (e.g. '2025-10-10T14:30:00')",
                    "location": "string (e.g. 'New York')",
                    "device": "string (e.g. 'Mobile' or 'POS')",
                    "card_present": "0 or 1",
                    "cvv_present": "0 or 1",
                    "card_bin": "int (first 6 digits of card)",
                    "ip_address": "string (e.g. '192.168.1.45')",
                    "chargeback_history": "int or float"
                }
            }
        }
    })


@app.route("/predict", methods=["POST"])
def predict():
    # === 1) Choose model ===
    choice = (request.args.get("model") or "").lower()
    if choice not in MODELS:
        return jsonify({"error": "Unknown model. Use ?model=lr or ?model=rf"}), 400
    model = MODELS[choice]

    # === 2) Read input JSON ===
    data = request.get_json(silent=True) or {}

    required = [
        "amount", "category", "merchant", "timestamp",
        "location", "device", "card_present", "cvv_present",
        "card_bin", "ip_address", "chargeback_history"
    ]
    missing = [k for k in required if k not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    # === 3) Predict fraud probability ===
    try:
        x_new = prepare_features_from_raw(data)
        prob = float(model.predict_proba(x_new)[0][1])
        is_fraud = int(prob >= 0.5)
    except Exception as e:
        return jsonify({"error": f"Failed to prepare or predict: {e}"}), 500

    # === 4) Return JSON response ===
    return jsonify({
        "model": "logistic_regression" if choice == "lr" else "random_forest",
        "input": data,
        "fraud_probability": round(prob, 4),
        "predicted_is_fraud": is_fraud
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
