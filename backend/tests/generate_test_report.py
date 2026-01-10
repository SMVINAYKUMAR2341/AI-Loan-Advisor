from report_generator import generate_loan_report_pdf
from datetime import datetime
import os

class MockApplication:
    def __init__(self):
        self.id = 12345
        self.first_name = "Rahul"
        self.last_name = "Sharma"
        self.full_name = "Rahul Sharma"
        self.customer_id = "CID-88992211"
        self.date_of_birth = datetime(1990, 5, 15)
        self.age = 34
        self.gender = "Male"
        self.mobile_number = "+91 9988776655"
        self.email = "rahul.sharma@example.com"
        self.address = "123, Park Avenue, Mumbai, Maharashtra - 400001"
        self.employment_status = "Salaried"
        self.monthly_income = 85000.0
        self.loan_amount = 500000.0
        self.loan_duration = 36
        self.loan_purpose = "Home Renovation"
        self.kyc_verified = True

analysis_result = {
    'approval_probability': 82.5,
    'decision': 'APPROVED',
    'interest_rate': {'annual': 10.5},
    'loan_details': {
        'amount': 500000.0,
        'duration_years': 3
    },
    'emi': {
        'monthly': 16254.0,
        'total_interest': 85144.0,
        'total_repayment': 585144.0
    },
    'income_analysis': {
        'monthly_income': 85000.0,
        'debt_to_income_ratio': 15.0,
        'emi_to_income_ratio': 19.1
    },
    'credit_score': {
        'score': 745,
        'rating': 'Good'
    },
    'explanations': [
        {
            'factor': 'High Credit Score',
            'impact': 'positive',
            'shap_value': 0.45,
            'description': 'Your credit score of 745 is significantly above our minimum threshold, indicating excellent repayment behavior.'
        },
        {
            'factor': 'Stable Income',
            'impact': 'positive',
            'shap_value': 0.30,
            'description': 'Your monthly income of Rs.85,000 provides strong coverage for the requested EMI.'
        },
        {
            'factor': 'Loan Purpose Risk',
            'impact': 'positive',
            'shap_value': 0.15,
            'description': 'Home renovation loans are considered low-risk as they improve the asset value.'
        },
        {
            'factor': 'Existing Debt',
            'impact': 'negative',
            'shap_value': 0.10,
            'description': 'Current outstanding credit card balances slightly impact your debt-to-income ratio.'
        }
    ]
}

def main():
    app = MockApplication()
    print("Generating test report...")
    pdf_content = generate_loan_report_pdf(app, analysis_result)
    
    file_path = "test_loan_report.pdf"
    with open(file_path, "wb") as f:
        f.write(pdf_content)
    
    print(f"Report generated successfully: {os.path.abspath(file_path)}")

if __name__ == "__main__":
    main()
