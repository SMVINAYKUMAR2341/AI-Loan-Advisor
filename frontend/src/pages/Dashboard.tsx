"use client";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "../services/api";
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
    Activity, CheckSquare, Search, AlertTriangle
} from "lucide-react";

// Charts - Professional visualization
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, RadialBarChart, RadialBar, AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, CartesianGrid, ReferenceLine } from 'recharts';

// Section Types
type SectionKey = "home" | "loans" | "apply" | "repayments" | "documents" | "security" | "activity" | "support";

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
        explanations: Array<{ factor: string; impact: string; description: string }>;
        kyc_required: boolean;
        next_steps: string[];
        application_id?: string;  // Added for KYC workflow
    }

    const [advisorResult, setAdvisorResult] = useState<LoanAdvisorResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [showCoApplicant, setShowCoApplicant] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [showQrCode, setShowQrCode] = useState(false);

    // KYC WORKFLOW STATE
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
        documents: any[];
    }

    interface BankDetails {
        id: string;
        account_holder_name: string;
        bank_name: string;
        account_number_masked: string;
        ifsc_code: string;
        is_verified: boolean;
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
    }

    const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
    const [kycLoading, setKycLoading] = useState(false);
    const [kycStep, setKycStep] = useState(1);
    const [kycError, setKycError] = useState('');
    const [kycSuccess, setKycSuccess] = useState('');
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

    // Account & Security State (moved here to comply with Rules of Hooks)
    const [accountData, setAccountData] = useState<any>(null);
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
            }
        } catch (error) {
            console.error("Failed to fetch account:", error);
        }
        setAccountLoading(false);
    };

    useEffect(() => {
        if (activeSection === "security" && !accountData) {
            fetchAccountData();
        }
    }, [activeSection]);

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
    const [activityTab, setActivityTab] = useState<"all" | "security" | "loans" | "kyc" | "payments" | "profile" | "sessions">("all");
    const [activityData, setActivityData] = useState<any>({ events: [], total_events: 0 });
    const [activityLoading, setActivityLoading] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);

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
                // Set current step based on status
                if (data.step_3_agreement === 'COMPLETED') setKycStep(4);
                else if (data.step_2_bank_details === 'COMPLETED') setKycStep(3);
                else if (data.step_1_docs_uploaded >= 2) setKycStep(2);
                else setKycStep(1);
            } else if (response.status === 403) {
                setKycStatus(null); // Not eligible
            }
        } catch (error) {
            console.error("KYC fetch error:", error);
        }
        setKycLoading(false);
    };

    const uploadDocument = async (appId: string, docType: string, docCategory: string) => {
        setKycError('');
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `${API_BASE_URL}/kyc/${appId}/documents?document_type=${docType}&document_category=${docCategory}`,
                {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            if (response.ok) {
                setKycSuccess(`${docCategory} document uploaded successfully!`);
                fetchKycStatus(appId);
            } else {
                const error = await response.json();
                setKycError(error.detail || 'Upload failed');
            }
        } catch (error) {
            setKycError('Network error uploading document');
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
                    consent_text_acknowledged: "I have read and agree to all terms and conditions of this loan agreement."
                })
            });
            if (response.ok) {
                setKycSuccess('Agreement signed successfully!');
                fetchKycStatus(appId);
                setKycStep(4);
            } else {
                const error = await response.json();
                setKycError(error.detail || 'Signing failed');
            }
        } catch (error) {
            setKycError('Network error signing agreement');
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
                    </div>
                </div>
            </div>
        </div>
    );

    // MY LOANS SECTION
    const renderLoansSection = () => (
        <div className="space-y-6">
            <div className="p-6 bg-gray-800 rounded-2xl border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-6">My Loans</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left py-3 px-4 text-gray-400 font-medium">Loan ID</th>
                                <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                                <th className="text-left py-3 px-4 text-gray-400 font-medium">Amount</th>
                                <th className="text-left py-3 px-4 text-gray-400 font-medium">Outstanding</th>
                                <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-white/5 hover:bg-white/5 transition">
                                <td className="py-4 px-4 text-white font-mono text-sm">{mockDashboardData.activeLoan.loanId}</td>
                                <td className="py-4 px-4 text-white">{mockDashboardData.activeLoan.type}</td>
                                <td className="py-4 px-4 text-white">{formatCurrency(mockDashboardData.activeLoan.sanctionedAmount)}</td>
                                <td className="py-4 px-4 text-yellow-400">{formatCurrency(mockDashboardData.activeLoan.outstandingAmount)}</td>
                                <td className="py-4 px-4">
                                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">Active</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

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
        } catch (error: any) {
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
        // KYC PAGE TRANSIITON: If KYC is started, show ONLY the KYC section (Next Page)
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
                        <p className="text-gray-400">Your comprehensive loan eligibility assessment</p>
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
                                <div className="text-5xl font-bold text-white">{advisorResult.approval_probability.toFixed(0)}%</div>
                                <div className="text-gray-400">Approval Score</div>
                            </div>
                        </div>
                    </div>

                    {/* KYC STATUS SUMMARY PANEL */}
                    {(advisorResult.decision === 'APPROVED' || advisorResult.decision === 'PENDING_REVIEW') && (
                        <div className="p-6 bg-gray-900/50 rounded-2xl border border-teal-500/30 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-teal-400" />
                                    KYC Verification Summary
                                </h4>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${kycStatus?.is_complete ? 'bg-green-500/20 text-green-400' : 'bg-teal-500/10 text-teal-400'}`}>
                                    {kycStatus?.is_complete ? '✓ Fully Verified' : 'In Progress'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Step 1: Documents */}
                                <div className={`p-4 rounded-xl border transition-all ${kycStatus && kycStatus.step_1_docs_uploaded >= 2 ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-800/50 border-gray-700'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Identity Proofs</span>
                                        {kycStatus && kycStatus.step_1_docs_uploaded >= 2 ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Clock className="w-4 h-4 text-gray-500" />}
                                    </div>
                                    <p className="text-xl font-bold text-white leading-none">{kycStatus?.step_1_docs_uploaded || 0} <span className="text-sm font-normal text-gray-500">of 2</span></p>
                                    <p className="text-[10px] text-gray-500 mt-2 uppercase">Required for verification</p>
                                </div>

                                {/* Step 2: Bank Linking */}
                                <div className={`p-4 rounded-xl border transition-all ${kycStatus?.step_2_bank_linked ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-800/50 border-gray-700'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Bank Linking</span>
                                        {kycStatus?.step_2_bank_linked ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Clock className="w-4 h-4 text-gray-500" />}
                                    </div>
                                    <p className="text-xl font-bold text-white leading-none">{kycStatus?.step_2_bank_linked ? 'Linked' : 'Pending'}</p>
                                    <p className="text-[10px] text-gray-500 mt-2 uppercase">Account for disbursement</p>
                                </div>

                                {/* Step 3: Agreement */}
                                <div className={`p-4 rounded-xl border transition-all ${kycStatus?.step_3_signed ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-800/50 border-gray-700'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Loan Agreement</span>
                                        {kycStatus?.step_3_signed ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Clock className="w-4 h-4 text-gray-500" />}
                                    </div>
                                    <p className="text-xl font-bold text-white leading-none">{kycStatus?.step_3_signed ? 'Signed' : 'Pending'}</p>
                                    <p className="text-[10px] text-gray-500 mt-2 uppercase">Digital e-signature</p>
                                </div>
                            </div>
                        </div>
                    )}

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
                                    <span className="text-gray-400">Debt-to-Income Ratio</span>
                                    <span className="text-white font-semibold">{advisorResult.income_analysis.debt_to_income_ratio}%</span>
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
                                    <p className="text-2xl font-bold text-white">{advisorResult.approval_probability}%</p>
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
                                            const totalImpact = factors.reduce((sum: number, f: any) =>
                                                sum + Math.abs(f.shap_value || 0.15) * 100, 0);

                                            return factors.map((f: any, idx: number) => {
                                                const impactValue = Math.abs(f.shap_value || 0.15) * 100;
                                                const normalizedPercent = (impactValue / totalImpact) * 100;
                                                return (
                                                    <div key={idx} className="group">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${f.impact === 'positive' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                    {f.impact === 'positive' ? '↑' : '↓'}
                                                                </span>
                                                                <span className="text-gray-300 text-sm font-medium">{f.factor.length > 18 ? f.factor.substring(0, 18) + '...' : f.factor}</span>
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
                                                {advisorResult.approval_probability}%
                                            </text>
                                            <text x="50%" y="58%" textAnchor="middle" fill={advisorResult.approval_probability >= 60 ? '#22C55E' : advisorResult.approval_probability >= 35 ? '#F59E0B' : '#EF4444'} fontSize="16" fontWeight="600">
                                                {advisorResult.decision}
                                            </text>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                                formatter={(value: any, name: string) => name === 'Remaining' ? null : [`${value}%`, 'ML Confidence']}
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
                                                formatter={(value: any, name: string) => [`₹${value.toLocaleString()}`, name]}
                                                labelStyle={{ color: '#1F2937', fontWeight: 'bold' }}
                                                itemStyle={{ color: '#374151' }}
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                iconType="circle"
                                                formatter={(value: string, entry: any) => {
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
                                                formatter={(value: any, name: string) => [`${value.toFixed(1)}%`, name === 'you' ? 'Your Value' : 'Ideal Target']}
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
                                            formatter={(value: any) => [`${value.toFixed(0)}/100`, '']}
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

                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Shield className="w-6 h-6 text-green-400" />
                    Complete Your KYC
                    <span className="text-sm font-normal text-gray-300 ml-2">Required for Disbursement</span>
                </h3>

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
                        <p className="text-gray-400 text-sm">Upload at least 2 documents: one ID proof and one address proof.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: "Aadhaar Card", type: "ADDRESS_PROOF", code: "AADHAAR", icon: FileText, desc: "Address Proof" },
                                { label: "PAN Card", type: "ID_PROOF", code: "PAN", icon: FileText, desc: "Identity Proof" },
                                { label: "Passport", type: "ADDRESS_PROOF", code: "PASSPORT", icon: Shield, desc: "Address Proof" },
                                { label: "Driving License", type: "ID_PROOF", code: "DRIVING_LICENSE", icon: CreditCard, desc: "Identity Proof" }
                            ].map((doc, idx) => {
                                const Icon = doc.icon;
                                return (
                                    <button
                                        key={doc.code}
                                        onClick={() => uploadDocument(applicationId, doc.type, doc.code)}
                                        className="flex items-center gap-4 p-4 bg-gray-800 hover:bg-gray-700 border border-white/10 hover:border-teal-500/50 rounded-xl transition-all group text-left"
                                    >
                                        <div className="w-12 h-12 bg-teal-900 rounded-full flex items-center justify-center group-hover:bg-teal-800 transition">
                                            <Icon className="w-6 h-6 text-teal-400 group-hover:scale-110 transition" />
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold">{doc.label}</p>
                                            <p className="text-gray-400 text-xs">{doc.desc}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Uploaded Documents */}
                        {kycStatus && kycStatus.documents.length > 0 && (
                            <div className="mt-4 p-4 bg-gray-800 rounded-xl">
                                <h5 className="text-white font-medium mb-2">Uploaded: {kycStatus.step_1_docs_uploaded}/2</h5>
                                <div className="space-y-2">
                                    {kycStatus.documents.map((doc: any) => (
                                        <div key={doc.id} className="flex items-center justify-between p-2 bg-green-900 rounded-lg">
                                            <span className="text-green-400 text-sm">{doc.document_type}</span>
                                            <span className="text-xs text-gray-400">{doc.verification_status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {kycStatus && kycStatus.step_1_docs_uploaded >= 2 && (
                            <button
                                onClick={() => setKycStep(2)}
                                className="w-full mt-4 py-3 bg-gradient-to-r from-teal-500 to-green-500 rounded-xl text-white font-semibold"
                            >
                                Continue to Bank Details →
                            </button>
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

                {/* Step 3: Agreement */}
                {kycStep === 3 && (
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-teal-400" />
                            Step 3: Sign Loan Agreement
                        </h4>

                        {!agreement && (
                            <button
                                onClick={() => fetchAgreement(applicationId)}
                                className="w-full py-3 bg-blue-900 border border-blue-500/30 rounded-xl text-blue-400"
                            >
                                Load Agreement
                            </button>
                        )}

                        {agreement && (
                            <div className="p-4 bg-gray-800 rounded-xl border border-white/10">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="text-center p-3 bg-teal-900 rounded-lg">
                                        <p className="text-teal-400 text-2xl font-bold">₹{agreement.loan_amount.toLocaleString()}</p>
                                        <p className="text-gray-400 text-xs">Loan Amount</p>
                                    </div>
                                    <div className="text-center p-3 bg-blue-900 rounded-lg">
                                        <p className="text-blue-400 text-2xl font-bold">{agreement.interest_rate}%</p>
                                        <p className="text-gray-400 text-xs">Annual Rate</p>
                                    </div>
                                    <div className="text-center p-3 bg-purple-900 rounded-lg">
                                        <p className="text-purple-400 text-2xl font-bold">₹{agreement.emi_amount.toLocaleString()}</p>
                                        <p className="text-gray-400 text-xs">Monthly EMI</p>
                                    </div>
                                    <div className="text-center p-3 bg-orange-900 rounded-lg">
                                        <p className="text-orange-400 text-2xl font-bold">{agreement.tenure_months}</p>
                                        <p className="text-gray-400 text-xs">Months</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-800 rounded-lg max-h-60 overflow-y-auto mb-4">
                                    <pre className="text-gray-300 text-sm whitespace-pre-wrap">{agreement.agreement_text}</pre>
                                </div>

                                <label className="flex items-start gap-3 p-4 bg-yellow-900 border border-yellow-500/30 rounded-xl cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={agreementConsent}
                                        onChange={(e) => setAgreementConsent(e.target.checked)}
                                        className="w-5 h-5 mt-0.5 rounded border-gray-500"
                                    />
                                    <span className="text-yellow-400 text-sm">
                                        I have read and agree to all terms and conditions of this loan agreement. I understand the repayment obligations and consequences of default.
                                    </span>
                                </label>

                                <button
                                    onClick={() => signAgreement(applicationId)}
                                    disabled={!agreementConsent}
                                    className="w-full mt-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 disabled:opacity-50 rounded-xl text-white font-semibold"
                                >
                                    ✍️ Sign Agreement Digitally
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 4: Complete */}
                {kycStep === 4 && (
                    <div className="text-center space-y-6">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                        <h4 className="text-2xl font-bold text-white">Almost There!</h4>
                        <p className="text-gray-400">All steps completed. Click below to finalize your KYC.</p>

                        {kycStatus?.can_proceed_to_disbursement ? (
                            <div className="p-6 bg-green-900 border border-green-500/30 rounded-xl">
                                <p className="text-green-400 text-xl font-semibold">🎉 KYC Completed Successfully!</p>
                                <p className="text-gray-300 mt-2">Disbursement will be processed within 24-48 hours.</p>
                            </div>
                        ) : (
                            <button
                                onClick={() => completeKyc(applicationId)}
                                className="px-8 py-4 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl text-white font-bold text-lg"
                            >
                                Complete KYC & Request Disbursement
                            </button>
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
    const renderRepaymentsSection = () => (
        <div className="space-y-6">
            <div className="p-6 bg-gray-800 rounded-2xl border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-6">Repayments & EMIs</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                        <p className="text-gray-400 text-sm">Next EMI Due</p>
                        <p className="text-2xl font-bold text-white mt-1">{formatCurrency(mockDashboardData.activeLoan.nextEmiAmount)}</p>
                        <p className="text-yellow-400 text-sm mt-1 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(mockDashboardData.activeLoan.nextEmiDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                        <p className="text-gray-400 text-sm">EMIs Paid</p>
                        <p className="text-2xl font-bold text-white mt-1">{mockDashboardData.activeLoan.paidEmis}</p>
                        <p className="text-green-400 text-sm mt-1">of {mockDashboardData.activeLoan.tenure} months</p>
                    </div>
                    <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl">
                        <p className="text-gray-400 text-sm">Interest Rate</p>
                        <p className="text-2xl font-bold text-white mt-1">{mockDashboardData.activeLoan.interestRate}%</p>
                        <p className="text-teal-400 text-sm mt-1">per annum</p>
                    </div>
                </div>
                <button
                    onClick={handlePayNow}
                    className="w-full py-3 bg-teal-500 hover:bg-teal-600 rounded-xl text-white font-semibold transition"
                >
                    Pay Now
                </button>
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

            {securitySubSection === "security" && <SecurityManagement security={profileData.security} />}
            {securitySubSection === "consent" && <ConsentPermissions consents={profileData.consents} />}
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
                            onClick={() => setActivityTab(tab.key as any)}
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
                            {sessions.map((session: any) => (
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
                            {activityData.events.map((event: any, index: number) => (
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

    // SUPPORT SECTION
    const renderSupportSection = () => (
        <div className="space-y-6">
            <div className="p-6 bg-gray-800 rounded-2xl border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-6">Support & Help</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition group">
                        <HelpCircle className="w-8 h-8 text-teal-400 mb-3 group-hover:scale-110 transition" />
                        <p className="text-white font-medium">FAQs</p>
                        <p className="text-gray-400 text-sm">Find answers to common questions</p>
                    </button>
                    <button className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition group">
                        <FileText className="w-8 h-8 text-teal-400 mb-3 group-hover:scale-110 transition" />
                        <p className="text-white font-medium">Raise a Ticket</p>
                        <p className="text-gray-400 text-sm">Submit a support request</p>
                    </button>
                </div>
                <div className="mt-6 p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl">
                    <p className="text-teal-400 font-medium">24/7 Customer Support</p>
                    <p className="text-gray-300">Call us at: 1800-XXX-XXXX (Toll Free)</p>
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
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 mb-3">
                                <div className="w-10 h-10 bg-teal-500/20 rounded-full flex items-center justify-center">
                                    <span className="text-teal-400 font-semibold text-sm">
                                        {profileData.user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{profileData.user.fullName}</p>
                                    <p className="text-gray-500 text-xs truncate">Customer ID: {profileData.user.id.slice(0, 8)}</p>
                                </div>
                            </div>
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
        </main>
    );
}
