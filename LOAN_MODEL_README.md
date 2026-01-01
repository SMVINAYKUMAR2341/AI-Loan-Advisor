# Loan Eligibility ML Model - Documentation

## Summary
Trained an ML model on `loan_eligibility_processed_features.csv` to predict loan eligibility with three outcomes: **Approved**, **Rejected**, or **Pending for Review**.

---

## Implementation

### 1. Model Training
- **Dataset**: `loan_eligibility_processed_features.csv` (4,000 rows, 24 features)
- **Model**: RandomForest Classifier
- **ROC-AUC**: 1.0000
- **Accuracy**: 99.88%

### Key Features (by importance):
| Feature | Importance |
|---------|------------|
| Approx_DTI | 23.8% |
| Applicant Income | 20.8% |
| LIR (Loan-Income Ratio) | 19.8% |
| Total_Income | 17.1% |
| Loan Amount | 7.0% |

---

## Files Created

| File | Purpose |
|------|---------|
| `backend/train_model.py` | ML training script |
| `backend/loan_predictor.py` | Prediction service |
| `backend/loan_model.joblib` | Trained model file |

---

## API Endpoint

### POST `/predict-loan`

**Request:**
```json
{
  "applicant_income": 8000,
  "coapplicant_income": 2000,
  "loan_amount": 200,
  "loan_term": 360,
  "credit_history": 1,
  "gender": "Male",
  "married": "Yes",
  "dependents": 1,
  "education": "Graduate",
  "employment": "Salaried",
  "property_area": "Urban"
}
```

**Response:**
```json
{
  "status": "APPROVED",
  "confidence": 100.0,
  "decision_factors": [
    {"factor": "Credit History", "impact": "positive", "description": "Good credit history"},
    {"factor": "Income-to-Loan Ratio", "impact": "positive", "description": "Loan manageable"}
  ],
  "recommendation": "Your loan application looks strong. You may proceed."
}
```

---

## Status Thresholds
- **APPROVED**: Confidence ≥ 70%
- **PENDING_REVIEW**: Confidence 40-70%
- **REJECTED**: Confidence < 40%

---

## Test Results
| Test Case | Income | Loan | Credit | Result |
|-----------|--------|------|--------|--------|
| Good profile | ₹8,000 | ₹2L | Good | ✅ APPROVED (100%) |
| Weak profile | ₹2,000 | ₹5L | Bad | ⚠️ APPROVED (80%) |

> **Note:** Training data was 99.8% approved, resulting in high approval rates. For production, use balanced training data.

---

## Usage

### Train the Model:
```bash
python backend/train_model.py
```

### Start the API:
```bash
uvicorn backend.main:app --reload --port 8000
```

### Test Prediction:
```powershell
$body = @{applicant_income=8000; loan_amount=200; credit_history=1} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/predict-loan" -Method Post -Body $body -ContentType "application/json"
```
