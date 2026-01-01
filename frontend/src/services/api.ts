/**
 * API Service Layer for Backend Communication
 * Handles all API calls to FastAPI backend with JWT authentication
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// =============================================================================
// TOKEN MANAGEMENT
// =============================================================================

export function getToken(): string | null {
    return localStorage.getItem('access_token');
}

export function setToken(token: string): void {
    localStorage.setItem('access_token', token);
}

export function removeToken(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    localStorage.removeItem('first_name');
}

export function isAuthenticated(): boolean {
    return !!getToken();
}

// Helper for authenticated requests
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = getToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    return fetch(url, { ...options, headers });
}

// =============================================================================
// TYPES
// =============================================================================

export interface SignupData {
    mobile_number: string;
    email: string;
    password: string;
    pin?: string;
    security_hint?: string;
    role?: string;
    terms_consent: boolean;
    privacy_consent: boolean;
    data_consent: boolean;
    remember_device: boolean;
    enable_passkey: boolean;
    title?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    date_of_birth?: string;
    gender?: string;
    nationality?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    same_as_permanent?: boolean;
    pan_number?: string;
    aadhaar_last4?: string;
    aadhaar_consent?: boolean;
    kyc_skipped?: boolean;
    final_consent?: boolean;
    has_signature?: boolean;
    signature_data?: string;
}

export interface LoginData {
    mobile_number: string;
    password: string;
    customer_id?: string;
    email?: string;
    pin?: string;
}

export interface UserResponse {
    id: string;
    customer_id: string | null;
    mobile_number: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    role: string;
    kyc_verified: boolean;
    kyc_skipped: boolean;
    is_active: boolean;
    created_at: string;
}

export interface LoginResponse {
    message: string;
    user_id: string;
    customer_id: string | null;
    first_name: string | null;
    role: string;
    access_token: string;
    token_type: string;
}

export interface CreditScoreResponse {
    score_band: string;
    rating: string;
    factors: Array<{ factor: string; impact: string; description: string }>;
    last_updated: string;
    eligibility_amount: number;
    eligibility_products: string[];
}

export interface EligibilityResponse {
    has_application: boolean;
    pre_approved_amount: number | null;
    max_eligible_amount: number;
    eligible_products: string[];
    approval_probability: number | null;
    credit_rating: string | null;
    income_to_emi_ratio: number | null;
}

export interface RepaymentItem {
    id: string;
    emi_number: number;
    due_date: string;
    emi_amount: number;
    principal_component: number;
    interest_component: number;
    outstanding_principal: number;
    payment_status: string;
    payment_date: string | null;
    payment_reference: string | null;
    late_fee: number;
}

export interface EMIScheduleResponse {
    application_id: string;
    loan_amount: number;
    interest_rate: number;
    tenure_months: number;
    monthly_emi: number;
    total_interest: number;
    total_repayment: number;
    schedule: RepaymentItem[];
    paid_emis: number;
    pending_emis: number;
    overdue_emis: number;
    next_emi_date: string | null;
    next_emi_amount: number | null;
}

export interface UpcomingEMI {
    application_id: string;
    loan_type: string;
    emi_number: number;
    due_date: string;
    emi_amount: number;
    days_until_due: number;
    is_overdue: boolean;
}

export interface KYCDocument {
    id: string;
    application_id: string;
    document_type: string;
    file_name: string;
    file_size: number | null;
    verification_status: string;
    verification_notes: string | null;
    uploaded_at: string;
    verified_at: string | null;
}

export interface ActivityEvent {
    id: string;
    action: string;
    entity_type: string | null;
    description: string | null;
    created_at: string;
    extra_data: Record<string, any> | null;
}

export interface ApplicationItem {
    id: string;
    user_id: string;
    customer_name: string | null;
    customer_id: string | null;
    loan_amount: number;
    loan_purpose: string;
    decision: string;
    approval_probability: number;
    created_at: string;
    reviewed: boolean;
}

export interface ApiError {
    detail: string;
}

// =============================================================================
// AUTH FUNCTIONS
// =============================================================================

export async function signup(data: SignupData): Promise<UserResponse> {
    const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.detail || 'Registration failed');
    }

    return response.json();
}

export async function login(data: LoginData): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.detail || 'Login failed');
    }

    const result: LoginResponse = await response.json();

    // Store JWT token and user info
    setToken(result.access_token);
    localStorage.setItem('user_id', result.user_id);
    localStorage.setItem('user_role', result.role);
    if (result.first_name) {
        localStorage.setItem('first_name', result.first_name);
    }
    if (result.customer_id) {
        localStorage.setItem('customer_id', result.customer_id);
    }

    return result;
}

export function logout(): void {
    removeToken();
    window.location.href = '/login';
}

// =============================================================================
// USER PROFILE
// =============================================================================

export async function getCurrentUser(): Promise<UserResponse> {
    const response = await authFetch(`${API_BASE_URL}/user/me`);
    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.detail || 'Failed to fetch user');
    }
    return response.json();
}

export async function updateProfile(data: Partial<UserResponse>): Promise<UserResponse> {
    const response = await authFetch(`${API_BASE_URL}/user/profile`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.detail || 'Failed to update profile');
    }
    return response.json();
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await authFetch(`${API_BASE_URL}/user/password`, {
        method: 'PUT',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.detail || 'Failed to change password');
    }
    return response.json();
}

// =============================================================================
// CREDIT SCORE & ELIGIBILITY
// =============================================================================

export async function getCreditScore(): Promise<CreditScoreResponse> {
    const response = await authFetch(`${API_BASE_URL}/credit-score`);
    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.detail || 'Failed to fetch credit score');
    }
    return response.json();
}

export async function getEligibility(): Promise<EligibilityResponse> {
    const response = await authFetch(`${API_BASE_URL}/eligibility`);
    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.detail || 'Failed to fetch eligibility');
    }
    return response.json();
}

// =============================================================================
// LOAN APPLICATIONS
// =============================================================================

export async function submitLoanApplication(data: Record<string, any>): Promise<any> {
    const response = await authFetch(`${API_BASE_URL}/loan-application`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.detail || 'Failed to submit application');
    }
    return response.json();
}

export async function getMyApplications(): Promise<ApplicationItem[]> {
    const response = await authFetch(`${API_BASE_URL}/my-applications`);
    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.detail || 'Failed to fetch applications');
    }
    return response.json();
}

export async function getApplicationDetail(applicationId: string): Promise<any> {
    const response = await authFetch(`${API_BASE_URL}/application/${applicationId}`);
    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.detail || 'Failed to fetch application');
    }
    return response.json();
}

// =============================================================================
// REPAYMENTS & EMI
// =============================================================================

export async function getEMISchedule(applicationId: string): Promise<EMIScheduleResponse> {
    const response = await authFetch(`${API_BASE_URL}/repayments/${applicationId}`);
    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.detail || 'Failed to fetch EMI schedule');
    }
    return response.json();
}

export async function makePayment(repaymentId: string, paymentMethod: string): Promise<any> {
    const response = await authFetch(`${API_BASE_URL}/repayments/pay`, {
        method: 'POST',
        body: JSON.stringify({ repayment_id: repaymentId, payment_method: paymentMethod }),
    });
    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.detail || 'Payment failed');
    }
    return response.json();
}

export async function getUpcomingEMIs(): Promise<UpcomingEMI[]> {
    const response = await authFetch(`${API_BASE_URL}/repayments/upcoming`);
    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.detail || 'Failed to fetch upcoming EMIs');
    }
    return response.json();
}

// =============================================================================
// DOCUMENTS
// =============================================================================

export async function uploadDocument(applicationId: string, documentType: string): Promise<KYCDocument> {
    const response = await authFetch(`${API_BASE_URL}/documents/upload?application_id=${applicationId}&document_type=${documentType}`, {
        method: 'POST',
    });
    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.detail || 'Failed to upload document');
    }
    return response.json();
}

export async function getDocuments(applicationId: string): Promise<KYCDocument[]> {
    const response = await authFetch(`${API_BASE_URL}/documents/${applicationId}`);
    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.detail || 'Failed to fetch documents');
    }
    return response.json();
}

// =============================================================================
// ACTIVITY LOG
// =============================================================================

export async function getActivityLog(limit: number = 50): Promise<{ total_events: number; events: ActivityEvent[] }> {
    const response = await authFetch(`${API_BASE_URL}/activity?limit=${limit}`);
    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.detail || 'Failed to fetch activity log');
    }
    return response.json();
}

// =============================================================================
// BANK OFFICER FUNCTIONS
// =============================================================================

export async function getAllApplications(): Promise<ApplicationItem[]> {
    const response = await authFetch(`${API_BASE_URL}/applications`);
    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.detail || 'Failed to fetch applications');
    }
    return response.json();
}

export async function submitReview(applicationId: string, decision: string, justification: string): Promise<any> {
    const response = await authFetch(`${API_BASE_URL}/review`, {
        method: 'POST',
        body: JSON.stringify({
            application_id: applicationId,
            final_decision: decision,
            justification: justification
        }),
    });
    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.detail || 'Failed to submit review');
    }
    return response.json();
}

export async function verifyDocument(documentId: string, status: string, notes?: string): Promise<KYCDocument> {
    const response = await authFetch(`${API_BASE_URL}/documents/${documentId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ status, notes }),
    });
    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.detail || 'Failed to verify document');
    }
    return response.json();
}
