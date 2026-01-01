# Test Loan Application Forms

This document contains test loan application forms for different approval scenarios: **APPROVED**, **REJECTED**, and **UNDER REVIEW**.

---

## 🟢 TEST CASE 1: APPROVED LOAN APPLICATION

**Profile:** High-income salaried professional with excellent credit profile

### Applicant Details
```json
{
  "gender": "Male",
  "age": 35,
  "employment_status": "Salaried",
  "education_level": "Master",
  "experience": 12,
  "job_tenure": 5,
  "monthly_income": 85000,
  "monthly_debt_payments": 8000,
  "loan_amount": 500000,
  "loan_duration": 36,
  "loan_purpose": "Personal",
  "marital_status": "Married",
  "number_of_dependents": 1,
  "home_ownership_status": "Own",
  "property_area": "Urban",
  "coapplicant_income": 45000
}
```

### Expected Results
- **Decision:** APPROVED
- **Approval Probability:** 85-95%
- **Interest Rate:** 10.5-11.5% p.a.
- **Credit Score Band:** 750-850 (Excellent)
- **EMI-to-Income Ratio:** ~30% (Healthy)
- **Debt-to-Income Ratio:** ~10% (Low)

### Key Factors (Positive)
- High monthly income (Rs. 85,000)
- Stable job tenure (5 years)
- Home ownership status
- Co-applicant income (Rs. 45,000)
- Low existing debt burden
- Master's degree qualification
- Good experience (12 years)

---

## 🔴 TEST CASE 2: REJECTED LOAN APPLICATION

**Profile:** Low-income applicant with high debt burden and unstable employment

### Applicant Details
```json
{
  "gender": "Female",
  "age": 24,
  "employment_status": "Unemployed",
  "education_level": "High School",
  "experience": 2,
  "job_tenure": 0,
  "monthly_income": 15000,
  "monthly_debt_payments": 12000,
  "loan_amount": 800000,
  "loan_duration": 60,
  "loan_purpose": "Business",
  "marital_status": "Single",
  "number_of_dependents": 2,
  "home_ownership_status": "Rent",
  "property_area": "Rural",
  "coapplicant_income": 0
}
```

### Expected Results
- **Decision:** REJECTED
- **Approval Probability:** 15-25%
- **Credit Score Band:** 300-500 (Poor)
- **EMI-to-Income Ratio:** >80% (Very High Risk)
- **Debt-to-Income Ratio:** >80% (Critical)

### Key Factors (Negative)
- Currently unemployed (No job tenure)
- Very high debt burden (Rs. 12,000 on Rs. 15,000 income)
- Loan amount too high relative to income
- No co-applicant income
- Renting (no asset ownership)
- Multiple dependents with low income
- Limited education and experience

---

## 🟡 TEST CASE 3: UNDER REVIEW - Marginal Case

**Profile:** Mid-level professional with moderate income and some risk factors

### Applicant Details
```json
{
  "gender": "Male",
  "age": 28,
  "employment_status": "Self-Employed",
  "education_level": "Bachelor",
  "experience": 5,
  "job_tenure": 2,
  "monthly_income": 45000,
  "monthly_debt_payments": 15000,
  "loan_amount": 600000,
  "loan_duration": 48,
  "loan_purpose": "Home",
  "marital_status": "Married",
  "number_of_dependents": 2,
  "home_ownership_status": "Rent",
  "property_area": "Semi-Urban",
  "coapplicant_income": 20000
}
```

### Expected Results
- **Decision:** PENDING_REVIEW / UNDER REVIEW
- **Approval Probability:** 45-65%
- **Interest Rate:** 12-14% p.a. (Higher risk premium)
- **Credit Score Band:** 600-700 (Fair to Good)
- **EMI-to-Income Ratio:** 40-50% (Moderate Risk)
- **Debt-to-Income Ratio:** 33% (Moderate)

### Key Factors (Mixed)
**Positive:**
- Bachelor's degree
- Reasonable experience (5 years)
- Co-applicant income available
- Home loan purpose (secured)

**Negative:**
- Self-employed (less stability)
- Short job tenure (2 years)
- High existing debt (Rs. 15,000)
- Renting (no property ownership)
- Multiple dependents
- Semi-urban area

**Review Required For:**
- Employment verification
- Income proof validation
- Additional collateral assessment
- Co-applicant income verification

---

## 🟢 TEST CASE 4: APPROVED - Young Professional

**Profile:** Young salaried professional with good income and no dependents

### Applicant Details
```json
{
  "gender": "Female",
  "age": 26,
  "employment_status": "Salaried",
  "education_level": "Bachelor",
  "experience": 4,
  "job_tenure": 3,
  "monthly_income": 60000,
  "monthly_debt_payments": 5000,
  "loan_amount": 300000,
  "loan_duration": 24,
  "loan_purpose": "Auto",
  "marital_status": "Single",
  "number_of_dependents": 0,
  "home_ownership_status": "Rent",
  "property_area": "Urban",
  "coapplicant_income": 0
}
```

