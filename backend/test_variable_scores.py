"""
Test script to verify variable approval probability scores.
Run: python test_variable_scores.py
"""

import sys
sys.path.insert(0, '.')

from loan_advisor import get_advisor

def test_variable_scores():
    advisor = get_advisor()
    
    # Test Case 1: High income, low debt - should be APPROVED with ~85-95%
    test1 = {
        'gender': 'Male',
        'age': 35,
        'employment_status': 'Employed',
        'education_level': 'Master',
        'experience': 10,
        'job_tenure': 5,
        'monthly_income': 100000,
        'monthly_debt_payments': 10000,
        'loan_amount': 500000,
        'loan_duration': 60,
        'loan_purpose': 'Personal',
        'marital_status': 'Married',
        'number_of_dependents': 1,
        'home_ownership_status': 'Own',
        'property_area': 'Urban',
    }
    
    # Test Case 2: Medium income - should be PENDING with ~50-70%
    test2 = {
        'gender': 'Female',
        'age': 28,
        'employment_status': 'Employed',
        'education_level': 'Bachelor',
        'experience': 4,
        'job_tenure': 2,
        'monthly_income': 50000,
        'monthly_debt_payments': 15000,
        'loan_amount': 800000,
        'loan_duration': 84,
        'loan_purpose': 'Home',
        'marital_status': 'Single',
        'number_of_dependents': 0,
        'home_ownership_status': 'Rent',
        'property_area': 'Semi-Urban',
    }
    
    # Test Case 3: Low income, high debt - should be REJECTED with ~20-35%
    test3 = {
        'gender': 'Male',
        'age': 22,
        'employment_status': 'Self-Employed',
        'education_level': 'High School',
        'experience': 1,
        'job_tenure': 0,
        'monthly_income': 20000,
        'monthly_debt_payments': 8000,
        'loan_amount': 1000000,
        'loan_duration': 120,
        'loan_purpose': 'Business',
        'marital_status': 'Single',
        'number_of_dependents': 2,
        'home_ownership_status': 'Rent',
        'property_area': 'Rural',
    }
    
    # Test Case 4: Another approved case - should give different score than test1
    test4 = {
        'gender': 'Female',
        'age': 40,
        'employment_status': 'Employed',
        'education_level': 'PhD',
        'experience': 15,
        'job_tenure': 8,
        'monthly_income': 150000,
        'monthly_debt_payments': 5000,
        'loan_amount': 300000,
        'loan_duration': 36,
        'loan_purpose': 'Personal',
        'marital_status': 'Married',
        'number_of_dependents': 2,
        'home_ownership_status': 'Own',
        'property_area': 'Urban',
    }
    
    print("=" * 60)
    print("TESTING VARIABLE APPROVAL PROBABILITY SCORES")
    print("=" * 60)
    
    for i, test in enumerate([test1, test2, test3, test4], 1):
        result = advisor.analyze(test)
        print(f"\nTest Case {i}:")
        print(f"  Income: ₹{test['monthly_income']:,}/month")
        print(f"  Loan: ₹{test['loan_amount']:,}")
        print(f"  Decision: {result['decision']}")
        print(f"  Approval Score: {result['approval_probability']}%")
        print(f"  ML Probability: {result['ml_probability']}%")
        print(f"  Credit Score: {result['credit_score']['display']} ({result['credit_score']['rating']})")
        print(f"  Interest Rate: {result['interest_rate']['annual']}%")
    
    print("\n" + "=" * 60)
    print("CHECK: All scores should be DIFFERENT, not fixed 95/65/30!")
    print("=" * 60)

if __name__ == "__main__":
    test_variable_scores()
