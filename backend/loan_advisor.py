"""
Bank-Grade AI Loan Eligibility, Pricing & Decision System
===========================================================
Features:
- ML-based loan approval prediction with real SHAP explanations
- Credit score estimation (band-based)
- Interest rate calculation (risk-based)
- EMI calculation using standard banking formula
- Co-applicant logic (conditional)
- Decision engine (ML + bank rules)
"""

import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime
import os
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

# Paths - Using XGBoost model from ml datasets ss folder
BASE_DIR = os.path.dirname(__file__)
ML_DATASETS_DIR = os.path.join(BASE_DIR, "ml datasets ss")
MODEL_PATH = os.path.join(ML_DATASETS_DIR, "xgboost_best_model.joblib")
DATASET_PATH = os.path.join(ML_DATASETS_DIR, "Loan_Eligibility_Data_4000_Dependents_0_2 for shap.csv")


class CreditScoreEstimator:
    """Estimates credit score band based on financial profile"""
    
    @staticmethod
    def estimate(profile: Dict[str, Any]) -> Tuple[int, int, str]:
        """
        Returns: (min_score, max_score, rating)
        Based on income stability, DTI, employment, etc.
        """
        score = 650  # Base score
        
        # Income stability (+/- 50)
        monthly_income = profile.get('monthly_income', 0)
        if monthly_income >= 100000:
            score += 50
        elif monthly_income >= 50000:
            score += 30
        elif monthly_income >= 25000:
            score += 10
        else:
            score -= 20
        
        # Debt-to-Income ratio (+/- 40)
        dti = profile.get('debt_to_income_ratio', 0.5)
        if dti < 0.2:
            score += 40
        elif dti < 0.35:
            score += 20
        elif dti < 0.5:
            score += 0
        else:
            score -= 30
        
        # Employment status (+/- 30)
        employment = profile.get('employment_status', '')
        if employment == 'Employed':
            score += 30
        elif employment == 'Self-Employed':
            # Reduced boost for self-employed (higher risk)
            score += 5  
        else:
            score -= 40
        
        # Job tenure (+/- 40) - Stricter penalties for stability
        job_tenure = profile.get('job_tenure', 0)
        if job_tenure >= 5:
            score += 25
        elif job_tenure >= 2:
            score += 10
        elif job_tenure < 1:
            score -= 40  # Massive penalty for new jobs/business
        elif job_tenure < 2:
            score -= 20  # Significant penalty for < 2 years
        
        # Experience (+/- 30)
        experience = profile.get('experience', 0)
        if experience >= 10:
            score += 20
        elif experience >= 5:
            score += 10
        elif experience < 2:
            score -= 30  # Stricter penalty for low experience
        
        # Home ownership (+/- 15)
        home_status = profile.get('home_ownership_status', '')
        if home_status == 'Own':
            score += 15
        elif home_status == 'Mortgage':
            score += 5
        
        # Education (+/- 10)
        education = profile.get('education_level', '')
        if education in ['PhD', 'Master']:
            score += 10
        elif education == 'Bachelor':
            score += 5
        
        # Clamp score to valid range
        score = max(300, min(850, score))
        
        # Determine band and rating
        if score >= 750:
            return (score - 25, min(850, score + 25), "Excellent")
        elif score >= 700:
            return (score - 25, score + 25, "Good")
        elif score >= 650:
            return (score - 25, score + 25, "Fair")
        elif score >= 600:
            return (score - 25, score + 25, "Poor")
        else:
            return (max(300, score - 25), score + 25, "Very Poor")


class InterestRateCalculator:
    """
    Calculates interest rate based on RBI guidelines and risk profile.
    
    RBI Reference Rates (Dec 2024):
    - RBI Repo Rate: 6.50%
    - MCLR (1-year): ~9.00-9.50%
    - Personal Loan Base: 10.50% - 14.00%
    - Personal Loan Range: 10.50% - 24.00% (for high risk)
    
    Banks typically price personal loans as:
    Base Rate = Repo Rate (6.50%) + MCLR Spread (3.50%) = 10.00%
    Final Rate = Base Rate + Risk Premium
    """
    
    # RBI Repo Rate as of December 2024
    RBI_REPO_RATE = 6.50
    
    # Bank's internal spread over repo rate (typical: 3-4%)
    BANK_SPREAD = 3.50
    
    # Base lending rate for personal loans
    BASE_RATE = RBI_REPO_RATE + BANK_SPREAD  # 10.00%
    
    @staticmethod
    def calculate(
        approval_probability: float,
        credit_score_band: Tuple[int, int, str],
        employment_status: str,
        loan_duration: int
    ) -> float:
        """
        Returns interest rate per annum based on RBI guidelines.
        
        Rate Structure (as per typical Indian bank personal loans):
        - Excellent (750+): 10.50% - 12.00%
        - Good (700-749): 12.00% - 14.00%
        - Fair (650-699): 14.00% - 16.00%
        - Poor (600-649): 16.00% - 18.00%
        - Very Poor (<600): Not typically approved, but 18.00% if approved
        """
        base_rate = InterestRateCalculator.BASE_RATE  # 10.00%
        
        # Credit score is the primary factor for interest rate
        avg_credit = (credit_score_band[0] + credit_score_band[1]) / 2
        credit_rating = credit_score_band[2]
        
        # Risk premium based on credit score (RBI compliant ranges)
        if avg_credit >= 800:  # Excellent Plus
            risk_premium = 0.50  # Final: 10.50%
        elif avg_credit >= 750:  # Excellent
            risk_premium = 1.50  # Final: 11.50%
        elif avg_credit >= 700:  # Good
            risk_premium = 3.00  # Final: 13.00%
        elif avg_credit >= 650:  # Fair
            risk_premium = 5.00  # Final: 15.00%
        elif avg_credit >= 600:  # Poor
            risk_premium = 7.00  # Final: 17.00%
        else:  # Very Poor
            risk_premium = 8.00  # Final: 18.00%
        
        # Employment stability adjustment
        # Salaried employees get slight discount, self-employed slight premium
        if employment_status == 'Employed':
            emp_adj = -0.25  # Salaried discount
        elif employment_status == 'Self-Employed':
            emp_adj = 0.50   # Self-employed premium
        else:
            emp_adj = 1.00   # Unemployed high risk
        
        # Tenure adjustment (longer loans = slightly higher risk for bank)
        if loan_duration > 180:  # > 15 years
            tenure_adj = 0.50
        elif loan_duration > 84:  # > 7 years
            tenure_adj = 0.25
        else:
            tenure_adj = 0.0
        
        # Calculate final rate
        final_rate = base_rate + risk_premium + emp_adj + tenure_adj
        
        # Clamp to RBI permissible range for personal loans
        # Min: 10.50% (best case), Max: 18.00% (high risk but approved)
        return round(max(10.50, min(18.00, final_rate)), 2)


