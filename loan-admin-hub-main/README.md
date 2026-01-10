# LoanAdmin - Bank Admin Dashboard

## Overview

LoanAdmin is the Bank Officer Dashboard for the AI-Driven Loan Advisor system. It provides bank officers with tools to manage loan applications, verify KYC documents, process disbursements, track EMIs, and send notifications to customers.

## Features

- **Dashboard**: Real-time overview of loan statistics and metrics
- **Loan Applications**: View all customer applications with AI approval scores
- **Loan Disbursement**: Process loan payouts with transaction tracking
- **EMI Tracking**: Monitor upcoming, overdue, and paid EMIs
- **Documents**: Verify customer KYC documents (PAN, Aadhaar, Income Proof)
- **Customers**: View all registered customers and their profiles
- **Notifications**: Send SMS/Email reminders to customers
- **Reports**: Analytics and visualizations on loan performance

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun

### Installation

```bash
cd loan-admin-hub-main
npm install
```

### Running Locally

```bash
npm run dev
```

The admin dashboard will be available at `http://localhost:8080`

### Backend Connection

Ensure the FastAPI backend is running at `http://localhost:8000` for API connectivity.

## Admin Login

Use the following demo credentials:
- **Email**: admin@bank.com
- **Password**: admin123

## Project Structure

```
src/
├── components/
│   ├── dashboard/    # Dashboard-specific components
│   ├── layout/       # AdminLayout, AppSidebar
│   └── ui/           # shadcn/ui components
├── pages/
│   ├── Dashboard.tsx
│   ├── LoanApplications.tsx
│   ├── LoanDisbursement.tsx
│   ├── EMITracking.tsx
│   ├── Documents.tsx
│   ├── Customers.tsx
│   ├── Notifications.tsx
│   ├── Reports.tsx
│   ├── AdminProfile.tsx
│   └── Login.tsx
├── lib/
│   └── api.ts        # API client connecting to backend
└── hooks/
    └── use-toast.ts  # Toast notifications
```

## License

This project is part of the AI-Driven Loan Advisor system.
