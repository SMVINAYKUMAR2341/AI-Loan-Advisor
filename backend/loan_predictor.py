"""
Loan Prediction Service - Updated for PR_Dset/loan_data.csv
Uses SMOTE + OneHotEncoding trained XGBoost model.
Based on extra/Xgboost.ipynb approach.
"""

import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any
import os

# Paths
BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "loan_model.joblib")
ENCODER_PATH = os.path.join(BASE_DIR, "loan_encoders.joblib")

# Value mappings for categorical fields (matching dataset values)
EDUCATION_MAP = {
    'High School': 'High School',
    'HighSchool': 'High School',
    'Associate': 'Associate',
    'Bachelor': 'Bachelor',
    "Bachelor's": 'Bachelor',
    'Master': 'Master',
    "Master's": 'Master',
    'Masters': 'Master',
    'PhD': 'PhD',
    'Doctorate': 'PhD'
}

HOME_OWNERSHIP_MAP = {
    'Own': 'OWN',
    'OWN': 'OWN',
    'Rent': 'RENT',
    'RENT': 'RENT',
    'Mortgage': 'MORTGAGE',
    'MORTGAGE': 'MORTGAGE',
    'Other': 'OTHER',
    'OTHER': 'OTHER'
}

LOAN_INTENT_MAP = {
    'PERSONAL': 'PERSONAL',
    'Personal': 'PERSONAL',
    'EDUCATION': 'EDUCATION',
    'Education': 'EDUCATION',
    'MEDICAL': 'MEDICAL',
    'Medical': 'MEDICAL',
    'VENTURE': 'VENTURE',
    'Venture': 'VENTURE',
    'Business': 'VENTURE',
    'HOMEIMPROVEMENT': 'HOMEIMPROVEMENT',
    'HomeImprovement': 'HOMEIMPROVEMENT',
    'Home Improvement': 'HOMEIMPROVEMENT',
    'DEBTCONSOLIDATION': 'DEBTCONSOLIDATION',
    'DebtConsolidation': 'DEBTCONSOLIDATION',
    'Debt Consolidation': 'DEBTCONSOLIDATION'
}

DEFAULTS_MAP = {
    'Yes': 'Yes',
    'yes': 'Yes',
    'YES': 'Yes',
    'No': 'No',
    'no': 'No',
    'NO': 'No',
    True: 'Yes',
    False: 'No',
    '1': 'Yes',
    '0': 'No'
}


