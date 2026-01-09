"""
Bank Statement Analyzer Module
Analyzes bank transactions to assess loan eligibility
"""
import re
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import random


class BankStatementAnalyzer:
    """Analyzes bank statement transactions for loan eligibility assessment"""
    
    # Transaction categories
    CATEGORIES = {
        'SALARY': ['salary', 'sal', 'wages', 'payroll', 'monthly pay'],
        'EMI': ['emi', 'loan', 'instalment', 'installment', 'nach'],
        'RENT': ['rent', 'house rent', 'rental'],
        'UTILITY': ['electricity', 'water', 'gas', 'bill', 'bescom', 'bwssb'],
        'INSURANCE': ['insurance', 'lic', 'premium', 'policy'],
        'SIP': ['sip', 'mutual fund', 'mf', 'investment'],
        'UPI': ['upi', '@', 'gpay', 'phonepe', 'paytm'],
        'GROCERY': ['grocery', 'bigbasket', 'blinkit', 'dmart', 'supermarket'],
        'FUEL': ['petrol', 'diesel', 'fuel', 'hp', 'ioc', 'bpcl'],
        'FOOD': ['swiggy', 'zomato', 'restaurant', 'cafe'],
        'SHOPPING': ['amazon', 'flipkart', 'myntra', 'shopping'],
        'MEDICAL': ['hospital', 'pharmacy', 'medical', 'apollo', 'healthcare'],
        'SUBSCRIPTION': ['netflix', 'spotify', 'hotstar', 'subscription'],
        'TRANSFER': ['transfer', 'imps', 'neft', 'rtgs'],
    }
    
    def __init__(self, transactions: List[Dict]):
        self.transactions = transactions
        self.credits = [t for t in transactions if t.get('type') == 'CREDIT']
        self.debits = [t for t in transactions if t.get('type') == 'DEBIT']
        
    def categorize_transaction(self, description: str) -> str:
        """Categorize transaction based on description"""
        desc_lower = description.lower()
        for category, keywords in self.CATEGORIES.items():
            if any(kw in desc_lower for kw in keywords):
                return category
        return 'OTHER'
    
    def analyze_income(self) -> Dict:
        """Analyze income patterns"""
        salary_credits = [c for c in self.credits 
                        if self.categorize_transaction(c.get('description', '')) == 'SALARY']
        
        total_salary = sum(c.get('amount', 0) for c in salary_credits)
        other_credits = [c for c in self.credits 
                        if self.categorize_transaction(c.get('description', '')) != 'SALARY']
        total_other = sum(c.get('amount', 0) for c in other_credits)
        
        # Estimate monthly (assuming 3 months data)
        months = 3
        monthly_salary = total_salary / months if salary_credits else 0
        monthly_other = total_other / months
        
        # Check salary regularity
        salary_dates = [datetime.strptime(c.get('date', ''), '%Y-%m-%d').day 
                       for c in salary_credits if c.get('date')]
        regularity = 'REGULAR' if salary_dates and max(salary_dates) - min(salary_dates) <= 3 else 'IRREGULAR'
        
        return {
            'monthly_salary': round(monthly_salary, 0),
            'other_income': round(monthly_other, 0),
            'total_monthly_income': round(monthly_salary + monthly_other, 0),
            'income_stability': 'STABLE' if len(salary_credits) >= 3 else 'UNSTABLE',
            'salary_regularity': regularity,
            'salary_count_3m': len(salary_credits)
        }
    
    def analyze_expenses(self) -> Dict:
        """Analyze expense patterns"""
        fixed_categories = ['EMI', 'RENT', 'INSURANCE', 'SIP']
        variable_categories = ['UTILITY', 'GROCERY', 'FUEL', 'FOOD', 'SHOPPING', 'MEDICAL', 'SUBSCRIPTION']
        
        fixed = {}
        variable = {}
        
        for debit in self.debits:
            category = debit.get('category') or self.categorize_transaction(debit.get('description', ''))
            amount = debit.get('amount', 0)
            
            if category in fixed_categories:
                fixed[category.lower()] = fixed.get(category.lower(), 0) + amount
            elif category in variable_categories:
                variable[category.lower()] = variable.get(category.lower(), 0) + amount
        
        # Convert to monthly (3 months data)
        months = 3
        fixed_monthly = {k: round(v / months, 0) for k, v in fixed.items()}
        variable_monthly = {k: round(v / months, 0) for k, v in variable.items()}
        
        fixed_monthly['total_fixed'] = sum(fixed_monthly.values())
        variable_monthly['total_variable'] = sum(variable_monthly.values())
        
        return {
            'fixed_expenses': fixed_monthly,
            'variable_expenses': variable_monthly,
            'total_monthly_expenses': fixed_monthly['total_fixed'] + variable_monthly['total_variable']
        }
    
    def calculate_ratios(self, income: Dict, expenses: Dict) -> Dict:
        """Calculate financial ratios for loan eligibility"""
        total_income = income['total_monthly_income']
        total_expenses = expenses['total_monthly_expenses']
        emi = expenses['fixed_expenses'].get('emi', 0)
        
        if total_income == 0:
            return {
                'debt_to_income': 1.0,
                'fixed_expense_ratio': 1.0,
                'savings_rate': 0,
                'emi_to_income': 1.0,
                'foir': 1.0
            }
        
        return {
            'debt_to_income': round(emi / total_income, 3),
            'fixed_expense_ratio': round(expenses['fixed_expenses']['total_fixed'] / total_income, 3),
            'savings_rate': round((total_income - total_expenses) / total_income, 3),
            'emi_to_income': round(emi / total_income, 3),
            'foir': round((emi + expenses['fixed_expenses'].get('rent', 0)) / total_income, 3)
        }
    
    def assess_eligibility(self, income: Dict, expenses: Dict, ratios: Dict, 
                          requested_loan: int = 500000, tenure_months: int = 60) -> Dict:
        """Assess loan eligibility based on financial analysis"""
        monthly_income = income['total_monthly_income']
        current_emi = expenses['fixed_expenses'].get('emi', 0)
        
        # RBI guideline: Max 50% FOIR
        max_foir = 0.50
        available_foir = max_foir - ratios['foir']
        max_new_emi = monthly_income * available_foir
        
        # Estimate max loan at 12% annual interest
        interest_rate = 12 / 100 / 12
        if max_new_emi > 0:
            max_loan = max_new_emi * ((1 - (1 + interest_rate) ** -tenure_months) / interest_rate)
        else:
            max_loan = 0
        
        # Risk assessment
        if ratios['foir'] > 0.50:
            risk = 'HIGH'
        elif ratios['foir'] > 0.40:
            risk = 'MODERATE'
        elif ratios['foir'] > 0.30:
            risk = 'LOW'
        else:
            risk = 'VERY_LOW'
        
        # Recommendation
        if max_new_emi <= 0:
            recommendation = "Current EMI obligations exceed safe limits. Loan approval unlikely without reducing existing debts."
        elif max_loan < requested_loan:
            recommendation = f"Eligible for a maximum loan of ₹{int(max_loan):,}. Consider reducing loan amount or increasing tenure."
        else:
            recommendation = "Good financial standing. Eligible for the requested loan amount."
        
        return {
            'max_affordable_emi': round(max_new_emi, 0),
            'recommended_loan_amount': round(max_loan, 0),
            'risk_level': risk,
            'recommendation': recommendation,
            'eligible_for_requested': max_loan >= requested_loan
        }
    
    def detect_patterns(self, income: Dict, expenses: Dict) -> Dict:
        """Detect spending patterns"""
        total_income = income['total_monthly_income']
        fixed = expenses['fixed_expenses']['total_fixed']
        variable = expenses['variable_expenses']['total_variable']
        total = fixed + variable
        
        return {
            'essential_spending': round(fixed / total, 2) if total > 0 else 0,
            'discretionary_spending': round(variable / total, 2) if total > 0 else 0,
            'monthly_deficit': round(total_income - total, 0),
            'cash_flow_status': 'POSITIVE' if total_income >= total else 'NEGATIVE'
        }
    
    def find_red_flags(self, income: Dict, expenses: Dict, ratios: Dict) -> List[str]:
        """Identify financial red flags"""
        flags = []
        
        if ratios['foir'] > 0.50:
            flags.append(f"FOIR too high ({ratios['foir']*100:.1f}% - exceeds 50% limit)")
        elif ratios['foir'] > 0.40:
            flags.append(f"High existing EMI obligations ({ratios['foir']*100:.1f}% of income)")
        
        if ratios['savings_rate'] < 0:
            flags.append("Monthly expenses exceed income")
            flags.append("Negative monthly savings")
        
        if income['income_stability'] == 'UNSTABLE':
            flags.append("Irregular salary credits detected")
        
        if income['salary_regularity'] == 'IRREGULAR':
            flags.append("Salary date varies significantly each month")
            
        # Check for bounced EMIs (would need more data)
        
        return flags
    
    def find_green_flags(self, income: Dict, expenses: Dict, ratios: Dict) -> List[str]:
        """Identify positive financial indicators"""
        flags = []
        
        if income['income_stability'] == 'STABLE':
            flags.append("Regular salary credits detected")
        
        if income['salary_regularity'] == 'REGULAR':
            flags.append("Consistent salary date each month")
        
        if expenses['fixed_expenses'].get('sip', 0) > 0:
            flags.append("Active SIP investment shows financial planning")
        
        if expenses['fixed_expenses'].get('insurance', 0) > 0:
            flags.append("Insurance premiums paid regularly")
        
        if ratios['savings_rate'] > 0.20:
            flags.append(f"Healthy savings rate ({ratios['savings_rate']*100:.1f}%)")
        
        if ratios['foir'] < 0.30:
            flags.append("Low existing debt - good borrowing capacity")
            
        return flags
    
    def generate_full_analysis(self, requested_loan: int = 500000, 
                               tenure_months: int = 60) -> Dict:
        """Generate complete bank statement analysis"""
        income = self.analyze_income()
        expenses = self.analyze_expenses()
        ratios = self.calculate_ratios(income, expenses)
        eligibility = self.assess_eligibility(income, expenses, ratios, 
                                              requested_loan, tenure_months)
        patterns = self.detect_patterns(income, expenses)
        red_flags = self.find_red_flags(income, expenses, ratios)
        green_flags = self.find_green_flags(income, expenses, ratios)
        
        return {
            'analysis_date': datetime.now().strftime('%Y-%m-%d'),
            'period_analyzed': '3 months',
            'transactions_count': len(self.transactions),
            'income_analysis': income,
            'expense_analysis': expenses,
            'financial_ratios': ratios,
            'eligibility_assessment': eligibility,
            'spending_patterns': patterns,
            'red_flags': red_flags,
            'green_flags': green_flags,
            'overall_score': self._calculate_score(ratios, income, len(red_flags), len(green_flags))
        }
    
    def _calculate_score(self, ratios: Dict, income: Dict, 
                        red_count: int, green_count: int) -> Dict:
        """Calculate overall eligibility score"""
        base_score = 50
        
        # FOIR impact (-30 to +20)
        foir = ratios['foir']
        if foir < 0.20:
            base_score += 20
        elif foir < 0.30:
            base_score += 15
        elif foir < 0.40:
            base_score += 5
        elif foir < 0.50:
            base_score -= 10
        else:
            base_score -= 30
        
        # Savings rate impact (-20 to +15)
        savings = ratios['savings_rate']
        if savings > 0.30:
            base_score += 15
        elif savings > 0.20:
            base_score += 10
        elif savings > 0.10:
            base_score += 5
        elif savings > 0:
            pass  # neutral
        else:
            base_score -= 20
        
        # Income stability (+10)
        if income['income_stability'] == 'STABLE':
            base_score += 10
        
        # Flags impact
        base_score -= red_count * 5
        base_score += green_count * 3
        
        # Clamp to 0-100
        final_score = max(0, min(100, base_score))
        
        if final_score >= 75:
            rating = 'EXCELLENT'
        elif final_score >= 60:
            rating = 'GOOD'
        elif final_score >= 45:
            rating = 'FAIR'
        else:
            rating = 'POOR'
        
        return {
            'score': final_score,
            'rating': rating,
            'description': self._get_score_description(rating)
        }
    
    def _get_score_description(self, rating: str) -> str:
        descriptions = {
            'EXCELLENT': 'Strong financial profile. High likelihood of loan approval with favorable terms.',
            'GOOD': 'Healthy finances. Loan approval likely with standard terms.',
            'FAIR': 'Moderate financial health. May need additional documentation or guarantor.',
            'POOR': 'Financial stress indicators present. Loan approval may be challenging.'
        }
        return descriptions.get(rating, '')


