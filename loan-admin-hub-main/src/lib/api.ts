// API Configuration for Bank Admin Hub
// Connects to the same backend as customer frontend

export const API_BASE_URL = 'http://localhost:8000';

// Helper to get auth token (admin must be logged in)
export const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

// Generic fetch wrapper with error handling
export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...getAuthHeaders(),
            ...(options?.headers || {})
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Network error' }));
        throw new Error(error.detail || 'Request failed');
    }

    return response.json();
}

// Helper for file downloads
export async function downloadFile(endpoint: string, filename: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: getAuthHeaders() // This already includes Content-Type: application/json, might need to override
    });

    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Admin API endpoints
export const adminApi = {
    // Dashboard
    getStats: () => apiFetch<{
        total_loans: number;
        pending_review: number;
        approved: number;
        rejected: number;
        total_disbursed: number;
        approval_rate: number;
    }>('/admin/dashboard/stats'),

    // Applications
    getApplications: (status?: string) => {
        const query = status ? `?status=${status}` : '';
        return apiFetch<any[]>(`/admin/applications${query}`);
    },

    getApplicationDetails: (id: string) =>
        apiFetch<any>(`/admin/applications/${id}`),

    downloadReport: (id: string, trackingId?: string) =>
        downloadFile(`/admin/applications/${id}/download-report`, `Loan_Report_${trackingId || id}.pdf`),

    // Customers
    getCustomers: () => apiFetch<any[]>('/admin/customers'),

    // Disbursements
    processDisbursement: (appId: string, transactionRef: string, remarks?: string) =>
        apiFetch<{ message: string; disbursement_id: string }>(
            `/admin/disbursements/${appId}?transaction_ref=${transactionRef}${remarks ? `&remarks=${remarks}` : ''}`,
            { method: 'POST' }
        ),

    getDisbursements: () => apiFetch<any[]>('/admin/disbursements'),

    // EMI Repayments - View customer payments
    getRepayments: () => apiFetch<{
        id: string;
        user_id: string;
        customer_name: string;
        emi_number: number;
        amount: number;
        payment_method: string;
        status: string;
        paid_at: string;
    }[]>('/admin/repayments'),

    // Notifications
    sendNotification: (userId: string, type: 'sms' | 'email', trigger: string, message: string) =>
        apiFetch<{ message: string; notification_id: string }>(
            `/admin/notifications/send?user_id=${userId}&notification_type=${type}&trigger=${trigger}&message=${encodeURIComponent(message)}`,
            { method: 'POST' }
        ),

    getNotifications: () => apiFetch<any[]>('/admin/notifications'),

    // Documents (KYC)
    getDocuments: (status?: string) => {
        const query = status ? `?status=${status}` : '';
        return apiFetch<any[]>(`/admin/documents${query}`);
    },

    verifyDocument: (docId: string, status: 'VERIFIED' | 'REJECTED', notes?: string) =>
        apiFetch<{ message: string; id: string }>(
            `/admin/documents/${docId}/verify?status=${status}${notes ? `&notes=${encodeURIComponent(notes)}` : ''}`,
            { method: 'POST' }
        ),

    // Loan Agreements
    getAgreement: (appId: string) =>
        apiFetch<{
            id: string;
            application_id: string;
            agreement_version: string;
            loan_amount: number;
            interest_rate: number;
            tenure_months: number;
            emi_amount: number;
            processing_fee: number;
            total_payable: number;
            agreement_summary: string;
            consent_given: boolean;
            signed_at: string | null;
            status: string;
        }>(`/admin/applications/${appId}/agreement`),

    // Admin Profile
    getProfile: () =>
        apiFetch<{
            id: string;
            customer_id: string;
            email: string;
            mobile_number: string;
            first_name: string;
            last_name: string;
            role: string;
            created_at: string;
        }>('/admin/profile'),

    updateProfile: (data: { first_name?: string; last_name?: string; email?: string }) =>
        apiFetch<{ message: string }>(
            `/admin/profile?${new URLSearchParams(data as Record<string, string>).toString()}`,
            { method: 'PUT' }
        ),
};

