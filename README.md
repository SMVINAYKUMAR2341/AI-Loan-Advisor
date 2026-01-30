# Secure Identity Hub & Loan Approval System

This project contains a comprehensive banking system comprising a **Secure Identity Hub** frontend and a **Loan Approval Prediction** backend.

## Project Structure

- `frontend/`: React/Vite application for the user interface.
- `backend/`: FastAPI application for loan prediction and user management.
- `sql/`: Database scripts.

## Prerequisites

- **Python 3.8+**
- **Node.js 16+** & **npm**
- **PostgreSQL** (running locally)

## Setup Instructions

### 1. Database Setup
1.  Ensure PostgreSQL is running.
2.  Create a database named `loan_app_db`.
3.  Configure your connection details in a `.env` file in the root directory.
    > **Note**: Use the `DATABASE_URL` format: `postgresql+asyncpg://[user]:[password]@localhost/loan_app_db`

### 2. Backend Setup
Navigate to the root directory and install Python dependencies:

```bash
pip install -r backend/requirements.txt
```

Initialize the database tables:

```bash
python backend/create_tables.py
```

Start the backend server:

```bash
uvicorn backend.main:app --reload
```

The API will be available at `http://localhost:8000`.

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Features
- **User Authentication**: Secure signup and login with JWT tokens
- **AI-Powered Loan Prediction**: Machine learning-based loan eligibility assessment with SHAP explanations
- **Interactive Dashboard**: Real-time loan status, credit score monitoring, and financial overview
- **Loan Application**: Step-by-step loan application form with AI advisor
- **PDF Report Generation**: Comprehensive RBI-compliant loan analysis reports
- **QR Code Sharing**: Share and download reports on mobile devices
- **Payment Gateway**: Mock payment integration (Card, UPI, Net Banking, Wallets)
- **Profile Management**: Complete user profile and security settings

## Screenshots

### 1. Dashboard - Financial Overview
![Dashboard](screenshots/dashboard.png)
- Real-time credit score monitoring (752/900)
- Active loan tracking with outstanding balance
- AI-powered loan eligibility predictions (₹8,00,000 pre-approved)
- Alerts & notifications center
- AI Credit Advisor chatbot

### 2. My Loans
![My Loans](screenshots/my-loans.png)
- View all active loans with details
- Track loan ID, type, amount, and outstanding balance
- Real-time status updates

### 3. Apply for Loan
![Apply for Loan](screenshots/loan-form.png)
- AI-Powered Loan Eligibility Advisor
- Personal & Employment information
- Financial details with automatic calculations
- Loan details configuration
- Household information
- Instant eligibility assessment

### 4. Loan Analysis Results
![Loan Analysis](screenshots/apply-loan.png)
- Comprehensive approval decision (95% approval score)
- Credit score range prediction (710-760)
- Interest rate analysis (12.75%)
- Monthly EMI calculation (₹2,263)
- Total interest breakdown (₹1,35,752)
- Decision factors with AI explanations
- Feature impact analysis
- ML approval score visualization
- Loan cost breakdown chart
- Risk assessment radar chart
- Next steps guidance (KYC, documentation)
- PDF report download & QR code sharing

### 5. Security & Profile Settings
![Profile Settings](screenshots/profile-settings.png)
- Complete account information
- Customer ID: LA20253834
- Email verification status
- Mobile number & address details
- KYC status tracking
- Password management
- Account role information

### 6. Mobile QR Code Download
![QR Code](screenshots/qr-code.png)
- Scan to download report on mobile
- Secure & encrypted link
- 24-hour expiration for security
- Works across all devices

### 7. KYC Completion Workflow
![KYC Completed](screenshots/kyc-completed.png)
- **Application Tracking**: Unique 8-character tracking ID (e.g., 1C9C4E4) displayed prominently
- **Progress Indicators**: Visual step completion (Documents, Bank Details, Agreement, Complete)
- **Success Confirmation**: Large checkmark with "KYC Completed Successfully!" message
- **Verification Status**: Shows "Verified & Approved" badge in green
- **Disbursement Timeline**: Clear 24-48 hours timeline for loan processing
- **Application Details Card**:
  - Application Reference Number
  - Verification Status with checkmark
  - Expected disbursement timeline
