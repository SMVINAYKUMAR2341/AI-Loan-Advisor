
import sys
import os
from datetime import datetime

# Add the current directory to sys.path so we can import modules from it
sys.path.append(os.getcwd())

try:
    from backend import report_generator
    
    class MockApp:
        def __init__(self):
            self.id = "test-app-id"
            self.full_name = "John Doe"
            self.email = "john@example.com"
            self.mobile_number = "9876543210"
            self.loan_amount = 500000
            self.monthly_income = 50000
            self.loan_purpose = "Personal"
            self.employment_status = "Salaried"
            self.loan_duration = 36
            self.date_of_birth = datetime(1990, 1, 1)
            self.gender = "Male"
            self.age = 34
            self.customer_id = "LA20250001"
            self.kyc_verified = True

    # Calculate accurate interest rate based on EMI formula
    # Given: Principal=500000, EMI=16607, Duration=36 months, Total Interest=97852
    # Using the formula: Total Interest = (EMI × months) - Principal
    # 97852 = (16607 × 36) - 500000
    # This gives us approximately 11.5% annual interest rate
    
    analysis_result = {
        "decision": "APPROVED",
        "approval_probability": 85,
        "loan_details": {"amount": 500000, "duration_years": 3},
        "emi": {"monthly": 16607, "total_interest": 97852, "total_repayment": 597852},
        "interest_rate": {"annual": 11.5, "monthly": 0.958},
        "income_analysis": {"monthly_income": 50000, "emi_to_income_ratio": 33.2, "debt_to_income_ratio": 10.5},
        "credit_score": {"score": 750, "rating": "Excellent"},
        "explanations": [
            {"factor": "Credit Score", "impact": "positive", "description": "High credit score", "shap_value": 0.5},
            {"factor": "Income", "impact": "positive", "description": "Stable income", "shap_value": 0.3}
        ]
    }

    print("Attempting to generate PDF...")
    pdf_bytes = report_generator.generate_loan_report_pdf(MockApp(), analysis_result)
    print(f"Success! PDF size: {len(pdf_bytes)} bytes")
    
    with open("test_report.pdf", "wb") as f:
        f.write(pdf_bytes)
    print("Saved to test_report.pdf")

except Exception as e:
    print(f"Error caught: {e}")
    import traceback
    traceback.print_exc()
