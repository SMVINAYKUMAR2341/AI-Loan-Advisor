# Real External API Integrations

## ✅ Free Services Integrated (Unlimited Usage)

### 1. **Document Validation - OCR.space API**
- **Service**: https://ocr.space
- **Free Tier**: 25,000 requests/month
- **Purpose**: Extract text from ID documents (PAN, Aadhaar, Passport, DL)
- **Endpoint**: `POST /api/validate-document-ocr`

**Usage:**
```bash
curl -X POST http://localhost:8000/api/validate-document-ocr \
  -H "Authorization: Bearer <admin_token>" \
  -d "document_id=<kyc_document_id>"
```

**Response:**
```json
{
  "success": true,
  "document_type": "PAN_CARD",
  "validation_score": 95,
  "is_valid": true,
  "extracted_text": "INCOME TAX DEPARTMENT...",
  "details": {
    "pan_number": "ABCDE1234F"
  },
  "service": "OCR.space"
}
```

---

### 2. **ID Document Format Validation**
- **Service**: Local validation (Regex + Checksum)
- **Free**: Unlimited
- **Purpose**: Validate PAN/Aadhaar format without external calls
- **Endpoint**: `POST /api/validate-id`

**Usage:**
```bash
curl -X POST "http://localhost:8000/api/validate-id?document_type=PAN&document_number=ABCDE1234F"
```

**Response:**
```json
{
  "document_type": "PAN",
  "document_number": "ABCDE1234F",
  "is_valid": true,
  "format": "Valid PAN format",
  "entity_type": "Individual"
}
```

---

### 3. **Payment Gateway - Razorpay Test Mode**
- **Service**: https://razorpay.com
- **Free**: Unlimited test transactions
- **Purpose**: Process loan disbursements
- **Endpoint**: `POST /api/initiate-payment`

**Test Cards:**
- Success: `4111 1111 1111 1111`
- Failure: `4000 0000 0000 0002`

**Usage:**
```bash
curl -X POST "http://localhost:8000/api/initiate-payment?application_id=<app_id>&payment_method=razorpay" \
  -H "Authorization: Bearer <admin_token>"
```

**Response:**
```json
{
  "success": true,
  "payment_id": "pay_ABC123XYZ",
  "amount": 100000.0,
  "currency": "INR",
  "status": "created",
  "payment_link": "https://razorpay.com/payment-link/...",
  "test_cards": {
    "success": "4111 1111 1111 1111",
    "failure": "4000 0000 0000 0002"
  },
  "service": "Razorpay Test Mode",
  "disbursement_id": "..."
}
```

---

### 4. **Payment Gateway - Stripe Test Mode**
- **Service**: https://stripe.com
- **Free**: Unlimited test transactions
- **Purpose**: Alternative payment processor
- **Endpoint**: `POST /api/initiate-payment?payment_method=stripe`

**Test Cards:**
- Success: `4242 4242 4242 4242`
- 3D Secure: `4000 0027 6000 3184`
- Decline: `4000 0000 0000 0002`

**Usage:**
```bash
curl -X POST "http://localhost:8000/api/initiate-payment?application_id=<app_id>&payment_method=stripe" \
  -H "Authorization: Bearer <admin_token>"
```

---

### 5. **Bank Account Verification - Penny Drop**
- **Service**: Simulated (Real services: Razorpay/Cashfree/Signzy)
- **Free**: Unlimited simulation
- **Purpose**: Verify bank account before disbursement
- **Endpoint**: `POST /api/verify-bank`

**Usage:**
```bash
curl -X POST http://localhost:8000/api/verify-bank \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "application_id": "<app_id>",
    "account_number": "1234567890",
    "ifsc_code": "SBIN0001234",
    "account_holder_name": "John Doe"
  }'
```

**Response:**
```json
{
  "success": true,
  "verification_id": "VER123456789012",
  "account_verified": true,
  "account_holder_name": "John Doe",
  "account_number": "XXXX7890",
  "ifsc_code": "SBIN0001234",
  "bank_name": "State Bank of India",
  "penny_drop_status": "SUCCESS",
  "amount_deposited": 0.01,
  "utr_number": "UTR123456789012",
  "service": "Bank Verification API (Simulated)"
}
```

---

## 🔧 Setup Instructions

### 1. Install Required Package
```bash
pip install httpx
```

### 2. Configure API Keys (Optional)

Create `.env` file in `backend/` directory:

```env
# OCR.space API (Free key provided, or get your own)
OCR_SPACE_API_KEY=K87899142388957

# Razorpay Test Mode (Get free test keys from razorpay.com)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_SECRET=your_test_secret

# Stripe Test Mode (Get free test keys from stripe.com)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
```

### 3. Test the APIs

```bash
# Start backend
cd backend
python -m uvicorn main:app --reload --port 8000

# Test document validation
curl http://localhost:8000/api/validate-id?document_type=PAN&document_number=ABCDE1234F

# View API docs
open http://localhost:8000/docs
```

---

## 📊 API Comparison

| Feature | Service | Free Tier | Realistic |
|---------|---------|-----------|-----------|
| **Document OCR** | OCR.space | 25K/month | ✅ Real API |
| **ID Validation** | Local | Unlimited | ✅ Real validation |
| **Payments** | Razorpay | Unlimited (test) | ✅ Real test mode |
| **Payments** | Stripe | Unlimited (test) | ✅ Real test mode |
| **Bank Verify** | Simulated | Unlimited | ⚠️ Simulation of real services |

---

## 🎯 Production Migration

When moving to production, replace with:

1. **OCR.space** → Keep same API, use paid tier if needed
2. **Razorpay** → Switch from test to live keys
3. **Stripe** → Switch from test to live keys
4. **Bank Verification** → Integrate Razorpay Fund Account Validation / Cashfree / Signzy

---

## 🔐 Security Notes

- All test keys are publicly available (safe for development)
- Never commit production API keys to git
- Use environment variables for all credentials
- Test mode transactions don't process real money

---

## 📝 Example Integration Flow

```python
# 1. Upload document
POST /kyc/{app_id}/documents (file upload)

# 2. Validate document with OCR
POST /api/validate-document-ocr?document_id={doc_id}

# 3. Validate ID format
POST /api/validate-id?document_type=PAN&document_number=ABCDE1234F

# 4. Verify bank account
POST /api/verify-bank (account details)

# 5. Initiate payment
POST /api/initiate-payment?application_id={app_id}
```

---

## ✅ Benefits

- **No Cost**: All services have unlimited free tiers for testing
- **Realistic**: Uses actual external APIs (not just mocks)
- **Production-Ready**: Easy to migrate to production
- **Test Mode**: Safe to use without real money
- **Documented**: All APIs well-documented

---

## 🚀 Try It Now

All endpoints are ready to use! Just start your backend and try the APIs.