class LoanPredictor:
    """Loan eligibility prediction using SMOTE + OneHotEncoded XGBoost model"""
    
    def __init__(self):
        self.model = None
        self.ohe = None
        self.scaler = None
        self.cat_columns = None
        self.num_columns = None
        self.feature_names = None
        self._load_model()
    
    def _load_model(self):
        """Load the trained model and preprocessors"""
        try:
            # Load model
            model_data = joblib.load(MODEL_PATH)
            self.model = model_data['model']
            self.feature_names = model_data.get('feature_names', [])
            
            # Load encoders
            encoder_data = joblib.load(ENCODER_PATH)
            self.ohe = encoder_data['ohe']
            self.scaler = encoder_data['scaler']
            self.cat_columns = encoder_data['cat_columns']
            self.num_columns = encoder_data['num_columns']
            
            print(f"[LoanPredictor] Model loaded successfully (v3.0 - SMOTE+OHE)")
            print(f"[LoanPredictor] Categorical columns: {self.cat_columns}")
            print(f"[LoanPredictor] Numerical columns: {self.num_columns}")
            print(f"[LoanPredictor] Total features: {len(self.feature_names)}")
        except Exception as e:
            print(f"[LoanPredictor] Error loading model: {e}")
            self.model = None
    
    def preprocess_input(self, loan_data: Dict[str, Any]) -> pd.DataFrame:
        """
        Convert raw loan application data to model input format.
        Uses OneHotEncoding for categorical and StandardScaler for numerical.
        
        Expected input fields (from user form):
        - age: Applicant age
        - education_level: Education level
        - monthly_income: Monthly income (will convert to annual)
        - experience: Years of experience
        - home_ownership_status: Home ownership
        - loan_amount: Loan amount requested
        - loan_purpose: Purpose of loan
        - cibil_score: Credit score (300-900)
        - previous_loan_defaults: Yes/No
        """
        try:
            # Extract values from form
            age = float(loan_data.get('age', 30))
            monthly_income = float(loan_data.get('monthly_income', 50000))
            annual_income = monthly_income * 12
            experience = int(loan_data.get('experience', 0))
            loan_amount = float(loan_data.get('loan_amount', 100000))
            credit_score = int(loan_data.get('cibil_score', loan_data.get('credit_score', 650)))
            
            # Derived fields
            loan_percent_income = (loan_amount / annual_income) if annual_income > 0 else 0.5
            cred_hist_length = max(0, age - 21)  # Approximate credit history
            
            # Map categorical values to dataset format
            education = str(loan_data.get('education_level', 'Bachelor'))
            education = EDUCATION_MAP.get(education, 'Bachelor')
            
            home_ownership = str(loan_data.get('home_ownership_status', 'Rent'))
            home_ownership = HOME_OWNERSHIP_MAP.get(home_ownership, 'RENT')
            
            loan_intent = str(loan_data.get('loan_purpose', 'PERSONAL'))
            loan_intent = LOAN_INTENT_MAP.get(loan_intent, 'PERSONAL')
            
            defaults = loan_data.get('previous_loan_defaults', 'No')
            defaults = DEFAULTS_MAP.get(str(defaults), 'No')
            
            # Create raw data matching dataset columns
            # Note: loan_data.csv columns (after dropping loan_int_rate, person_gender):
            # person_age, person_education, person_income, person_emp_exp, 
            # person_home_ownership, loan_amnt, loan_intent, loan_percent_income,
            # cb_person_cred_hist_length, credit_score, previous_loan_defaults_on_file
            
            raw_data = pd.DataFrame([{
                'person_education': education,
                'person_home_ownership': home_ownership,
                'loan_intent': loan_intent,
                'previous_loan_defaults_on_file': defaults,
                'person_age': age,
                'person_income': annual_income,
                'person_emp_exp': experience,
                'loan_amnt': loan_amount,
                'loan_percent_income': loan_percent_income,
                'cb_person_cred_hist_length': cred_hist_length,
                'credit_score': credit_score
            }])
            
            # OneHotEncode categorical columns
            cat_data = raw_data[self.cat_columns]
            encoded = self.ohe.transform(cat_data)
            df_ohe = pd.DataFrame(encoded, columns=self.ohe.get_feature_names_out(self.cat_columns))
            
            # Scale numerical columns
            num_data = raw_data[self.num_columns]
            df_num_scaled = pd.DataFrame(
                self.scaler.transform(num_data), 
                columns=self.num_columns
            )
            
            # Combine
            input_data = pd.concat([df_ohe, df_num_scaled], axis=1)
            
            # Ensure column order matches training
            # Add missing columns with 0 (for unseen categories)
            for col in self.feature_names:
                if col not in input_data.columns:
                    input_data[col] = 0
            
            input_data = input_data[self.feature_names]
            
            return input_data
            
        except Exception as e:
            print(f"[LoanPredictor] Preprocessing error: {e}")
            import traceback
            traceback.print_exc()
            raise ValueError(f"Error preprocessing loan data: {e}")
    
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
            return {
                'status': 'PENDING_REVIEW',
                'confidence': 50.0,
                'decision_factors': [{'factor': 'System', 'impact': 'neutral', 'description': 'Model not available'}],
                'recommendation': 'Application requires manual review'
            }
        
        try:
            # Preprocess input
            X = self.preprocess_input(loan_data)
            
            # Get prediction probability
            proba = self.model.predict_proba(X)[0]
            approval_prob = proba[1] * 100  # Probability of approval (class 1)
            
            # Determine status based on probability (Granular thresholds)
            if approval_prob >= 75:
                status = 'APPROVED'
            elif approval_prob >= 45:
                status = 'PENDING_REVIEW'
            else:
                status = 'REJECTED'
            
            # Generate decision factors
            decision_factors = self._get_decision_factors(loan_data, approval_prob)
            
            # Generate recommendation
            recommendation = self._get_recommendation(status, approval_prob)
            
            return {
                'status': status,
                'confidence': round(approval_prob, 2),
                'decision_factors': decision_factors,
                'recommendation': recommendation
            }
            
        except Exception as e:
            print(f"[LoanPredictor] Prediction error: {e}")
            import traceback
            traceback.print_exc()
            return {
                'status': 'PENDING_REVIEW',
                'confidence': 50.0,
                'decision_factors': [{'factor': 'Error', 'impact': 'negative', 'description': str(e)}],
                'recommendation': 'Application requires manual review due to processing error'
            }
    
    def _get_decision_factors(self, loan_data: Dict[str, Any], confidence: float) -> list:
        """Generate human-readable decision factors based on input"""
        factors = []
        
        # Credit Score factor
        credit_score = int(loan_data.get('cibil_score', loan_data.get('credit_score', 650)))
        if credit_score >= 750:
            factors.append({'factor': 'Credit Score', 'impact': 'positive', 'description': f'Excellent credit score ({credit_score})', 'shap_value': 0.25})
        elif credit_score >= 650:
            factors.append({'factor': 'Credit Score', 'impact': 'positive', 'description': f'Good credit score ({credit_score})', 'shap_value': 0.15})
        else:
            factors.append({'factor': 'Credit Score', 'impact': 'negative', 'description': f'Low credit score ({credit_score})', 'shap_value': -0.20})
        
        # Income factor
        monthly_income = float(loan_data.get('monthly_income', 50000))
        loan_amount = float(loan_data.get('loan_amount', 100000))
        income_ratio = loan_amount / (monthly_income * 12) if monthly_income > 0 else 1
        
        if income_ratio <= 0.3:
            factors.append({'factor': 'Income Ratio', 'impact': 'positive', 'description': 'Loan amount is well within income capacity', 'shap_value': 0.20})
        elif income_ratio <= 0.5:
            factors.append({'factor': 'Income Ratio', 'impact': 'neutral', 'description': 'Moderate loan-to-income ratio', 'shap_value': 0.05})
        else:
            factors.append({'factor': 'Income Ratio', 'impact': 'negative', 'description': 'High loan-to-income ratio', 'shap_value': -0.15})
        
        # Experience factor
        experience = int(loan_data.get('experience', 0))
        if experience >= 5:
            factors.append({'factor': 'Work Experience', 'impact': 'positive', 'description': f'{experience} years of experience', 'shap_value': 0.10})
        elif experience >= 2:
            factors.append({'factor': 'Work Experience', 'impact': 'neutral', 'description': f'{experience} years of experience', 'shap_value': 0.03})
        else:
            factors.append({'factor': 'Work Experience', 'impact': 'negative', 'description': 'Limited work experience', 'shap_value': -0.08})
        
        # Previous defaults factor
        defaults = loan_data.get('previous_loan_defaults', 'No')
        if str(defaults).lower() in ['yes', 'true', '1']:
            factors.append({'factor': 'Payment History', 'impact': 'negative', 'description': 'Previous loan defaults on record', 'shap_value': -0.25})
        else:
            factors.append({'factor': 'Payment History', 'impact': 'positive', 'description': 'No previous defaults', 'shap_value': 0.15})
        
        # Home ownership factor
        home = loan_data.get('home_ownership_status', 'Rent')
        if str(home).upper() == 'OWN':
            factors.append({'factor': 'Home Ownership', 'impact': 'positive', 'description': 'Owns home (asset security)', 'shap_value': 0.10})
        elif str(home).upper() == 'MORTGAGE':
            factors.append({'factor': 'Home Ownership', 'impact': 'neutral', 'description': 'Has mortgage (existing liability)', 'shap_value': 0.02})
        else:
            factors.append({'factor': 'Home Ownership', 'impact': 'neutral', 'description': 'Renting residence', 'shap_value': 0.0})
        
        return factors
    
    def _get_recommendation(self, status: str, confidence: float) -> str:
        """Generate recommendation based on status"""
        if status == 'APPROVED':
            return f"Congratulations! Your loan application is approved with {confidence:.1f}% confidence. Please complete the KYC process to proceed."
        elif status == 'PENDING_REVIEW':
            return f"Your application ({confidence:.1f}% score) requires additional review. A loan officer will assess your application within 24-48 hours."
        else:
            return f"We regret to inform you that your application could not be approved at this time. Consider improving your credit score or reducing the loan amount."


# Singleton instance
_predictor = None

def get_predictor() -> LoanPredictor:
    """Get or create the loan predictor instance"""
    global _predictor
    if _predictor is None:
        _predictor = LoanPredictor()
    return _predictor
