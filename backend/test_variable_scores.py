from loan_predictor import get_predictor
import pandas as pd

def test_variable_scores():
    p = get_predictor()
    
    # Intentionally vary the inputs to get different scores
    scenarios = [
        # Very Strong
        {'age': 45, 'monthly_income': 150000, 'loan_amount': 200000, 'cibil_score': 850, 'experience': 20, 'previous_loan_defaults': 'No', 'education_level': 'PhD', 'home_ownership_status': 'Own', 'loan_purpose': 'VENTURE'},
        # Strong
        {'age': 35, 'monthly_income': 80000, 'loan_amount': 300000, 'cibil_score': 780, 'experience': 10, 'previous_loan_defaults': 'No'},
        # Middle ground (likely PENDING)
        {'age': 28, 'monthly_income': 40000, 'loan_amount': 400000, 'cibil_score': 680, 'experience': 4, 'previous_loan_defaults': 'No', 'education_level': 'Bachelor', 'home_ownership_status': 'Rent', 'loan_purpose': 'PERSONAL'},
        # Weak (likely REJECTED)
        {'age': 21, 'monthly_income': 20000, 'loan_amount': 1000000, 'cibil_score': 600, 'experience': 0, 'previous_loan_defaults': 'No', 'education_level': 'High School', 'home_ownership_status': 'Rent', 'loan_purpose': 'EDUCATION'},
        # Very Weak
        {'age': 20, 'monthly_income': 10000, 'loan_amount': 500000, 'cibil_score': 450, 'experience': 0, 'previous_loan_defaults': 'Yes'},
        # Varied Middle ground
        {'age': 32, 'monthly_income': 55000, 'loan_amount': 500000, 'cibil_score': 660, 'experience': 6, 'previous_loan_defaults': 'No'}
    ]
    
    print("=" * 70)
    print(f"{'INDEX':<5} | {'SCORE (%)':<15} | {'STATUS':<20} | {'REASON'}")
    print("-" * 70)
    
    for i, data in enumerate(scenarios, 1):
        result = p.predict(data)
        score = float(result['confidence'])
        status = result['status']
        print(f"{i:<5} | {score:<15.2f} | {status:<20} | {result['recommendation'][:30]}...")

if __name__ == "__main__":
    test_variable_scores()