class EMICalculator:
    """Standard banking EMI calculation"""
    
    @staticmethod
    def calculate(
        principal: float,
        annual_rate: float,
        duration_months: int
    ) -> Dict[str, float]:
        """
        EMI = [P × R × (1+R)^N] / [(1+R)^N – 1]
        
        Returns:
        - emi: Monthly EMI amount
        - total_interest: Total interest payable
        - total_repayment: Total amount to be repaid
        """
        # Convert annual rate to monthly
        monthly_rate = annual_rate / (12 * 100)
        
        # Calculate EMI
        if monthly_rate == 0:
            emi = principal / duration_months
        else:
            factor = (1 + monthly_rate) ** duration_months
            emi = (principal * monthly_rate * factor) / (factor - 1)
        
        total_repayment = emi * duration_months
        total_interest = total_repayment - principal
        
        return {
            'emi': round(emi, 2),
            'total_interest': round(total_interest, 2),
            'total_repayment': round(total_repayment, 2),
            'principal': principal,
            'duration_months': duration_months,
            'annual_rate': annual_rate
        }


class CoApplicantEvaluator:
    """Determines if co-applicant is needed and processes co-applicant data"""
    
    @staticmethod
    def needs_coapplicant(
        approval_probability: float,
        emi: float,
        monthly_income: float,
        loan_amount: float,
        annual_income: float
    ) -> Tuple[bool, str]:
        """
        Returns: (needs_coapplicant, reason)
        Triggered only for borderline cases
        """
        emi_to_income_ratio = emi / monthly_income if monthly_income > 0 else 1
        loan_to_income_ratio = loan_amount / annual_income if annual_income > 0 else 10
        
        if approval_probability >= 0.75:
            return (False, "")
        
        if 0.50 <= approval_probability < 0.75:
            if emi_to_income_ratio > 0.40:
                return (True, f"EMI ({emi_to_income_ratio:.1%} of income) exceeds safe threshold (40%). Co-applicant can help reduce burden.")
            if loan_to_income_ratio > 5:
                return (True, f"Loan amount is {loan_to_income_ratio:.1f}x your annual income. Co-applicant can strengthen application.")
            return (True, "Your application is borderline. Adding a co-applicant may improve approval chances.")
        
        return (False, "Application does not meet minimum criteria for co-applicant consideration.")
    
    @staticmethod
    def calculate_effective_income(
        applicant_income: float,
        coapplicant_income: float
    ) -> float:
        """
        EffectiveIncome = ApplicantIncome + (CoApplicantIncome × 0.7)
        """
        return applicant_income + (coapplicant_income * 0.7)


