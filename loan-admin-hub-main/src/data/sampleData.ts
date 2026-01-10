// Sample data for Bank Admin Dashboard - 2 loan entries only

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  kycStatus: 'verified' | 'pending' | 'rejected';
  address: string;
  createdAt: string;
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
}

export interface LoanApplication {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  tenure: number; // months
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed';
  interestRate: number;
  emiAmount: number;
  creditScore: number;
  aiEligibilityScore: number;
  monthlyIncome: number;
  employment: string;
  appliedAt: string;
  processedAt?: string;
  disbursedAt?: string;
  transactionRef?: string;
}

export interface EMISchedule {
  id: string;
  loanId: string;
  customerId: string;
  customerName: string;
  emiNumber: number;
  amount: number;
  dueDate: string;
  status: 'upcoming' | 'paid' | 'overdue';
  paidDate?: string;
  paymentMode?: string;
}

export interface Document {
  id: string;
  loanId?: string;
  customerId: string;
  type: 'disbursement_receipt' | 'kyc' | 'income_proof' | 'loan_agreement' | 'payment_receipt';
  name: string;
  uploadedAt: string;
  fileSize: string;
}

export interface Notification {
  id: string;
  customerId: string;
  customerName: string;
  type: 'sms' | 'email';
  trigger: 'emi_reminder' | 'emi_due' | 'emi_overdue' | 'disbursement_confirmation';
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  message: string;
  sentAt: string;
}

// Sample Customers
export const customers: Customer[] = [
  {
    id: 'CUST001',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@email.com',
    phone: '+91 98765 43210',
    kycStatus: 'verified',
    address: '123 MG Road, Bangalore, Karnataka 560001',
    createdAt: '2024-01-15',
    bankDetails: {
      accountNumber: '1234567890123456',
      ifscCode: 'HDFC0001234',
      bankName: 'HDFC Bank',
    },
  },
  {
    id: 'CUST002',
    name: 'Priya Patel',
    email: 'priya.patel@email.com',
    phone: '+91 87654 32109',
    kycStatus: 'verified',
    address: '456 Park Street, Mumbai, Maharashtra 400001',
    createdAt: '2024-02-20',
    bankDetails: {
      accountNumber: '9876543210987654',
      ifscCode: 'ICIC0005678',
      bankName: 'ICICI Bank',
    },
  },
];

// Sample Loan Applications
export const loanApplications: LoanApplication[] = [
  {
    id: 'LOAN001',
    customerId: 'CUST001',
    customerName: 'Rahul Sharma',
    amount: 500000,
    tenure: 24,
    purpose: 'Home Renovation',
    status: 'disbursed',
    interestRate: 12.5,
    emiAmount: 23536,
    creditScore: 780,
    aiEligibilityScore: 92,
    monthlyIncome: 85000,
    employment: 'Software Engineer at TCS',
    appliedAt: '2024-01-20',
    processedAt: '2024-01-22',
    disbursedAt: '2024-01-25',
    transactionRef: 'TXN2024012500001',
  },
  {
    id: 'LOAN002',
    customerId: 'CUST002',
    customerName: 'Priya Patel',
    amount: 300000,
    tenure: 12,
    purpose: 'Education Loan',
    status: 'approved',
    interestRate: 10.5,
    emiAmount: 26401,
    creditScore: 720,
    aiEligibilityScore: 85,
    monthlyIncome: 65000,
    employment: 'Marketing Manager at Reliance',
    appliedAt: '2024-02-25',
    processedAt: '2024-02-27',
  },
];

