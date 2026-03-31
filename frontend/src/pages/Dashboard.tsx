"use client";
import { useState, useEffect } from "react";
import { API_BASE_URL, getMockBankTransactions, BankTransaction, BankTransactionsResponse } from "../services/api";
import { useNavigate } from "react-router-dom";
import { SmokeyBackground } from "@/components/ui/login-form";

// Profile Components (used in Security & Settings)
import { ProfileOverview } from "@/components/profile/ProfileOverview";
import { SecurityManagement } from "@/components/profile/SecurityManagement";
import { ConsentPermissions } from "@/components/profile/ConsentPermissions";
import { CommunicationPreferences } from "@/components/profile/CommunicationPreferences";
import { ActivityLog } from "@/components/profile/ActivityLog";

// Data & Types
import { mockProfileData } from "@/data/mockProfileData";
import { ProfileData } from "@/types/profile";

import {
    Home, Wallet, FileText, TrendingUp, CreditCard, FolderOpen, Shield, History,
    HelpCircle, LogOut, Menu, X, ChevronRight, AlertCircle, Calendar, IndianRupee,
    CheckCircle, Clock, ArrowUpRight, Sparkles, User, Bell,
    Activity, CheckSquare, Search, AlertTriangle, Download, Plus,
    ShieldCheck, Landmark, PenTool, Lock, RefreshCw, Loader, Loader2, Trash2, Upload
} from "lucide-react";

// Charts - Professional visualization
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, RadialBarChart, RadialBar, AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, CartesianGrid, ReferenceLine } from 'recharts';

// Section Types
type SectionKey = "home" | "loans" | "apply" | "repayments" | "notifications" | "documents" | "security" | "activity" | "support";

interface NavItem {
    key: SectionKey;
    label: string;
    icon: typeof Home;
    description: string;
}

const navItems: NavItem[] = [
    { key: "home", label: "Home", icon: Home, description: "Dashboard overview" },
    { key: "loans", label: "My Loans", icon: Wallet, description: "View your loans" },
    { key: "apply", label: "Apply for Loan", icon: FileText, description: "New loan application" },
    { key: "repayments", label: "Repayments & EMIs", icon: CreditCard, description: "Payment schedule" },
    { key: "notifications", label: "Notifications", icon: Bell, description: "View all notifications" },
    { key: "documents", label: "Documents", icon: FolderOpen, description: "Upload & manage" },
    { key: "security", label: "Security & Settings", icon: Shield, description: "Profile & security" },
    { key: "activity", label: "Activity & Audit Log", icon: History, description: "Transaction history" },
    { key: "support", label: "Support", icon: HelpCircle, description: "Get help" },
];

// Mock data for dashboard
const mockDashboardData = {
    activeLoan: {
        loanId: "LN-2024-001234",
        type: "Personal Loan",
        sanctionedAmount: 500000,
        outstandingAmount: 342500,
        nextEmiAmount: 12450,
        nextEmiDate: "2025-01-05",
        interestRate: 10.5,
        tenure: 48,
        paidEmis: 12,
    },
    creditScore: {
        score: 752,
        rating: "Good",
        lastUpdated: "2024-12-20",
        trend: "up",
        maxScore: 900,
    },
    eligibility: {
        preApprovedAmount: 800000,
        confidence: 87,
        eligibleProducts: ["Personal Loan", "Home Loan", "Vehicle Loan"],
        lastChecked: "2024-12-24",
    },
    alerts: [
        { id: 1, type: "warning", message: "EMI due in 3 days", action: "Pay Now" },
        { id: 2, type: "info", message: "New loan offer available", action: "View" },
        { id: 3, type: "success", message: "KYC verification complete", action: null },
    ],
};