### Expected Results
- **Decision:** APPROVED
- **Approval Probability:** 75-85%
- **Interest Rate:** 11-12% p.a.
- **Credit Score Band:** 700-750 (Good)
- **EMI-to-Income Ratio:** ~25% (Healthy)

---

## 🔴 TEST CASE 5: REJECTED - High Risk

**Profile:** Senior citizen with low income requesting large loan

### Applicant Details
```json
{
  "gender": "Male",
  "age": 65,
  "employment_status": "Self-Employed",
  "education_level": "High School",
  "experience": 30,
  "job_tenure": 1,
  "monthly_income": 25000,
  "monthly_debt_payments": 18000,
  "loan_amount": 1000000,
  "loan_duration": 84,
  "loan_purpose": "Personal",
  "marital_status": "Widowed",
  "number_of_dependents": 3,
  "home_ownership_status": "Rent",
  "property_area": "Rural",
  "coapplicant_income": 0
}
```

### Expected Results
- **Decision:** REJECTED
- **Approval Probability:** 10-20%
- **Reason:** Age risk, high debt burden, insufficient income

---

## 🟡 TEST CASE 6: UNDER REVIEW - Business Loan

**Profile:** Entrepreneur seeking business expansion loan

### Applicant Details
```json
{
  "gender": "Male",
  "age": 42,
  "employment_status": "Self-Employed",
  "education_level": "Master",
  "experience": 15,
  "job_tenure": 8,
  "monthly_income": 75000,
  "monthly_debt_payments": 25000,
  "loan_amount": 1500000,
  "loan_duration": 60,
  "loan_purpose": "Business",
  "marital_status": "Married",
  "number_of_dependents": 2,
  "home_ownership_status": "Own",
  "property_area": "Urban",
  "coapplicant_income": 35000
}
```

### Expected Results
- **Decision:** PENDING_REVIEW
- **Approval Probability:** 50-60%
- **Reason:** Large loan amount requires additional business documentation and collateral verification

---

## How to Use These Test Forms

### Via API (Using curl or Postman)

```bash
curl -X POST "http://localhost:8000/api/loan/apply" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "gender": "Male",
    "age": 35,
    "employment_status": "Salaried",
    ...
  }'
```

### Via Python Script

```python
import requests

# Login first
login_response = requests.post("http://localhost:8000/api/auth/login", json={
    "mobile_number": "9876543210",
    "password": "your_password"
})
token = login_response.json()["access_token"]

# Apply for loan
headers = {"Authorization": f"Bearer {token}"}
loan_data = {
    "gender": "Male",
    "age": 35,
    "employment_status": "Salaried",
    # ... rest of the data
}
response = requests.post(
    "http://localhost:8000/api/loan/apply",
    json=loan_data,
    headers=headers
)
print(response.json())
```

### Via Frontend UI

1. Login to http://localhost:8080
2. Navigate to "Apply for Loan" section
3. Fill in the form with the test data above
4. Submit and view the decision

---

## Testing Scenarios

### Scenario A: Bulk Testing
Copy all 6 test cases and run them sequentially to test:
- ML model accuracy
- Decision engine logic
- Report generation
- Interest rate calculation
- Risk assessment

### Scenario B: Edge Cases
Test boundary conditions:
- Minimum age (18)
- Maximum age (100)
- Minimum income (Rs. 10,000)
- Maximum loan amount (Rs. 10,000,000)
- Minimum duration (6 months)
- Maximum duration (360 months)

### Scenario C: Data Validation
Test invalid inputs:
- Negative age
- Zero income
- Invalid employment status
- Missing required fields

---

## Expected Report Sections

Each test case should generate a comprehensive PDF report with:

1. **Cover Page** - Report details, application ID, timestamp
2. **Approval Score** - Gauge chart showing approval probability
3. **Executive Summary** - Key metrics and financial overview
4. **Credit Profile** - Credit score analysis
5. **Loan Cost Breakdown** - EMI, interest, principal breakdown
6. **Decision Factors** - AI explanation with SHAP values
7. **Risk Assessment** - Risk parameters and ratings
8. **Compliance** - RBI guidelines and security measures
9. **Terms & Conditions** - Loan agreement terms

---

## Notes

- All monetary values are in Indian Rupees (₹)
- Loan duration is in months
- Age must be between 18-100 years
- Monthly income must be greater than 0
- Approval probability is scaled to 0-100%
- Interest rates follow RBI guidelines
- Credit scores range from 300-900

---

## Support

For issues or questions:
- Check API documentation: http://localhost:8000/docs
- Review ML model metrics in backend/train_model.py
- Verify database connection in backend/database.py

---

**Generated:** December 29, 2025  
**Project:** Secure Identity Hub - Digital Loan Platform  
**Version:** 1.0
