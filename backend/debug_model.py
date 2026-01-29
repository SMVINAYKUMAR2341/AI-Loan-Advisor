"""
Debug script to check if model predictions are inverted
"""
from loan_predictor import get_predictor
import numpy as np

predictor = get_predictor()

print("=" * 60)
print("DEBUGGING MODEL PREDICTIONS")
print("=" * 60)

# Let's check raw probabilities for extreme cases

# Case 1: Very good profile (should be high approval prob)
good_profile = {
    "age": 35,
    "education_level": "Master",
    "monthly_income": 100000,  # 12L annual
    "experience": 10,
    "home_ownership_status": "Own",
    "loan_amount": 200000,  # 2L loan (very low LTI = 0.17)
    "loan_purpose": "Personal",
    "cibil_score": 800,
    "previous_loan_defaults": "No",
    "loan_duration": 24
}

# Case 2: Very bad profile (should be low approval prob / high rejection)
bad_profile = {
    "age": 22,
    "education_level": "High School",
    "monthly_income": 15000,  # 1.8L annual
    "experience": 0,
    "home_ownership_status": "Rent",
    "loan_amount": 800000,  # 8L loan (LTI = 4.44!)
    "loan_purpose": "Personal",
    "cibil_score": 350,
    "previous_loan_defaults": "Yes",
    "loan_duration": 12
}

print("\nGOOD PROFILE (should be APPROVED with high probability):")
print("-" * 50)
X_good = predictor.preprocess_input(good_profile)
proba_good = predictor.model.predict_proba(X_good)[0]
print(f"  Class 0 (Non-Default/Approved) Probability: {proba_good[0] * 100:.2f}%")
print(f"  Class 1 (Default/Rejected) Probability: {proba_good[1] * 100:.2f}%")
result_good = predictor.predict(good_profile)
print(f"  Final Status: {result_good['status']}")
print(f"  Confidence shown: {result_good['confidence']}%")

print("\nBAD PROFILE (should be REJECTED with low approval probability):")
print("-" * 50)
X_bad = predictor.preprocess_input(bad_profile)
proba_bad = predictor.model.predict_proba(X_bad)[0]
print(f"  Class 0 (Non-Default/Approved) Probability: {proba_bad[0] * 100:.2f}%")
print(f"  Class 1 (Default/Rejected) Probability: {proba_bad[1] * 100:.2f}%")
result_bad = predictor.predict(bad_profile)
print(f"  Final Status: {result_bad['status']}")
print(f"  Confidence shown: {result_bad['confidence']}%")

print("\n" + "=" * 60)
print("DIAGNOSIS:")
print("=" * 60)

if proba_good[0] < proba_bad[0]:
    print(">>> MODEL IS INVERTED! Good profiles get lower Class 0 prob than bad ones.")
    print(">>> FIX: Use proba[1] as approval probability instead of proba[0]")
    print(">>>    OR swap Class 0 and Class 1 interpretation")
else:
    print("Model seems correctly oriented. Issue might be elsewhere.")
