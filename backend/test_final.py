"""
Final comprehensive test for PENDING_REVIEW scenarios
"""
from loan_predictor import get_predictor

predictor = get_predictor()

print("=" * 70)
print("COMPREHENSIVE PENDING_REVIEW TEST RESULTS")
print("=" * 70)

test_cases = [
    # PENDING_REVIEW Case 1: Defaults with good profile (LTI < 1.0, Credit >= 600)
    {"name": "CASE 1: Defaults + Good Profile", "expected": "PENDING_REVIEW",
     "input": {"age": 35, "education_level": "Bachelor", "monthly_income": 60000,
               "experience": 8, "home_ownership_status": "Own", "loan_amount": 500000,
               "loan_purpose": "Personal", "cibil_score": 650, "previous_loan_defaults": "Yes", "loan_duration": 36}},
    
    # PENDING_REVIEW Case 2: Low credit (500-600) + Low LTI (<0.5)
    {"name": "CASE 2: Low Credit + Safe LTI", "expected": "PENDING_REVIEW",
     "input": {"age": 30, "education_level": "Bachelor", "monthly_income": 80000,
               "experience": 5, "home_ownership_status": "Rent", "loan_amount": 350000,
               "loan_purpose": "Personal", "cibil_score": 550, "previous_loan_defaults": "No", "loan_duration": 24}},
    
    # PENDING_REVIEW Case 3: High LTI (1.0-1.5) + Fair credit (>=600)
    {"name": "CASE 3: High LTI + Fair Credit", "expected": "PENDING_REVIEW",
     "input": {"age": 32, "education_level": "Bachelor", "monthly_income": 40000,
               "experience": 6, "home_ownership_status": "Rent", "loan_amount": 550000,
               "loan_purpose": "Personal", "cibil_score": 620, "previous_loan_defaults": "No", "loan_duration": 48}},
    
    # PENDING_REVIEW Case 4: Young applicant (<25) with thin credit
    {"name": "CASE 4: Young + Limited Experience", "expected": "PENDING_REVIEW",
     "input": {"age": 23, "education_level": "Bachelor", "monthly_income": 35000,
               "experience": 1, "home_ownership_status": "Rent", "loan_amount": 200000,
               "loan_purpose": "Education", "cibil_score": 600, "previous_loan_defaults": "No", "loan_duration": 36}},
    
    # APPROVED: Good profile, no defaults
    {"name": "APPROVED: Good Profile", "expected": "APPROVED",
     "input": {"age": 35, "education_level": "Master", "monthly_income": 80000,
               "experience": 10, "home_ownership_status": "Own", "loan_amount": 400000,
               "loan_purpose": "Personal", "cibil_score": 750, "previous_loan_defaults": "No", "loan_duration": 36}},
    
    # REJECTED: Very poor profile
    {"name": "REJECTED: Poor Profile", "expected": "REJECTED",
     "input": {"age": 25, "education_level": "High School", "monthly_income": 20000,
               "experience": 1, "home_ownership_status": "Rent", "loan_amount": 600000,
               "loan_purpose": "Personal", "cibil_score": 450, "previous_loan_defaults": "Yes", "loan_duration": 24}},
]

passed = 0
failed = 0

for test in test_cases:
    result = predictor.predict(test["input"])
    status = result['status']
    expected = test['expected']
    match = "✓" if status == expected else "✗"
    
    if status == expected:
        passed += 1
    else:
        failed += 1
    
    print(f"\n{match} {test['name']}")
    print(f"   Expected: {expected}")
    print(f"   Got:      {status} ({result['confidence']:.1f}%)")

print("\n" + "=" * 70)
print(f"RESULTS: {passed} passed, {failed} failed out of {len(test_cases)} tests")
print("=" * 70)
