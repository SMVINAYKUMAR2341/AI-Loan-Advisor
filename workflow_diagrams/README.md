# AI Loan Advisor - Workflow Diagrams

This directory contains comprehensive sequence diagrams illustrating the complete workflow of the AI-Powered Loan Eligibility Advisor system.

## 📁 Diagram Files

| File | Description |
|------|-------------|
| `complete_system_workflow.png` | **Complete End-to-End Flow** - All 7 stages from registration to repayment |
| `customer_loan_workflow.png` | Customer login, loan application, ML processing with 3 outcomes |
| `kyc_bank_agreement_workflow.png` | KYC document upload, bank details, agreement signing |
| `admin_loan_disbursement_workflow.png` | Admin login, application review, document verification, disbursement |
| `combined_customer_admin_workflow.png` | **Combined Customer + Admin** - Full journey from registration to repayment |
| `kyc_verification.png` | Existing KYC verification workflow |
| `repayment.png` | Existing repayment workflow |
| `ticket_system.png` | Support ticket workflow |
| `monitoring.png` | System monitoring workflow |

## 🔄 System Flow Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AI LOAN ADVISOR WORKFLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STAGE 1: Customer Login/Signup                                             │
│      ↓                                                                      │
│  STAGE 2: Loan Application Submission → ML Engine Processing                │
│      ↓                                                                      │
│  STAGE 3: ML Decision                                                       │
│      ├── ✅ APPROVED (>=75%) ──────────────────────────┐                    │
│      ├── ⏳ PENDING_REVIEW (50-74%) → Admin Review ─────┤                    │
│      └── ❌ REJECTED (<50%) → End                       │                    │
│      ↓                                                 │                    │
│  STAGE 4: KYC Process (Approved Loans Only)           ←┘                    │
│      ├── Step 1: Document Upload                                            │
│      ├── Step 2: Bank Details                                               │
│      └── Step 3: Agreement Signing                                          │
│      ↓                                                                      │
│  STAGE 5: Loan Disbursement (Admin)                                         │
│      ↓                                                                      │
│  STAGE 6: EMI Repayments                                                    │
│      ↓                                                                      │
│  STAGE 7: Loan Reports & Monitoring                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔍 ML Decision Logic

The ML engine returns one of three decisions based on approval probability:

| Decision | Probability Range | Action |
|----------|------------------|--------|
| **APPROVED** | >= 75% | Customer proceeds to KYC |
| **PENDING_REVIEW** | 50% - 74% | Admin manual review required |
| **REJECTED** | < 50% | Application rejected with reasons |

## 👥 Actors

- **Customer**: End user applying for loans
- **Frontend (Dashboard)**: React-based customer portal
- **Backend API**: FastAPI server with ML integration
- **ML Engine**: Logistic regression model for loan prediction
- **Database**: PostgreSQL with loan applications, predictions, KYC data
- **Admin Portal**: React-based admin dashboard
- **Bank System**: External bank for fund transfers

## 📊 How to View These Diagrams

The diagrams are generated as high-resolution PNG images. You can view them directly in any image viewer or browser.

---

## 🖼️ Combined Customer + Admin Workflow

![Combined Customer Admin Workflow](combined_customer_admin_workflow.png)

## 🏗️ Related Code Files

### Backend (FastAPI)
- `backend/main.py` - All API endpoints
- `backend/auth.py` - Authentication & JWT
- `backend/loan_advisor.py` - ML analysis engine
- `backend/models.py` - Database models
- `backend/report_generator.py` - PDF report generation

### Customer Frontend
- `frontend/src/pages/Dashboard.tsx` - Main customer dashboard

### Admin Frontend
- `loan-admin-hub-main/src/pages/LoanApplications.tsx` - Application review
- `loan-admin-hub-main/src/pages/LoanDisbursement.tsx` - Disbursement processing
- `loan-admin-hub-main/src/pages/Documents.tsx` - KYC document verification
- `loan-admin-hub-main/src/pages/Reports.tsx` - Admin reports

---
*Generated for AI-Powered Loan Eligibility Advisor v6.0*
