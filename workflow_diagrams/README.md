# AI Loan Advisor - Workflow Diagrams

This directory contains comprehensive sequence diagrams illustrating the complete workflow of the AI-Powered Loan Eligibility Advisor system.

## 📁 Diagram Files

| File | Description |
|------|-------------|
| `complete_system_workflow.mmd` | **Complete End-to-End Flow** - All 7 stages from registration to repayment |
| `customer_loan_workflow.mmd` | Customer login, loan application, ML processing with 3 outcomes |
| `kyc_bank_agreement_workflow.mmd` | KYC document upload, bank details, agreement signing |
| `admin_loan_disbursement_workflow.mmd` | Admin login, application review, document verification, disbursement |
| `kyc_verification.mmd` | Existing KYC verification workflow |
| `repayment.mmd` | Existing repayment workflow |
| `ticket_system.mmd` | Support ticket workflow |
| `monitoring.mmd` | System monitoring workflow |

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

### Option 1: Mermaid Live Editor
1. Go to [Mermaid Live Editor](https://mermaid.live/)
2. Copy the contents of any `.mmd` file
3. Paste into the editor to see the rendered diagram

### Option 2: VS Code Extension
1. Install "Mermaid Preview" extension in VS Code
2. Open any `.mmd` file
3. Press `Ctrl+Shift+V` to preview

### Option 3: GitHub
GitHub automatically renders Mermaid diagrams in markdown files. You can embed diagrams using:
```markdown
```mermaid
<paste diagram content here>
```
```

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