# Mock validation functions
def validate_pan(pan_number: str) -> Dict:
    """
    Validate PAN card number (mock - no actual API call)
    PAN Format: AAAAA0000A (5 letters, 4 digits, 1 letter)
    """
    pan_pattern = r'^[A-Z]{5}[0-9]{4}[A-Z]$'
    
    if not pan_number:
        return {'valid': False, 'error': 'PAN number is required'}
    
    pan_upper = pan_number.upper().strip()
    
    if not re.match(pan_pattern, pan_upper):
        return {
            'valid': False, 
            'error': 'Invalid PAN format. Expected: AAAAA0000A'
        }
    
    # Mock successful validation
    # Fourth character indicates holder type
    holder_type_map = {
        'A': 'Association of Persons',
        'B': 'Body of Individuals',
        'C': 'Company',
        'F': 'Firm',
        'G': 'Government',
        'H': 'Hindu Undivided Family',
        'L': 'Local Authority',
        'J': 'Artificial Juridical Person',
        'P': 'Individual',
        'T': 'Trust'
    }
    
    fourth_char = pan_upper[3]
    holder_type = holder_type_map.get(fourth_char, 'Unknown')
    
    # Generate mock name from PAN (for demo)
    names = ['Vinay Kumar', 'Rahul Sharma', 'Priya Patel', 'Amit Singh', 'Neha Gupta']
    mock_name = random.choice(names) if pan_upper[3] == 'P' else 'ABC Corporation'
    
    return {
        'valid': True,
        'pan': pan_upper,
        'holder_type': holder_type,
        'holder_name': mock_name,
        'status': 'ACTIVE',
        'verified_at': datetime.now().isoformat()
    }