// Sample EMI Schedule (for disbursed loan)
export const emiSchedules: EMISchedule[] = [
  {
    id: 'EMI001',
    loanId: 'LOAN001',
    customerId: 'CUST001',
    customerName: 'Rahul Sharma',
    emiNumber: 1,
    amount: 23536,
    dueDate: '2024-02-25',
    status: 'paid',
    paidDate: '2024-02-24',
    paymentMode: 'UPI',
  },
  {
    id: 'EMI002',
    loanId: 'LOAN001',
    customerId: 'CUST001',
    customerName: 'Rahul Sharma',
    emiNumber: 2,
    amount: 23536,
    dueDate: '2024-03-25',
    status: 'paid',
    paidDate: '2024-03-25',
    paymentMode: 'Net Banking',
  },
  {
    id: 'EMI003',
    loanId: 'LOAN001',
    customerId: 'CUST001',
    customerName: 'Rahul Sharma',
    emiNumber: 3,
    amount: 23536,
    dueDate: '2024-04-25',
    status: 'paid',
    paidDate: '2024-04-23',
    paymentMode: 'UPI',
  },
  {
    id: 'EMI004',
    loanId: 'LOAN001',
    customerId: 'CUST001',
    customerName: 'Rahul Sharma',
    emiNumber: 4,
    amount: 23536,
    dueDate: '2025-01-25',
    status: 'upcoming',
  },
];

// Sample Documents
export const documents: Document[] = [
  {
    id: 'DOC001',
    loanId: 'LOAN001',
    customerId: 'CUST001',
    type: 'disbursement_receipt',
    name: 'Disbursement_Receipt_LOAN001.pdf',
    uploadedAt: '2024-01-25',
    fileSize: '245 KB',
  },
  {
    id: 'DOC002',
    customerId: 'CUST001',
    type: 'kyc',
    name: 'Aadhaar_Card_RahulSharma.pdf',
    uploadedAt: '2024-01-15',
    fileSize: '1.2 MB',
  },
  {
    id: 'DOC003',
    customerId: 'CUST002',
    type: 'kyc',
    name: 'PAN_Card_PriyaPatel.pdf',
    uploadedAt: '2024-02-20',
    fileSize: '890 KB',
  },
  {
    id: 'DOC004',
    customerId: 'CUST002',
    type: 'income_proof',
    name: 'Salary_Slip_Feb2024.pdf',
    uploadedAt: '2024-02-25',
    fileSize: '156 KB',
  },
];

// Sample Notifications
export const notifications: Notification[] = [
  {
    id: 'NOTIF001',
    customerId: 'CUST001',
    customerName: 'Rahul Sharma',
    type: 'email',
    trigger: 'disbursement_confirmation',
    status: 'delivered',
    message: 'Your loan of ₹5,00,000 has been disbursed to your account.',
    sentAt: '2024-01-25T10:30:00',
  },
  {
    id: 'NOTIF002',
    customerId: 'CUST001',
    customerName: 'Rahul Sharma',
    type: 'sms',
    trigger: 'emi_reminder',
    status: 'delivered',
    message: 'Reminder: Your EMI of ₹23,536 is due on 25th Jan 2025.',
    sentAt: '2025-01-22T09:00:00',
  },
];

// Dashboard Stats
export const dashboardStats = {
  totalLoans: 2,
  pendingApplications: 0,
  approvedLoans: 1,
  disbursedLoans: 1,
  rejectedLoans: 0,
  totalDisbursed: 500000,
  totalEmiCollected: 70608,
  overdueEmis: 0,
  approvalRate: 100,
};

// Monthly trends data for charts
export const monthlyTrends = [
  { month: 'Oct', applications: 3, disbursements: 2, emiCollected: 45000 },
  { month: 'Nov', applications: 5, disbursements: 4, emiCollected: 68000 },
  { month: 'Dec', applications: 4, disbursements: 3, emiCollected: 52000 },
  { month: 'Jan', applications: 2, disbursements: 1, emiCollected: 70608 },
];

// Loan status distribution for pie chart
export const loanStatusDistribution = [
  { name: 'Disbursed', value: 1, color: 'hsl(174, 72%, 50%)' },
  { name: 'Approved', value: 1, color: 'hsl(142, 72%, 45%)' },
  { name: 'Pending', value: 0, color: 'hsl(38, 92%, 50%)' },
  { name: 'Rejected', value: 0, color: 'hsl(0, 72%, 51%)' },
];
