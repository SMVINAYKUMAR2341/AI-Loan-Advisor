from loan_predictor import get_predictor

def find_pending():
    p = get_predictor()
    print("Searching for PENDING_REVIEW case (45% - 75% score)...")
    
    # Try different scores to hit the pending range
    # Profile: High risk but not catastrophic
    for loan in range(500000, 2000000, 100000):
        data = {
            'age': 20,
            'monthly_income': 10000,
            'experience': 0,
            'loan_amount': loan,
            'cibil_score': 500,
            'previous_loan_defaults': 'Yes',
            'education_level': 'High School',
            'home_ownership_status': 'Rent',
            'loan_purpose': 'PERSONAL'
        }
        res = p.predict(data)
        conf = float(res['confidence'])
        print(f"Loan {loan} -> Score: {conf:.2f}% | Status: {res['status']}")
        if res['status'] == 'PENDING_REVIEW':
            print(f"FOUND PENDING! Message: {res['recommendation']}")

if __name__ == "__main__":
    find_pending()