- **What Happens Next** Section:
  - ✓ Team verification of submitted documents
  - ✓ Loan amount credit to bank account
  - ✓ SMS & Email confirmation upon disbursement
- **Document Management**:
  - Minimum 2 documents required (down from 4 for faster processing)
  - Delete & reupload functionality for corrections
  - Real-time document verification status
- **Professional UI**: Gradient backgrounds, consistent teal/blue theme, no redundant messages

### Key Features:
- **Tracking ID System**: 8-character unique identifier generated from application UUID
  - Copy-to-clipboard functionality for easy reference
  - Displayed prominently with large font (3xl) and gradient background
  - Used for all customer communications and admin searches
- **Admin Tracking Search**: Backend endpoint `/admin/applications/tracking/{tracking_id}` returns:
  - Complete customer information (name, email, phone, customer_id)
  - Loan details (amount, purpose, tenure, income)
  - AI prediction data (decision, approval_probability, risk_score, credit_score)
  - KYC status with document count and verification details
  - Full document list with file paths and verification status
  - Bank details (masked account number, IFSC code)
  - Disbursement status if processed
  - Flag indicating if application can proceed to disbursement
- **Document Viewing**: Admin endpoint `/admin/documents/{document_id}/view` provides FileResponse for document review
- **Disbursement Processing**: Admin endpoint `/admin/disbursements/{application_id}` processes approved loans

### 8. Second Loan Application - Smart Document Reuse
**New Feature**: Intelligent KYC handling for repeat customers applying for additional loans

#### Customer Benefits:
- **Identity Documents Reuse**: Previously verified Aadhaar and PAN cards can be reused instantly
- **No Re-upload Required**: Save time by linking verified documents from previous applications
- **Fresh Bank Statements**: System requires updated bank statements (3-6 months) for each new loan
- **One-Click Linking**: Simply click "Use This Document" to reuse verified identity proofs

#### Business Logic:
- **Identity Verification**: One-time KYC per customer (not per application)
- **Financial Verification**: Fresh per application to assess:
  - Current income and expense patterns
  - Existing loan EMI payment history
  - Updated debt-to-income ratio
  - Repayment capacity for multiple loans

#### Technical Implementation:
**Backend Endpoints:**
- `GET /kyc/user-verified-documents` - Fetches reusable documents from previous applications
- `POST /kyc/{application_id}/link-previous-document` - Links verified document to new application
- `GET /admin/applications/tracking/{tracking_id}` - Shows all user documents across applications

**Smart Document Categories:**
- ✅ **Reusable**: Aadhaar, PAN, Passport (identity documents)
- ❌ **Fresh Required**: Bank Statements (must be recent for each application)

**Admin View Enhancement:**
- Admins can see `all_user_documents` array in tracking endpoint
- View document history across all customer applications
- Track which documents are original vs linked
- Verify bank statement freshness for second loans

#### UI Highlights:
- 🔵 Blue info card showing "Second Loan Application?" with document reuse option
- 🟡 Yellow highlighting for bank statement requirement with animated alert
- 🟢 Green badges for verified reusable documents
- Modal showing previous verified documents with one-click linking

This feature reduces customer friction for repeat loans while maintaining compliance with fresh financial assessment requirements.

---

## Bank Admin Dashboard

The Admin Dashboard is a separate interface for bank officers to manage loan applications, process disbursements, and monitor customer activities.

### Admin Features
- **Secure 3-Factor Login**: Admin ID, Password, and 6-digit Security PIN
- **Loan Application Review**: View all customer applications with AI approval scores
- **Approve/Reject/Request Documents**: Make decisions with mandatory justification
- **Loan Disbursement**: Process fund transfers for approved loans
- **Customer Management**: Access customer database and profiles
- **Reports & Analytics**: View loan statistics and trends
- **EMI Tracking**: Monitor repayment schedules
- **Support Tickets**: Handle customer queries

### Admin Screenshots