class DecisionEngine:
    """Final decision logic combining ML + bank rules - Realistic bank manager criteria"""
    
    @staticmethod
    def decide(
        approval_probability: float,
        emi_to_income_ratio: float,
        credit_rating: str,
        loan_duration: int,
        loan_to_income_ratio: float = 0,
        profile: dict = None
    ) -> Tuple[str, str]:
        """
        Returns: (decision, reason)
        
        Decisions: APPROVED, REJECTED, PENDING_REVIEW
        
        Realistic Bank Manager Criteria:
        - EMI > 50% → REJECTED (RBI guideline)
        - EMI > 30% → PENDING_REVIEW (bank risk policy)
        - Self-employed < 2 years → PENDING_REVIEW
        - Job tenure < 1 year → PENDING_REVIEW
        - Fair/Poor credit + EMI > 25% → PENDING_REVIEW
        """
        profile = profile or {}
        
        # Extract profile data for decision rules
        employment_status = profile.get('employment_status', 'Employed')
        job_tenure = profile.get('job_tenure', 5)
        experience = profile.get('experience', 5)
        
        # === HARD REJECTION RULES (These are absolute) ===
        
        # Rule 1: EMI exceeds 50% of income (RBI guideline)
        if emi_to_income_ratio > 0.50:
            return ("REJECTED", f"EMI exceeds 50% of monthly income ({emi_to_income_ratio:.1%}). Bank policy prohibits approval.")
        
        # Rule 2: Loan amount too high relative to income
        if loan_to_income_ratio > 5:
            return ("REJECTED", f"Loan amount is {loan_to_income_ratio:.1f}x your annual income. Maximum allowed is 5x annual income.")
        
        # Rule 3: Very poor credit with long tenure
        if credit_rating == "Very Poor" and loan_duration > 180:
            return ("REJECTED", "High risk profile with long tenure is not permitted.")
        
        # === PENDING_REVIEW RULES (Practical Bank Manager Criteria) ===
        # These run BEFORE ML rejection to give borderline cases a chance at manual review
        
        # Rule 4: Self-employed with limited business history
        if employment_status == 'Self-Employed':
            if job_tenure < 2 or experience < 2:
                return ("PENDING_REVIEW", "Self-employed applicants with less than 2 years of business history require additional documentation and review.")
        
        # Rule 5: New employee - less than 1 year at current job
        if employment_status == 'Employed' and job_tenure < 1:
            return ("PENDING_REVIEW", "New employees (less than 1 year at current job) require additional employment verification.")
        
        # Rule 6: High EMI burden (30-50% of income) - needs manual review
        if emi_to_income_ratio > 0.30:
            return ("PENDING_REVIEW", f"EMI is {emi_to_income_ratio:.1%} of your income. This is on the higher side and requires additional verification by a loan officer.")
        
        # Rule 7: Fair/Poor credit with moderate EMI
        if credit_rating in ["Fair", "Poor"] and emi_to_income_ratio > 0.25:
            return ("PENDING_REVIEW", f"Your credit rating ({credit_rating}) combined with EMI of {emi_to_income_ratio:.1%} requires additional review.")
        
        # Rule 8: High leverage loan (4-5x annual income)
        if loan_to_income_ratio > 4:
            return ("PENDING_REVIEW", f"Loan amount is {loan_to_income_ratio:.1f}x your annual income. A loan officer will verify your repayment capacity.")
        
        # === ML-BASED FINAL DECISION ===
        
        # Now apply ML-based rejection for profiles without specific flags
        if approval_probability < 0.15:
            return ("REJECTED", "Application does not meet minimum eligibility criteria based on financial profile.")
        
        if approval_probability >= 0.40:
            return ("APPROVED", "Congratulations! Your application meets all eligibility criteria.")
        elif approval_probability >= 0.20:
            return ("PENDING_REVIEW", "Your application requires additional review by a loan officer. We will contact you within 2-3 business days.")
        else:
            return ("REJECTED", "Based on your current profile, we recommend improving your financial position before reapplying.")


class SHAPExplainer:
    """Generates human-readable explanations for loan decisions"""
    
    @staticmethod
    def explain(profile: Dict[str, Any], approval_probability: float) -> List[Dict[str, Any]]:
        """
        Generates top factors affecting the decision
        Returns list of {factor, impact, description, shap_value}
        """
        factors = []
        
        # Income analysis - assign synthetic SHAP values based on importance
        monthly_income = profile.get('monthly_income', 0)
        if monthly_income >= 75000:
            factors.append({
                "factor": "Strong Income",
                "impact": "positive",
                "description": f"Monthly income of ₹{monthly_income:,.0f} demonstrates strong repayment capacity",
                "shap_value": 0.35
            })
        elif monthly_income < 25000:
            factors.append({
                "factor": "Limited Income",
                "impact": "negative",
                "description": f"Monthly income of ₹{monthly_income:,.0f} may limit loan eligibility",
                "shap_value": 0.30
            })
        
        # DTI analysis
        dti = profile.get('debt_to_income_ratio', 0)
        if dti < 0.25:
            factors.append({
                "factor": "Low Debt Burden",
                "impact": "positive",
                "description": f"Debt-to-income ratio of {dti:.1%} indicates healthy financial management",
                "shap_value": 0.25
            })
        elif dti > 0.40:
            factors.append({
                "factor": "High Debt Burden",
                "impact": "negative",
                "description": f"Debt-to-income ratio of {dti:.1%} exceeds recommended threshold",
                "shap_value": 0.28
            })
        
        # Employment
        employment = profile.get('employment_status', '')
        job_tenure = profile.get('job_tenure', 0)
        if employment == 'Employed' and job_tenure >= 2:
            factors.append({
                "factor": "Stable Employment",
                "impact": "positive",
                "description": f"Employed with {job_tenure} years at current job shows stability",
                "shap_value": 0.20
            })
        elif employment == 'Unemployed':
            factors.append({
                "factor": "Employment Status",
                "impact": "negative",
                "description": "Currently not employed - income verification required",
                "shap_value": 0.45
            })
        
        # Loan amount vs income
        loan_amount = profile.get('loan_amount', 0)
        annual_income = profile.get('annual_income', 1)
        loan_ratio = loan_amount / annual_income if annual_income > 0 else 10
        if loan_ratio < 3:
            factors.append({
                "factor": "Conservative Loan Request",
                "impact": "positive",
                "description": f"Loan amount is {loan_ratio:.1f}x annual income - within safe limits",
                "shap_value": 0.18
            })
        elif loan_ratio > 6:
            factors.append({
                "factor": "High Loan Amount",
                "impact": "negative",
                "description": f"Loan amount is {loan_ratio:.1f}x annual income - above recommended limits",
                "shap_value": 0.22
            })
        
        # Home ownership
        home_status = profile.get('home_ownership_status', '')
        if home_status == 'Own':
            factors.append({
                "factor": "Property Owner",
                "impact": "positive",
                "description": "Home ownership provides collateral security",
                "shap_value": 0.15
            })
        
        # Education
        education = profile.get('education_level', '')
        if education in ['PhD', 'Master', 'Bachelor']:
            factors.append({
                "factor": "Educational Background",
                "impact": "positive",
                "description": f"{education} qualification indicates career growth potential",
                "shap_value": 0.12
            })
        
        # Dependents
        dependents = profile.get('number_of_dependents', 0)
        if dependents >= 4:
            factors.append({
                "factor": "High Dependents",
                "impact": "negative",
                "description": f"{dependents} dependents increase monthly financial obligations",
                "shap_value": 0.10
            })
        
        return factors[:6]  # Return top 6 factors


