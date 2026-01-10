// API Configuration for Bank Admin Hub
// Connects to the same backend as customer frontend

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
    // Auth
    // Auth
    login: (credentials: { email: string; password: string; pin: string; admin_id: string }) =>
        fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        }).then(async res => {
            if (!res.ok) {
                const err = await res.json().catch(() => ({ detail: 'Login failed' }));
                throw new Error(err.detail || 'Login failed');
            }
            return res.json();
        }),

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

    getApplicationFullDetails: (id: string) =>
        apiFetch<any>(`/admin/applications/${id}/details`),

    updateApplicationDecision: (id: string, decision: string, justification: string) =>
        apiFetch<{ message: string; decision: string; application_id: string }>(
            `/admin/applications/${id}/decision?decision=${encodeURIComponent(decision)}&justification=${encodeURIComponent(justification)}`,
            { method: 'PUT' }
        ),

    requestDocuments: (id: string, documentTypes: string, message: string, requireOfficeVisit: boolean) =>
        apiFetch<{ message: string; documents_requested: string[]; office_visit_required: boolean }>(
            `/admin/applications/${id}/request-documents?document_types=${encodeURIComponent(documentTypes)}&message=${encodeURIComponent(message)}&require_office_visit=${requireOfficeVisit}`,
            { method: 'POST' }
        ),

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

    changePassword: (currentPassword: string, newPassword: string) =>
        apiFetch<{ message: string }>(
            `/admin/change-password?current_password=${encodeURIComponent(currentPassword)}&new_password=${encodeURIComponent(newPassword)}`,
            { method: 'PUT' }
        ),

    changePin: (currentPin: string, newPin: string) =>
        apiFetch<{ message: string }>(
            `/admin/change-pin?current_pin=${encodeURIComponent(currentPin)}&new_pin=${encodeURIComponent(newPin)}`,
            { method: 'PUT' }
        ),

    // Support Tickets
    getTickets: (status?: string) => {
        const query = status && status !== 'ALL' ? `?status=${status}` : '';
        return apiFetch<any[]>(`/admin/tickets${query}`);
    },

    getTicketDetails: (id: string) =>
        apiFetch<{
            id: string;
            ticket_id: string;
            subject: string;
            category: string;
            priority: string;
            status: string;
            created_at: string;
            user_id: string;
            messages: Array<{
                id: string;
                sender_type: string;
                message: string;
                created_at: string;
            }>;
            user?: {
                first_name: string;
                last_name: string;
                email: string;
            };
        }>(`/admin/tickets/${id}`),

    replyTicket: (ticketId: string, message: string) =>
        fetch(`${API_BASE_URL}/admin/tickets/${ticketId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
            },
            body: JSON.stringify({ message })
        }).then(res => res.json()),

    updateTicketStatus: (ticketId: string, status: string) =>
        fetch(`${API_BASE_URL}/admin/tickets/${ticketId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
            },
            body: JSON.stringify({ status })
        }).then(res => res.json()),

    sendBulkReminders: () =>
        fetch(`${API_BASE_URL}/admin/notifications/bulk-reminders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
            }
        }).then(res => res.json()),

    getReportsData: () =>
        fetch(`${API_BASE_URL}/admin/reports/stats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
            }
        }).then(res => res.json()),
};