def validate_aadhaar(aadhaar_number: str) -> Dict:
    """
    Validate Aadhaar number (mock - no actual API call, no OTP)
    Aadhaar Format: 12 digits, should not start with 0 or 1
    """
    if not aadhaar_number:
        return {'valid': False, 'error': 'Aadhaar number is required'}
    
    # Remove spaces and hyphens
    aadhaar_clean = re.sub(r'[\s\-]', '', aadhaar_number)
    
    if not aadhaar_clean.isdigit():
        return {'valid': False, 'error': 'Aadhaar must contain only digits'}
    
    if len(aadhaar_clean) != 12:
        return {'valid': False, 'error': 'Aadhaar must be exactly 12 digits'}
    
    if aadhaar_clean[0] in '01':
        return {'valid': False, 'error': 'Aadhaar cannot start with 0 or 1'}
    
    # Verhoeff checksum (simplified - not implementing full algorithm for mock)
    
    # Mock successful validation
    masked = aadhaar_clean[:4] + ' XXXX ' + aadhaar_clean[-4:]
    
    return {
        'valid': True,
        'aadhaar_masked': masked,
        'name': 'Vinay Kumar',  # Mock name
        'gender': 'Male',
        'dob': '1995-05-15',
        'address': {
            'state': 'Karnataka',
            'district': 'Bangalore Urban',
            'pincode': '560001'
        },
        'mobile_linked': True,
        'email_linked': True,
        'status': 'ACTIVE',
        'verified_at': datetime.now().isoformat()
    }