#### 1. Admin Secure Login
![Admin Login](screenshots/admin-login.jpg)
- 3-Factor authentication (Admin ID + Email + Password + Security PIN)
- Secure login portal for bank officers
- RBI-compliant encryption
- Animated WebGL background matching customer portal

#### 2. Admin Dashboard Overview
![Admin Dashboard](screenshots/admin-dashboard.jpg)
- **Total Loans**: Count of all loan applications in the system
- **Total Disbursed**: Sum of all disbursed loan amounts
- **Pending Review**: Applications awaiting officer decision
- **Approval Rate**: Percentage of approved applications
- **Loan Status Distribution**: Visual pie chart (Disbursed, Approved, Pending, Rejected)
- **Monthly Trends**: Line chart showing application and approval trends
- **EMI Collection Trend**: Track repayment performance

#### 3. Loan Applications Management
![Loan Applications](screenshots/admin-loan-applications.jpg)
- Comprehensive table with all loan applications
- **Loan ID & Reference ID**: Unique identifiers for tracking
- **Customer Name**: Linked to customer profile
- **Amount & Purpose**: Loan details at a glance
- **AI Score**: Machine learning approval probability (percentage)
- **Decision Status**: APPROVED, REJECTED, PENDING_REVIEW badges
- **Date**: Application submission timestamp
- **Actions**: Quick access to view details

#### 4. Loan Application Details & Decision
![Loan Details](screenshots/admin-loan-details.png)
- **Customer Information**: Full customer profile (Name, ID, Email, Phone, Account Created)
- **Loan Details**: Amount (₹5,00,000), Purpose, Tenure, Interest Rate, Monthly EMI
- **AI Analysis Section**: 
  - Approval Probability (68%)
  - Decision Reason with AI explanation
  - Credit Rating assessment
  - Total Repayment calculation
- **Take Action Panel**:
  - ✅ **Approve** button with justification
  - ❌ **Reject** button with justification
  - 📄 **Request Documents** with document type selection
  - ✓ "Require customer to visit branch with hard copies" checkbox
- **Quick Actions**: Download Report button

#### 5. Loan Disbursement
![Loan Disbursement](screenshots/admin-loan-disbursement.jpg)
- **Pending Disbursements Counter**: Number of approved loans awaiting processing
- **Total Disbursements**: Count of completed disbursements
- **Total Disbursed Amount**: Sum of all disbursed funds
- **Approved Loans Table**: 
  - Loan ID, Customer Name, Amount, Purpose, Contact
  - One-click "Disburse" button for each loan
- **Disbursement History**: Tab for viewing completed transactions

---

## Deployment
This repository is configured to include the `.env` file for ease of setup. **Do not use these credentials in a production environment.**

---

## 🖼️ Complete System Workflow

**Complete 12-phase workflow covering customer loan application through admin disbursement including: Authentication, Loan Submission, ML Decision, Report/QR Download, KYC, Bank Details, Agreement Signing, Admin Review, Document Verification, Disbursement, and Repayment Tracking.**

![Combined Customer + Admin Workflow](workflow_diagrams/combined_customer_admin_workflow.png)

---

### KYC, Bank Details & Agreement Workflow
**Customer KYC process: document upload (Aadhaar, PAN), admin verification, bank details submission, and digital loan agreement signing.**

![KYC Bank Agreement Workflow](workflow_diagrams/kyc_bank_agreement_workflow.png)

---

### KYC Verification
**Admin KYC document verification flow: view documents, verify authenticity, approve or reject with comments.**

![KYC Verification](workflow_diagrams/kyc_verification.png)

---

### Repayment Workflow
**Customer EMI repayment process: view schedule, make payments, track payment history and outstanding balance.**

![Repayment Workflow](workflow_diagrams/repayment.png)

---

### Ticket System Workflow
**Customer support ticket flow: create ticket, admin assignment, resolution tracking, and customer notification.**

![Ticket System](workflow_diagrams/ticket_system.png)

---

### System Monitoring
**Admin system monitoring: dashboard stats, alerts, notifications, and activity logging.**

![Monitoring](workflow_diagrams/monitoring.png)
