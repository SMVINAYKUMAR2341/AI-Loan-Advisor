import { ProfileData } from '@/types/profile';

export const mockProfileData: ProfileData = {
  user: {
    id: 'usr_x7k9m2p4',
    fullName: 'Rajesh Kumar Sharma',
    email: 'rajesh.sharma@email.com',
    phone: '+919876543210',
    accountStatus: 'kyc_verified',
    createdAt: '2024-03-15T10:30:00Z',
    avatarUrl: undefined,
  },
  kyc: {
    status: 'verified',
    completionDate: '2024-03-20T14:45:00Z',
    verificationsCompleted: [
      { type: 'aadhaar', status: 'verified', verifiedAt: '2024-03-18T11:20:00Z' },
      { type: 'pan', status: 'verified', verifiedAt: '2024-03-18T11:25:00Z' },
      { type: 'selfie', status: 'verified', verifiedAt: '2024-03-19T09:15:00Z' },
      { type: 'bank_statement', status: 'verified', verifiedAt: '2024-03-20T14:45:00Z' },
    ],
  },
  security: {
    lastLogin: '2024-12-24T08:30:00Z',
    lastLoginDevice: {
      browser: 'Chrome 120',
      os: 'Windows 11',
      location: 'Mumbai, India',
    },
    otpLoginEnabled: true,
    activeSessions: [
      {
        id: 'sess_1',
        device: 'Chrome on Windows',
        location: 'Mumbai, India',
        lastActive: '2024-12-24T08:30:00Z',
        isCurrent: true,
      },
      {
        id: 'sess_2',
        device: 'Safari on iPhone',
        location: 'Mumbai, India',
        lastActive: '2024-12-23T19:45:00Z',
        isCurrent: false,
      },
    ],
  },
  consents: [
    {
      id: 'cons_1',
      version: 'v2.1',
      purpose: 'Terms of Service',
      acceptedAt: '2024-03-15T10:30:00Z',
      consentType: 'terms',
    },
    {
      id: 'cons_2',
      version: 'v1.8',
      purpose: 'Privacy Policy',
      acceptedAt: '2024-03-15T10:30:00Z',
      consentType: 'privacy',
    },
    {
      id: 'cons_3',
      version: 'v1.0',
      purpose: 'Credit Bureau Data Access',
      acceptedAt: '2024-03-18T11:20:00Z',
      consentType: 'credit_bureau',
    },
    {
      id: 'cons_4',
      version: 'v1.2',
      purpose: 'Marketing Communications',
      acceptedAt: '2024-03-15T10:32:00Z',
      consentType: 'marketing',
    },
  ],
  preferences: {
    smsNotifications: true,
    emailNotifications: true,
    paymentReminders: true,
    promotionalOffers: false,
    criticalAlerts: true,
  },
  financial: {
    employmentType: 'salaried',
    incomeRange: '5l_10l',
    creditHealth: 'high',
  },
  activityLog: [
    {
      id: 'log_1',
      type: 'login',
      description: 'Logged in from Chrome on Windows',
      timestamp: '2024-12-24T08:30:00Z',
      metadata: { device: 'Chrome 120 / Windows 11', location: 'Mumbai, India' },
    },
    {
      id: 'log_2',
      type: 'preference_change',
      description: 'Disabled promotional offers notifications',
      timestamp: '2024-12-22T15:20:00Z',
    },
    {
      id: 'log_3',
      type: 'security_change',
      description: 'Enabled OTP-based login',
      timestamp: '2024-12-20T10:15:00Z',
    },
    {
      id: 'log_4',
      type: 'login',
      description: 'Logged in from Safari on iPhone',
      timestamp: '2024-12-19T14:30:00Z',
      metadata: { device: 'Safari / iOS 17', location: 'Mumbai, India' },
    },
    {
      id: 'log_5',
      type: 'profile_update',
      description: 'Updated email address',
      timestamp: '2024-12-15T09:45:00Z',
    },
    {
      id: 'log_6',
      type: 'consent_update',
      description: 'Accepted updated Privacy Policy v1.8',
      timestamp: '2024-12-10T11:30:00Z',
    },
    {
      id: 'log_7',
      type: 'login',
      description: 'Logged in from Chrome on MacOS',
      timestamp: '2024-12-08T16:20:00Z',
      metadata: { device: 'Chrome 119 / MacOS', location: 'Pune, India' },
    },
  ],
};

// Helper functions to mask sensitive data
export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
};

export const maskPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return `+91 ****${digits.slice(-4)}`;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return formatDate(dateString);
};