def validate_bank_account(account_number: str, ifsc_code: str) -> Dict:
    """
    Validate bank account number and IFSC (mock - no actual API call)
    """
    errors = []
    
    if not account_number:
        errors.append('Account number is required')
    elif not account_number.isdigit():
        errors.append('Account number must contain only digits')
    elif len(account_number) < 9 or len(account_number) > 18:
        errors.append('Account number should be 9-18 digits')
    
    ifsc_pattern = r'^[A-Z]{4}0[A-Z0-9]{6}$'
    if not ifsc_code:
        errors.append('IFSC code is required')
    elif not re.match(ifsc_pattern, ifsc_code.upper()):
        errors.append('Invalid IFSC format. Expected: AAAA0NNNNNN')
    
    if errors:
        return {'valid': False, 'errors': errors}
    
    # Mock bank details from IFSC
    bank_mapping = {
        'SBIN': {'name': 'State Bank of India', 'type': 'PSU'},
        'HDFC': {'name': 'HDFC Bank', 'type': 'Private'},
        'ICIC': {'name': 'ICICI Bank', 'type': 'Private'},
        'KKBK': {'name': 'Kotak Mahindra Bank', 'type': 'Private'},
        'AXIS': {'name': 'Axis Bank', 'type': 'Private'},
        'PUNB': {'name': 'Punjab National Bank', 'type': 'PSU'},
        'BARB': {'name': 'Bank of Baroda', 'type': 'PSU'},
        'CNRB': {'name': 'Canara Bank', 'type': 'PSU'},
    }
    
    bank_prefix = ifsc_code[:4].upper()
    bank_info = bank_mapping.get(bank_prefix, {'name': 'Unknown Bank', 'type': 'Unknown'})
    
    return {
        'valid': True,
        'account_number': account_number,
        'account_number_masked': 'XXXX' + account_number[-4:],
        'ifsc': ifsc_code.upper(),
        'bank_name': bank_info['name'],
        'bank_type': bank_info['type'],
        'branch': f'{bank_info["name"]} - Main Branch',
        'account_type': 'SAVINGS',
        'account_status': 'ACTIVE',
        'micr': f'{ifsc_code[4:7]}001234',
        'verified_at': datetime.now().isoformat()
    }


