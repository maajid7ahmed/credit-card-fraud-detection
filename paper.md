# Credit Card Fraud Detection System

## 📝 Introduction
The Credit Card Fraud Detection System is an AI-powered solution designed to help financial institutions, merchants, and fraud monitoring teams identify potentially fraudulent transactions. By analyzing transaction patterns, user behavior, and historical data, the system predicts fraudulent activity, reducing financial losses and improving security. This tool combines machine learning techniques with realistic, messy transaction data to provide a practical solution for real-world fraud detection.

## 🎯 Objectives

### Primary Objectives:
- **Fraud Prevention**: Detect and flag suspicious transactions in real time
- **Risk Reduction**: Minimize financial losses for banks and merchants
- **Data-Driven Insights**: Provide actionable intelligence for fraud investigation teams
- **Operational Efficiency**: Reduce manual fraud review workload

### Technical Objectives:
- Develop robust machine learning models (Logistic Regression, Random Forest)
- Handle messy and incomplete datasets effectively
- Build a REST API for easy integration with existing systems
- Enable scalable deployment for institutional use

## ✨ Key Features

### 🤖 Multiple AI Models
- **Classification Algorithms**: Logistic Regression and Random Forest Classifier
- **Performance Evaluation**: Accuracy, F1-Score, Precision, Recall
- **Single Transaction Prediction**: Predict fraud for individual transactions
- **Custom Input Support**: Accepts JSON payload via Flask API

### 📊 Comprehensive Data Analysis
- **Transaction Metrics**: Amount, merchant, category, timestamp
- **User Behavior**: Past chargebacks, card presence, device type
- **Card Information**: PAN, CVV, BIN, card expiry
- **Location & Contact**: IP address, email, phone
- **Messy Data Handling**: Missing values, extra spaces, duplicates

## ⚙️ Project Architecture


## 🛠️ How It Works
1. **Data Preprocessing**: Clean missing values, standardize categories, scale numerical features, remove duplicates.
2. **Model Training**: Train Logistic Regression and Random Forest on preprocessed dataset.
3. **Evaluation**: Validate models using test set and compute metrics.
4. **Deployment**: Serve predictions via a Flask REST API accepting JSON inputs.
5. **Fraud Detection**: Output `is_fraud = 1` for suspicious transactions, `0` otherwise.

## 🔗 Project Link
[GitHub Repository](https://github.com/maajid7ahmed/credit-card-fraud-detection)

## 📌 Notes
- Simulated dataset includes realistic messy entries for preprocessing practice.
- Dataset is imbalanced to reflect real-world fraud scenarios.
- Designed for scalability and integration into banking and e-commerce systems.