class LoanAdvisor:
    """Main loan advisor combining all components"""
    
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.feature_names = None
        self.df_reference = None
        self.shap_explainer = None
        self._load_model()
        
        self.credit_estimator = CreditScoreEstimator()
        self.interest_calc = InterestRateCalculator()
        self.emi_calc = EMICalculator()
        self.coapplicant_eval = CoApplicantEvaluator()
        self.decision_engine = DecisionEngine()
        self.explainer = SHAPExplainer()
    
    def _load_model(self):
        """Load XGBoost model and build preprocessor"""
        try:
            if os.path.exists(MODEL_PATH):
                import warnings
                warnings.filterwarnings('ignore')
                self.model = joblib.load(MODEL_PATH)
                self.feature_names = self.model.get_booster().feature_names
                print(f"✔ XGBoost model loaded with {len(self.feature_names)} features")
            
            # Load reference dataset for preprocessing
            if os.path.exists(DATASET_PATH):
                df = pd.read_csv(DATASET_PATH)
                # Remove target and ID columns
                target_cols = ["Loan Status (Target)", "Loan Status", "Loan_Status"]
                df = df.drop(columns=[c for c in target_cols if c in df.columns], errors="ignore")
                df = df.drop(columns=[c for c in df.columns if "id" in c.lower()], errors="ignore")
                self.df_reference = df
                
                # Build preprocessor matching model features
                cat_cols = df.select_dtypes(include="object").columns.tolist()
                num_cols = df.select_dtypes(include=["int", "float"]).columns.tolist()
                
                self.preprocessor = ColumnTransformer(
                    transformers=[
                        ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
                        ("num", StandardScaler(), num_cols),
                    ]
                )
                self.preprocessor.fit(df)
                self.cat_cols = cat_cols
                self.num_cols = num_cols
                print(f"✔ Preprocessor built with {len(cat_cols)} categorical + {len(num_cols)} numerical features")
                
                # Try to load SHAP
                try:
                    import shap
                    self.shap_explainer = shap.TreeExplainer(self.model)
                    print("✔ SHAP TreeExplainer ready")
                except ImportError:
                    print("⚠ SHAP not installed, using rule-based explanations")
                
        except Exception as e:
            print(f"Warning: Could not load model - {e}")
            import traceback
            traceback.print_exc()
    
    def analyze(self, user_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main analysis function
        
        User inputs:
        - age, employment_status, education_level, experience, job_tenure
        - monthly_income, monthly_debt_payments
        - loan_amount, loan_duration, loan_purpose
        - marital_status, number_of_dependents, home_ownership_status
        
        Optional:
        - coapplicant_income, coapplicant_employment, coapplicant_relationship
        """
        
        # 1. System-derived calculations
        monthly_income = float(user_input.get('monthly_income', 0))
        monthly_debt = float(user_input.get('monthly_debt_payments', 0))
        loan_amount = float(user_input.get('loan_amount', 0))
        loan_duration = int(user_input.get('loan_duration', 60))
        
        annual_income = monthly_income * 12
        debt_to_income = monthly_debt / monthly_income if monthly_income > 0 else 1
        application_date = datetime.now().isoformat()
        
        # Build profile
        profile = {
            'gender': user_input.get('gender', 'Male'),
            'age': user_input.get('age', 30),
            'employment_status': user_input.get('employment_status', 'Employed'),
            'education_level': user_input.get('education_level', 'Bachelor'),
            'experience': user_input.get('experience', 5),
            'job_tenure': user_input.get('job_tenure', 2),
            'monthly_income': monthly_income,
            'annual_income': annual_income,
            'monthly_debt_payments': monthly_debt,
            'debt_to_income_ratio': debt_to_income,
            'loan_amount': loan_amount,
            'loan_duration': loan_duration,
            'loan_purpose': user_input.get('loan_purpose', 'Personal'),
            'marital_status': user_input.get('marital_status', 'Single'),
            'number_of_dependents': user_input.get('number_of_dependents', 0),
            'home_ownership_status': user_input.get('home_ownership_status', 'Rent'),
            'property_area': user_input.get('property_area', 'Urban'),
            'coapplicant_income': user_input.get('coapplicant_income', 0)
        }
        
        # 2. Credit score estimation
        credit_min, credit_max, credit_rating = self.credit_estimator.estimate(profile)
        
        # 3. ML prediction (approval probability)
        approval_probability = self._predict(profile)
        
        # 4. Interest rate calculation
        interest_rate = self.interest_calc.calculate(
            approval_probability,
            (credit_min, credit_max, credit_rating),
            profile['employment_status'],
            loan_duration
        )
        
        # 5. EMI calculation
        emi_details = self.emi_calc.calculate(loan_amount, interest_rate, loan_duration)
        emi_to_income = emi_details['emi'] / monthly_income if monthly_income > 0 else 1
        
        # 6. Co-applicant evaluation
        needs_coapplicant, coapplicant_reason = self.coapplicant_eval.needs_coapplicant(
            approval_probability,
            emi_details['emi'],
            monthly_income,
            loan_amount,
            annual_income
        )
        
        # Handle co-applicant if provided
        coapplicant_income = float(user_input.get('coapplicant_income', 0))
        if coapplicant_income > 0:
            effective_income = self.coapplicant_eval.calculate_effective_income(
                monthly_income, coapplicant_income
            )
            emi_to_income = emi_details['emi'] / effective_income if effective_income > 0 else 1
            # Recalculate with combined income
            profile['monthly_income'] = effective_income
            profile['annual_income'] = effective_income * 12
            approval_probability = min(approval_probability * 1.15, 0.95)  # Boost with co-applicant
        
        # 7. Final decision
        # Calculate loan-to-income ratio for decision
        loan_to_income_ratio = loan_amount / annual_income if annual_income > 0 else 10
        
        decision, decision_reason = self.decision_engine.decide(
            approval_probability,
            emi_to_income,
            credit_rating,
            loan_duration,
            loan_to_income_ratio,
            profile  # Pass profile for employment/tenure checks
        )
        
        # 8. SHAP explanations (REAL from TreeExplainer)
        explanations = self._get_real_shap_explanations(profile)
        
        # Build response
        # Calculate approval score that ACTUALLY reflects the decision
        # The score must account for bank policy violations, not just ML probability
        raw_prob = approval_probability
        
        # Start with ML-based score scaling
        if raw_prob >= 0.35:
            base_display_score = 95.0
        elif raw_prob <= 0.10:
            base_display_score = 30.0
        else:
            # Linear scaling from [0.10, 0.35] to [30, 95]
            base_display_score = 30 + (raw_prob - 0.10) * (95 - 30) / (0.35 - 0.10)
        
        # CRITICAL: Adjust score based on bank policy violations
        # If EMI exceeds 50% of income, this is a hard rejection - score should reflect it
        if emi_to_income > 0.50:
            # Score penalty based on how much EMI exceeds the 50% threshold
            # EMI at 100% of income = ~20% score, EMI at 50% = 50% score
            emi_penalty = (emi_to_income - 0.50) * 100  # Each 1% over threshold = 1 point penalty
            display_score = max(10.0, min(45.0, 50.0 - emi_penalty))
        elif decision == "REJECTED":
            # Other rejection reasons - cap score at 40%
            display_score = min(40.0, base_display_score)
        elif decision == "PENDING_REVIEW":
            # Pending review - cap score at 65%
            display_score = min(65.0, base_display_score)
        else:
            # Approved - use the full scaled score
            display_score = base_display_score
        
        return {
            "application_date": application_date,
            "decision": decision,
            "decision_reason": decision_reason,
            "approval_probability": round(display_score, 1),  # Scaled for user display
            "ml_probability": round(raw_prob * 100, 1),  # Raw ML probability
            "credit_score": {
                "min": credit_min,
                "max": credit_max,
                "rating": credit_rating,
                "display": f"{credit_min}-{credit_max}"
            },
            "interest_rate": {
                "annual": round(interest_rate, 2),
                "monthly": round(interest_rate / 12, 3)
            },
            "emi": {
                "monthly": round(emi_details['emi'], 0),
                "total_interest": round(emi_details['total_interest'], 0),
                "total_repayment": round(emi_details['total_repayment'], 0)
            },
            "loan_details": {
                "amount": loan_amount,
                "duration_months": loan_duration,
                "duration_years": loan_duration / 12
            },
            "income_analysis": {
                "monthly_income": monthly_income,
                "annual_income": annual_income,
                "debt_to_income_ratio": round(debt_to_income * 100, 1),
                "emi_to_income_ratio": round(emi_to_income * 100, 1)
            },
            "coapplicant": {
                "suggested": needs_coapplicant,
                "reason": coapplicant_reason,
                "provided": coapplicant_income > 0
            },
            "explanations": explanations,
            "kyc_required": decision == "APPROVED",
            "next_steps": self._get_next_steps(decision)
        }
    
    def _predict(self, profile: Dict[str, Any]) -> float:
        """
        Get approval probability using the XGBoost model.
        Maps user input to features matching the shap.py structure.
        """
        if self.model is None or self.preprocessor is None:
            return self._rule_based_score(profile)
        
        try:
            # Map user input to model features (matching shap.py user_input structure)
            # Model expects: Gender, Married, Dependents, Education, Employment Type,
            # Applicant Income, Co-applicant Income, Loan Amount, Loan Amount Term,
            # Credit History, Property Area
            
            # Map frontend values to dataset values
            gender_map = {
                'Male': 'Male', 'Female': 'Female', 'male': 'Male', 'female': 'Female'
            }
            married_map = {
                'Married': 'Yes', 'Single': 'No', 'Divorced': 'No', 'Widowed': 'No',
                'Yes': 'Yes', 'No': 'No'
            }
            education_map = {
                'Graduate': 'Graduate', 'Bachelor': 'Graduate', 'Master': 'Graduate',
                'PhD': 'Graduate', 'Doctorate': 'Graduate',
                'Not Graduate': 'Not Graduate', 'High School': 'Not Graduate',
                'Associate': 'Not Graduate'
            }
            employment_map = {
                'Employed': 'Salaried', 'Salaried': 'Salaried',
                'Self-Employed': 'Self-Employed', 'Self Employed': 'Self-Employed',
                'Unemployed': 'Self-Employed'  # Fallback
            }
            property_map = {
                'Urban': 'Urban', 'Semi-Urban': 'Semiurban', 'Semi Urban': 'Semiurban',
                'Semiurban': 'Semiurban', 'Rural': 'Rural'
            }
            
            # Extract and map values
            gender = gender_map.get(profile.get('gender', 'Male'), 'Male')
            married = married_map.get(profile.get('marital_status', 'Single'), 'No')
            dependents = int(profile.get('number_of_dependents', 0))
            education = education_map.get(profile.get('education_level', 'Graduate'), 'Graduate')
            employment = employment_map.get(profile.get('employment_status', 'Employed'), 'Salaried')
            
            # Income: convert monthly to annual (dataset uses annual values)
            monthly_income = profile.get('monthly_income', 0)
            applicant_income = monthly_income  # Dataset uses monthly values in thousands
            coapplicant_income = profile.get('coapplicant_income', 0)
            
            # Loan: convert to thousands (dataset uses thousands)
            loan_amount = profile.get('loan_amount', 0) / 1000
            loan_term = profile.get('loan_duration', 60) * 6  # 60 months = 360 days term
            
            # Credit history: Calculate based on ACTUAL risk factors, not just employment
            # This is critical for realistic decisions
            credit_history = 1.0  # Start with good credit
            
            # Risk factor 1: Loan-to-Income ratio
            annual_income = monthly_income * 12
            lti_ratio = profile.get('loan_amount', 0) / annual_income if annual_income > 0 else 10
            if lti_ratio > 5:
                credit_history = 0.0  # Very risky - loan is 5x+ annual income
            elif lti_ratio > 4:
                credit_history = 0.3  # High risk
            elif lti_ratio > 3:
                credit_history = 0.6  # Moderate risk
            
            # Risk factor 2: Employment stability
            job_tenure = profile.get('job_tenure', 0)
            experience = profile.get('experience', 0)
            if profile.get('employment_status') == 'Unemployed':
                credit_history = 0.0  # No income source
            elif profile.get('employment_status') == 'Self-Employed':
                if job_tenure < 2 or experience < 2:
                    credit_history = min(credit_history, 0.5)  # Self-employed with short tenure is risky
            
            # Risk factor 3: Education + Experience mismatch
            if profile.get('education_level') in ['High School', 'Not Graduate']:
                if monthly_income > 50000:  # Unlikely scenario
                    credit_history = min(credit_history, 0.7)
            
            property_area = property_map.get(profile.get('property_area', 'Urban'), 'Urban')
            
            # Build user input matching shap.py structure
            user_input = {
                "Gender": gender,
                "Married": married,
                "Dependents": dependents,
                "Education": education,
                "Employment Type": employment,
                "Applicant Income": applicant_income,
                "Co-applicant Income": coapplicant_income,
                "Loan Amount": loan_amount,
                "Loan Amount Term": loan_term,
                "Credit History": credit_history,
                "Property Area": property_area
            }
            
            user_df = pd.DataFrame([user_input])
            
            # Align with reference dataset columns
            for col in self.df_reference.columns:
                if col not in user_df.columns:
                    user_df[col] = self.df_reference[col].mode()[0]
            user_df = user_df[self.df_reference.columns]
            
            # Preprocess
            user_pre_full = self.preprocessor.transform(user_df)
            
            # Get feature names from preprocessor
            ohe = self.preprocessor.named_transformers_["cat"]
            encoded_cat_names = ohe.get_feature_names_out(self.cat_cols)
            generated_features = list(encoded_cat_names) + self.num_cols
            
            # Convert to DataFrame
            user_pre_df = pd.DataFrame(
                user_pre_full.toarray() if hasattr(user_pre_full, "toarray") else user_pre_full,
                columns=generated_features
            )
            
            # Align to model's expected feature order
            user_pre_final = user_pre_df.reindex(columns=self.feature_names, fill_value=0)
            
            # Store for SHAP analysis
            self._last_processed_input = user_pre_final
            self._last_raw_input = user_input
            
            # Get prediction probability
            proba = self.model.predict_proba(user_pre_final)[0][1]
            prediction = self.model.predict(user_pre_final)[0]
            
            # ==== DETAILED ML LOGGING ====
            print("\n" + "="*70)
            print("🤖 XGBOOST ML PREDICTION LOG")
            print("="*70)
            print(f"📊 Model: XGBoost Classifier from 'ml datasets ss' folder")
            print(f"📈 Features used: {len(self.feature_names)}")
            print(f"\n🔢 INPUT FEATURES:")
            for key, val in user_input.items():
                print(f"   • {key}: {val}")
            print(f"\n🎯 RAW ML OUTPUT:")
            print(f"   • Prediction: {'APPROVED (1)' if prediction == 1 else 'REJECTED (0)'}")
            print(f"   • Probability of Approval: {proba*100:.2f}%")
            print(f"   • Probability of Rejection: {(1-proba)*100:.2f}%")
            print("="*70 + "\n")
            
            return float(proba)
            
        except Exception as e:
            print(f"XGBoost Prediction error: {e}")
            import traceback
            traceback.print_exc()
            return self._rule_based_score(profile)
    
    def _get_real_shap_explanations(self, profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Get REAL SHAP-based explanations for the prediction.
        Uses TreeExplainer to compute actual feature importance.
        """
        try:
            if self.shap_explainer is None or not hasattr(self, '_last_processed_input'):
                return self.explainer.explain(profile, 0.5)  # Fallback to rule-based
            
            import shap
            
            # Compute SHAP values
            shap_values = self.shap_explainer.shap_values(self._last_processed_input)
            
            # For binary classification, use the positive class SHAP values
            if isinstance(shap_values, list):
                shap_vals = shap_values[1][0]  # Class 1 (Approved)
            else:
                shap_vals = shap_values[0]
            
            # Build feature importance list
            feature_importance = []
            for idx, feat_name in enumerate(self.feature_names):
                shap_val = shap_vals[idx]
                
                # Check for significance (relaxed threshold)
                is_significant = abs(shap_val) > 0.0001
                
                if is_significant:
                    # Clean up feature name for display
                    display_name = feat_name.replace('_', ' ').replace('  ', ' ')
                    if '_' in feat_name:
                        parts = feat_name.split('_')
                        category = parts[0]
                        value = '_'.join(parts[1:])
                        display_name = f"{category}: {value}"
                    
                    feature_importance.append({
                        "factor": display_name,
                        "impact": "positive" if shap_val > 0 else "negative",
                        "description": self._get_shap_description(feat_name, shap_val, self._last_raw_input),
                        "_shap_value": shap_val  # Internal use only for sorting
                    })
            
            # Sort by absolute SHAP value (most important first)
            feature_importance.sort(key=lambda x: abs(x['_shap_value']), reverse=True)
            
            # If nothing passed threshold (rare), take top 5 anyway based on raw magnitude
            if not feature_importance:
                top_indices = sorted(range(len(shap_vals)), key=lambda i: abs(shap_vals[i]), reverse=True)[:5]
                for idx in top_indices:
                     feature_importance.append({
                        "factor": self.feature_names[idx],
                        "impact": "positive" if shap_vals[idx] > 0 else "negative",
                        "description": "Contributing factor",
                        "_shap_value": shap_vals[idx]
                    })

            
            # Print SHAP analysis
            print("\n" + "="*70)
            print("📊 REAL SHAP FEATURE IMPORTANCE")
            print("="*70)
            for i, feat in enumerate(feature_importance[:8], 1):
                sign = "+" if feat['impact'] == 'positive' else "-"
                print(f"   {i}. {feat['factor']}: {sign}{abs(feat['_shap_value']):.6f}")
            print("="*70 + "\n")
            
            # Include SHAP value for frontend chart visualization
            result = []
            for feat in feature_importance[:8]:
                result.append({
                    "factor": feat["factor"],
                    "impact": feat["impact"],
                    "description": feat["description"],
                    "shap_value": float(round(abs(feat["_shap_value"]), 6))  # Convert numpy float to Python float
                })
            
            return result  # Top 6 factors with SHAP values
            
        except Exception as e:
            print(f"SHAP Explanation error: {e}")
            import traceback
            traceback.print_exc()
            return self.explainer.explain(profile, 0.5)
    
    def _get_shap_description(self, feature_name: str, shap_value: float, user_input: Dict) -> str:
        """Generate human-readable description for SHAP feature"""
        impact = "increases" if shap_value > 0 else "decreases"
        
        # Map feature to description
        if "Income" in feature_name:
            return f"Your income level {impact} approval chances"
        elif "Loan Amount" in feature_name:
            return f"The loan amount {impact} approval likelihood"
        elif "Credit History" in feature_name:
            return f"Credit history {impact} your score significantly"
        elif "Education" in feature_name:
            return f"Education level {impact} creditworthiness"
        elif "Employment Type" in feature_name:
            return f"Employment type {impact} stability assessment"
        elif "Property Area" in feature_name:
            return f"Property location {impact} risk assessment"
        elif "Married" in feature_name:
            return f"Marital status {impact} financial stability"
        elif "Dependents" in feature_name:
            return f"Number of dependents {impact} available income"
        elif "Gender" in feature_name:
            return f"Gender factor {impact} model output"
        elif "Term" in feature_name:
            return f"Loan term {impact} repayment capacity"
        elif "DTI" in feature_name:
            return f"Debt-to-income ratio {impact} affordability"
        elif "Total_Income" in feature_name:
            return f"Total household income {impact} approval chances"
        else:
            return f"This factor {impact} your approval probability"
    
    def _rule_based_score(self, profile: Dict[str, Any]) -> float:
        """Fallback rule-based approval scoring - more realistic"""
        score = 0.65  # Higher base score for typical applicants
        
        # Loan-to-Income ratio factor (most important)
        lti = profile['loan_amount'] / profile['annual_income'] if profile['annual_income'] > 0 else 10
        if lti <= 1:
            score += 0.20  # Very conservative loan
        elif lti <= 2:
            score += 0.15  # Conservative loan
        elif lti <= 3:
            score += 0.10  # Moderate loan
        elif lti <= 4:
            score += 0.05  # Reasonable loan
        elif lti <= 5:
            score += 0.00  # At limit
        elif lti <= 6:
            score -= 0.10  # Above recommended
        else:
            score -= 0.25  # High risk
        
        # Debt-to-Income factor
        dti = profile['debt_to_income_ratio']
        if dti <= 0.15:
            score += 0.15  # Excellent
        elif dti <= 0.25:
            score += 0.10  # Very good
        elif dti <= 0.35:
            score += 0.05  # Good
        elif dti <= 0.45:
            score -= 0.05  # Moderate
        else:
            score -= 0.20  # High debt
        
        # Employment status
        if profile['employment_status'] == 'Employed':
            score += 0.10
        elif profile['employment_status'] == 'Self-Employed':
            score += 0.05
        else:  # Unemployed
            score -= 0.35
        
        # Job tenure
        job_tenure = profile.get('job_tenure', 0)
        if job_tenure >= 5:
            score += 0.10
        elif job_tenure >= 3:
            score += 0.07
        elif job_tenure >= 2:
            score += 0.05
        elif job_tenure >= 1:
            score += 0.02
        else:
            score -= 0.05
        
        # Home ownership
        home_status = profile.get('home_ownership_status', 'Rent')
        if home_status == 'Own':
            score += 0.08
        elif home_status == 'Mortgage':
            score += 0.03
        
        # Education
        education = profile.get('education_level', '')
        if education in ['PhD', 'Master']:
            score += 0.05
        elif education == 'Bachelor':
            score += 0.03
        
        # Income level
        monthly_income = profile.get('monthly_income', 0)
        if monthly_income >= 100000:
            score += 0.10
        elif monthly_income >= 75000:
            score += 0.07
        elif monthly_income >= 50000:
            score += 0.05
        elif monthly_income >= 30000:
            score += 0.02
        
        return max(0.1, min(0.98, score))
    
    def _prepare_features(self, profile: Dict[str, Any]) -> pd.DataFrame:
        """Prepare features for ML model"""
        # Map profile to model features
        features = {
            'Age': profile['age'],
            'AnnualIncome': profile['annual_income'],
            'LoanAmount': profile['loan_amount'],
            'LoanDuration': profile['loan_duration'],
            'MonthlyDebtPayments': profile['monthly_debt_payments'],
            'DebtToIncomeRatio': profile['debt_to_income_ratio'],
            'Experience': profile['experience'],
            'JobTenure': profile['job_tenure'],
            'NumberOfDependents': profile['number_of_dependents'],
            'MonthlyIncome': profile['monthly_income'],
            'EmploymentStatus': profile['employment_status'],
            'EducationLevel': profile['education_level'],
            'MaritalStatus': profile['marital_status'],
            'HomeOwnershipStatus': profile['home_ownership_status'],
            'LoanPurpose': profile['loan_purpose'],
            # Estimated values for remaining features
            'CreditScore': 700,
            'CreditCardUtilizationRate': 0.3,
            'NumberOfOpenCreditLines': 3,
            'NumberOfCreditInquiries': 1,
            'BankruptcyHistory': 0,
            'PreviousLoanDefaults': 0,
            'PaymentHistory': 90,
            'LengthOfCreditHistory': 60,
            'SavingsAccountBalance': profile['annual_income'] * 0.1,
            'TotalAssets': profile['annual_income'] * 2,
            'TotalLiabilities': profile['monthly_debt_payments'] * 12,
            'UtilityBillsPaymentHistory': 0.95,
            'NetWorth': profile['annual_income'] * 1.5,
            'BaseInterestRate': 8.5,
            'InterestRate': 12.0,
            'MonthlyLoanPayment': profile['loan_amount'] / profile['loan_duration'],
            'TotalDebtToIncomeRatio': profile['debt_to_income_ratio'],
            'RiskScore': 50
        }
        
        df = pd.DataFrame([features])
        
        # Encode categoricals
        if self.encoders:
            for col, encoder in self.encoders.items():
                if col in df.columns:
                    try:
                        df[col] = encoder.transform(df[col].astype(str))
                    except:
                        df[col] = 0
        
        # Scale numericals
        if self.scaler and self.feature_names:
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            try:
                df[numeric_cols] = self.scaler.transform(df[numeric_cols])
            except:
                pass
        
        # Ensure correct column order
        if self.feature_names:
            for col in self.feature_names:
                if col not in df.columns:
                    df[col] = 0
            df = df[self.feature_names]
        
        return df
    
    def _get_next_steps(self, decision: str) -> List[str]:
        """Get next steps based on decision"""
        if decision == "APPROVED":
            return [
                "Complete KYC verification",
                "Submit identity and address proof",
                "Provide bank account details",
                "Sign loan agreement"
            ]
        elif decision == "PENDING_REVIEW":
            return [
                "Wait for loan officer callback (2-3 business days)",
                "Consider adding a co-applicant to strengthen application",
                "Keep financial documents ready for verification"
            ]
        else:
            return [
                "Improve credit score by paying dues on time",
                "Reduce existing debt burden",
                "Wait 3-6 months before reapplying",
                "Consider a lower loan amount or shorter tenure"
            ]


# Singleton instance
_advisor = None

def get_advisor() -> LoanAdvisor:
    """Get or create loan advisor instance"""
    global _advisor
    if _advisor is None:
        _advisor = LoanAdvisor()
    return _advisor
