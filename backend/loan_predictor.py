"""
Loan Prediction Service - Updated for loan final dataset.csv
Uses the trained ML model to predict loan eligibility.
Features match the 34 columns from the final dataset.
"""

import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any
import os

# Paths
BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "loan_model.joblib")
SCALER_PATH = os.path.join(BASE_DIR, "loan_scaler.joblib")
ENCODER_PATH = os.path.join(BASE_DIR, "loan_encoders.joblib")

class LoanPredictor:
    """Loan eligibility prediction using trained ML model on loan final dataset"""
    
    def __init__(self):
        self.model = None
        self.scaler = None
        self.encoders = None
        self.feature_names = None
        self.numerical_cols = None
        self.categorical_cols = None
        self._load_model()
    
    def _load_model(self):
        """Load the trained model and preprocessors"""
        if os.path.exists(MODEL_PATH):
            model_data = joblib.load(MODEL_PATH)
            self.model = model_data['model']
            self.feature_names = model_data['feature_names']
            self.numerical_cols = model_data.get('numerical_cols', [])
            self.categorical_cols = model_data.get('categorical_cols', [])
        else:
            raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Run train_model.py first.")
        
        if os.path.exists(SCALER_PATH):
            self.scaler = joblib.load(SCALER_PATH)
        
        if os.path.exists(ENCODER_PATH):
            self.encoders = joblib.load(ENCODER_PATH)
    
    def preprocess_input(self, loan_data: Dict[str, Any]) -> pd.DataFrame:
        """
        Convert raw loan application data to model input format.
        
        Expected input fields (matching loan final dataset):
        - age: Applicant age
        - annual_income: Annual income
        - credit_score: Credit score (300-850)
        - employment_status: Employed, Self-Employed, Unemployed
        - education_level: High School, Bachelor, Master, PhD, Associate
        - experience: Years of experience
        - loan_amount: Requested loan amount
        - loan_duration: Loan duration in months
        - marital_status: Single, Married, Divorced, Widowed
        - number_of_dependents: Number of dependents
        - home_ownership_status: Own, Rent, Mortgage, Other
        - monthly_debt_payments: Monthly debt payments
        - credit_card_utilization: Credit card utilization rate (0-1)
        - number_of_credit_lines: Open credit lines
        - number_of_credit_inquiries: Recent credit inquiries
        - debt_to_income_ratio: DTI ratio
        - bankruptcy_history: 0 or 1
        - loan_purpose: Home, Auto, Education, Business, Personal
        - previous_loan_defaults: 0 or 1
        - payment_history: Payment history score
        - credit_history_length: Length of credit history in months
        - savings_balance: Savings account balance
        - total_assets: Total assets value
        - total_liabilities: Total liabilities
        - job_tenure: Years at current job
        """
        
        # Map input to dataset columns
        features = {
            'Age': loan_data.get('age', 35),
            'AnnualIncome': loan_data.get('annual_income', 50000),
            'CreditScore': loan_data.get('credit_score', 700),
            'EmploymentStatus': loan_data.get('employment_status', 'Employed'),
            'EducationLevel': loan_data.get('education_level', 'Bachelor'),
            'Experience': loan_data.get('experience', 5),
            'LoanAmount': loan_data.get('loan_amount', 10000),
            'LoanDuration': loan_data.get('loan_duration', 36),
            'MaritalStatus': loan_data.get('marital_status', 'Single'),
            'NumberOfDependents': loan_data.get('number_of_dependents', 0),
            'HomeOwnershipStatus': loan_data.get('home_ownership_status', 'Rent'),
            'MonthlyDebtPayments': loan_data.get('monthly_debt_payments', 500),
            'CreditCardUtilizationRate': loan_data.get('credit_card_utilization', 0.3),
            'NumberOfOpenCreditLines': loan_data.get('number_of_credit_lines', 3),
            'NumberOfCreditInquiries': loan_data.get('number_of_credit_inquiries', 1),
            'DebtToIncomeRatio': loan_data.get('debt_to_income_ratio', 0.3),
            'BankruptcyHistory': loan_data.get('bankruptcy_history', 0),
            'LoanPurpose': loan_data.get('loan_purpose', 'Personal'),
            'PreviousLoanDefaults': loan_data.get('previous_loan_defaults', 0),
            'PaymentHistory': loan_data.get('payment_history', 90),
            'LengthOfCreditHistory': loan_data.get('credit_history_length', 60),
            'SavingsAccountBalance': loan_data.get('savings_balance', 5000),
            'TotalAssets': loan_data.get('total_assets', 50000),
            'TotalLiabilities': loan_data.get('total_liabilities', 10000),
            'MonthlyIncome': loan_data.get('annual_income', 50000) / 12,
            'UtilityBillsPaymentHistory': loan_data.get('utility_payment_history', 0.95),
            'JobTenure': loan_data.get('job_tenure', 3),
            'NetWorth': loan_data.get('total_assets', 50000) - loan_data.get('total_liabilities', 10000),
            'BaseInterestRate': 5.0,
            'InterestRate': loan_data.get('interest_rate', 8.0),
            'MonthlyLoanPayment': loan_data.get('loan_amount', 10000) / loan_data.get('loan_duration', 36),
            'TotalDebtToIncomeRatio': loan_data.get('debt_to_income_ratio', 0.3),
            'RiskScore': loan_data.get('risk_score', 50),  # Calculated or provided
        }
        
        df = pd.DataFrame([features])
        
        # Encode categorical variables
        if self.encoders:
            for col in self.categorical_cols:
                if col in df.columns and col in self.encoders:
                    try:
                        df[col] = self.encoders[col].transform(df[col].astype(str))
                    except ValueError:
                        # Handle unseen categories by using the first known class
                        df[col] = 0
        
        # Scale numerical features
        if self.scaler and self.numerical_cols:
            numerical_in_df = [c for c in self.numerical_cols if c in df.columns]
            if numerical_in_df:
                df[numerical_in_df] = self.scaler.transform(df[numerical_in_df])
        
        # Ensure column order matches training
        if self.feature_names:
            for col in self.feature_names:
                if col not in df.columns:
                    df[col] = 0
            df = df[self.feature_names]
        
        return df
    
    def predict(self, loan_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make a loan eligibility prediction.
        
        Returns:
        - status: 'APPROVED', 'REJECTED', or 'PENDING_REVIEW'
        - confidence: Probability score (0-100)
        - decision_factors: Key factors influencing the decision
        - recommendation: Recommendation message
        """
        if self.model is None:
            raise ValueError("Model not loaded")
        
        # Preprocess input
        X = self.preprocess_input(loan_data)
        
        # Get prediction and probability
        prediction = self.model.predict(X)[0]
        probabilities = self.model.predict_proba(X)[0]
        confidence = probabilities[1] * 100  # Probability of approval
        
        # Determine status based on confidence thresholds
        if confidence >= 70:
            status = "APPROVED"
        elif confidence < 40:
            status = "REJECTED"
        else:
            status = "PENDING_REVIEW"
        
        # Generate decision factors (explainability)
        decision_factors = self._get_decision_factors(loan_data, confidence)
        
        return {
            "status": status,
            "confidence": round(confidence, 2),
            "decision_factors": decision_factors,
            "recommendation": self._get_recommendation(status, confidence)
        }
    
    def _get_decision_factors(self, loan_data: Dict[str, Any], confidence: float) -> list:
        """Generate human-readable decision factors"""
        factors = []
        
        # Credit Score
        credit_score = loan_data.get('credit_score', 700)
        if credit_score >= 750:
            factors.append({"factor": "Credit Score", "impact": "positive", "description": f"Excellent credit score ({credit_score})"})
        elif credit_score >= 650:
            factors.append({"factor": "Credit Score", "impact": "positive", "description": f"Good credit score ({credit_score})"})
        else:
            factors.append({"factor": "Credit Score", "impact": "negative", "description": f"Low credit score ({credit_score})"})
        
        # Debt to Income
        dti = loan_data.get('debt_to_income_ratio', 0.3)
        if dti < 0.35:
            factors.append({"factor": "Debt-to-Income", "impact": "positive", "description": f"Healthy DTI ratio ({dti:.1%})"})
        else:
            factors.append({"factor": "Debt-to-Income", "impact": "negative", "description": f"High DTI ratio ({dti:.1%})"})
        
        # Employment
        employment = loan_data.get('employment_status', 'Employed')
        if employment == 'Employed':
            factors.append({"factor": "Employment", "impact": "positive", "description": "Stable employment status"})
        elif employment == 'Self-Employed':
            factors.append({"factor": "Employment", "impact": "positive", "description": "Self-employed with income"})
        else:
            factors.append({"factor": "Employment", "impact": "negative", "description": "Currently not employed"})
        
        # Bankruptcy History
        if loan_data.get('bankruptcy_history', 0) == 0:
            factors.append({"factor": "Financial History", "impact": "positive", "description": "No bankruptcy history"})
        else:
            factors.append({"factor": "Financial History", "impact": "negative", "description": "Previous bankruptcy on record"})
        
        return factors
    
    def _get_recommendation(self, status: str, confidence: float) -> str:
        """Generate recommendation based on status"""
        if status == "APPROVED":
            return "Congratulations! Your loan application meets our approval criteria. Proceed to document submission."
        elif status == "PENDING_REVIEW":
            return "Your application requires additional review. A loan officer will contact you within 2-3 business days."
        else:
            return "Based on your current profile, we recommend improving your credit score or reducing debt before reapplying."


# Singleton instance
_predictor = None

def get_predictor() -> LoanPredictor:
    """Get or create the loan predictor instance"""
    global _predictor
    if _predictor is None:
        _predictor = LoanPredictor()
    return _predictor