def mock_cibil_check(pan_number: str) -> Dict:
    """
    Mock CIBIL score check (no actual API call)
    """
    pan_validation = validate_pan(pan_number)
    if not pan_validation['valid']:
        return {'success': False, 'error': pan_validation.get('error')}
    
    # Generate consistent mock score based on PAN (for demo reproducibility)
    random.seed(hash(pan_number))
    base_score = random.randint(650, 850)
    
    # Score bands
    if base_score >= 750:
        rating = 'EXCELLENT'
        risk = 'LOW'
    elif base_score >= 700:
        rating = 'GOOD'
        risk = 'LOW_TO_MODERATE'
    elif base_score >= 650:
        rating = 'FAIR'
        risk = 'MODERATE'
    elif base_score >= 550:
        rating = 'POOR'
        risk = 'HIGH'
    else:
        rating = 'VERY_POOR'
        risk = 'VERY_HIGH'
    
    return {
        'success': True,
        'pan': pan_number.upper(),
        'cibil_score': base_score,
        'score_range': {'min': 300, 'max': 900},
        'rating': rating,
        'risk_level': risk,
        'report_date': datetime.now().strftime('%Y-%m-%d'),
        'factors': {
            'payment_history': random.choice(['GOOD', 'EXCELLENT', 'FAIR']),
            'credit_utilization': f'{random.randint(15, 45)}%',
            'credit_age': f'{random.randint(3, 15)} years',
            'credit_mix': random.choice(['GOOD', 'EXCELLENT']),
            'recent_inquiries': random.randint(0, 3)
        },
        'active_accounts': {
            'credit_cards': random.randint(1, 3),
            'personal_loans': random.randint(0, 2),
            'home_loans': random.randint(0, 1),
            'auto_loans': random.randint(0, 1)
        },
        'total_outstanding': random.randint(0, 500000)
    }
