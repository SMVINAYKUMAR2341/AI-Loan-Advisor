"""
Test script to find PENDING_REVIEW scenarios
"""
from loan_predictor import get_predictor

predictor = get_predictor()

print("=" * 60)
print("TESTING DIFFERENT LOAN SCENARIOS")
print("=" * 60)

# PENDING_REVIEW happens when: approval_prob >= 40 AND approval_prob < 65
# AND not meeting override conditions

test_cases = [
    {
        "name": "Scenario 1: Low credit, moderate income - should be PENDING/REJECTED",
        "input": {
            "age": 28,
            "education_level": "High School",
            "monthly_income": 25000,
            "experience": 2,
            "home_ownership_status": "Rent",
            "loan_amount": 250000,
            "loan_purpose": "Personal",
            "cibil_score": 550,
            "previous_loan_defaults": "No",
            "loan_duration": 24
        }
    },
    {
        "name": "Scenario 2: Border case - fair credit, high loan ratio",
        "input": {
            "age": 35,
            "education_level": "Bachelor",
            "monthly_income": 40000,
            "experience": 5,
            "home_ownership_status": "Rent",
            "loan_amount": 400000,
            "loan_purpose": "Personal",
            "cibil_score": 600,
            "previous_loan_defaults": "No",
            "loan_duration": 36
        }
    },
    {
        "name": "Scenario 3: Good income but has previous defaults",
        "input": {
            "age": 40,
            "education_level": "Master",
            "monthly_income": 80000,
            "experience": 10,
            "home_ownership_status": "Own",
            "loan_amount": 500000,
            "loan_purpose": "Business",
            "cibil_score": 650,
            "previous_loan_defaults": "Yes",
            "loan_duration": 36
        }
    },
    {
        "name": "Scenario 4: High income, low loan, good credit - should be APPROVED",
        "input": {
            "age": 35,
            "education_level": "Bachelor",
            "monthly_income": 80000,
            "experience": 8,
            "home_ownership_status": "Own",
            "loan_amount": 300000,
            "loan_purpose": "Personal",
            "cibil_score": 750,
            "previous_loan_defaults": "No",
            "loan_duration": 24
        }
    },
    {
        "name": "Scenario 5: Poor credit, defaults, high loan - should be REJECTED",
        "input": {
            "age": 25,
            "education_level": "High School",
            "monthly_income": 20000,
            "experience": 1,
            "home_ownership_status": "Rent",
            "loan_amount": 500000,
            "loan_purpose": "Personal",
            "cibil_score": 450,
            "previous_loan_defaults": "Yes",
            "loan_duration": 24
        }
    },
    {
        "name": "Scenario 6: Medium credit, medium income - likely PENDING_REVIEW",
        "input": {
            "age": 32,
            "education_level": "Associate",
            "monthly_income": 35000,
            "experience": 4,
            "home_ownership_status": "Rent",
            "loan_amount": 350000,
            "loan_purpose": "Personal",
            "cibil_score": 580,
            "previous_loan_defaults": "No",
            "loan_duration": 36
        }
    }
]

for test in test_cases:
    print(f"\n{test['name']}")
    print("-" * 50)
    result = predictor.predict(test["input"])
    print(f">>> Status: {result['status']}")
    print(f">>> Confidence: {result['confidence']}%")
    
    # Calculate ratios
    monthly_income = test["input"]["monthly_income"]
    annual_income = monthly_income * 12
    loan_amount = test["input"]["loan_amount"]
    lti = loan_amount / annual_income
    print(f"    Loan-to-Income Ratio: {lti:.2f}")
    print(f"    Credit Score: {test['input']['cibil_score']}")
