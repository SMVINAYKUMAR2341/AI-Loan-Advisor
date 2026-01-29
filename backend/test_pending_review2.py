"""
Test to find PENDING_REVIEW scenarios with fixed model
"""
from loan_predictor import get_predictor

predictor = get_predictor()

print("=" * 60)
print("FINDING PENDING_REVIEW SCENARIOS (40-65% range)")
print("=" * 60)

# Testing various combinations to find PENDING_REVIEW
test_cases = [
    # Previous defaults scenarios - these might be borderline
    {
        "name": "Previous defaults, medium income, medium loan",
        "input": {
            "age": 30, "education_level": "Bachelor", "monthly_income": 50000,
            "experience": 5, "home_ownership_status": "Rent", "loan_amount": 500000,
            "loan_purpose": "Personal", "cibil_score": 620,
            "previous_loan_defaults": "Yes", "loan_duration": 36
        }
    },
    {
        "name": "Previous defaults, lower income, high LTI",
        "input": {
            "age": 35, "education_level": "Bachelor", "monthly_income": 40000,
            "experience": 8, "home_ownership_status": "Rent", "loan_amount": 600000,
            "loan_purpose": "Personal", "cibil_score": 600,
            "previous_loan_defaults": "Yes", "loan_duration": 48
        }
    },
    {
        "name": "Very high LTI (1.5x), low credit",
        "input": {
            "age": 28, "education_level": "High School", "monthly_income": 30000,
            "experience": 3, "home_ownership_status": "Rent", "loan_amount": 550000,
            "loan_purpose": "Personal", "cibil_score": 520,
            "previous_loan_defaults": "No", "loan_duration": 36
        }
    },
    {
        "name": "Multiple negatives: defaults + low credit + high LTI",
        "input": {
            "age": 26, "education_level": "High School", "monthly_income": 25000,
            "experience": 2, "home_ownership_status": "Rent", "loan_amount": 400000,
            "loan_purpose": "Personal", "cibil_score": 480,
            "previous_loan_defaults": "Yes", "loan_duration": 24
        }
    },
    {
        "name": "Moderate risk: defaults + OK credit + moderate LTI",
        "input": {
            "age": 32, "education_level": "Bachelor", "monthly_income": 45000,
            "experience": 6, "home_ownership_status": "Mortgage", "loan_amount": 400000,
            "loan_purpose": "HOMEIMPROVEMENT", "cibil_score": 580,
            "previous_loan_defaults": "Yes", "loan_duration": 36
        }
    },
]

for test in test_cases:
    print(f"\n{test['name']}")
    print("-" * 50)
    
    # Get raw probability
    X = predictor.preprocess_input(test["input"])
    proba = predictor.model.predict_proba(X)[0]
    raw_approval_prob = proba[1] * 100
    
    result = predictor.predict(test["input"])
    
    print(f"  Raw ML Approval Prob: {raw_approval_prob:.2f}%")
    print(f"  >>> Final Status: {result['status']}")
    print(f"  >>> Final Confidence: {result['confidence']}%")
    
    # Show LTI
    mi = test["input"]["monthly_income"]
    la = test["input"]["loan_amount"]
    lti = la / (mi * 12)
    print(f"  LTI: {lti:.2f}, Credit: {test['input']['cibil_score']}, Defaults: {test['input']['previous_loan_defaults']}")

print("\n" + "=" * 60)
print("CONCLUSION: If no PENDING_REVIEW cases found, model rarely produces")
print("probabilities in the 40-65% range. May need to adjust thresholds.")
print("=" * 60)