export default function Dashboard() {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState<SectionKey>("home");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [securitySubSection, setSecuritySubSection] = useState<"account" | "profile" | "security" | "consent" | "communication">("account");

    // Bank-Grade Loan Advisor State
    const [loanFormData, setLoanFormData] = useState({
        gender: 'Male',
        age: '',
        employment_status: 'Employed',
        education_level: 'Bachelor',
        experience: '',
        job_tenure: '',
        monthly_income: '',
        monthly_debt_payments: '',
        loan_amount: '',
        loan_duration: 60,
        loan_purpose: 'PERSONAL',
        marital_status: 'Single',
        number_of_dependents: 0,
        home_ownership_status: 'Rent',
        property_area: 'Urban',
        coapplicant_income: '',
        coapplicant_employment: '',
        coapplicant_relationship: '',
        cibil_score: '',
        previous_loan_defaults: 'No'
    });

    interface LoanAdvisorResult {
        application_date: string;
        decision: string;
        decision_reason: string;
        approval_probability: number;
        credit_score: { min: number; max: number; rating: string; display: string };
        interest_rate: { annual: number; monthly: number };
        emi: { monthly: number; total_interest: number; total_repayment: number };
        loan_details: { amount: number; duration_months: number; duration_years: number };
        income_analysis: { monthly_income: number; annual_income: number; debt_to_income_ratio: number; emi_to_income_ratio: number };
        coapplicant: { suggested: boolean; reason: string; provided: boolean };
        explanations: Array<{ factor: string; impact: string; description: string; shap_value?: number }>;
        kyc_required: boolean;
        next_steps: string[];
        application_id?: string;  // Added for KYC workflow
        tracking_id?: string;     // Unified human-readable ID
    }

    const [advisorResult, setAdvisorResult] = useState<LoanAdvisorResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [showCoApplicant, setShowCoApplicant] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [showQrCode, setShowQrCode] = useState(false);

    // MY LOANS STATE (Real DB data)
    interface LoanApplicationItem {
        id: string;
        loan_amount: number;
        loan_purpose: string;
        decision: string;
        status: string; // Mapped from decision
        interest_rate: number;
        approval_probability: number;
        created_at: string;
        tracking_id?: string;
        kyc_status?: string; // KYC status: NOT_STARTED, IN_PROGRESS, COMPLETED, BLOCKED
    }
    const [loanApplications, setLoanApplications] = useState<LoanApplicationItem[]>([]);
    const [loanApplicationsLoading, setLoanApplicationsLoading] = useState(false);
    const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
    const [viewingApplication, setViewingApplication] = useState<LoanApplicationItem | null>(null);
    const [showApplicationModal, setShowApplicationModal] = useState(false);

    // DISBURSEMENTS STATE - Bank transfers received
    interface DisbursementItem {
        id: string;
        application_id: string;
        amount: number;
        transaction_ref: string;
        status: string;
        loan_purpose: string;
        processed_at: string;
    }
    const [disbursements, setDisbursements] = useState<DisbursementItem[]>([]);

    // REPAYMENTS STATE
    interface RepaymentItem {
        id: string;
        application_id: string;
        emi_number: number;
        due_date: string;
        emi_amount: number;
        payment_status: string;
        payment_date?: string;
        payment_amount?: number;
        payment_reference?: string;
    }
    const [repayments, setRepayments] = useState<RepaymentItem[]>([]);
    const [repaymentsLoading, setRepaymentsLoading] = useState(false);

    const fetchRepayments = async () => {
        setRepaymentsLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/repayments/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setRepayments(data);
            }
        } catch (error) {
            console.error("Failed to fetch repayments:", error);
        }
        setRepaymentsLoading(false);
    };

    const [paymentProcessing, setPaymentProcessing] = useState(false);

    const handleMakePayment = async (repayment: RepaymentItem) => {
        setPaymentProcessing(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/repayments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    application_id: repayment.application_id,
                    amount: repayment.emi_amount,
                    payment_method: 'UPI',
                    transaction_ref: `PYMT-${Date.now()}`,
                    emi_number: repayment.emi_number
                })
            });

            if (response.ok) {
                alert("Payment Successful!");
                fetchRepayments();
                fetchLoanApplications();
            } else {
                const error = await response.json();
                alert(`Payment Failed: ${error.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Payment error:", error);
            alert("Payment error occurred.");
        }
        setPaymentProcessing(false);
    };

    const fetchLoanApplications = async () => {
        setLoanApplicationsLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/loan-applications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setLoanApplications(data);
            }
        } catch (error) {
            console.error("Failed to fetch loan applications:", error);
        }
        setLoanApplicationsLoading(false);
    };

    const handleViewApplication = async (applicationId: string) => {
        const application = loanApplications.find(app => app.id === applicationId);
        if (application) {
            setViewingApplication(application);
            setShowApplicationModal(true);
        }
    };

    const handleRequestDelete = async (applicationId: string) => {
        if (!confirm('Are you sure you want to request deletion of this application?\n\nAn admin will review your request.')) {
            return;
        }
        
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/loan-applications/${applicationId}/request-delete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reason: 'User requested deletion'
                })
            });
            
            if (response.ok) {
                alert('Delete request submitted successfully!\n\nAn admin will review your request shortly.');
                fetchLoanApplications(); // Refresh the list
            } else {
                const error = await response.json();
                alert(`Failed to submit delete request: ${error.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Failed to request delete:", error);
            alert('Network error - please try again');
        }
    };

    const fetchDisbursements = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/disbursements/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setDisbursements(data);
            }
        } catch (error) {
            console.error("Failed to fetch disbursements:", error);
        }
    };

    // KYC WORKFLOW STATE
    interface KYCDocumentItem {
        id: string;
        document_type: string;
        file_name: string;
        verification_status: string;
        uploaded_at: string;
    }

    interface KYCStatus {
        application_id: string;
        loan_status: string;
        kyc_eligible: boolean;
        step_1_documents: string;
        step_1_docs_required: number;
        step_1_docs_uploaded: number;
        step_1_docs_verified: number;
        step_2_bank_details: string;
        step_3_agreement: string;
        overall_status: string;
        can_proceed_to_disbursement: boolean;
        documents: KYCDocumentItem[];
    }

    interface BankDetails {
        id: string;
        account_holder_name: string;
        bank_name: string;
        account_number_masked: string;
        ifsc_code: string;
        is_verified: boolean;
    }

    interface AdminBank {
        id: string;
        bank_name: string;
        account_holder_name: string;
        account_number: string;
        ifsc_code: string;
        branch_name?: string;
    }

    interface LoanAgreement {
        id: string;
        loan_amount: number;
        interest_rate: number;
        tenure_months: number;
        emi_amount: number;
        processing_fee: number;
        total_payable: number;
        agreement_text: string;
        consent_given: boolean;
        signed_at: string | null;
        status: string;
        agreement_version: string;
    }

    const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
    const [kycLoading, setKycLoading] = useState(false);
    const [kycStep, setKycStep] = useState(1);
    const [kycError, setKycError] = useState('');
    const [kycSuccess, setKycSuccess] = useState('');
    const [documentNumbers, setDocumentNumbers] = useState<{ [key: string]: string }>({});
    const [previousDocuments, setPreviousDocuments] = useState<any[]>([]);
    const [showPreviousDocs, setShowPreviousDocs] = useState(false);
    const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
    const [agreement, setAgreement] = useState<LoanAgreement | null>(null);
    const [bankForm, setBankForm] = useState({
        account_holder_name: '',
        bank_name: '',
        account_number: '',
        confirm_account_number: '',
        ifsc_code: '',
        account_type: 'SAVINGS'
    });
    const [agreementConsent, setAgreementConsent] = useState(false);
    const [electronicConsent, setElectronicConsent] = useState(false);
    const [signatureText, setSignatureText] = useState<string>("");
    const [signingInProgress, setSigningInProgress] = useState(false);

    interface AccountData {
        customer_id: string;
        title: string;
        first_name: string;
        middle_name?: string;
        last_name: string;
        mobile_number: string;
        email: string;
        date_of_birth?: string;
        gender?: string;
        kyc_verified: boolean;
        created_at: string;
        pan_number?: string;
        address_line1?: string;
        address_line2?: string;
        city?: string;
        state?: string;
        pincode?: string;
        role?: string;
        terms_consent?: boolean;
        privacy_consent?: boolean;
        data_consent?: boolean;
    }

    // Account & Security State (moved here to comply with Rules of Hooks)
    const [accountData, setAccountData] = useState<AccountData | null>(null);
    const [accountLoading, setAccountLoading] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current: '', new_password: '', confirm: '' });
    const [pinForm, setPinForm] = useState({ current: '', new_pin: '', confirm: '' });
    const [changeError, setChangeError] = useState('');
    const [changeSuccess, setChangeSuccess] = useState('');

    // PAYMENT GATEWAY STATE - Must be declared at top level
    const [showPaymentGateway, setShowPaymentGateway] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking' | 'wallet' | null>(null);
    const [paymentStep, setPaymentStep] = useState<'method' | 'details' | 'processing' | 'success'>('method');
    const [netBankingStep, setNetBankingStep] = useState<'select' | 'login'>('select');

    // BANK TRANSACTIONS STATE
    const [bankTransactions, setBankTransactions] = useState<BankTransactionsResponse | null>(null);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [paymentData, setPaymentData] = useState({
        cardNumber: '',
        cardName: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        upiId: '',
        bankName: '',
        bankUserId: '',
        bankPassword: '',
        walletType: ''
    });

    // Account & Security Functions (Moved to top level)
    const fetchAccountData = async () => {
        setAccountLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/user/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401) {
                handleLogout();
                return;
            }

            if (response.ok) {
                const data = await response.json();
                setAccountData(data);
                // Update profileData with real user info to fix ProfileOverview showing mock data
                setProfileData(prev => prev ? {
                    ...prev,
                    user: {
                        ...prev.user,
                        fullName: `${data.first_name || ''} ${data.last_name || ''}`.trim() || prev.user.fullName,
                        email: data.email || prev.user.email,
                        phone: data.mobile_number || prev.user.phone,
                        id: data.customer_id || prev.user.id,
                        createdAt: data.created_at || prev.user.createdAt,
                        accountStatus: data.kyc_verified ? 'kyc_verified' : 'kyc_pending',
                    }
                } : prev);
            }
        } catch (error) {
            console.error("Failed to fetch account:", error);
        }
        setAccountLoading(false);
    };

    // Fetch loans and disbursements when loans section is active
    useEffect(() => {
        if (activeSection === "loans") {
            fetchLoanApplications();
            fetchDisbursements();
        } else if (activeSection === "repayments") {
            fetchRepayments();
            fetchLoanApplications();
        }
    }, [activeSection]);

    useEffect(() => {
        if (activeSection === "security") {
            if (!accountData) fetchAccountData();
            if (securitySubSection === "security") fetchActivityData("sessions");
        }
    }, [activeSection, securitySubSection]);

    const handleChangePassword = async () => {
        setChangeError('');
        setChangeSuccess('');
        if (passwordForm.new_password !== passwordForm.confirm) {
            setChangeError('New passwords do not match');
            return;
        }
        if (passwordForm.new_password.length < 8) {
            setChangeError('Password must be at least 8 characters');
            return;
        }
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/user/password`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current_password: passwordForm.current,
                    new_password: passwordForm.new_password
                })
            });
            if (response.ok) {
                setChangeSuccess('Password changed successfully!');
                setPasswordForm({ current: '', new_password: '', confirm: '' });
            } else {
                const error = await response.json();
                setChangeError(error.detail || 'Failed to change password');
            }
        } catch (error) {
            setChangeError('Network error - please try again');
        }
    };

    const handleChangePin = async () => {
        setChangeError('');
        setChangeSuccess('');
        if (pinForm.new_pin !== pinForm.confirm) {
            setChangeError('New PINs do not match');
            return;
        }
        if (!/^\d{6}$/.test(pinForm.new_pin)) {
            setChangeError('PIN must be exactly 6 digits');
            return;
        }
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/user/pin`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current_pin: pinForm.current,
                    new_pin: pinForm.new_pin
                })
            });
            if (response.ok) {
                setChangeSuccess('PIN changed successfully!');
                setPinForm({ current: '', new_pin: '', confirm: '' });
            } else {
                const error = await response.json();
                setChangeError(error.detail || 'Failed to change PIN');
            }
        } catch (error) {
            setChangeError('Network error - please try again');
        }
    };

    // ACTIVITY LOG STATE & FUNCTIONS (Moved to top level)
    interface ActivityEvent {
        id: string;
        category?: string;
        action?: string;
        severity?: string;
        description: string;
        timestamp: string;
        device?: string;
        location?: string;
        ip_address?: string;
    }

    interface ActivityData {
        events: ActivityEvent[];
        total_events: number;
    }

    interface SessionItem {
        id: string;
        started_at: string;
        browser: string;
        os: string;
        location: string;
        device_type?: string;
        is_active: boolean;
        is_new_device?: boolean;
        last_activity?: string;
    }

    // SUPPORT TICKET INTERFACES
    interface TicketMessage {
        id: string;
        sender_type: string;
        message: string;
        created_at: string;
    }

    interface Ticket {
        id: string;
        ticket_id: string;
        subject: string;
        category: string;
        priority: string;
        status: string;
        created_at: string;
        messages?: TicketMessage[];
    }

    const [activityTab, setActivityTab] = useState<"all" | "security" | "loans" | "kyc" | "payments" | "profile" | "sessions">("all");
    const [activityData, setActivityData] = useState<ActivityData>({ events: [], total_events: 0 });
    const [activityLoading, setActivityLoading] = useState(false);
    const [sessions, setSessions] = useState<SessionItem[]>([]);

    // SUPPORT TICKET STATE
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [ticketsLoading, setTicketsLoading] = useState(false);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [ticketForm, setTicketForm] = useState({ subject: '', category: 'General', priority: 'Medium', message: '' });

    // ADMIN BANK STATE
    const [adminBanks, setAdminBanks] = useState<AdminBank[]>([]);
    const [loadingAdminBanks, setLoadingAdminBanks] = useState(false);

    // NOTIFICATIONS STATE
    interface NotificationItem {
        id: string;
        type: string;
        trigger: string;
        message: string;
        status: string;
        sent_at: string;
    }
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);

    const fetchNotifications = async () => {
        setNotificationsLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/notifications/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error("Fetch notifications error:", error);
        } finally {
            setNotificationsLoading(false);
        }
    };

    const fetchActivityData = async (category: string) => {
        setActivityLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const endpoint = category === "all" ? "/activity" :
                category === "sessions" ? "/sessions" :
                    `/activity/${category}`;
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (category === "sessions") {
                setSessions(data.sessions || []);
            } else {
                setActivityData(data);
            }
        } catch (error) {
            console.error("Failed to fetch activity:", error);
        }
        setActivityLoading(false);
    };

    useEffect(() => {
        if (activeSection === "activity") {
            fetchActivityData(activityTab);
        }
    }, [activeSection, activityTab]);

    // SUPPORT TICKET FUNCTIONS
    const fetchTickets = async () => {
        setTicketsLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/tickets`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTickets(data);
            }
        } catch (error) {
            console.error("Failed to fetch tickets:", error);
        }
        setTicketsLoading(false);
    };

    useEffect(() => {
        if (activeSection === "support") {
            fetchTickets();
        }
    }, [activeSection]);

    const handleCreateTicket = async () => {
        if (!ticketForm.subject || !ticketForm.message) return;

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/tickets`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subject: ticketForm.subject,
                    category: ticketForm.category,
                    priority: ticketForm.priority,
                    initial_message: ticketForm.message
                })
            });

            if (response.ok) {
                setShowTicketModal(false);
                setTicketForm({ subject: '', category: 'General', priority: 'Medium', message: '' });
                fetchTickets();
            }
        } catch (error) {
            console.error("Failed to create ticket:", error);
        }
    };

    // KYC API Functions
    const fetchKycStatus = async (appId: string) => {
        setKycLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/kyc/${appId}/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setKycStatus(data);
                setKycError(''); // Clear any previous errors
                // Set current step based on status
                if (data.step_3_agreement === 'COMPLETED') setKycStep(4);
                else if (data.step_2_bank_details === 'COMPLETED') setKycStep(3);
                else if (data.step_1_docs_uploaded >= 2) setKycStep(2);
                else setKycStep(1);
            } else if (response.status === 403 || response.status === 404) {
                const error = await response.json().catch(() => ({ detail: 'Loan application not found or not eligible for KYC' }));
                setKycStatus(null); // Not eligible
                setKycError(error.detail || 'This loan application is not eligible for KYC. Please ensure you have an approved loan application.');
                setAdvisorResult(null); // Reset to start fresh
            }
        } catch (error) {
            console.error("KYC fetch error:", error);
            setKycError('Unable to fetch KYC status. Please try creating a new loan application.');
            setKycStatus(null);
            setAdvisorResult(null);
        }
        setKycLoading(false);
    };

    const uploadDocument = async (appId: string, docType: string, docCategory: string) => {
        setKycError('');
        setKycSuccess('');
        
        console.log('Upload started:', { appId, docType, docCategory });
        
        // Get the file from input
        const input = document.getElementById(`file-upload-${docCategory}`) as HTMLInputElement;
        if (!input || !input.files || input.files.length === 0) {
            setKycError('Please select a file to upload');
            console.error('No file selected');
            return;
        }
        
        const file = input.files[0];
        console.log('File selected:', file.name, file.type, file.size);
        
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setKycError('File size must be less than 5MB');
            return;
        }
        
        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            setKycError('File must be PDF, JPG, or PNG');
            return;
        }
        
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setKycError('You must be logged in to upload documents');
                return;
            }
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('document_type', docType);
            formData.append('document_category', docCategory);
            
            console.log('Sending upload request to:', `${API_BASE_URL}/kyc/${appId}/documents`);
            
            const response = await fetch(
                `${API_BASE_URL}/kyc/${appId}/documents`,
                {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                }
            );
            
            console.log('Upload response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Upload success:', result);
                setKycSuccess(`${docCategory} document uploaded successfully! (${result.total_uploaded}/4 documents)`);
                fetchKycStatus(appId);
                // Clear the file input
                input.value = '';
            } else {
                const error = await response.json();
                console.error('Upload error:', error);
                setKycError(error.detail || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload exception:', error);
            setKycError('Network error uploading document');
        }
    };

    const deleteDocument = async (appId: string, documentId: string) => {
        if (!confirm('Are you sure you want to delete this document?')) {
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `${API_BASE_URL}/kyc/${appId}/documents/${documentId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.ok) {
                setKycSuccess('Document deleted successfully');
                fetchKycStatus(appId);
            } else {
                const error = await response.json();
                setKycError(error.detail || 'Failed to delete document');
            }
        } catch (error) {
            setKycError('Network error deleting document');
        }
    };

    const fetchPreviousDocuments = async (excludeApplicationId?: string) => {
        try {
            const token = localStorage.getItem('access_token');
            const url = excludeApplicationId 
                ? `${API_BASE_URL}/kyc/user-verified-documents?exclude_application_id=${excludeApplicationId}`
                : `${API_BASE_URL}/kyc/user-verified-documents`;
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setPreviousDocuments(data.reusable_documents || []);
                return data.reusable_documents || [];
            }
        } catch (error) {
            console.error('Error fetching previous documents:', error);
        }
        return [];
    };

    const linkPreviousDocument = async (appId: string, sourceDocumentId: string) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `${API_BASE_URL}/kyc/${appId}/link-previous-document`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ source_document_id: sourceDocumentId })
                }
            );

            if (response.ok) {
                const result = await response.json();
                setKycSuccess(`${result.document_type} linked successfully! (${result.total_uploaded}/4 documents)`);
                fetchKycStatus(appId);
                setShowPreviousDocs(false);
            } else {
                const error = await response.json();
                setKycError(error.detail || 'Failed to link document');
            }
        } catch (error) {
            setKycError('Network error linking document');
        }
    };

    const submitBankDetails = async (appId: string) => {
        setKycError('');
        if (bankForm.account_number !== bankForm.confirm_account_number) {
            setKycError('Account numbers do not match');
            return;
        }
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/kyc/${appId}/bank-details`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bankForm)
            });
            if (response.ok) {
                setKycSuccess('Bank details submitted successfully!');
                fetchKycStatus(appId);
                setKycStep(3);
            } else {
                const error = await response.json();
                setKycError(error.detail || 'Submission failed');
            }
        } catch (error) {
            setKycError('Network error submitting bank details');
        }
    };

    const fetchAgreement = async (appId: string) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/kyc/${appId}/agreement`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAgreement(data.agreement);
            }
        } catch (error) {
            console.error("Agreement fetch error:", error);
        }
    };

    const signAgreement = async (appId: string) => {
        setKycError('');
        if (!agreementConsent) {
            setKycError('You must accept the terms to proceed');
            return;
        }
        if (!signatureText.trim() || signatureText.length < 3) {
            setKycError('Please enter your full name as digital signature');
            return;
        }
        
        setSigningInProgress(true);
        
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/kyc/${appId}/agreement/sign`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    consent_checkbox: true,
                    consent_text_acknowledged: `I, ${signatureText}, have read and agree to all terms and conditions of this loan agreement. Signed on ${new Date().toLocaleString()}.`,
                    digital_signature: signatureText,
                    signature_timestamp: new Date().toISOString()
                })
            });
            if (response.ok) {
                setKycSuccess('✓ Agreement signed and authenticated successfully!');
                setSignatureText('');
                setAgreementConsent(false);
                fetchKycStatus(appId);
                setKycStep(4);
                
                // Show success animation
                setTimeout(() => {
                    setKycSuccess('');
                }, 5000);
            } else {
                const error = await response.json();
                setKycError(error.detail || 'Signing failed');
            }
        } catch (error) {
            setKycError('Network error signing agreement');
        } finally {
            setSigningInProgress(false);
        }
    };

    const fetchAdminBanks = async () => {
        setLoadingAdminBanks(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/admin/bank-details`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAdminBanks(data);
            }
        } catch (error) {
            console.error("Fetch admin banks error:", error);
        } finally {
            setLoadingAdminBanks(false);
        }
    };

    const completeKyc = async (appId: string) => {
        setKycError('');
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/kyc/${appId}/complete`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setKycSuccess('🎉 KYC completed! Disbursement will be processed within 24-48 hours.');
                fetchKycStatus(appId);
            } else {
                const error = await response.json();
                setKycError(error.detail || 'Completion failed');
            }
        } catch (error) {
            setKycError('Network error completing KYC');
        }
    };

    // Authentication Guard
    useEffect(() => {
        const userId = localStorage.getItem("user_id") || sessionStorage.getItem("user_id");
        // Also check if we have a customer ID (semantic ID)
        const customerId = localStorage.getItem("customer_id") || sessionStorage.getItem("customer_id");

        if (!userId && !customerId) {
            setIsAuthenticated(false);
            navigate("/login", { replace: true });
        } else {
            setIsAuthenticated(true);
            const storedName = localStorage.getItem("first_name") || sessionStorage.getItem("first_name");
            const enhancedData = {
                ...mockProfileData,
                user: {
                    ...mockProfileData.user,
                    // Prioritize customer_id (LA...) over user_id (UUID) for display
                    id: customerId || userId || mockProfileData.user.id,
                    fullName: storedName ? `${storedName} (Customer)` : mockProfileData.user.fullName,
                }
            };
            setProfileData(enhancedData);
        }
    }, [navigate]);

    // Handle responsive sidebar
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth < 1024) setSidebarOpen(false);
            else setSidebarOpen(true);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Fetch account data on initial load to populate ProfileOverview with real data
    useEffect(() => {
        if (isAuthenticated && !accountData) {
            fetchAccountData();
            fetchNotifications();
        }
    }, [isAuthenticated]);

    // Auto-fetch KYC status when entering KYC section (via 'apply' section with selectedApplicationId)
    useEffect(() => {
        const appId = selectedApplicationId || advisorResult?.application_id;
        if (activeSection === 'apply' && appId && !kycStatus && !kycLoading) {
            console.log('Auto-fetching KYC status for:', appId);
            fetchKycStatus(appId);
        }
    }, [activeSection, selectedApplicationId, advisorResult?.application_id]);

    const handleLogout = () => {
        localStorage.removeItem("user_id");
        localStorage.removeItem("customer_id");
        localStorage.removeItem("first_name");
        sessionStorage.removeItem("user_id");
        sessionStorage.removeItem("customer_id");
        sessionStorage.removeItem("first_name");
        navigate("/login", { replace: true });
    };

    const handleSectionChange = (key: SectionKey) => {
        setActiveSection(key);
        if (key === 'home') {
            fetchNotifications();
        }
        if (key === 'loans') {
            fetchLoanApplications();
            fetchDisbursements();
            fetchAdminBanks();
        }
        if (key === 'repayments') {
            fetchRepayments();
            fetchLoanApplications(); // Need loan details for EMI amounts
        }
        if (isMobile) setSidebarOpen(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    // Loading state
    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-lg">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated || !profileData) {
        return null;
    }

    // =========== SECTION RENDERERS ===========

    // HOME SECTION - Main Dashboard
    const renderHomeSection = () => (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="p-6 bg-gradient-to-r from-teal-500/20 to-blue-500/20 rounded-2xl border border-teal-500/30">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Welcome back, {profileData.user.fullName.split(' ')[0]}!</h2>
                        <p className="text-gray-300 mt-1">Here's your financial overview</p>
                    </div>
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-teal-500/20 rounded-full">
                        <CheckCircle className="w-4 h-4 text-teal-400" />
                        <span className="text-teal-400 text-sm font-medium">Account Active</span>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Loan Summary */}
                <div className="p-6 bg-gray-800 rounded-2xl border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-teal-400" />
                            Active Loan
                        </h3>
                        <span className="text-xs text-gray-400">{mockDashboardData.activeLoan.loanId}</span>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Sanctioned Amount</span>
                            <span className="text-white font-semibold">{formatCurrency(mockDashboardData.activeLoan.sanctionedAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Outstanding</span>
                            <span className="text-yellow-400 font-semibold">{formatCurrency(mockDashboardData.activeLoan.outstandingAmount)}</span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full"
                                style={{ width: `${((mockDashboardData.activeLoan.sanctionedAmount - mockDashboardData.activeLoan.outstandingAmount) / mockDashboardData.activeLoan.sanctionedAmount) * 100}%` }}
                            />
                        </div>
                        <div className="pt-2 border-t border-white/10">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-gray-400 text-sm">Next EMI</p>
                                    <p className="text-white font-bold text-lg">{formatCurrency(mockDashboardData.activeLoan.nextEmiAmount)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-400 text-sm">Due Date</p>
                                    <p className="text-teal-400 font-medium flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(mockDashboardData.activeLoan.nextEmiDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Credit Score Snapshot */}
                <div className="p-6 bg-gray-800 rounded-2xl border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-teal-400" />
                            Credit Score
                        </h3>
                        <span className="text-xs text-gray-400">Updated {mockDashboardData.creditScore.lastUpdated}</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative w-28 h-28">
                            <svg className="w-28 h-28 transform -rotate-90">
                                <circle cx="56" cy="56" r="48" stroke="#374151" strokeWidth="8" fill="none" />
                                <circle
                                    cx="56" cy="56" r="48"
                                    stroke="url(#scoreGradient)"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(mockDashboardData.creditScore.score / mockDashboardData.creditScore.maxScore) * 301} 301`}
                                />
                                <defs>
                                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#14b8a6" />
                                        <stop offset="100%" stopColor="#22d3ee" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-white">{mockDashboardData.creditScore.score}</span>
                                <span className="text-xs text-gray-400">/ {mockDashboardData.creditScore.maxScore}</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${mockDashboardData.creditScore.rating === 'Good'
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                    {mockDashboardData.creditScore.rating}
                                </span>
                                {mockDashboardData.creditScore.trend === 'up' && (
                                    <ArrowUpRight className="w-4 h-4 text-green-400" />
                                )}
                            </div>
                            <p className="text-gray-400 text-sm">Your credit score is in good standing. Keep maintaining timely payments.</p>
                        </div>
                    </div>
                </div>

                {/* ML Eligibility Status */}
                <div className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-purple-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            AI Loan Eligibility
                        </h3>
                        <span className="px-2 py-1 bg-purple-500/20 rounded text-purple-400 text-xs">ML Powered</span>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Pre-Approved Amount</p>
                            <p className="text-3xl font-bold text-white">{formatCurrency(mockDashboardData.eligibility.preApprovedAmount)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                                    style={{ width: `${mockDashboardData.eligibility.confidence}%` }}
                                />
                            </div>
                            <span className="text-purple-400 font-medium">{mockDashboardData.eligibility.confidence}%</span>
                        </div>
                        <p className="text-gray-400 text-sm">Confidence score based on your financial profile</p>
                        <button
                            onClick={() => setActiveSection("apply")}
                            className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2"
                        >
                            Apply Now <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Alerts Panel */}
                <div className="p-6 bg-gray-800 rounded-2xl border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Bell className="w-5 h-5 text-teal-400" />
                            Alerts & Notifications
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {mockDashboardData.alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`p-4 rounded-xl border flex items-center justify-between ${alert.type === 'warning'
                                    ? 'bg-yellow-500/10 border-yellow-500/30'
                                    : alert.type === 'success'
                                        ? 'bg-green-500/10 border-green-500/30'
                                        : 'bg-blue-500/10 border-blue-500/30'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {alert.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-400" />}
                                    {alert.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
                                    {alert.type === 'info' && <Clock className="w-5 h-5 text-blue-400" />}
                                    <span className="text-white text-sm">{alert.message}</span>
                                </div>
                                {alert.action && (
                                    <button className="text-teal-400 text-sm font-medium hover:text-teal-300 transition">
                                        {alert.action}
                                    </button>
                                )}
                            </div>
                        ))}
                        {/* Real Notifications from Admin */}
                        {notifications.slice(0, 3).map((notif) => (
                            <div
                                key={notif.id}
                                className={`p-4 rounded-xl border flex items-center justify-between ${notif.trigger.includes('overdue') ? 'bg-red-500/10 border-red-500/30' :
                                    notif.trigger.includes('due') ? 'bg-yellow-500/10 border-yellow-500/30' :
                                        notif.trigger.includes('disburs') ? 'bg-green-500/10 border-green-500/30' :
                                            'bg-blue-500/10 border-blue-500/30'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {notif.trigger.includes('overdue') && <AlertCircle className="w-5 h-5 text-red-400" />}
                                    {notif.trigger.includes('due') && !notif.trigger.includes('overdue') && <Clock className="w-5 h-5 text-yellow-400" />}
                                    {notif.trigger.includes('disburs') && <CheckCircle className="w-5 h-5 text-green-400" />}
                                    {!notif.trigger.includes('due') && !notif.trigger.includes('disburs') && <Bell className="w-5 h-5 text-blue-400" />}
                                    <div>
                                        <span className="text-white text-sm">{notif.message}</span>
                                        <p className="text-xs text-gray-500">{new Date(notif.sent_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    // MY LOANS SECTION
    const renderLoansSection = () => {
        // Trigger fetch when this section is rendered (via useEffect in parent)
        if (loanApplications.length === 0 && !loanApplicationsLoading) {
            fetchLoanApplications();
        }

        return (
            <div className="space-y-6">
                <div className="p-6 bg-gray-800 rounded-2xl border border-gray-700">
                    <h3 className="text-xl font-semibold text-white mb-6">My Loan Applications</h3>
                    {loanApplicationsLoading ? (
                        <p className="text-gray-400">Loading your loan applications...</p>
                    ) : loanApplications.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400 mb-4">No loan applications found.</p>
                            <button
                                onClick={() => setActiveSection('apply')}
                                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg text-white font-medium transition"
                            >
                                Apply for a Loan
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-center py-3 px-4 text-gray-400 font-medium">Application ID</th>
                                        <th className="text-center py-3 px-4 text-gray-400 font-medium">Purpose</th>
                                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Amount</th>
                                        <th className="text-center py-3 px-4 text-gray-400 font-medium">Approval %</th>
                                        <th className="text-center py-3 px-4 text-gray-400 font-medium">Decision</th>
                                        <th className="text-center py-3 px-4 text-gray-400 font-medium">KYC Status</th>
                                        <th className="text-center py-3 px-4 text-gray-400 font-medium">Applied On</th>
                                        <th className="text-center py-3 px-4 text-gray-400 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loanApplications.map((app) => (
                                        <tr key={app.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                            <td className="py-4 px-4 text-white font-mono text-sm text-center">{app.tracking_id || app.id.slice(0, 8)}</td>
                                            <td className="py-4 px-4 text-white text-center">{app.loan_purpose}</td>
                                            <td className="py-4 px-4 text-white text-right">{formatCurrency(app.loan_amount)}</td>
                                            <td className="py-4 px-4 text-teal-400 text-center">{app.approval_probability.toFixed(1)}%</td>
                                            <td className="py-4 px-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-sm ${app.decision === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                                                    app.decision === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                    {app.decision}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                {app.decision === 'APPROVED' ? (
                                                    <span className={`px-3 py-1 rounded-full text-xs inline-block ${
                                                        app.kyc_status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                                                        app.kyc_status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
                                                        app.kyc_status === 'BLOCKED' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                        {app.kyc_status === 'COMPLETED' ? 'Completed' :
                                                         app.kyc_status === 'IN_PROGRESS' ? 'In Progress' :
                                                         app.kyc_status === 'BLOCKED' ? 'Blocked' : 'Pending'}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500 text-xs">N/A</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-gray-400 text-sm text-center">{new Date(app.created_at).toLocaleDateString()}</td>
                                            <td className="py-4 px-4 text-center">
                                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                                    {app.decision === 'APPROVED' && app.kyc_status !== 'COMPLETED' && (
                                                        <button
                                                            onClick={() => {
                                                                console.log('Complete KYC clicked for:', app.id);
                                                                setSelectedApplicationId(app.id);
                                                                setActiveSection('apply');
                                                            }}
                                                            className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 rounded-lg text-sm font-medium transition whitespace-nowrap"
                                                        >
                                                            Complete KYC
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleViewApplication(app.id)}
                                                        className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition whitespace-nowrap"
                                                    >
                                                        View
                                                    </button>
                                                    {app.decision !== 'DISBURSED' && (
                                                        <button
                                                            onClick={() => handleRequestDelete(app.id)}
                                                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition whitespace-nowrap"
                                                        >
                                                            Delete Request
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Bank Transactions - Received Payments */}
                <div className="p-6 bg-gradient-to-br from-green-900/30 to-teal-900/30 rounded-2xl border border-green-500/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <IndianRupee className="w-6 h-6 text-green-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">Bank Transactions - Amount Received</h3>
                    </div>

                    {disbursements.length === 0 ? (
                        <div className="text-center py-8">
                            <CreditCard className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                            <p className="text-gray-400">No bank transactions yet.</p>
                            <p className="text-gray-500 text-sm mt-2">Once your loan is approved and disbursed, the transaction details will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {disbursements.map((disbursement) => (
                                <div key={disbursement.id} className="p-4 bg-gray-800/50 rounded-xl border border-green-500/20 hover:border-green-500/40 transition">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-500/20 rounded-lg">
                                                <CheckCircle className="w-5 h-5 text-green-400" />
                                            </div>
                                            <div>
                                                <p className="text-white font-semibold">Amount Credited</p>
                                                <p className="text-gray-400 text-sm">{disbursement.loan_purpose}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-green-400">+{formatCurrency(disbursement.amount)}</p>
                                            <span className={`px-2 py-1 rounded-full text-xs ${disbursement.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                                                disbursement.status === 'PROCESSING' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                {disbursement.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-white/10">
                                        <div>
                                            <p className="text-gray-500 text-xs">Transaction Ref</p>
                                            <p className="text-white font-mono text-sm">{disbursement.transaction_ref || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">Application ID</p>
                                            <p className="text-white font-mono text-sm">{disbursement.application_id.slice(0, 8)}...</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">Received On</p>
                                            <p className="text-white text-sm">{disbursement.processed_at ? new Date(disbursement.processed_at).toLocaleDateString() : 'Pending'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Loan form handlers
    const handleLoanFormChange = (field: string, value: string | number) => {
        // Validation for non-negative numbers
        const numericFields = [
            'age', 'experience', 'job_tenure', 'monthly_income',
            'monthly_debt_payments', 'loan_amount', 'number_of_dependents',
            'coapplicant_income', 'cibil_score'
        ];

        if (numericFields.includes(field)) {
            // Strictly block negative signs
            if (value.toString().includes('-')) {
                return;
            }
            const numValue = Number(value);
            // Allow empty string to let user delete content, but reject negatives
            if (value !== '' && (!isNaN(numValue) && numValue < 0)) {
                return;
            }
        }
        setLoanFormData(prev => ({ ...prev, [field]: value }));
        setFormError('');
    };

    const handleLoanSubmit = async () => {
        // Validate required fields
        if (!loanFormData.age || parseInt(loanFormData.age) < 18) {
            setFormError('Please enter a valid age (18+)');
            return;
        }
        if (!loanFormData.monthly_income || parseFloat(loanFormData.monthly_income) <= 0) {
            setFormError('Please enter your monthly income');
            return;
        }
        if (!loanFormData.loan_amount || parseFloat(loanFormData.loan_amount) <= 0) {
            setFormError('Please enter the loan amount');
            return;
        }
        if (!loanFormData.cibil_score) {
            setFormError('Please enter your CIBIL score');
            return;
        }
        const cibilScore = parseInt(loanFormData.cibil_score);
        if (isNaN(cibilScore) || cibilScore < 300 || cibilScore > 900) {
            setFormError('CIBIL score must be between 300 and 900');
            return;
        }

        setIsSubmitting(true);
        setFormError('');
        setAdvisorResult(null);
        setKycStatus(null);

        try {
            const token = localStorage.getItem('access_token');

            // Call /loan-application which saves to database and returns application_id
            const response = await fetch(`${API_BASE_URL}/loan-application`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    gender: loanFormData.gender,
                    age: parseInt(loanFormData.age),
                    employment_status: loanFormData.employment_status,
                    education_level: loanFormData.education_level,
                    experience: parseInt(loanFormData.experience) || 0,
                    job_tenure: parseInt(loanFormData.job_tenure) || 0,
                    monthly_income: parseFloat(loanFormData.monthly_income),
                    monthly_debt_payments: parseFloat(loanFormData.monthly_debt_payments) || 0,
                    loan_amount: parseFloat(loanFormData.loan_amount),
                    loan_duration: loanFormData.loan_duration,
                    loan_purpose: loanFormData.loan_purpose,
                    marital_status: loanFormData.marital_status,
                    number_of_dependents: loanFormData.number_of_dependents,
                    home_ownership_status: loanFormData.home_ownership_status,
                    property_area: loanFormData.property_area,
                    coapplicant_income: parseFloat(loanFormData.coapplicant_income) || 0,
                    coapplicant_employment: loanFormData.coapplicant_employment || null,
                    coapplicant_relationship: loanFormData.coapplicant_relationship || null,
                    cibil_score: loanFormData.cibil_score ? parseInt(loanFormData.cibil_score) : null,
                    previous_loan_defaults: loanFormData.previous_loan_defaults
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Session expired. Please log in again.');
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Loan analysis failed');
            }
            const result = await response.json();

            // Transform response to match LoanAdvisorResult interface
            setAdvisorResult({
                application_date: result.created_at,
                application_id: result.id,  // Store the application ID for KYC
                tracking_id: result.tracking_id, // Store tracking ID
                decision: result.decision,
                decision_reason: result.decision_reason,
                approval_probability: result.approval_probability,
                credit_score: {
                    min: 0, max: 0,
                    rating: result.credit_rating,
                    display: result.credit_score_band
                },
                interest_rate: {
                    annual: result.interest_rate,
                    monthly: result.interest_rate / 12
                },
                emi: {
                    monthly: result.emi,
                    total_interest: result.total_interest,
                    total_repayment: result.total_repayment
                },
                loan_details: {
                    amount: parseFloat(loanFormData.loan_amount),
                    duration_months: loanFormData.loan_duration,
                    duration_years: loanFormData.loan_duration / 12
                },
                income_analysis: {
                    monthly_income: parseFloat(loanFormData.monthly_income),
                    annual_income: parseFloat(loanFormData.monthly_income) * 12,
                    debt_to_income_ratio: (parseFloat(loanFormData.monthly_debt_payments) || 0) / parseFloat(loanFormData.monthly_income) * 100,
                    emi_to_income_ratio: result.emi / parseFloat(loanFormData.monthly_income) * 100
                },
                coapplicant: {
                    suggested: false,
                    reason: '',
                    provided: parseFloat(loanFormData.coapplicant_income) > 0
                },
                explanations: result.shap_summary || [],
                kyc_required: result.kyc_required,
                next_steps: result.next_steps || []
            });

            // Show co-applicant section if suggested
            if (result.coapplicant?.suggested && !result.coapplicant?.provided) {
                setShowCoApplicant(true);
            }
        } catch (error) {
            setFormError(error.message || 'Unable to analyze loan. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Download Report Handler
    const handleDownloadReport = async (appId: string) => {
        if (!appId) return;
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/loan-application/${appId}/report`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Loan_Report_${appId.slice(-6)}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                console.error("Failed to download report");
                alert("Could not generate report. Please try again.");
            }
        } catch (error) {
            console.error("Error downloading report:", error);
            alert("Error downloading report.");
        }
    };

    // Generate QR Code Handler
    const handleGenerateQRCode = async (appId: string) => {
        if (!appId) return;
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/loan-application/${appId}/report-qr`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                setQrCodeUrl(url);
                setShowQrCode(true);
            } else {
                console.error("Failed to generate QR code");
                alert("Could not generate QR code. Please try again.");
            }
        } catch (error) {
            console.error("Error generating QR code:", error);
            alert("Error generating QR code.");
        }
    };


    // APPLY FOR LOAN SECTION - Bank-Grade AI Loan Advisor

    const renderApplySection = () => {
        // KYC PAGE TRANSITION: If navigating to KYC from loan applications list
        if (selectedApplicationId && activeSection === 'apply') {
            return renderKYCSection(selectedApplicationId);
        }
        
        // KYC PAGE TRANSITION: If KYC is started from advisor, show ONLY the KYC section (Next Page)
        if (advisorResult?.decision === 'APPROVED' && advisorResult?.application_id && kycStatus) {
            return renderKYCSection(advisorResult.application_id);
        }

        // If we have results, show ONLY the results page
        if (advisorResult) {
            return (
                <div className="space-y-6">
                    {/* Back Button */}
                    <button
                        onClick={() => setAdvisorResult(null)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Back to Application Form
                    </button>

                    {/* Page Title */}
                    <div className="text-center mb-6">
                        <h2 className="text-3xl font-bold text-white mb-2">Loan Analysis Results</h2>
                        <p className="text-gray-400">Application Reference: {advisorResult.tracking_id || advisorResult.application_id?.slice(0, 8)}</p>
                    </div>

                    {/* Decision Banner - Large and Prominent */}
                    <div className={`p-8 rounded-2xl border-2 ${advisorResult.decision === 'APPROVED'
                        ? 'bg-gray-900 border-green-500'
                        : advisorResult.decision === 'REJECTED'
                            ? 'bg-gray-900 border-red-500'
                            : 'bg-gray-900 border-yellow-500'
                        }`}>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                {advisorResult.decision === 'APPROVED' && <CheckCircle className="w-16 h-16 text-green-400" />}
                                {advisorResult.decision === 'REJECTED' && <AlertCircle className="w-16 h-16 text-red-400" />}
                                {advisorResult.decision === 'PENDING_REVIEW' && <Clock className="w-16 h-16 text-yellow-400" />}
                                <div>
                                    <h3 className={`text-3xl font-bold ${advisorResult.decision === 'APPROVED' ? 'text-green-400'
                                        : advisorResult.decision === 'REJECTED' ? 'text-red-400' : 'text-yellow-400'
                                        }`}>
                                        {advisorResult.decision.replace('_', ' ')}
                                    </h3>
                                    <p className="text-gray-300 text-lg mt-1">{advisorResult.decision_reason}</p>
                                </div>
                            </div>
                            <div className="text-center md:text-right bg-gray-800 rounded-2xl p-6">
                                <div className="text-5xl font-bold text-white">{advisorResult.approval_probability.toFixed(1)}%</div>
                                <div className="text-gray-400">Approval Score</div>
                            </div>
                        </div>
                    </div>

                    {/* KYC STATUS SUMMARY PANEL - REMOVED BY USER REQUEST */}

                    {/* Financial Summary Grid - Large Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-6 bg-gray-900 border-2 border-teal-500 rounded-2xl text-center">
                            <TrendingUp className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                            <p className="text-gray-400 text-sm">Credit Score</p>
                            <p className="text-3xl font-bold text-teal-400">{advisorResult.credit_score.display}</p>
                            <p className="text-teal-300 text-sm">{advisorResult.credit_score.rating}</p>
                        </div>
                        <div className="p-6 bg-gray-900 border-2 border-purple-500 rounded-2xl text-center">
                            <CreditCard className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                            <p className="text-gray-400 text-sm">Interest Rate</p>
                            <p className="text-3xl font-bold text-purple-400">{advisorResult.interest_rate.annual}%</p>
                            <p className="text-purple-300 text-sm">per annum</p>
                        </div>
                        <div className="p-6 bg-gray-900 border-2 border-blue-500 rounded-2xl text-center">
                            <IndianRupee className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                            <p className="text-gray-400 text-sm">Monthly EMI</p>
                            <p className="text-3xl font-bold text-blue-400">{formatCurrency(advisorResult.emi.monthly)}</p>
                            <p className="text-blue-300 text-sm">{advisorResult.income_analysis.emi_to_income_ratio.toFixed(1)}% of income</p>
                        </div>
                        <div className="p-6 bg-gray-900 border-2 border-orange-500 rounded-2xl text-center">
                            <Wallet className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                            <p className="text-gray-400 text-sm">Total Repayment</p>
                            <p className="text-3xl font-bold text-orange-400">{formatCurrency(advisorResult.emi.total_repayment)}</p>
                            <p className="text-orange-300 text-sm">Interest: {formatCurrency(advisorResult.emi.total_interest)}</p>
                        </div>
                    </div>


                    {/* Loan & Income Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-gray-900 rounded-2xl border-2 border-gray-700">
                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-teal-400" />
                                Loan Details
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Loan Amount</span>
                                    <span className="text-white font-semibold">{formatCurrency(advisorResult.loan_details.amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Duration</span>
                                    <span className="text-white font-semibold">{advisorResult.loan_details.duration_years} years ({advisorResult.loan_details.duration_months} months)</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-900 rounded-2xl border-2 border-gray-700">
                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <IndianRupee className="w-5 h-5 text-teal-400" />
                                Income Analysis
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Monthly Income</span>
                                    <span className="text-white font-semibold">{formatCurrency(advisorResult.income_analysis.monthly_income)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Annual Income</span>
                                    <span className="text-white font-semibold">{formatCurrency(advisorResult.income_analysis.annual_income)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">EMI-to-Income (FOIR)</span>
                                    <span className="text-white font-semibold">{advisorResult.income_analysis.emi_to_income_ratio.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-0">
                                    <span>Existing DTI: {advisorResult.income_analysis.debt_to_income_ratio}%</span>
                                    <span>Limit: 50%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SHAP Explanations with Professional Charts */}
                    <div className="p-6 bg-gray-900 rounded-2xl border-2 border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            Decision Factors (AI Explanation)
                        </h4>

                        {/* Professional ML Visualizations - Best Practices */}
                        <div className="space-y-6 mb-6">

                            {/* Key Risk Metrics - Quick Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-4 border border-purple-500/30">
                                    <p className="text-purple-300 text-xs font-medium mb-1">ML Confidence</p>
                                    <p className="text-2xl font-bold text-white">{advisorResult.approval_probability.toFixed(1)}%</p>
                                    <p className="text-xs text-purple-400 mt-1">{advisorResult.decision}</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-xl p-4 border border-blue-500/30">
                                    <p className="text-blue-300 text-xs font-medium mb-1">Credit Rating</p>
                                    <p className="text-2xl font-bold text-white">{advisorResult.credit_score.rating}</p>
                                    <p className="text-xs text-blue-400 mt-1">{advisorResult.credit_score.display}</p>
                                </div>
                                <div className="bg-gradient-to-br from-amber-900/50 to-amber-800/30 rounded-xl p-4 border border-amber-500/30">
                                    <p className="text-amber-300 text-xs font-medium mb-1">EMI to Income</p>
                                    <p className="text-2xl font-bold text-white">{advisorResult.income_analysis.emi_to_income_ratio.toFixed(1)}%</p>
                                    <p className="text-xs text-amber-400 mt-1">{advisorResult.income_analysis.emi_to_income_ratio < 40 ? 'Healthy' : advisorResult.income_analysis.emi_to_income_ratio < 50 ? 'Borderline' : 'High Risk'}</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-xl p-4 border border-green-500/30">
                                    <p className="text-green-300 text-xs font-medium mb-1">Interest Rate</p>
                                    <p className="text-2xl font-bold text-white">{advisorResult.interest_rate.annual.toFixed(2)}%</p>
                                    <p className="text-xs text-green-400 mt-1">p.a.</p>
                                </div>
                            </div>

                            {/* Row 1: SHAP Vertical Bar + Approval Pie */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                {/* Chart 1: SHAP Feature Importance - PREMIUM HORIZONTAL BARS */}
                                <div className="bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700/50 shadow-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                                            <span className="text-white text-sm">📊</span>
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-semibold">Feature Impact Analysis</p>
                                            <p className="text-gray-500 text-xs">SHAP values showing each factor's contribution</p>
                                        </div>
                                    </div>

                                    {/* Custom horizontal bars - normalized to add up to 100% */}
                                    <div className="space-y-3 mt-4">
                                        {(() => {
                                            const factors = advisorResult.explanations.slice(0, 5);
                                            const totalImpact = factors.reduce((sum: number, f) =>
                                                sum + Math.abs(f.shap_value || 0.15) * 100, 0);

                                            return factors.map((f, idx: number) => {
                                                const impactValue = Math.abs(f.shap_value || 0.15) * 100;
                                                const normalizedPercent = (impactValue / totalImpact) * 100;
                                                return (
                                                    <div key={idx} className="group">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${f.impact === 'positive' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                    {f.impact === 'positive' ? '↑' : '↓'}
                                                                </span>
                                                                <span className="text-gray-300 text-sm font-medium">{f.factor}</span>
                                                            </div>
                                                            <span className={`text-sm font-bold ${f.impact === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
                                                                {normalizedPercent.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 group-hover:opacity-80 ${f.impact === 'positive'
                                                                    ? 'bg-gradient-to-r from-green-600 to-emerald-400'
                                                                    : 'bg-gradient-to-r from-red-600 to-rose-400'
                                                                    }`}
                                                                style={{ width: `${normalizedPercent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>

                                    {/* Legend */}
                                    <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-gray-700/50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-600 to-emerald-400"></div>
                                            <span className="text-gray-400 text-xs">Increases Approval</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-600 to-rose-400"></div>
                                            <span className="text-gray-400 text-xs">Decreases Approval</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Chart 2: ML Approval Score - PIE CHART */}
                                <div className="bg-gray-800 rounded-xl p-4">
                                    <p className="text-gray-400 text-sm mb-1 font-medium">⭐ ML Approval Score</p>
                                    <p className="text-gray-500 text-xs mb-3">XGBoost model prediction confidence</p>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Approval Score', value: advisorResult.approval_probability, fill: advisorResult.approval_probability >= 60 ? '#22C55E' : advisorResult.approval_probability >= 35 ? '#F59E0B' : '#EF4444' },
                                                    { name: 'Remaining', value: 100 - advisorResult.approval_probability, fill: '#374151' }
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                startAngle={90}
                                                endAngle={-270}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                            </Pie>
                                            <text x="50%" y="45%" textAnchor="middle" fill="#fff" fontSize="36" fontWeight="bold">
                                                {advisorResult.approval_probability.toFixed(1)}%
                                            </text>
                                            <text x="50%" y="58%" textAnchor="middle" fill={advisorResult.approval_probability >= 60 ? '#22C55E' : advisorResult.approval_probability >= 35 ? '#F59E0B' : '#EF4444'} fontSize="16" fontWeight="600">
                                                {advisorResult.decision}
                                            </text>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                                formatter={(value: number, name: string) => name === 'Remaining' ? null : [`${value}%`, 'ML Confidence']}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Row 2: Loan Breakdown Donut + User vs Ideal Thresholds */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                {/* Chart 3: Loan Cost Breakdown - DONUT CHART */}
                                <div className="bg-gray-800 rounded-xl p-4 overflow-visible">
                                    <p className="text-gray-400 text-sm mb-1 font-medium">💰 Loan Cost Breakdown</p>
                                    <p className="text-gray-500 text-xs mb-3">Principal vs Interest Distribution</p>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Principal', value: advisorResult.loan_details.amount, fill: '#8B5CF6' },
                                                    { name: 'Interest', value: advisorResult.emi.total_interest, fill: '#F59E0B' }
                                                ]}
                                                cx="50%"
                                                cy="45%"
                                                innerRadius={40}
                                                outerRadius={65}
                                                paddingAngle={3}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                            </Pie>
                                            {/* Principal label - left side */}
                                            <text x="15%" y="35%" textAnchor="start" fill="#8B5CF6" fontSize="12" fontWeight="600">
                                                Principal
                                            </text>
                                            <text x="15%" y="47%" textAnchor="start" fill="#fff" fontSize="13" fontWeight="bold">
                                                ₹{advisorResult.loan_details.amount.toLocaleString()}
                                            </text>
                                            {/* Interest label - right side */}
                                            <text x="85%" y="55%" textAnchor="end" fill="#F59E0B" fontSize="12" fontWeight="600">
                                                Interest
                                            </text>
                                            <text x="85%" y="67%" textAnchor="end" fill="#fff" fontSize="13" fontWeight="bold">
                                                ₹{advisorResult.emi.total_interest.toLocaleString()}
                                            </text>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#ffffff',
                                                    border: '1px solid #E5E7EB',
                                                    borderRadius: '8px',
                                                    padding: '10px 14px',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                    color: '#1F2937'
                                                }}
                                                wrapperStyle={{ zIndex: 1000 }}
                                                formatter={(value: number, name: string) => [`₹${value.toLocaleString()}`, name]}
                                                labelStyle={{ color: '#1F2937', fontWeight: 'bold' }}
                                                itemStyle={{ color: '#374151' }}
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                iconType="circle"
                                                formatter={(value: string, entry: { payload: { value: number } }) => {
                                                    const percent = ((entry.payload.value / advisorResult.emi.total_repayment) * 100).toFixed(0);
                                                    return <span style={{ color: '#D1D5DB' }}>{value}: {percent}%</span>;
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="flex justify-between text-xs text-gray-400 mt-1 px-4">
                                        <span>Monthly EMI: <span className="text-white font-semibold">₹{advisorResult.emi.monthly.toLocaleString()}</span></span>
                                        <span>Total: <span className="text-white font-semibold">₹{advisorResult.emi.total_repayment.toLocaleString()}</span></span>
                                    </div>
                                </div>

                                {/* Chart 4: Grouped Vertical Bar Chart */}
                                <div className="bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700/50 shadow-xl">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                            <span className="text-white text-sm">📊</span>
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-semibold">Your Profile vs Ideal</p>
                                            <p className="text-gray-500 text-xs">Side-by-side comparison</p>
                                        </div>
                                    </div>

                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart
                                            data={[
                                                {
                                                    name: 'EMI/Income',
                                                    you: Math.min(advisorResult.income_analysis.emi_to_income_ratio, 100),
                                                    ideal: 40
                                                },
                                                {
                                                    name: 'DTI Ratio',
                                                    you: Math.min(advisorResult.income_analysis.debt_to_income_ratio || 0, 100),
                                                    ideal: 30
                                                },
                                                {
                                                    name: 'Approval',
                                                    you: advisorResult.approval_probability,
                                                    ideal: 60
                                                },
                                            ]}
                                            margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                                            barGap={4}
                                            barCategoryGap="20%"
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fill: '#D1D5DB', fontSize: 11 }} axisLine={{ stroke: '#4B5563' }} />
                                            <YAxis domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={(v) => `${v}%`} axisLine={{ stroke: '#4B5563' }} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                                formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name === 'you' ? 'Your Value' : 'Ideal Target']}
                                                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                                            />
                                            <Legend
                                                formatter={(value: string) => <span style={{ color: '#D1D5DB', fontSize: '12px' }}>{value === 'you' ? 'You' : 'Ideal'}</span>}
                                            />
                                            <Bar dataKey="you" name="you" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="ideal" name="ideal" fill="#22C55E" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Row 3: Full Width Risk Profile Radar */}
                            <div className="bg-gray-800 rounded-xl p-4">
                                <p className="text-gray-400 text-sm mb-1 font-medium">🔍 Risk Assessment Radar</p>
                                <p className="text-gray-500 text-xs mb-3">Multi-dimensional profile analysis (higher = better)</p>
                                <ResponsiveContainer width="100%" height={320}>
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                                        { subject: 'Income', A: Math.min(100, (advisorResult.income_analysis.monthly_income / 1000)), fullMark: 100 },
                                        { subject: 'Debt Mgmt', A: Math.max(0, 100 - (advisorResult.income_analysis.debt_to_income_ratio || 0) * 2), fullMark: 100 },
                                        { subject: 'EMI Afford', A: Math.max(0, 100 - (advisorResult.income_analysis.emi_to_income_ratio || 0) * 2), fullMark: 100 },
                                        { subject: 'Credit', A: advisorResult.credit_score.rating === 'Excellent' ? 95 : advisorResult.credit_score.rating === 'Good' ? 75 : advisorResult.credit_score.rating === 'Fair' ? 50 : 25, fullMark: 100 },
                                        { subject: 'ML Score', A: advisorResult.approval_probability, fullMark: 100 }
                                    ]}>
                                        <PolarGrid gridType="polygon" stroke="#4B5563" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#D1D5DB', fontSize: 12, fontWeight: 500 }} />
                                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 9 }} axisLine={false} />
                                        <Radar name="Your Profile" dataKey="A" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.5} strokeWidth={2} dot={{ fill: '#A78BFA', r: 5, strokeWidth: 0 }} />
                                        <Radar name="Ideal (100)" dataKey="fullMark" stroke="#22C55E" fill="none" strokeWidth={2} strokeDasharray="4 4" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                            formatter={(value: number) => [`${value.toFixed(0)}/100`, '']}
                                        />
                                        <Legend
                                            wrapperStyle={{ paddingTop: '10px' }}
                                            formatter={(value: string) => <span style={{ color: '#9CA3AF' }}>{value}</span>}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Factor Details Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {advisorResult.explanations.map((factor, idx) => (
                                <div key={idx} className={`p-4 rounded-xl ${factor.impact === 'positive' ? 'bg-gray-800 border-2 border-green-500' : 'bg-gray-800 border-2 border-red-500'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        {factor.impact === 'positive' ? <CheckCircle className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
                                        <span className="text-white font-medium">{factor.factor}</span>
                                    </div>
                                    <p className="text-gray-400 text-sm">{factor.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Co-Applicant Suggestion */}
                    {
                        advisorResult.coapplicant.suggested && !advisorResult.coapplicant.provided && (
                            <div className="p-4 bg-gray-900 border-2 border-yellow-500 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <User className="w-6 h-6 text-yellow-400" />
                                    <div>
                                        <p className="text-yellow-400 font-medium">Co-Applicant Recommended</p>
                                        <p className="text-gray-300 text-sm">{advisorResult.coapplicant.reason}</p>
                                    </div>
                                    <button
                                        onClick={() => { setAdvisorResult(null); setShowCoApplicant(true); }}
                                        className="ml-auto px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                                    >
                                        Add Co-Applicant & Reapply
                                    </button>
                                </div>
                            </div>
                        )
                    }

                    {/* Next Steps */}
                    <div className="p-6 bg-gray-900 rounded-2xl border-2 border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-4">Next Steps</h4>
                        <ul className="space-y-2">
                            {advisorResult.next_steps.map((step, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-gray-300">
                                    <ChevronRight className="w-4 h-4 text-teal-400" />
                                    {step}
                                </li>
                            ))}
                        </ul>
                        {advisorResult.kyc_required && (advisorResult.decision === 'APPROVED' || advisorResult.decision === 'PENDING_REVIEW') && advisorResult.application_id && (
                            <div className="mt-4">
                                <button
                                    onClick={() => {
                                        fetchKycStatus(advisorResult.application_id!);
                                    }}
                                    className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 rounded-xl text-white font-semibold transition flex items-center justify-center gap-2"
                                >
                                    <Shield className="w-5 h-5" />
                                    {kycStatus ? 'Continue KYC' : 'Start KYC Verification'}
                                </button>
                            </div>
                        )}
                    </div>



                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                setAdvisorResult(null);
                                setKycStatus(null);
                                setKycStep(1);
                                setShowQrCode(false);
                                setQrCodeUrl(null);
                            }}
                            className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-semibold transition"
                        >
                            Apply Again
                        </button>

                        <button
                            onClick={() => handleDownloadReport(advisorResult.application_id!)}
                            className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl text-white font-semibold transition"
                        >
                            Download Report
                        </button>
                    </div>

                    {/* QR Code Section */}
                    <div className="mt-6 p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold">Scan to Download on Mobile</h4>
                                    <p className="text-gray-400 text-sm">Access your report on any device</p>
                                </div>
                            </div>
                            {!showQrCode && (
                                <button
                                    onClick={() => handleGenerateQRCode(advisorResult.application_id!)}
                                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg text-white font-medium transition flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Generate QR Code
                                </button>
                            )}
                        </div>

                        {showQrCode && qrCodeUrl && (
                            <div className="flex flex-col items-center justify-center py-6 space-y-4">
                                <div className="p-4 bg-white rounded-2xl shadow-2xl">
                                    <img
                                        src={qrCodeUrl}
                                        alt="QR Code for Report Download"
                                        className="w-48 h-48"
                                    />
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-white font-medium">Scan with your phone's camera</p>
                                    <p className="text-gray-400 text-sm">Link expires in 24 hours</p>
                                    <div className="flex items-center gap-2 justify-center text-green-400 text-sm">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        <span>Secure & Encrypted Link</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowQrCode(false);
                                        if (qrCodeUrl) {
                                            window.URL.revokeObjectURL(qrCodeUrl);
                                            setQrCodeUrl(null);
                                        }
                                    }}
                                    className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 text-sm transition"
                                >
                                    Hide QR Code
                                </button>
                            </div>
                        )}

                        {!showQrCode && (
                            <div className="mt-4 flex items-start gap-3 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                                <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="text-sm text-blue-200">
                                    <p className="font-medium mb-1">Cross-Device Access</p>
                                    <ul className="list-disc list-inside space-y-1 text-blue-300">
                                        <li>Scan QR code with any smartphone camera</li>
                                        <li>Download report without login required</li>
                                        <li>Share link valid for 24 hours</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div >
            );
        }

        // Otherwise show the application form
        return (
            <div className="space-y-6">
                {/* Application Form */}
                <div className="p-6 bg-gray-900 rounded-2xl border-2 border-purple-500">
                    <div className="flex items-center gap-3 mb-6">
                        <Sparkles className="w-6 h-6 text-purple-400" />
                        <div>
                            <h3 className="text-xl font-semibold text-white">AI-Powered Loan Eligibility Advisor</h3>
                            <p className="text-gray-400 text-sm">Get instant credit score, EMI, interest rate & approval decision</p>
                        </div>
                    </div>

                    {formError && (
                        <div className="p-4 bg-red-900 border-2 border-red-500 rounded-xl mb-6 text-red-300">
                            {formError}
                        </div>
                    )}

                    {/* Personal & Employment Section */}
                    <div className="mb-6">
                        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                            <User className="w-4 h-4" /> Personal & Employment
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Gender *</label>
                                <select
                                    value={loanFormData.gender}
                                    onChange={(e) => handleLoanFormChange('gender', e.target.value)}
                                    style={{ color: '#ffffff', backgroundColor: '#1f2937' }}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Age *</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={loanFormData.age}
                                    onChange={(e) => handleLoanFormChange('age', e.target.value)}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    placeholder="e.g., 30"
                                    style={{ color: '#ffffff', backgroundColor: '#1f2937' }}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Employment *</label>
                                <select
                                    value={loanFormData.employment_status}
                                    onChange={(e) => handleLoanFormChange('employment_status', e.target.value)}
                                    style={{ color: '#ffffff', backgroundColor: '#1f2937' }}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white"
                                >
                                    <option value="Employed">Employed</option>
                                    <option value="Self-Employed">Self-Employed</option>
                                    <option value="Unemployed">Unemployed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Education</label>
                                <select
                                    value={loanFormData.education_level}
                                    onChange={(e) => handleLoanFormChange('education_level', e.target.value)}
                                    style={{ color: '#ffffff', backgroundColor: '#1f2937' }}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white"
                                >
                                    <option value="High School">High School</option>
                                    <option value="Associate">Associate</option>
                                    <option value="Bachelor">Bachelor</option>
                                    <option value="Master">Master</option>
                                    <option value="PhD">PhD</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Experience (years)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={loanFormData.experience}
                                    onChange={(e) => handleLoanFormChange('experience', e.target.value)}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    placeholder="e.g., 5"
                                    style={{ color: '#ffffff', backgroundColor: '#1f2937' }}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Job Tenure (years)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={loanFormData.job_tenure}
                                    onChange={(e) => handleLoanFormChange('job_tenure', e.target.value)}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    placeholder="e.g., 3"
                                    style={{ color: '#ffffff', backgroundColor: '#1f2937' }}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Marital Status</label>
                                <select
                                    value={loanFormData.marital_status}
                                    onChange={(e) => handleLoanFormChange('marital_status', e.target.value)}
                                    style={{ color: '#ffffff', backgroundColor: '#1f2937' }}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white"
                                >
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Divorced">Divorced</option>
                                    <option value="Widowed">Widowed</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Financial Section */}
                    <div className="mb-6">
                        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                            <IndianRupee className="w-4 h-4" /> Financial Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Monthly Income (₹) *</label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="number"
                                        min="0"
                                        value={loanFormData.monthly_income}
                                        onChange={(e) => handleLoanFormChange('monthly_income', e.target.value)}
                                        onWheel={(e) => e.currentTarget.blur()}
                                        placeholder="e.g., 50000"
                                        style={{ color: '#ffffff', backgroundColor: '#1f2937' }}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Monthly Debt Payments (₹)</label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="number"
                                        min="0"
                                        value={loanFormData.monthly_debt_payments}
                                        onChange={(e) => handleLoanFormChange('monthly_debt_payments', e.target.value)}
                                        onWheel={(e) => e.currentTarget.blur()}
                                        placeholder="Existing EMIs, loans, etc."
                                        style={{ color: '#ffffff', backgroundColor: '#1f2937' }}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">CIBIL Score *</label>
                                <div className="relative">
                                    <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="number"
                                        min="300"
                                        max="900"
                                        value={loanFormData.cibil_score}
                                        onChange={(e) => handleLoanFormChange('cibil_score', e.target.value)}
                                        onWheel={(e) => e.currentTarget.blur()}
                                        placeholder="e.g., 750 (300-900)"
                                        style={{ color: '#ffffff', backgroundColor: '#1f2937' }}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Enter your CIBIL score (300-900)</p>
                            </div>
                        </div>
                    </div>

                    {/* Loan Details Section */}
                    <div className="mb-6">
                        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Loan Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Loan Amount (₹) *</label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="number"
                                        min="0"
                                        value={loanFormData.loan_amount}
                                        onChange={(e) => handleLoanFormChange('loan_amount', e.target.value)}
                                        onWheel={(e) => e.currentTarget.blur()}
                                        placeholder="e.g., 500000"
                                        style={{ color: '#ffffff', backgroundColor: '#1f2937' }}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Duration</label>
                                <select
                                    value={loanFormData.loan_duration}
                                    onChange={(e) => handleLoanFormChange('loan_duration', parseInt(e.target.value))}
                                    style={{ color: '#ffffff', backgroundColor: '#1f2937' }}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white"
                                >
                                    <option value={12}>1 Year (12 months)</option>
                                    <option value={24}>2 Years (24 months)</option>
                                    <option value={36}>3 Years (36 months)</option>
                                    <option value={60}>5 Years (60 months)</option>
                                    <option value={84}>7 Years (84 months)</option>
                                    <option value={120}>10 Years (120 months)</option>
                                    <option value={180}>15 Years (180 months)</option>
                                    <option value={240}>20 Years (240 months)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Purpose</label>
                                <select
                                    value={loanFormData.loan_purpose}
                                    onChange={(e) => handleLoanFormChange('loan_purpose', e.target.value)}
                                    style={{ color: '#ffffff', backgroundColor: '#1f2937' }}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white"
                                >
                                    <option value="PERSONAL">Personal</option>
                                    <option value="EDUCATION">Education</option>
                                    <option value="MEDICAL">Medical</option>
                                    <option value="VENTURE">Business / Venture</option>
                                    <option value="HOMEIMPROVEMENT">Home Improvement</option>
                                    <option value="DEBTCONSOLIDATION">Debt Consolidation</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Previous Loan Defaults?</label>
                                <select
                                    value={loanFormData.previous_loan_defaults}
                                    onChange={(e) => handleLoanFormChange('previous_loan_defaults', e.target.value)}
                                    style={{ color: '#ffffff', backgroundColor: '#1f2937' }}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white"
                                >
                                    <option value="No">No - Never Defaulted</option>
                                    <option value="Yes">Yes - Has Previous Defaults</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Household Section */}
                    <div className="mb-6">
                        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                            <Home className="w-4 h-4" /> Household
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Dependents</label>
                                <select
                                    value={loanFormData.number_of_dependents}
                                    onChange={(e) => handleLoanFormChange('number_of_dependents', parseInt(e.target.value))}
                                    style={{ color: '#ffffff', backgroundColor: '#1f2937' }}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white"
                                >
                                    {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Home Ownership</label>
                                <select
                                    value={loanFormData.home_ownership_status}
                                    onChange={(e) => handleLoanFormChange('home_ownership_status', e.target.value)}
                                    style={{ color: '#ffffff', backgroundColor: '#1f2937' }}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white"
                                >
                                    <option value="Rent">Rent</option>
                                    <option value="Own">Own</option>
                                    <option value="Mortgage">Mortgage</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Property Area *</label>
                                <select
                                    value={loanFormData.property_area}
                                    onChange={(e) => handleLoanFormChange('property_area', e.target.value)}
                                    style={{ color: '#ffffff', backgroundColor: '#1f2937' }}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white"
                                >
                                    <option value="Urban">Urban</option>
                                    <option value="Semi-Urban">Semi-Urban</option>
                                    <option value="Rural">Rural</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Co-Applicant Section (Conditional) */}
                    {
                        showCoApplicant && (
                            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                                <h4 className="text-yellow-400 font-medium mb-4 flex items-center gap-2">
                                    <User className="w-4 h-4" /> Co-Applicant Details (Optional)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-gray-300 mb-2 text-sm">Relationship</label>
                                        <select
                                            value={loanFormData.coapplicant_relationship}
                                            onChange={(e) => handleLoanFormChange('coapplicant_relationship', e.target.value)}
                                            style={{ color: '#ffffff', backgroundColor: '#1f2937' }}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white"
                                        >
                                            <option value="">Select...</option>
                                            <option value="Spouse">Spouse</option>
                                            <option value="Parent">Parent</option>
                                            <option value="Sibling">Sibling</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-gray-300 mb-2 text-sm">Employment</label>
                                        <select
                                            value={loanFormData.coapplicant_employment}
                                            onChange={(e) => handleLoanFormChange('coapplicant_employment', e.target.value)}
                                            style={{ color: '#ffffff', backgroundColor: '#1f2937' }}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white"
                                        >
                                            <option value="">Select...</option>
                                            <option value="Employed">Employed</option>
                                            <option value="Self-Employed">Self-Employed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-gray-300 mb-2 text-sm">Monthly Income (₹)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={loanFormData.coapplicant_income}
                                            onChange={(e) => handleLoanFormChange('coapplicant_income', e.target.value)}
                                            onWheel={(e) => e.currentTarget.blur()}
                                            placeholder="e.g., 30000"
                                            style={{ color: '#ffffff', backgroundColor: '#1f2937' }}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400"
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* What We Don't Ask */}
                    <div className="p-4 bg-gray-800 border-2 border-teal-500 rounded-xl mb-6">
                        <p className="text-teal-400 text-sm font-medium mb-1">✓ We Automatically Calculate</p>
                        <p className="text-gray-400 text-xs">
                            Annual Income, Debt-to-Income Ratio, Risk Score - You don't need to provide these!
                        </p>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleLoanSubmit}
                        disabled={isSubmitting}
                        className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-semibold text-lg transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Analyzing Your Application...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Get AI-Powered Loan Analysis
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    };

    // KYC WORKFLOW SECTION - POST-APPROVAL ONLY
    const renderKYCSection = (applicationId: string) => {
        if (!applicationId) return null;

        // Auto-fetch KYC status if not already loaded
        if (!kycStatus && !kycLoading && !kycError) {
            fetchKycStatus(applicationId);
        }

        // Show loading state
        if (kycLoading && !kycStatus) {
            return (
                <div className="mt-8 p-6 bg-gray-900 rounded-2xl border border-green-500/30">
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
                            <p className="text-gray-400">Loading KYC status...</p>
                        </div>
                    </div>
                </div>
            );
        }

        // Show error state if KYC fetch failed
        if (kycError && !kycStatus) {
            return (
                <div className="mt-8 p-6 bg-gray-900 rounded-2xl border border-red-500/30">
                    <div className="p-6 bg-red-900/20 rounded-xl border border-red-500/30">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-red-400">Unable to Load KYC</h4>
                        </div>
                        <p className="text-red-300 mb-4">{kycError}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setKycError('');
                                    fetchKycStatus(applicationId);
                                }}
                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => {
                                    setKycStatus(null);
                                    setKycError('');
                                    setAdvisorResult(null);
                                    setActiveSection('apply');
                                }}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
                            >
                                Back to Application
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="mt-8 p-6 bg-gray-900 rounded-2xl border border-green-500/30">
                {/* Back Button */}
                <button
                    onClick={() => setKycStatus(null)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6"
                >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    Back to Results
                </button>

                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                    <Shield className="w-6 h-6 text-green-400" />
                    Complete Your KYC
                    <span className="text-sm font-normal text-gray-300 ml-2">Required for Disbursement</span>
                </h3>
                <p className="text-gray-400 mb-6 font-mono text-sm pl-9">
                    Application Ref: <span className="text-teal-400">{advisorResult?.tracking_id || applicationId.slice(0, 8)}</span>
                </p>

                {/* KYC Stepper */}
                <div className="flex items-center justify-between mb-8 relative">
                    <div className="absolute top-4 left-0 right-0 h-1 bg-gray-700 -z-10" />
                    <div
                        className="absolute top-4 left-0 h-1 bg-gradient-to-r from-teal-500 to-green-500 -z-10 transition-all duration-500"
                        style={{ width: `${((kycStep - 1) / 3) * 100}%` }}
                    />

                    {[
                        { step: 1, label: "Documents", icon: FileText },
                        { step: 2, label: "Bank Details", icon: CreditCard },
                        { step: 3, label: "Agreement", icon: Shield },
                        { step: 4, label: "Complete", icon: CheckCircle },
                    ].map(({ step, label, icon: Icon }) => (
                        <div key={step} className="flex flex-col items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${kycStep >= step
                                    ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white'
                                    : 'bg-gray-700 text-gray-400'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                            </div>
                            <span className={`text-xs mt-2 ${kycStep >= step ? 'text-green-400' : 'text-gray-500'}`}>
                                {label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Error/Success Messages */}
                {kycError && (
                    <div className="p-4 mb-4 bg-red-900 border border-red-500/30 rounded-xl text-red-400">
                        {kycError}
                    </div>
                )}
                {kycSuccess && (
                    <div className="p-4 mb-4 bg-green-900 border border-green-500/30 rounded-xl text-green-400">
                        {kycSuccess}
                    </div>
                )}

                {/* Step 1: Document Upload */}
                {kycStep === 1 && (
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-teal-400" />
                            Step 1: Upload Identity & Address Proof
                        </h4>
                        <p className="text-gray-400 text-sm">Upload required documents. Bank statement must be fresh (within last 3-6 months).</p>

                        {/* Previous Documents Reuse Section */}
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/20 to-teal-900/20 rounded-xl border border-blue-500/30">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mt-1">
                                    <Shield className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <h5 className="text-white font-semibold mb-1">Second Loan Application?</h5>
                                    <p className="text-gray-300 text-sm mb-3">
                                        If you've completed KYC before, you can reuse verified identity documents (Aadhaar, PAN). 
                                        <span className="text-yellow-400 font-medium"> Bank statements must be uploaded fresh for each application.</span>
                                    </p>
                                    <button
                                        onClick={async () => {
                                            const docs = await fetchPreviousDocuments(applicationId);
                                            if (docs.length > 0) {
                                                setShowPreviousDocs(!showPreviousDocs);
                                            } else {
                                                setKycError('No previous verified documents found. Please upload documents below.');
                                            }
                                        }}
                                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                                    >
                                        <FileText className="w-4 h-4" />
                                        {showPreviousDocs ? 'Hide' : 'Show'} Previous Documents
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Previous Documents Modal */}
                        {showPreviousDocs && previousDocuments.length > 0 && (
                            <div className="mb-6 p-5 bg-gray-800 rounded-xl border border-blue-500/30">
                                <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    Verified Documents from Previous Applications
                                </h5>
                                <div className="space-y-2">
                                    {previousDocuments.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{doc.document_type.replace(/_/g, ' ')}</p>
                                                    <p className="text-gray-400 text-xs">Verified on {new Date(doc.verified_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => linkPreviousDocument(applicationId, doc.id)}
                                                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-all"
                                            >
                                                Use This Document
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-gray-400 text-xs mt-3">
                                    ℹ️ Click "Use This Document" to link verified documents to this application
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: "Aadhaar Card", type: "ADDRESS_PROOF", code: "AADHAAR", icon: FileText, desc: "Identity - Can reuse from previous application", reusable: true },
                                { label: "PAN Card", type: "ID_PROOF", code: "PAN", icon: FileText, desc: "Identity - Can reuse from previous application", reusable: true },
                                { label: "Bank Statement", type: "ADDRESS_PROOF", code: "BANK_STATEMENT", icon: CreditCard, desc: "⚠️ REQUIRED FRESH - Last 3-6 months", reusable: false },
                                { label: "Passport (Optional)", type: "ADDRESS_PROOF", code: "PASSPORT", icon: Shield, desc: "Additional identity proof", reusable: true }
                            ].map((doc, idx) => {
                                const Icon = doc.icon;
                                const isUploaded = kycStatus?.documents.some(d => d.document_type.includes(doc.code));

                                return (
                                    <div key={doc.code} className="relative">
                                        {/* Highlight bank statement as required fresh */}
                                        {doc.code === "BANK_STATEMENT" && !isUploaded && (
                                            <div className="absolute -top-2 -right-2 z-10">
                                                <span className="flex h-5 w-5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-5 w-5 bg-yellow-500 items-center justify-center text-xs font-bold text-black">!</span>
                                                </span>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => {
                                                const input = document.getElementById(`file-upload-${doc.code}`);
                                                if (input) input.click();
                                            }}
                                            disabled={isUploaded}
                                            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all group text-left ${
                                                doc.code === "BANK_STATEMENT" && !isUploaded
                                                    ? 'bg-yellow-900/20 border-yellow-500/50 hover:bg-yellow-900/30'
                                                    : isUploaded
                                                    ? 'bg-green-900/20 border-green-500/50 cursor-default'
                                                    : 'bg-gray-800 hover:bg-gray-700 border-white/10 hover:border-teal-500/50'
                                            }`}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                                                isUploaded 
                                                    ? 'bg-green-500/20' 
                                                    : doc.code === "BANK_STATEMENT"
                                                    ? 'bg-yellow-500/20'
                                                    : 'bg-teal-900 group-hover:bg-teal-800'
                                            }`}>
                                                {isUploaded ? (
                                                    <CheckCircle className="w-6 h-6 text-green-400" />
                                                ) : (
                                                    <Icon className={`w-6 h-6 ${doc.code === "BANK_STATEMENT" ? 'text-yellow-400' : 'text-teal-400'} group-hover:scale-110 transition`} />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-white font-semibold">{doc.label}</p>
                                                    {isUploaded && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">UPLOADED</span>}
                                                    {!isUploaded && doc.reusable && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">REUSABLE</span>}
                                                    {!isUploaded && doc.code === "BANK_STATEMENT" && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold">FRESH REQUIRED</span>}
                                                </div>
                                                <p className={`text-xs ${doc.code === "BANK_STATEMENT" ? 'text-yellow-300 font-medium' : 'text-gray-400'}`}>{doc.desc}</p>
                                        {["AADHAAR_FRONT", "AADHAAR_BACK", "PAN"].includes(doc.code) && (
                                            <input
                                                type="text"
                                                placeholder={`Enter ${doc.label} Number`}
                                                value={documentNumbers[doc.code] || ''}
                                                onChange={(e) => setDocumentNumbers(prev => ({ ...prev, [doc.code]: e.target.value }))}
                                                className="mt-2 w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                                            />
                                        )}
                                            </div>
                                        </button>
                                        <input
                                            id={`file-upload-${doc.code}`}
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    uploadDocument(applicationId, doc.type, e.target.files[0], documentNumbers[doc.code]);
                                                }
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Bank Statement Warning */}
                        <div className="p-4 bg-yellow-900/20 rounded-xl border border-yellow-500/30">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                                <div>
                                    <h5 className="text-yellow-400 font-semibold mb-1">Bank Statement Must Be Fresh</h5>
                                    <p className="text-gray-300 text-sm">
                                        Bank statements must be from the <span className="font-semibold">last 3-6 months</span> for each new loan application. 
                                        This helps us verify your current income, existing EMI payments, and financial health.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Uploaded Documents */}
                        {kycStatus && kycStatus.documents.length > 0 && (
                            <div className="mt-4 p-4 bg-gray-800 rounded-xl">
                                <h5 className="text-white font-medium mb-2">Uploaded: {kycStatus.step_1_docs_uploaded}/4 (Minimum 2 required to proceed)</h5>
                                <div className="space-y-2">
                                    {kycStatus.documents.map((doc: KYCDocumentItem) => {
                                        const docCode = doc.document_type.split('_').pop() || '';
                                        const docTypeInfo = [
                                            { label: "Aadhaar Card", type: "ADDRESS_PROOF", code: "AADHAAR" },
                                            { label: "PAN Card", type: "ID_PROOF", code: "PAN" },
                                            { label: "Passport", type: "ADDRESS_PROOF", code: "PASSPORT" },
                                            { label: "Driving License", type: "ID_PROOF", code: "DRIVING_LICENSE" }
                                        ].find(d => doc.document_type.includes(d.code));
                                        
                                        return (
                                            <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg group hover:bg-gray-700 transition-all">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                                    <div>
                                                        <span className="text-green-400 text-sm font-medium block">{doc.document_type}</span>
                                                        <span className="text-xs text-gray-400">{doc.verification_status}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {/* Reupload Button */}
                                                    <button
                                                        onClick={() => {
                                                            const input = document.getElementById(`file-reupload-${docCode}`);
                                                            if (input) input.click();
                                                        }}
                                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-all flex items-center gap-1.5"
                                                        title="Reupload document"
                                                    >
                                                        <Upload className="w-3.5 h-3.5" />
                                                        Reupload
                                                    </button>
                                                    <input
                                                        id={`file-reupload-${docCode}`}
                                                        type="file"
                                                        className="hidden"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={(e) => {
                                                            if (e.target.files && e.target.files[0] && docTypeInfo) {
                                                                uploadDocument(applicationId, docTypeInfo.type, docTypeInfo.code);
                                                            }
                                                        }}
                                                    />
                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`Are you sure you want to delete ${doc.document_type}?`)) {
                                                                deleteDocument(applicationId, doc.id);
                                                            }
                                                        }}
                                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg transition-all flex items-center gap-1.5"
                                                        title="Delete document"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {kycStatus && kycStatus.step_1_docs_uploaded >= 2 && (
                            <button
                                onClick={() => setKycStep(2)}
                                className="w-full mt-4 py-3 bg-gradient-to-r from-teal-500 to-green-500 rounded-xl text-white font-semibold hover:from-teal-600 hover:to-green-600 transition-all"
                            >
                                Continue to Bank Details → ({kycStatus.step_1_docs_uploaded}/4 documents uploaded)
                            </button>
                        )}
                        {kycStatus && kycStatus.step_1_docs_uploaded < 2 && kycStatus.step_1_docs_uploaded > 0 && (
                            <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/30 rounded-xl text-blue-300 text-sm">
                                📋 Upload {2 - kycStatus.step_1_docs_uploaded} more document(s) to proceed to bank details
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Bank Details */}
                {kycStep === 2 && (
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-teal-400" />
                            Step 2: Bank Account for Disbursement
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Account Holder Name</label>
                                <input
                                    type="text"
                                    value={bankForm.account_holder_name}
                                    onChange={(e) => setBankForm({ ...bankForm, account_holder_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white"
                                    placeholder="As per bank records"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Bank Name</label>
                                <input
                                    type="text"
                                    value={bankForm.bank_name}
                                    onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white"
                                    placeholder="e.g., State Bank of India"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Account Number</label>
                                <input
                                    type="text"
                                    value={bankForm.account_number}
                                    onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value.replace(/\D/g, '') })}
                                    className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white"
                                    placeholder="9-18 digit account number"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Confirm Account Number</label>
                                <input
                                    type="text"
                                    value={bankForm.confirm_account_number}
                                    onChange={(e) => setBankForm({ ...bankForm, confirm_account_number: e.target.value.replace(/\D/g, '') })}
                                    className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white"
                                    placeholder="Re-enter account number"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">IFSC Code</label>
                                <input
                                    type="text"
                                    value={bankForm.ifsc_code}
                                    onChange={(e) => setBankForm({ ...bankForm, ifsc_code: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white"
                                    placeholder="e.g., ABCD0123456"
                                    maxLength={11}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Account Type</label>
                                <select
                                    value={bankForm.account_type}
                                    onChange={(e) => setBankForm({ ...bankForm, account_type: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white"
                                >
                                    <option value="SAVINGS">Savings</option>
                                    <option value="CURRENT">Current</option>
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={() => submitBankDetails(applicationId)}
                            className="w-full mt-4 py-3 bg-gradient-to-r from-teal-500 to-green-500 rounded-xl text-white font-semibold"
                        >
                            Submit Bank Details →
                        </button>
                    </div>
                )}

                {/* Step 3: Agreement - RBI-Governor Grade Design */}
                {kycStep === 3 && (
                    <div className="space-y-6">
                        {/* Success Message */}
                        {kycSuccess && (
                            <div className="p-4 bg-green-900/30 border border-green-500/30 rounded-xl flex items-center gap-3 animate-fade-in">
                                <CheckCircle className="w-6 h-6 text-green-400" />
                                <p className="text-green-300 font-semibold">{kycSuccess}</p>
                            </div>
                        )}
                        
                        {/* Error Message */}
                        {kycError && (
                            <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-xl flex items-center gap-3 animate-fade-in">
                                <AlertCircle className="w-6 h-6 text-red-400" />
                                <p className="text-red-300 font-semibold">{kycError}</p>
                            </div>
                        )}
                        
                        {/* Header Section – Trust & Identity */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div>
                                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Shield className="w-6 h-6 text-teal-400" />
                                    Loan Agreement & Borrower Consent
                                </h4>
                                <p className="text-gray-400 text-sm mt-1">This document outlines the terms governing your approved loan, as per regulatory guidelines.</p>
                            </div>
                            <div className="flex gap-2 flex-wrap justify-end">
                                <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-[10px] font-bold tracking-wider">RBI COMPLIANT</span>
                                <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-[10px] font-bold tracking-wider">SSL SECURE</span>
                                <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/30 rounded-full text-teal-400 text-[10px] font-bold tracking-wider">IT ACT 2000</span>
                            </div>
                        </div>

                        {!agreement && (
                            <div className="text-center py-12 bg-gray-800/50 rounded-2xl border border-dashed border-white/10">
                                <div className="w-16 h-16 bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <FileText className="w-8 h-8 text-teal-400" />
                                </div>
                                <h5 className="text-white font-semibold mb-2">Generating Secure Agreement</h5>
                                <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">We are customizing your loan terms based on your approved profile and RBI guidelines.</p>
                                <button
                                    onClick={() => fetchAgreement(applicationId)}
                                    className="px-8 py-3 bg-teal-500 hover:bg-teal-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-teal-500/20"
                                >
                                    Proceed to Review Agreement
                                </button>
                            </div>
                        )}

                        {agreement && (
                            <div className="space-y-8">
                                {/* Professional Header */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6 gap-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                            <FileText className="w-8 h-8 text-teal-400" />
                                            Certified Loan Agreement
                                        </h3>
                                        <p className="text-gray-400 text-sm mt-1">Agreement ID: <span className="text-teal-400 font-mono">{agreement.id.toUpperCase().slice(0, 8)}</span> | Version {agreement.agreement_version}</p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-teal-500/10 px-4 py-2 rounded-lg border border-teal-500/20">
                                        <ShieldCheck className="w-5 h-5 text-teal-400" />
                                        <span className="text-teal-400 font-bold text-sm tracking-widest uppercase">VERIFIED SECURE</span>
                                    </div>
                                </div>

                                {/* The "Document" paper - PREMIUM DARK THEME */}
                                <div className="bg-[#0f172a] rounded-xl overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 relative">
                                    {/* Watermark */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] rotate-[-45deg]">
                                        <p className="text-white text-9xl font-black">{agreement.status || "CONFIDENTIAL"}</p>
                                    </div>

                                    <div className="p-8 md:p-12 text-gray-200 space-y-8 relative z-10">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <h4 className="font-black text-3xl text-white tracking-tighter flex items-center gap-2">
                                                    <Sparkles className="w-6 h-6 text-teal-400" />
                                                    LoanAdvisor
                                                </h4>
                                                <p className="text-xs text-gray-500 font-medium">Certified Digital Lending Partner</p>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <div className="inline-flex flex-col items-end">
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Digital Issue Date</p>
                                                    <p className="font-bold text-sm text-white">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-px bg-white/10" />

                                        {/* Summary Grid - High Tech Look */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            <div className="p-5 bg-white/5 rounded-xl border border-white/10 hover:border-teal-500/30 transition-colors group">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-2 group-hover:text-teal-400 transition-colors">Principal Amount</p>
                                                <p className="text-2xl font-black text-white">{formatCurrency(agreement.loan_amount)}</p>
                                            </div>
                                            <div className="p-5 bg-white/5 rounded-xl border border-white/10 hover:border-teal-500/30 transition-colors group">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-2 group-hover:text-teal-400 transition-colors">Interest Rate (p.a)</p>
                                                <p className="text-2xl font-black text-teal-400">{agreement.interest_rate}%</p>
                                            </div>
                                            <div className="p-5 bg-white/5 rounded-xl border border-white/10 hover:border-teal-500/30 transition-colors group">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-2 group-hover:text-teal-400 transition-colors">Tenure</p>
                                                <p className="text-2xl font-black text-white">{agreement.tenure_months} Months</p>
                                            </div>
                                            <div className="p-5 bg-white/5 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-colors group">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-2 group-hover:text-emerald-400 transition-colors">Monthly EMI</p>
                                                <p className="text-2xl font-black text-emerald-400">{formatCurrency(agreement.emi_amount)}</p>
                                            </div>
                                        </div>

                                        {/* Detailed Terms Table - Dark Variant */}
                                        <div className="overflow-hidden border border-white/10 rounded-xl bg-white/[0.02]">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-white/5 text-gray-400 uppercase text-[10px] font-bold tracking-wider">
                                                    <tr>
                                                        <th className="px-6 py-4">Description</th>
                                                        <th className="px-6 py-4">Details / Terms</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    <tr className="hover:bg-white/[0.02] transition-colors">
                                                        <td className="px-6 py-4 font-semibold text-gray-400">Processing Fee</td>
                                                        <td className="px-6 py-4 text-white font-medium">{formatCurrency(agreement.processing_fee)} <span className="text-gray-500 text-xs ml-2 font-normal">(Deducted from disbursement)</span></td>
                                                    </tr>
                                                    <tr className="hover:bg-white/[0.02] transition-colors">
                                                        <td className="px-6 py-4 font-semibold text-gray-400">Total Repayment</td>
                                                        <td className="px-6 py-4 font-bold text-white text-lg">{formatCurrency(agreement.total_payable)}</td>
                                                    </tr>
                                                    <tr className="hover:bg-white/[0.02] transition-colors">
                                                        <td className="px-6 py-4 font-semibold text-gray-400">Late Payment Penalty</td>
                                                        <td className="px-6 py-4 text-rose-400 font-bold">2.0% per month on overdue amount</td>
                                                    </tr>
                                                    <tr className="hover:bg-white/[0.02] transition-colors">
                                                        <td className="px-6 py-4 font-semibold text-gray-400">Prepayment Option</td>
                                                        <td className="px-6 py-4 text-emerald-400 font-bold italic">Allowed after 6 EMIs with 0% NIL penalty</td>
                                                    </tr>
                                                    <tr className="hover:bg-white/[0.02] transition-colors">
                                                        <td className="px-6 py-4 font-semibold text-gray-400">Governing Law</td>
                                                        <td className="px-6 py-4 text-gray-300">Information Technology Act, 2000 (Secured Digital Signature)</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Full Text Area */}
                                        <div className="space-y-4">
                                            <h5 className="font-bold text-white text-lg flex items-center gap-3">
                                                <div className="h-6 w-1 bg-teal-500 rounded-full" />
                                                Standard Terms & Conditions
                                            </h5>
                                            <div className="p-6 bg-black/30 rounded-xl border border-white/5 max-h-64 overflow-y-auto font-serif leading-relaxed text-gray-400 text-sm italic scrollbar-thin scrollbar-thumb-white/10">
                                                {agreement.agreement_text}
                                            </div>
                                        </div>

                                        {/* Admin Bank Details (Dark Emerald Theme) */}
                                        {adminBanks.length > 0 && (
                                            <div className="p-6 bg-emerald-950/20 rounded-xl border border-emerald-500/20 space-y-4 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]">
                                                <h5 className="font-bold text-emerald-400 flex items-center gap-2">
                                                    <Landmark className="w-5 h-5" />
                                                    Official Disbursement Accounts
                                                </h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {adminBanks.map(bank => (
                                                        <div key={bank.id} className="p-4 bg-[#0f172a] rounded-xl border border-emerald-500/10 hover:border-emerald-500/30 transition-all shadow-lg group">
                                                            <p className="font-bold text-emerald-400 mb-2 group-hover:text-white transition-colors">{bank.bank_name}</p>
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between text-[11px]">
                                                                    <span className="text-gray-500 uppercase font-bold">A/C Number</span>
                                                                    <span className="text-gray-200 font-mono tracking-wider">{bank.account_number}</span>
                                                                </div>
                                                                <div className="flex justify-between text-[11px]">
                                                                    <span className="text-gray-500 uppercase font-bold">IFSC Code</span>
                                                                    <span className="text-gray-200 font-mono tracking-wider">{bank.ifsc_code}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-[10px] text-emerald-500/60 italic font-medium flex items-center gap-2">
                                                    <ShieldCheck className="w-3 h-3" />
                                                    All transactions are end-to-end encrypted and RBI complaint.
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex flex-col lg:flex-row justify-between items-end gap-12 pt-8 border-t border-white/10">
                                            <div className="max-w-md w-full space-y-5">
                                                {/* Digital Signature Input */}
                                                <div className="space-y-3">
                                                    <label className="block text-sm font-semibold text-gray-300 flex items-center gap-2">
                                                        <PenTool className="w-4 h-4 text-teal-400" />
                                                        Enter Your Full Name (Digital Signature)
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={signatureText}
                                                            onChange={(e) => setSignatureText(e.target.value)}
                                                            placeholder="Type your full legal name here"
                                                            disabled={agreement.signed_at !== null}
                                                            className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                                            style={{ fontFamily: "'Brush Script MT', cursive" }}
                                                        />
                                                    </div>
                                                    {signatureText && (
                                                        <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg flex items-center gap-2">
                                                            <CheckCircle className="w-4 h-4 text-teal-400" />
                                                            <p className="text-sm text-teal-300">Signature: <span className="font-semibold">{signatureText}</span></p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Security Info */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <ShieldCheck className="w-3 h-3 text-blue-400" />
                                                            <p className="text-xs font-bold text-blue-400 uppercase">IP Verified</p>
                                                        </div>
                                                        <p className="text-xs text-gray-500">Encrypted</p>
                                                    </div>
                                                    <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Clock className="w-3 h-3 text-purple-400" />
                                                            <p className="text-xs font-bold text-purple-400 uppercase">Timestamp</p>
                                                        </div>
                                                        <p className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</p>
                                                    </div>
                                                </div>

                                                <label className="flex items-start gap-4 cursor-pointer group p-4 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10">
                                                    <div className="relative flex items-center mt-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={agreementConsent}
                                                            onChange={(e) => setAgreementConsent(e.target.checked)}
                                                            className="w-5 h-5 rounded-md border-white/20 bg-gray-800 text-teal-500 focus:ring-teal-500/50 transition-all"
                                                        />
                                                    </div>
                                                    <p className="text-[11px] leading-relaxed text-gray-400 group-hover:text-gray-200 transition-colors font-medium">
                                                        I, the borrower, hereby certify that I have read, understood and agree to the digital execution of this loan agreement. I acknowledge that my digital signature carries the same legal weight as a physical signature under the IT Act, 2000.
                                                    </p>
                                                </label>

                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={() => signAgreement(applicationId)}
                                                        disabled={!agreementConsent || !signatureText.trim() || agreement.signed_at !== null || signingInProgress}
                                                        className="flex-1 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 disabled:opacity-30 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed rounded-xl text-white font-black text-xs tracking-[0.2em] uppercase hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_20px_-10px_rgba(20,184,166,0.3)] flex items-center justify-center gap-3 group"
                                                    >
                                                        {signingInProgress ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                PROCESSING...
                                                            </>
                                                        ) : agreement.signed_at ? (
                                                            <>
                                                                <Lock className="w-4 h-4" />
                                                                SIGNED & TRANSMITTED
                                                            </>
                                                        ) : (
                                                            <>
                                                                <PenTool className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                                                Digitally Sign Now
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
                                                                const response = await fetch(`${API_BASE_URL}/kyc/${applicationId}/agreement/download`, {
                                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                                });
                                                                if (!response.ok) throw new Error('Download failed');
                                                                const blob = await response.blob();
                                                                const url = window.URL.createObjectURL(blob);
                                                                const a = document.createElement('a');
                                                                a.href = url;
                                                                a.download = `LoanAgreement_${applicationId.slice(0, 8)}.pdf`;
                                                                document.body.appendChild(a);
                                                                a.click();
                                                                window.URL.revokeObjectURL(url);
                                                            } catch (err) {
                                                                console.error("Download error:", err);
                                                                alert("Failed to download agreement. Please try again.");
                                                            }
                                                        }}
                                                        className="px-6 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 hover:text-white transition-all border border-white/10 group"
                                                        title="Download Official Agreement"
                                                    >
                                                        <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>

                                            {agreement.signed_at ? (
                                                <div className="relative">
                                                    {/* OFFICIAL SEAL */}
                                                    <div className="p-8 border-[6px] border-emerald-500/50 rounded-2xl rotate-[-15deg] bg-emerald-950/40 backdrop-blur-md shadow-[0_0_40px_rgba(16,185,129,0.2)] flex flex-col items-center justify-center relative overflow-hidden group">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
                                                        <div className="absolute top-0 right-0 p-2 opacity-20">
                                                            <Landmark className="w-12 h-12" />
                                                        </div>
                                                        <CheckCircle className="w-16 h-16 text-emerald-400 mb-2 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                                                        <p className="font-black text-emerald-400 text-2xl tracking-tighter text-center leading-tight">DIGITALLY<br />AUTHENTICATED</p>
                                                        <div className="h-px w-full bg-emerald-500/30 my-3" />
                                                        <p className="text-[10px] text-emerald-200/60 font-mono uppercase tracking-[0.2em]">{new Date(agreement.signed_at).toLocaleString()}</p>
                                                        <p className="text-[9px] text-emerald-500/40 font-mono mt-1 mt-2">SECURE-KEY: {agreement.id.slice(0, 12).toUpperCase()}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-48 h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-gray-600 space-y-2 opacity-50 bg-white/[0.01]">
                                                    <PenTool className="w-8 h-8 opacity-20" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-center">Awaiting<br />Digital Signature</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Regulatory Assurance Footer */}
                                <div className="bg-gray-900/80 p-6 rounded-2xl border border-white/5 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-left">
                                        <div>
                                            <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Lender Details</p>
                                            <p className="text-gray-400 text-xs">LoanAdvisor Financial Services Pvt. Ltd.</p>
                                            <p className="text-gray-500 text-[10px]">CIN: U65910KA2024PTC185XXX</p>
                                            <p className="text-gray-500 text-[10px]">RBI Reg: N-05.00XXX</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Grievance Officer</p>
                                            <p className="text-gray-400 text-xs">Mr. Compliance Officer</p>
                                            <p className="text-teal-400 text-xs">grievance@loanadvisor.in</p>
                                            <p className="text-gray-500 text-[10px]">Response within 48 hours</p>
                                        </div>
                                        <div className="md:text-right">
                                            <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Agreement Info</p>
                                            <p className="text-gray-400 text-xs">Version: v{agreement.agreement_version} (RBI Compliant)</p>
                                            <p className="text-gray-500 text-[10px]">Generated: {new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 4: Complete */}
                {kycStep === 4 && (
                    <div className="space-y-6">
                        {kycStatus?.can_proceed_to_disbursement ? (
                            <div className="text-center space-y-6">
                                {/* Success Icon */}
                                <div className="w-24 h-24 mx-auto bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center shadow-2xl">
                                    <CheckCircle className="w-12 h-12 text-white" />
                                </div>
                                
                                {/* Success Message */}
                                <div>
                                    <h4 className="text-3xl font-bold text-white mb-2">🎉 KYC Completed Successfully!</h4>
                                    <p className="text-gray-400 text-lg">Your verification is complete and approved</p>
                                </div>

                                {/* Success Details Card */}
                                <div className="bg-gradient-to-br from-green-900/40 to-teal-900/40 border border-green-500/30 rounded-xl p-6 backdrop-blur-sm">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between pb-3 border-b border-green-500/20">
                                            <span className="text-gray-400">Application Ref</span>
                                            <span className="text-white font-mono">{applicationId.slice(0, 8).toUpperCase()}</span>
                                        </div>
                                        <div className="flex items-center justify-between pb-3 border-b border-green-500/20">
                                            <span className="text-gray-400">Verification Status</span>
                                            <span className="text-green-400 font-semibold flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4" />
                                                Verified & Approved
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-400">Disbursement Timeline</span>
                                            <span className="text-white font-semibold">24-48 hours</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Next Steps */}
                                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-5">
                                    <h5 className="text-blue-300 font-semibold mb-3 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5" />
                                        What Happens Next?
                                    </h5>
                                    <ul className="text-gray-300 text-sm space-y-2 text-left">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                            <span>Our team will verify your submitted documents</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                            <span>Loan amount will be credited to your bank account</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                            <span>You'll receive SMS & email confirmation upon disbursement</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={() => setActiveSection('home')}
                                    className="w-full py-4 bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 rounded-xl text-white font-semibold text-lg transition-all shadow-lg"
                                >
                                    Back to Dashboard
                                </button>
                            </div>
                        ) : (
                            <div className="text-center space-y-6">
                                {/* Pending Icon */}
                                <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-10 h-10 text-white" />
                                </div>
                                <h4 className="text-2xl font-bold text-white">Almost There!</h4>
                                <p className="text-gray-400">All steps completed. Click below to finalize your KYC.</p>

                                {/* Checklist */}
                                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-left">
                                    <h5 className="text-white font-semibold mb-4">Completed Steps:</h5>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-green-400">
                                            <CheckCircle className="w-5 h-5" />
                                            <span>Documents Uploaded ({kycStatus?.step_1_docs_uploaded}/4)</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-green-400">
                                            <CheckCircle className="w-5 h-5" />
                                            <span>Bank Details Submitted</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-green-400">
                                            <CheckCircle className="w-5 h-5" />
                                            <span>Agreement Signed</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => completeKyc(applicationId)}
                                    className="w-full px-8 py-4 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 rounded-xl text-white font-bold text-lg transition-all shadow-lg"
                                >
                                    Complete KYC & Request Disbursement
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };



    // PAYMENT GATEWAY HANDLERS
    const handlePayNow = () => {
        setShowPaymentGateway(true);
        setPaymentStep('method');
        setPaymentMethod(null);
        setNetBankingStep('select');
    };

    const handlePaymentMethodSelect = (method: typeof paymentMethod) => {
        setPaymentMethod(method);
        setPaymentStep('details');
        if (method === 'netbanking') {
            setNetBankingStep('select');
        }
    };

    const handleBankSelect = (bank: string) => {
        setPaymentData({ ...paymentData, bankName: bank });
        setNetBankingStep('login');
    };

    const processPayment = () => {
        setPaymentStep('processing');
        setTimeout(() => {
            setPaymentStep('success');
        }, 3000);
    };

    const closePaymentGateway = () => {
        setShowPaymentGateway(false);
        setPaymentStep('method');
        setPaymentMethod(null);
        setNetBankingStep('select');
        setPaymentData({
            cardNumber: '',
            cardName: '',
            expiryMonth: '',
            expiryYear: '',
            cvv: '',
            upiId: '',
            bankName: '',
            bankUserId: '',
            bankPassword: '',
            walletType: ''
        });
    };

    // REPAYMENTS SECTION
    const renderRepaymentsSection = () => {
        // Calculate stats from real data
        const totalPaidEmis = repayments.filter(r => r.payment_status === 'PAID').length;
        const nextEmi = repayments.find(r => r.payment_status === 'PENDING') || repayments[0]; // Simple logic for now
        const nextEmiDate = nextEmi ? new Date(nextEmi.due_date) : new Date();
        const nextEmiAmount = nextEmi ? nextEmi.emi_amount : 0;

        // Derive interest rate from active loan (if available) or fallback
        const activeLoan = loanApplications.find(l => l.status === 'APPROVED' || l.status === 'DISBURSED');
        const interestRate = activeLoan?.interest_rate || 0;

        return (
            <div className="space-y-6">
                <div className="p-6 bg-gray-800 rounded-2xl border border-gray-700">
                    <h3 className="text-xl font-semibold text-white mb-6">Repayments & EMIs</h3>

                    {repaymentsLoading ? (
                        <div className="text-center py-8 text-gray-400">Loading repayments...</div>
                    ) : repayments.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400">No repayment schedule found.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                                    <p className="text-gray-400 text-sm">Next EMI Due</p>
                                    <p className="text-2xl font-bold text-white mt-1">{formatCurrency(nextEmiAmount)}</p>
                                    <p className="text-yellow-400 text-sm mt-1 flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {nextEmiDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                                    <p className="text-gray-400 text-sm">EMIs Paid</p>
                                    <p className="text-2xl font-bold text-white mt-1">{totalPaidEmis}</p>
                                    <p className="text-green-400 text-sm mt-1">of {repayments.length} total</p>
                                </div>
                                <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl">
                                    <p className="text-gray-400 text-sm">Interest Rate</p>
                                    <p className="text-2xl font-bold text-white mt-1">{interestRate}%</p>
                                    <p className="text-teal-400 text-sm mt-1">per annum</p>
                                </div>
                            </div>

                            {/* Repayment History Table */}
                            <div className="overflow-hidden rounded-xl border border-gray-700">
                                <table className="w-full text-sm text-left text-gray-400">
                                    <thead className="bg-gray-700/50 text-gray-300 uppercase font-medium">
                                        <tr>
                                            <th className="px-4 py-3">EMI No</th>
                                            <th className="px-4 py-3">Due Date</th>
                                            <th className="px-4 py-3">Amount</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Paid On</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {repayments.map((r) => (
                                            <tr key={r.id} className="hover:bg-gray-700/30">
                                                <td className="px-4 py-3">#{r.emi_number}</td>
                                                <td className="px-4 py-3">{new Date(r.due_date).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 font-medium text-white">{formatCurrency(r.emi_amount)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.payment_status === 'PAID' ? 'bg-green-500/20 text-green-400' :
                                                        r.payment_status === 'OVERDUE' ? 'bg-red-500/20 text-red-400' :
                                                            'bg-yellow-500/20 text-yellow-400'
                                                        }`}>
                                                        {r.payment_status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">{r.payment_date ? new Date(r.payment_date).toLocaleDateString() : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <button
                                onClick={handlePayNow}
                                className="w-full mt-6 py-3 bg-teal-500 hover:bg-teal-600 rounded-xl text-white font-semibold transition"
                            >
                                Pay Now
                            </button>
                        </>
                    )}
                </div>

                {/* BANK TRANSACTIONS SECTION */}
                <div className="p-6 bg-gray-800 rounded-2xl border border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white">Bank Transactions</h3>
                        <button
                            onClick={async () => {
                                setLoadingTransactions(true);
                                try {
                                    const data = await getMockBankTransactions();
                                    setBankTransactions(data);
                                } catch (error) {
                                    console.error('Failed to load transactions:', error);
                                } finally {
                                    setLoadingTransactions(false);
                                }
                            }}
                            className="px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 rounded-lg text-sm font-medium transition"
                        >
                            {loadingTransactions ? 'Loading...' : bankTransactions ? 'Refresh' : 'Load Transactions'}
                        </button>
                    </div>

                    {bankTransactions ? (
                        <div className="space-y-4">
                            {/* Account Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-900/50 rounded-xl">
                                <div>
                                    <p className="text-gray-500 text-xs">Account Holder</p>
                                    <p className="text-white font-medium">{bankTransactions.account_holder}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs">Account</p>
                                    <p className="text-white font-medium">{bankTransactions.account_number}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs">Bank</p>
                                    <p className="text-white font-medium">{bankTransactions.bank_name}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs">IFSC</p>
                                    <p className="text-white font-medium">{bankTransactions.ifsc}</p>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                    <p className="text-gray-400 text-xs">Total Credits</p>
                                    <p className="text-green-400 font-bold">₹{bankTransactions.summary.total_credits.toLocaleString()}</p>
                                </div>
                                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                    <p className="text-gray-400 text-xs">Total Debits</p>
                                    <p className="text-red-400 font-bold">₹{bankTransactions.summary.total_debits.toLocaleString()}</p>
                                </div>
                                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                    <p className="text-gray-400 text-xs">Opening Balance</p>
                                    <p className="text-blue-400 font-bold">₹{bankTransactions.summary.opening_balance.toLocaleString()}</p>
                                </div>
                                <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                    <p className="text-gray-400 text-xs">Closing Balance</p>
                                    <p className="text-purple-400 font-bold">₹{bankTransactions.summary.closing_balance.toLocaleString()}</p>
                                </div>
                                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                    <p className="text-gray-400 text-xs">Avg Balance</p>
                                    <p className="text-amber-400 font-bold">₹{bankTransactions.summary.average_balance.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Transactions Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-700">
                                            <th className="text-left py-3 px-2 text-gray-400 font-medium">Date</th>
                                            <th className="text-left py-3 px-2 text-gray-400 font-medium">Description</th>
                                            <th className="text-left py-3 px-2 text-gray-400 font-medium">Mode</th>
                                            <th className="text-right py-3 px-2 text-gray-400 font-medium">Amount</th>
                                            <th className="text-right py-3 px-2 text-gray-400 font-medium">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bankTransactions.transactions.slice(0, 10).map((txn) => (
                                            <tr key={txn.id} className="border-b border-gray-800 hover:bg-gray-700/30">
                                                <td className="py-3 px-2 text-gray-300">{new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                                                <td className="py-3 px-2">
                                                    <p className="text-white text-xs truncate max-w-[200px]">{txn.description}</p>
                                                    <p className="text-gray-500 text-[10px]">{txn.category}</p>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <span className="px-2 py-0.5 bg-gray-700 rounded text-[10px] text-gray-300">{txn.mode}</span>
                                                </td>
                                                <td className={`py-3 px-2 text-right font-medium ${txn.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                                                    {txn.type === 'CREDIT' ? '+' : '-'}₹{txn.amount.toLocaleString()}
                                                </td>
                                                <td className="py-3 px-2 text-right text-gray-300">₹{txn.balance.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {bankTransactions.transactions.length > 10 && (
                                <p className="text-gray-500 text-xs text-center">Showing 10 of {bankTransactions.transactions.length} transactions</p>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">Click "Load Transactions" to view your bank statement</p>
                            <p className="text-gray-500 text-xs mt-1">Simulates Account Aggregator data fetch</p>
                        </div>
                    )}
                </div>

                {/* PAYMENT GATEWAY MODAL */}
                {showPaymentGateway && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-900">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Secure Payment Gateway</h2>
                                    <p className="text-gray-400 text-sm">Amount: {formatCurrency(mockDashboardData.activeLoan.nextEmiAmount)}</p>
                                </div>
                                <button onClick={closePaymentGateway} className="text-gray-400 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6">
                                {/* STEP 1: SELECT PAYMENT METHOD */}
                                {paymentStep === 'method' && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-white mb-4">Choose Payment Method</h3>

                                        {/* Credit/Debit Card */}
                                        <button
                                            onClick={() => handlePaymentMethodSelect('card')}
                                            className="w-full p-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-teal-500 rounded-xl flex items-center gap-4 transition group"
                                        >
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                <CreditCard className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="text-white font-semibold">Credit / Debit Card</p>
                                                <p className="text-gray-400 text-sm">Visa, Mastercard, RuPay, Amex</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-400" />
                                        </button>

                                        {/* UPI */}
                                        <button
                                            onClick={() => handlePaymentMethodSelect('upi')}
                                            className="w-full p-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-teal-500 rounded-xl flex items-center gap-4 transition group"
                                        >
                                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="text-white font-semibold">UPI</p>
                                                <p className="text-gray-400 text-sm">Google Pay, PhonePe, Paytm, BHIM</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-400" />
                                        </button>

                                        {/* Net Banking */}
                                        <button
                                            onClick={() => handlePaymentMethodSelect('netbanking')}
                                            className="w-full p-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-teal-500 rounded-xl flex items-center gap-4 transition group"
                                        >
                                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                                                <Wallet className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="text-white font-semibold">Net Banking</p>
                                                <p className="text-gray-400 text-sm">All major banks supported</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-400" />
                                        </button>

                                        {/* Wallets */}
                                        <button
                                            onClick={() => handlePaymentMethodSelect('wallet')}
                                            className="w-full p-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-teal-500 rounded-xl flex items-center gap-4 transition group"
                                        >
                                            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
                                                <Sparkles className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="text-white font-semibold">Digital Wallets</p>
                                                <p className="text-gray-400 text-sm">Paytm, Amazon Pay, PhonePe</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-400" />
                                        </button>
                                    </div>
                                )}

                                {/* STEP 2: PAYMENT DETAILS */}
                                {paymentStep === 'details' && paymentMethod === 'card' && (
                                    <div className="space-y-4">
                                        <button onClick={() => setPaymentStep('method')} className="text-teal-400 hover:text-teal-300 flex items-center gap-1 text-sm mb-4">
                                            ← Back to payment methods
                                        </button>
                                        <h3 className="text-lg font-semibold text-white mb-4">Enter Card Details</h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">Card Number</label>
                                                <input
                                                    type="text"
                                                    placeholder="1234 5678 9012 3456"
                                                    maxLength={19}
                                                    value={paymentData.cardNumber}
                                                    onChange={(e) => setPaymentData({ ...paymentData, cardNumber: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">Cardholder Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="JOHN DOE"
                                                    value={paymentData.cardName}
                                                    onChange={(e) => setPaymentData({ ...paymentData, cardName: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                                                />
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Month</label>
                                                    <input
                                                        type="text"
                                                        placeholder="MM"
                                                        maxLength={2}
                                                        value={paymentData.expiryMonth}
                                                        onChange={(e) => setPaymentData({ ...paymentData, expiryMonth: e.target.value })}
                                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                                                    <input
                                                        type="text"
                                                        placeholder="YY"
                                                        maxLength={2}
                                                        value={paymentData.expiryYear}
                                                        onChange={(e) => setPaymentData({ ...paymentData, expiryYear: e.target.value })}
                                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">CVV</label>
                                                    <input
                                                        type="password"
                                                        placeholder="123"
                                                        maxLength={3}
                                                        value={paymentData.cvv}
                                                        onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value })}
                                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={processPayment}
                                                className="w-full py-3 bg-teal-500 hover:bg-teal-600 rounded-xl text-white font-semibold transition mt-6"
                                            >
                                                Pay {formatCurrency(mockDashboardData.activeLoan.nextEmiAmount)}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {paymentStep === 'details' && paymentMethod === 'upi' && (
                                    <div className="space-y-4">
                                        <button onClick={() => setPaymentStep('method')} className="text-teal-400 hover:text-teal-300 flex items-center gap-1 text-sm mb-4">
                                            ← Back to payment methods
                                        </button>
                                        <h3 className="text-lg font-semibold text-white mb-4">Enter UPI ID</h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">UPI ID</label>
                                                <input
                                                    type="text"
                                                    placeholder="yourname@paytm"
                                                    value={paymentData.upiId}
                                                    onChange={(e) => setPaymentData({ ...paymentData, upiId: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                                                />
                                                <p className="text-gray-400 text-xs mt-2">Enter your UPI ID (e.g., name@gpay, name@paytm)</p>
                                            </div>
                                            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                                                <p className="text-blue-400 text-sm">You will receive a payment request on your UPI app</p>
                                            </div>
                                            <button
                                                onClick={processPayment}
                                                className="w-full py-3 bg-teal-500 hover:bg-teal-600 rounded-xl text-white font-semibold transition"
                                            >
                                                Send Payment Request
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {paymentStep === 'details' && paymentMethod === 'netbanking' && (
                                    <div className="space-y-4">
                                        <button onClick={() => setPaymentStep('method')} className="text-teal-400 hover:text-teal-300 flex items-center gap-1 text-sm mb-4">
                                            ← Back to payment methods
                                        </button>

                                        {netBankingStep === 'select' ? (
                                            <>
                                                <h3 className="text-lg font-semibold text-white mb-4">Select Your Bank</h3>
                                                <div className="space-y-3">
                                                    {[
                                                        { name: 'State Bank of India', logo: '🏦' },
                                                        { name: 'HDFC Bank', logo: '🏦' },
                                                        { name: 'ICICI Bank', logo: '🏦' },
                                                        { name: 'Axis Bank', logo: '🏦' },
                                                        { name: 'Kotak Mahindra Bank', logo: '🏦' },
                                                        { name: 'Punjab National Bank', logo: '🏦' },
                                                        { name: 'Bank of Baroda', logo: '🏦' },
                                                        { name: 'Canara Bank', logo: '🏦' }
                                                    ].map((bank) => (
                                                        <button
                                                            key={bank.name}
                                                            onClick={() => handleBankSelect(bank.name)}
                                                            className="w-full p-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-teal-500 rounded-xl flex items-center gap-3 text-left transition group"
                                                        >
                                                            <div className="text-2xl">{bank.logo}</div>
                                                            <div className="flex-1">
                                                                <p className="text-white font-medium">{bank.name}</p>
                                                                <p className="text-gray-400 text-xs">Retail & Corporate Banking</p>
                                                            </div>
                                                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-400" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setNetBankingStep('select')}
                                                    className="text-teal-400 hover:text-teal-300 flex items-center gap-1 text-sm mb-4"
                                                >
                                                    ← Change Bank
                                                </button>
                                                <div className="p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/50 rounded-xl mb-4">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="text-2xl">🏦</div>
                                                        <div>
                                                            <p className="text-white font-semibold">{paymentData.bankName}</p>
                                                            <p className="text-gray-400 text-xs">Internet Banking Login</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <h3 className="text-lg font-semibold text-white mb-4">Login to Complete Payment</h3>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-300 mb-2">User ID / Customer ID</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter your User ID"
                                                            value={paymentData.bankUserId}
                                                            onChange={(e) => setPaymentData({ ...paymentData, bankUserId: e.target.value })}
                                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-300 mb-2">Password / IPIN</label>
                                                        <input
                                                            type="password"
                                                            placeholder="Enter your password"
                                                            value={paymentData.bankPassword}
                                                            onChange={(e) => setPaymentData({ ...paymentData, bankPassword: e.target.value })}
                                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                                                        />
                                                    </div>

                                                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                                                        <div className="flex gap-2">
                                                            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                                            <div>
                                                                <p className="text-yellow-400 text-sm font-medium mb-1">Security Notice</p>
                                                                <p className="text-yellow-300/80 text-xs">
                                                                    This is a mock payment gateway. Your actual bank credentials are never stored or transmitted.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="p-3 bg-gray-800 rounded-xl border border-gray-700">
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="text-gray-400">Payment Amount</span>
                                                            <span className="text-white font-semibold">{formatCurrency(mockDashboardData.activeLoan.nextEmiAmount)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-400">Payee</span>
                                                            <span className="text-white">Secure Identity Hub</span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={processPayment}
                                                        disabled={!paymentData.bankUserId || !paymentData.bankPassword}
                                                        className="w-full py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition"
                                                    >
                                                        Proceed to Pay
                                                    </button>

                                                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                                                        <Shield className="w-3 h-3" />
                                                        <span>Protected by 2048-bit encryption</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {paymentStep === 'details' && paymentMethod === 'wallet' && (
                                    <div className="space-y-4">
                                        <button onClick={() => setPaymentStep('method')} className="text-teal-400 hover:text-teal-300 flex items-center gap-1 text-sm mb-4">
                                            ← Back to payment methods
                                        </button>
                                        <h3 className="text-lg font-semibold text-white mb-4">Select Digital Wallet</h3>

                                        <div className="space-y-3">
                                            {['Paytm Wallet', 'PhonePe Wallet', 'Amazon Pay', 'Mobikwik', 'Freecharge'].map((wallet) => (
                                                <button
                                                    key={wallet}
                                                    onClick={() => {
                                                        setPaymentData({ ...paymentData, walletType: wallet });
                                                        processPayment();
                                                    }}
                                                    className="w-full p-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-teal-500 rounded-xl text-left text-white transition"
                                                >
                                                    {wallet}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: PROCESSING */}
                                {paymentStep === 'processing' && (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                        <h3 className="text-xl font-semibold text-white mb-2">Processing Payment...</h3>
                                        <p className="text-gray-400">Please wait while we process your payment</p>
                                    </div>
                                )}

                                {/* STEP 4: SUCCESS */}
                                {paymentStep === 'success' && (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="w-10 h-10 text-green-400" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
                                        <p className="text-gray-400 mb-6">Transaction ID: TXN{Date.now().toString().slice(-10)}</p>
                                        <div className="p-4 bg-gray-800 rounded-xl mb-6 text-left max-w-sm mx-auto">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-gray-400">Amount Paid</span>
                                                <span className="text-white font-semibold">{formatCurrency(mockDashboardData.activeLoan.nextEmiAmount)}</span>
                                            </div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-gray-400">Payment Method</span>
                                                <span className="text-white">{paymentMethod?.toUpperCase()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Date & Time</span>
                                                <span className="text-white">{new Date().toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={closePaymentGateway}
                                            className="px-6 py-3 bg-teal-500 hover:bg-teal-600 rounded-xl text-white font-semibold transition"
                                        >
                                            Done
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Security Badge */}
                            {paymentStep !== 'success' && (
                                <div className="p-4 bg-gray-800 border-t border-gray-700 flex items-center justify-center gap-2">
                                    <Shield className="w-4 h-4 text-green-400" />
                                    <p className="text-sm text-gray-400">Secured by 256-bit SSL encryption</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // DOCUMENTS SECTION
    const renderDocumentsSection = () => (
        <div className="space-y-6">
            <div className="p-6 bg-gray-800 rounded-2xl border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-6">Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { name: "PAN Card", status: "Verified", date: "2024-01-15" },
                        { name: "Aadhaar Card", status: "Verified", date: "2024-01-15" },
                        { name: "Income Proof", status: "Pending", date: null },
                        { name: "Bank Statements", status: "Pending", date: null },
                    ].map((doc, index) => (
                        <div key={index} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FolderOpen className="w-5 h-5 text-teal-400" />
                                <div>
                                    <p className="text-white font-medium">{doc.name}</p>
                                    {doc.date && <p className="text-gray-500 text-xs">Uploaded: {doc.date}</p>}
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${doc.status === 'Verified'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                {doc.status}
                            </span>
                        </div>
                    ))}
                </div>
                <button className="mt-4 w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition">
                    + Upload Document
                </button>
            </div>
        </div>
    );

    // Account & Security Functions


    // Account & Security Functions (Moved to top)
    const getRealSecurityData = () => {
        if (sessions && sessions.length > 0) {
            // Sort by started_at desc if not already
            const sortedSessions = [...sessions].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
            const latestSession = sortedSessions[0];

            return {
                lastLogin: latestSession.started_at,
                lastLoginDevice: {
                    browser: latestSession.browser || "Unknown",
                    os: latestSession.os || "Unknown",
                    location: latestSession.location || "Unknown"
                },
                otpLoginEnabled: false, // Default
                activeSessions: sortedSessions.map((s, index) => ({
                    id: s.id,
                    device: `${s.browser || 'Unknown'} on ${s.os || 'Unknown'}`,
                    location: s.location || "Unknown",
                    lastActive: s.last_activity || s.started_at,
                    isCurrent: index === 0 // Approximation
                }))
            };
        }
        return profileData?.security || mockProfileData.security;
    };

    const getRealConsentData = () => {
        if (!accountData) return profileData?.consents || mockProfileData.consents;

        const consentDate = accountData.created_at || new Date().toISOString();
        const baseConsents = [];

        if (accountData.terms_consent) {
            baseConsents.push({
                id: "terms-1",
                version: "v2.1",
                purpose: "Terms of Service",
                acceptedAt: consentDate,
                consentType: "terms"
            });
        }
        if (accountData.privacy_consent) {
            baseConsents.push({
                id: "privacy-1",
                version: "v1.8",
                purpose: "Privacy Policy",
                acceptedAt: consentDate,
                consentType: "privacy"
            });
        }
        if (accountData.data_consent) {
            baseConsents.push({
                id: "credit-1",
                version: "v1.0",
                purpose: "Credit Bureau Data Access",
                acceptedAt: consentDate,
                consentType: "credit_bureau"
            });
        }

        // Always include Marketing as accepted for now if account exists, or omit
        // using mock defaults if array is empty to avoid broken UI
        if (baseConsents.length === 0) return profileData?.consents || mockProfileData.consents;

        return baseConsents;
    };


    // SECURITY & SETTINGS SECTION (Combined)
    const renderSecuritySection = () => (
        <div className="space-y-6">
            {/* Sub-navigation tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { key: "account", label: "Account Details", icon: User },

                    { key: "security", label: "Security", icon: Shield },
                    { key: "consent", label: "Consent", icon: FileText },
                    { key: "communication", label: "Communication", icon: Bell },
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setSecuritySubSection(tab.key as typeof securitySubSection)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition ${securitySubSection === tab.key
                                ? 'bg-teal-900 text-teal-400 border border-teal-700'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Account Details Tab */}
            {securitySubSection === "account" && (
                <div className="space-y-6">
                    {/* Profile Overview - Moved Here */}
                    {profileData?.user && <ProfileOverview user={profileData.user} />}

                    {/* Account Information Card */}
                    <div className="p-6 bg-gray-800 rounded-2xl border border-gray-700">
                        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <User className="w-5 h-5 text-teal-400" />
                            Account Information
                        </h3>
                        {accountLoading ? (
                            <p className="text-gray-400">Loading account details...</p>
                        ) : accountData ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-xl">
                                    <p className="text-gray-400 text-sm">Customer ID</p>
                                    <p className="text-white font-mono font-semibold text-lg">{accountData.customer_id}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl">
                                    <p className="text-gray-400 text-sm">Full Name</p>
                                    <p className="text-white font-semibold">{accountData.title} {accountData.first_name} {accountData.middle_name} {accountData.last_name}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl">
                                    <p className="text-gray-400 text-sm">Mobile Number</p>
                                    <p className="text-white font-medium">{accountData.mobile_number}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl">
                                    <p className="text-gray-400 text-sm">Email Address</p>
                                    <p className="text-white font-medium">{accountData.email}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl">
                                    <p className="text-gray-400 text-sm">Date of Birth</p>
                                    <p className="text-white font-medium">{accountData.date_of_birth || 'Not set'}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl">
                                    <p className="text-gray-400 text-sm">Gender</p>
                                    <p className="text-white font-medium">{accountData.gender || 'Not set'}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl md:col-span-2">
                                    <p className="text-gray-400 text-sm">Address</p>
                                    <p className="text-white font-medium">
                                        {accountData.address_line1}, {accountData.address_line2}, {accountData.city}, {accountData.state} - {accountData.pincode}
                                    </p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl">
                                    <p className="text-gray-400 text-sm">PAN Number</p>
                                    <p className="text-white font-mono">{accountData.pan_number ? `${accountData.pan_number.slice(0, 4)}****${accountData.pan_number.slice(-2)}` : 'Not set'}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl">
                                    <p className="text-gray-400 text-sm">KYC Status</p>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${accountData.kyc_verified
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                        }`}>
                                        {accountData.kyc_verified ? '✓ Verified' : '⏳ Pending'}
                                    </span>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl">
                                    <p className="text-gray-400 text-sm">Account Created</p>
                                    <p className="text-white font-medium">{new Date(accountData.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl">
                                    <p className="text-gray-400 text-sm">Account Role</p>
                                    <span className="px-3 py-1 bg-teal-500/20 text-teal-400 rounded-full text-sm font-medium">
                                        {accountData.role === 'bank_officer' ? 'Bank Officer' : 'Customer'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400">Unable to load account details</p>
                        )}
                    </div>

                    {/* Error/Success Messages */}
                    {changeError && (
                        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">{changeError}</div>
                    )}
                    {changeSuccess && (
                        <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400">{changeSuccess}</div>
                    )}

                    {/* Change Password Card */}
                    <div className="p-6 bg-gray-800 rounded-2xl border border-gray-700">
                        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-teal-400" />
                            Change Password
                        </h3>
                        <div className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.current}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.new_password}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                                    placeholder="Enter new password (min 8 characters)"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.confirm}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <button
                                onClick={handleChangePassword}
                                className="w-full py-3 bg-teal-500 hover:bg-teal-600 rounded-xl text-white font-semibold transition"
                            >
                                Change Password
                            </button>
                        </div>
                    </div>

                    {/* Change PIN Card */}
                    <div className="p-6 bg-gray-800 rounded-2xl border border-gray-700">
                        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-teal-400" />
                            Change PIN
                        </h3>
                        <div className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Current PIN</label>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={pinForm.current}
                                    onChange={(e) => setPinForm({ ...pinForm, current: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 tracking-widest"
                                    placeholder="••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">New PIN (6 digits)</label>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={pinForm.new_pin}
                                    onChange={(e) => setPinForm({ ...pinForm, new_pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 tracking-widest"
                                    placeholder="••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Confirm New PIN</label>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={pinForm.confirm}
                                    onChange={(e) => setPinForm({ ...pinForm, confirm: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 tracking-widest"
                                    placeholder="••••••"
                                />
                            </div>
                            <button
                                onClick={handleChangePin}
                                className="w-full py-3 bg-teal-500 hover:bg-teal-600 rounded-xl text-white font-semibold transition"
                            >
                                Change PIN
                            </button>
                        </div>
                    </div>

                    {/* Security Notice */}
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-yellow-400 font-medium">Security Notice</p>
                                <p className="text-gray-400 text-sm mt-1">
                                    Password and PIN changes are logged for security. Never share your credentials with anyone.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-section content - Other tabs */}

            {securitySubSection === "security" && <SecurityManagement security={getRealSecurityData()} />}
            {securitySubSection === "consent" && <ConsentPermissions consents={getRealConsentData()} />}
            {securitySubSection === "communication" && <CommunicationPreferences preferences={profileData.preferences} />}
        </div>
    );

    // ACTIVITY LOG SECTION - REAL API INTEGRATION

    // ACTIVITY LOG SECTION (Functions moved to top)


    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "CRITICAL": return "bg-red-500/20 text-red-400 border-red-500/30";
            case "WARNING": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
            default: return "bg-teal-500/20 text-teal-400 border-teal-500/30";
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "SECURITY": return <Shield className="w-4 h-4" />;
            case "LOAN": return <FileText className="w-4 h-4" />;
            case "KYC": return <FolderOpen className="w-4 h-4" />;
            case "PAYMENT": return <CreditCard className="w-4 h-4" />;
            default: return <User className="w-4 h-4" />;
        }
    };

    const terminateSession = async (sessionId: string) => {
        try {
            const token = localStorage.getItem('access_token');
            await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchActivityData("sessions");
        } catch (error) {
            console.error("Failed to terminate session:", error);
        }
    };

    const renderActivitySection = () => (
        <div className="space-y-6">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 p-2 bg-gray-900 rounded-xl border border-gray-800">
                {[
                    { key: "all", label: "All Activity", icon: History },
                    { key: "security", label: "Security", icon: Shield },
                    { key: "loans", label: "Loans", icon: FileText },
                    { key: "kyc", label: "KYC", icon: FolderOpen },
                    { key: "payments", label: "Payments", icon: CreditCard },
                    { key: "profile", label: "Profile", icon: User },
                    { key: "sessions", label: "Sessions", icon: Menu },
                ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activityTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActivityTab(tab.key as typeof activityTab)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${isActive
                                ? "bg-teal-900 text-teal-400 border border-teal-700"
                                : "text-gray-400 hover:bg-gray-700 hover:text-white"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Sessions Tab */}
            {activityTab === "sessions" ? (
                <div className="p-6 bg-gray-800 rounded-2xl border border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Menu className="w-5 h-5 text-teal-400" />
                            Active Sessions
                        </h3>
                        <span className="px-3 py-1 bg-teal-500/20 text-teal-400 rounded-full text-sm">
                            {sessions.length} active
                        </span>
                    </div>
                    {sessions.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No active sessions found</p>
                    ) : (
                        <div className="space-y-4">
                            {sessions.map((session: SessionItem) => (
                                <div key={session.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-teal-500/20 rounded-full flex items-center justify-center">
                                            {session.device_type === "Mobile" ? (
                                                <Menu className="w-5 h-5 text-teal-400" />
                                            ) : (
                                                <Menu className="w-5 h-5 text-teal-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{session.device_type} - {session.browser}</p>
                                            <p className="text-gray-400 text-sm">{session.os} • {session.location}</p>
                                            <p className="text-gray-500 text-xs mt-1">
                                                Started: {new Date(session.started_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {session.is_new_device && (
                                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">New Device</span>
                                        )}
                                        <button
                                            onClick={() => terminateSession(session.id)}
                                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition"
                                        >
                                            End Session
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Activity Events */
                <div className="p-6 bg-gray-800 rounded-2xl border border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                            <History className="w-5 h-5 text-teal-400" />
                            {activityTab === "all" ? "All Activity" : `${activityTab.charAt(0).toUpperCase() + activityTab.slice(1)} Activity`}
                        </h3>
                        <span className="text-gray-400 text-sm">
                            {activityData.total_events || activityData.events?.length || 0} events
                        </span>
                    </div>

                    {activityLoading ? (
                        <div className="text-center py-8 text-gray-400">Loading activity...</div>
                    ) : !activityData.events || activityData.events.length === 0 ? (
                        <div className="text-center py-8">
                            <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">No activity found in this category</p>
                            <p className="text-gray-500 text-sm mt-1">Your actions will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activityData.events.map((event: ActivityEvent, index: number) => (
                                <div key={event.id || index} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getSeverityColor(event.severity)}`}>
                                            {getCategoryIcon(event.category)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-white font-medium">{event.description || event.action}</p>
                                                <span className={`px-2 py-0.5 rounded text-xs ${getSeverityColor(event.severity)}`}>
                                                    {event.severity}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(event.timestamp).toLocaleString()}
                                                </span>
                                                {event.device && event.device !== "Unknown - Unknown" && (
                                                    <span className="flex items-center gap-1">
                                                        <Menu className="w-3 h-3" />
                                                        {event.device}
                                                    </span>
                                                )}
                                                {event.location && event.location !== "Unknown, Unknown" && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {event.location}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Security Notice */}
            <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-teal-400 font-medium">RBI Compliance Notice</p>
                        <p className="text-gray-400 text-sm mt-1">
                            All activities are logged immutably for regulatory compliance. Logs cannot be modified or deleted.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    // NOTIFICATIONS SECTION
    const renderNotificationsSection = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-semibold text-white">Notifications</h3>
                    <p className="text-gray-400 text-sm">Stay updated with your loan status and alerts</p>
                </div>
                <button
                    onClick={fetchNotifications}
                    className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    title="Refresh Notifications"
                >
                    <RefreshCw className={`w-5 h-5 ${notificationsLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="space-y-4">
                {notificationsLoading ? (
                    <div className="text-center py-12">
                        <Loader className="w-8 h-8 text-teal-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-400">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700/50">
                        <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No notifications yet</h3>
                        <p className="text-gray-400">You're all caught up!</p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div
                            key={notif.id}
                            className={`p-4 rounded-xl border transition-all ${notif.status === 'sent'
                                ? 'bg-gray-800/80 border-teal-500/30 ring-1 ring-teal-500/20'
                                : 'bg-gray-800/40 border-gray-700/50'
                                }`}
                        >
                            <div className="flex gap-4">
                                <div className={`p-2 rounded-lg h-fit ${notif.type === 'LOAN_DECISION' ? 'bg-blue-500/20 text-blue-400' :
                                    notif.type === 'LOAN_DISBURSED' ? 'bg-green-500/20 text-green-400' :
                                        notif.type === 'DOCUMENT_REQUEST' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-gray-700 text-gray-300'
                                    }`}>
                                    {notif.type === 'LOAN_DECISION' ? <FileText className="w-5 h-5" /> :
                                        notif.type === 'LOAN_DISBURSED' ? <Wallet className="w-5 h-5" /> :
                                            notif.type === 'DOCUMENT_REQUEST' ? <FolderOpen className="w-5 h-5" /> :
                                                <Bell className="w-5 h-5" />}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-white font-medium mb-1">
                                        {notif.trigger?.replace(/_/g, ' ') || 'Notification'}
                                    </h4>
                                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{notif.message}</p>
                                    <span className="text-xs text-gray-500 mt-2 block">
                                        {new Date(notif.sent_at).toLocaleString()}
                                    </span>
                                </div>
                                {notif.status === 'sent' && (
                                    <div className="w-2 h-2 rounded-full bg-teal-500 mt-2"></div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    // SUPPORT SECTION
    const renderSupportSection = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-semibold text-white">Support Tickets</h3>
                    <p className="text-gray-400 text-sm">Track your requests and issues</p>
                </div>
                <button
                    onClick={() => setShowTicketModal(true)}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg flex items-center gap-2 transition"
                >
                    <Plus className="w-4 h-4" /> Raise Ticket
                </button>
            </div>

            {/* Ticket List */}
            {ticketsLoading ? (
                <div className="text-center py-8 text-gray-400">Loading tickets...</div>
            ) : tickets.length === 0 ? (
                <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
                    <HelpCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No support tickets found</p>
                    <p className="text-sm text-gray-500 mt-1">Need help? Raise a ticket above.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {tickets.map((ticket) => (
                        <div key={ticket.id} className="p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-teal-500/50 transition">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-teal-400 font-mono text-sm">{ticket.ticket_id}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs ${ticket.status === 'OPEN' ? 'bg-green-500/20 text-green-400' :
                                            ticket.status === 'RESOLVED' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {ticket.status}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs ${ticket.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                                            ticket.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {ticket.priority}
                                        </span>
                                    </div>
                                    <h4 className="text-white font-medium text-lg">{ticket.subject}</h4>
                                    <p className="text-sm text-gray-400 mt-1">{ticket.category}</p>
                                </div>
                                <span className="text-xs text-gray-500">
                                    {new Date(ticket.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            {/* Messages Preview */}
                            {ticket.messages && ticket.messages.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-700">
                                    <p className="text-sm text-gray-300 line-clamp-2">
                                        <span className="text-gray-500">Last message:</span> {ticket.messages[ticket.messages.length - 1].message}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* TICKET MODAL */}
            {showTicketModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowTicketModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-teal-400" />
                            Raise Support Ticket
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                    placeholder="Brief description of issue"
                                    value={ticketForm.subject}
                                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                                    <select
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-teal-500 outline-none"
                                        value={ticketForm.category}
                                        onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                                    >
                                        <option>General</option>
                                        <option>Loan Application</option>
                                        <option>Repayments</option>
                                        <option>KYC / Documents</option>
                                        <option>Technical Issue</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
                                    <select
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-teal-500 outline-none"
                                        value={ticketForm.priority}
                                        onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                                    >
                                        <option>Low</option>
                                        <option>Medium</option>
                                        <option>High</option>
                                        <option>Critical</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Message</label>
                                <textarea
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-teal-500 outline-none min-h-[120px]"
                                    placeholder="Describe your issue in detail..."
                                    value={ticketForm.message}
                                    onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                                ></textarea>
                            </div>

                            <button
                                onClick={handleCreateTicket}
                                disabled={!ticketForm.subject || !ticketForm.message}
                                className="w-full py-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition mt-2"
                            >
                                Submit Ticket
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Us Card */}
            <div className="mt-8 p-6 bg-gradient-to-br from-teal-900/30 to-blue-900/30 rounded-2xl border border-teal-500/30">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-teal-400" />
                    Contact Us
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-white/5 rounded-xl">
                        <p className="text-gray-400 text-sm mb-1">Customer Care (Toll-Free)</p>
                        <p className="text-white font-semibold text-lg">1800-XXX-XXXX</p>
                        <p className="text-gray-500 text-xs mt-1">Mon-Sat: 9 AM - 6 PM</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl">
                        <p className="text-gray-400 text-sm mb-1">Email Support</p>
                        <p className="text-teal-400 font-medium">support@loanadvisor.com</p>
                        <p className="text-gray-500 text-xs mt-1">Response within 24 hours</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl">
                        <p className="text-gray-400 text-sm mb-1">Branch Locator</p>
                        <button className="text-teal-400 font-medium hover:underline">Find Nearest Branch →</button>
                        <p className="text-gray-500 text-xs mt-1">500+ branches across India</p>
                    </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-400 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        For loan disbursement queries, please have your Application ID ready.
                    </p>
                </div>
            </div>
        </div>
    );

    // MAIN RENDER
    const renderActiveSection = () => {
        switch (activeSection) {
            case "home": return renderHomeSection();
            case "loans": return renderLoansSection();
            case "apply": return renderApplySection();
            case "repayments": return renderRepaymentsSection();
            case "notifications": return renderNotificationsSection();
            case "documents": return renderDocumentsSection();
            case "security": return renderSecuritySection();
            case "activity": return renderActivitySection();
            case "support": return renderSupportSection();
            default: return renderHomeSection();
        }
    };

    const activeNavItem = navItems.find(item => item.key === activeSection);

    return (
        <main className="relative min-h-screen bg-gray-900">
            <SmokeyBackground className="fixed inset-0" color="#14b8a6" />

            <div className="relative z-10 flex min-h-screen">
                {/* Sidebar */}
                <aside
                    className={`fixed lg:static inset-y-0 left-0 z-30 flex flex-col bg-gray-900/95 backdrop-blur-xl border-r border-white/10 transition-all duration-300 ${sidebarOpen ? "w-72" : "w-0 lg:w-20"
                        }`}
                >
                    {/* Sidebar Header */}
                    <div className={`flex items-center justify-between p-4 border-b border-white/10 ${!sidebarOpen && "lg:justify-center"}`}>
                        {sidebarOpen && (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center">
                                    <Home className="w-5 h-5 text-teal-400" />
                                </div>
                                <div>
                                    <h1 className="text-white font-bold text-lg">LoanAdvisor</h1>
                                    <p className="text-gray-400 text-xs">Banking Portal</p>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors lg:block hidden"
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 py-4 overflow-y-auto">
                        <ul className="space-y-1 px-3">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeSection === item.key;
                                return (
                                    <li key={item.key}>
                                        <button
                                            onClick={() => handleSectionChange(item.key)}
                                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${isActive
                                                ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                                                }`}
                                            title={!sidebarOpen ? item.label : undefined}
                                        >
                                            <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-teal-400" : "text-gray-500 group-hover:text-teal-400"}`} />
                                            {sidebarOpen && (
                                                <>
                                                    <div className="flex-1 text-left">
                                                        <p className="text-sm font-medium">{item.label}</p>
                                                        <p className="text-xs text-gray-500">{item.description}</p>
                                                    </div>
                                                    {isActive && <ChevronRight className="w-4 h-4" />}
                                                </>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* User Info & Logout */}
                    {sidebarOpen && (
                        <div className="p-4 border-t border-white/10">
                            <button
                                onClick={() => {
                                    setActiveSection('security');
                                    setSecuritySubSection('account');
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 mb-3 transition-colors cursor-pointer"
                            >
                                <div className="w-10 h-10 bg-teal-500/20 rounded-full flex items-center justify-center">
                                    <span className="text-teal-400 font-semibold text-sm">
                                        {profileData.user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-white text-sm font-medium truncate">{profileData.user.fullName}</p>
                                    <p className="text-gray-500 text-xs truncate">Customer ID: {accountData?.customer_id || profileData.user.id}</p>
                                </div>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium transition-colors"
                            >
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                    )}
                </aside>

                {/* Mobile Overlay */}
                {isMobile && sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-20"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Mobile Menu Button */}
                {isMobile && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="fixed top-4 left-4 z-20 p-3 bg-gray-800/90 backdrop-blur-sm rounded-xl border border-white/10 text-white lg:hidden"
                    >
                        <Menu size={20} />
                    </button>
                )}

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-h-screen">
                    {/* Header */}
                    <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-xl border-b border-white/10 px-6 py-4">
                        <div className="flex items-center justify-between max-w-6xl mx-auto">
                            <div>
                                <h2 className="text-xl font-bold text-white">{activeNavItem?.label}</h2>
                                <p className="text-sm text-gray-400">{activeNavItem?.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${profileData.user.accountStatus === 'kyc_verified'
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    }`}>
                                    {profileData.user.accountStatus === 'kyc_verified' ? '✓ Verified' : '⏳ Pending'}
                                </span>
                            </div>
                        </div>
                    </header>

                    {/* Content Area */}
                    <div className="flex-1 p-6 overflow-auto">
                        <div className="max-w-6xl mx-auto">
                            {renderActiveSection()}
                        </div>
                    </div>

                    {/* Footer */}
                    <footer className="border-t border-white/10 px-6 py-4">
                        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-gray-500">
                            <p>© 2025 LoanAdvisor. All rights reserved.</p>
                            <p>Protected by RBI-compliant security protocols</p>
                        </div>
                    </footer>
                </div>
            </div>

            {/* Application Details Modal */}
            {showApplicationModal && viewingApplication && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-auto">
                        <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-6 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white">Application Details</h2>
                            <button
                                onClick={() => {
                                    setShowApplicationModal(false);
                                    setViewingApplication(null);
                                }}
                                className="p-2 hover:bg-white/10 rounded-lg transition"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Tracking ID - Prominent Display */}
                            <div className="p-5 bg-gradient-to-r from-teal-900/40 to-blue-900/40 rounded-xl border-2 border-teal-500/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Tracking ID</div>
                                        <div className="text-3xl font-bold font-mono text-teal-400 tracking-wider">
                                            {viewingApplication.tracking_id || viewingApplication.id.substring(0, 8).toUpperCase()}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">Use this ID for all communications</div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const trackingId = viewingApplication.tracking_id || viewingApplication.id.substring(0, 8).toUpperCase();
                                            navigator.clipboard.writeText(trackingId);
                                            alert('Tracking ID copied to clipboard!');
                                        }}
                                        className="px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 rounded-lg transition flex items-center gap-2"
                                        title="Copy Tracking ID"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Copy
                                    </button>
                                </div>
                            </div>

                            {/* Status Banner */}
                            <div className={`p-4 rounded-xl border-2 ${
                                viewingApplication.decision === 'APPROVED' ? 'bg-green-500/10 border-green-500/30' :
                                viewingApplication.decision === 'REJECTED' ? 'bg-red-500/10 border-red-500/30' :
                                'bg-yellow-500/10 border-yellow-500/30'
                            }`}>
                                <div className="text-sm text-gray-400 mb-2">Status</div>
                                <div className={`text-2xl font-bold ${
                                    viewingApplication.decision === 'APPROVED' ? 'text-green-400' :
                                    viewingApplication.decision === 'REJECTED' ? 'text-red-400' :
                                    'text-yellow-400'
                                }`}>
                                    {viewingApplication.decision}
                                </div>
                                {viewingApplication.approval_probability && (
                                    <div className="text-sm text-gray-400 mt-1">
                                        Approval Probability: {viewingApplication.approval_probability.toFixed(1)}%
                                    </div>
                                )}
                            </div>

                            {/* Loan Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-800/50 rounded-xl border border-white/5">
                                    <div className="text-sm text-gray-400 mb-1">Loan Amount</div>
                                    <div className="text-xl font-bold text-white">₹{viewingApplication.loan_amount.toLocaleString()}</div>
                                </div>

                                <div className="p-4 bg-gray-800/50 rounded-xl border border-white/5">
                                    <div className="text-sm text-gray-400 mb-1">Purpose</div>
                                    <div className="text-xl font-bold text-white">{viewingApplication.loan_purpose}</div>
                                </div>

                                {viewingApplication.interest_rate && (
                                    <div className="p-4 bg-gray-800/50 rounded-xl border border-white/5">
                                        <div className="text-sm text-gray-400 mb-1">Interest Rate</div>
                                        <div className="text-xl font-bold text-white">{viewingApplication.interest_rate}% p.a.</div>
                                    </div>
                                )}

                                <div className="p-4 bg-gray-800/50 rounded-xl border border-white/5">
                                    <div className="text-sm text-gray-400 mb-1">Applied On</div>
                                    <div className="text-xl font-bold text-white">
                                        {new Date(viewingApplication.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            {/* KYC Status */}
                            {viewingApplication.kyc_status && (
                                <div className="p-4 bg-gray-800/50 rounded-xl border border-white/5">
                                    <div className="text-sm text-gray-400 mb-2">KYC Status</div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        viewingApplication.kyc_status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                                        viewingApplication.kyc_status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
                                        viewingApplication.kyc_status === 'BLOCKED' ? 'bg-red-500/20 text-red-400' :
                                        'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                        {viewingApplication.kyc_status === 'COMPLETED' ? 'Completed' :
                                         viewingApplication.kyc_status === 'IN_PROGRESS' ? 'In Progress' :
                                         viewingApplication.kyc_status === 'BLOCKED' ? 'Blocked' : 'Pending'}
                                    </span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-white/10">
                                {viewingApplication.decision === 'APPROVED' && viewingApplication.kyc_status !== 'COMPLETED' && (
                                    <button
                                        onClick={() => {
                                            setShowApplicationModal(false);
                                            setSelectedApplicationId(viewingApplication.id);
                                            setActiveSection('apply');
                                        }}
                                        className="flex-1 px-4 py-3 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 rounded-lg font-medium transition"
                                    >
                                        Complete KYC
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setShowApplicationModal(false);
                                        setViewingApplication(null);
                                    }}
                                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
