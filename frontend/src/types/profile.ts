// Profile Types for Bank-Grade Customer Profile

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  accountStatus: 'active' | 'kyc_pending' | 'kyc_verified' | 'suspended';
  createdAt: string;
  avatarUrl?: string;
}

export interface KYCStatus {
  status: 'not_started' | 'in_progress' | 'verified' | 'failed';
  completionDate?: string;
  verificationsCompleted: {
    type: 'aadhaar' | 'pan' | 'bank_statement' | 'selfie';
    status: 'pending' | 'verified' | 'failed';
    verifiedAt?: string;
  }[];
}

export interface SecuritySettings {
  lastLogin: string;
  lastLoginDevice: {
    browser: string;
    os: string;
    location?: string;
  };
  otpLoginEnabled: boolean;
  activeSessions: {
    id: string;
    device: string;
    location: string;
    lastActive: string;
    isCurrent: boolean;
  }[];
}

export interface ConsentRecord {
  id: string;
  version: string;
  purpose: string;
  acceptedAt: string;
  consentType: 'terms' | 'privacy' | 'marketing' | 'credit_bureau';
}

export interface CommunicationPreferences {
  smsNotifications: boolean;
  emailNotifications: boolean;
  paymentReminders: boolean;
  promotionalOffers: boolean;
  criticalAlerts: boolean; // Always on, cannot be disabled
}

export interface FinancialProfile {
  employmentType?: 'salaried' | 'self_employed' | 'business_owner' | 'retired' | 'student';
  incomeRange?: 'below_3l' | '3l_5l' | '5l_10l' | '10l_25l' | 'above_25l';
  creditHealth: 'low' | 'medium' | 'high' | 'excellent';
}

export interface ActivityLogEntry {
  id: string;
  type: 'login' | 'profile_update' | 'security_change' | 'consent_update' | 'preference_change';
  description: string;
  timestamp: string;
  metadata?: {
    device?: string;
    location?: string;
    ipAddress?: string;
  };
}

export interface ProfileData {
  user: UserProfile;
  kyc: KYCStatus;
  security: SecuritySettings;
  consents: ConsentRecord[];
  preferences: CommunicationPreferences;
  financial: FinancialProfile;
  activityLog: ActivityLogEntry[];
}