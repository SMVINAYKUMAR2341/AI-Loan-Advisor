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
