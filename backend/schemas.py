from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID


# =============================================================================
# USER SCHEMAS
# =============================================================================

class UserCreate(BaseModel):
    """Complete user registration data from signup form"""
    # Account Credentials (Step 1)
    mobile_number: str = Field(..., min_length=10, max_length=15, description="Mobile number")
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=8)
    pin: Optional[str] = Field(None, min_length=6, max_length=6)
    security_hint: Optional[str] = Field(None, max_length=50)
    role: str = "customer"  # customer or bank_officer
    
    # Consent (Step 1)
    terms_consent: bool = False
    privacy_consent: bool = False
    data_consent: bool = False
    remember_device: bool = False
    enable_passkey: bool = False
    
    # Personal Details (Step 2)
    title: Optional[str] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    nationality: str = "Indian"
    
    # Address (Step 3)
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = Field(None, max_length=6)
    same_as_permanent: bool = False
    
    # KYC (Step 4)
    pan_number: Optional[str] = Field(None, max_length=10)
    aadhaar_last4: Optional[str] = Field(None, max_length=4)
    aadhaar_consent: bool = False
    kyc_skipped: bool = False
    
    # Final Consent (Step 5)
    final_consent: bool = False
    has_signature: bool = False
    signature_data: Optional[str] = None  # Base64 encoded


class UserLogin(BaseModel):
    mobile_number: str
    password: str
    customer_id: Optional[str] = None
    email: Optional[str] = None
    pin: Optional[str] = None


class PasswordChange(BaseModel):
    """Request to change password"""
    current_password: str
    new_password: str


class PinChange(BaseModel):
    """Request to change PIN"""
    current_pin: str
    new_pin: str


class UserResponse(BaseModel):
    """Response after successful signup - Full account details"""
    id: UUID
    customer_id: Optional[str] = None
    mobile_number: str
    email: Optional[str] = None
    # Personal
    title: Optional[str] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    # Address
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    # KYC
    pan_number: Optional[str] = None
    kyc_verified: bool = False
    kyc_skipped: bool = False
    # Account status
    role: str = "customer"
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    message: str
    user_id: str
    customer_id: Optional[str] = None
    first_name: Optional[str] = None
    role: str
    access_token: str
    token_type: str = "bearer"


# =============================================================================
# JWT TOKEN SCHEMAS
# =============================================================================

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None


# =============================================================================
# LOAN APPLICATION SCHEMAS (ML INPUTS)
# =============================================================================

class LoanApplicationCreate(BaseModel):
    """ML Model Input Features - exactly what is sent to the trained model"""
    gender: str = "Male"
    age: int = Field(..., ge=18, le=100)
    employment_status: str  # Employed, Self-Employed, Unemployed
    education_level: str  # High School, Associate, Bachelor, Master, PhD
    experience: int = Field(..., ge=0)
    job_tenure: int = Field(..., ge=0)
    monthly_income: float = Field(..., gt=0)
    monthly_debt_payments: float = Field(..., ge=0)
    loan_amount: float = Field(..., gt=0)
    loan_duration: int = Field(..., ge=6, le=360)  # 6 months to 30 years
    loan_purpose: str  # PERSONAL, EDUCATION, MEDICAL, VENTURE, HOMEIMPROVEMENT, DEBTCONSOLIDATION
    marital_status: str  # Single, Married, Divorced, Widowed
    number_of_dependents: int = Field(..., ge=0)
    home_ownership_status: str  # Own, Rent, Mortgage, Other
    property_area: str = "Urban"  # Urban, Semi-Urban, Rural
    coapplicant_income: float = 0
    cibil_score: int = Field(..., ge=300, le=900)  # Mandatory CIBIL score entry
    previous_loan_defaults: str = "No"  # Yes/No - Whether applicant has previous loan defaults


class LoanApplicationResponse(BaseModel):
    """Response after loan application submission - for customer view"""
    id: UUID
    created_at: datetime
    
    # ML Decision
    decision: str  # APPROVED, REJECTED, PENDING_REVIEW
    decision_reason: str
    approval_probability: float  # 0-100 (display scaled)
    
    # Financial Details
    interest_rate: float
    emi: float
    total_repayment: float
    total_interest: float
    
    # Credit Assessment
    credit_score_band: str  # "750-800"
    credit_rating: str  # Excellent, Good, Fair, Poor
    
    # AI Explanation
    shap_summary: List[Dict[str, Any]]
    
    # Next Steps
    next_steps: List[str]
    kyc_required: bool

    class Config:
        from_attributes = True


class ApplicationListItem(BaseModel):
    """Summary view for listing applications"""
    id: UUID
    user_id: UUID
    customer_name: Optional[str] = None
    customer_id: Optional[str] = None
    loan_amount: float
    loan_purpose: str
    decision: str
    approval_probability: float
    created_at: datetime
    reviewed: bool = False

    class Config:
        from_attributes = True


class ApplicationDetailResponse(BaseModel):
    """Detailed application view - includes features for officer review"""
    id: UUID
    user_id: UUID
    customer_name: Optional[str] = None
    customer_id: Optional[str] = None
    
    # ML Input Features
    features: Dict[str, Any]
    
    # ML Outputs
    decision: str
    decision_reason: str
    approval_probability: float
    ml_probability: float
    
    # Financial
    interest_rate: float
    emi: float
    total_repayment: float
    total_interest: float
    credit_score_band: str
    credit_rating: str
    
    # AI Explanation
    shap_summary: List[Dict[str, Any]]
    model_version: str
    
    # Status
    created_at: datetime
    reviewed: bool = False
    officer_review: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


# =============================================================================
# OFFICER REVIEW SCHEMAS
# =============================================================================

class OfficerReviewCreate(BaseModel):
    """Officer review submission - only for PENDING_REVIEW cases"""
    application_id: UUID
    final_decision: str = Field(..., pattern="^(APPROVED|REJECTED)$")
    justification: str = Field(..., min_length=20)  # Require meaningful justification


class OfficerReviewResponse(BaseModel):
    """Officer review response"""
    id: UUID
    application_id: UUID
    officer_id: UUID
    final_decision: str
    justification: str
    reviewed_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# KYC DOCUMENT SCHEMAS
# =============================================================================

class KYCDocumentCreate(BaseModel):
    """Create KYC document upload"""
    application_id: UUID
    document_type: str  # PAN, AADHAAR, ADDRESS_PROOF, INCOME_PROOF, BANK_STATEMENT


class KYCDocumentResponse(BaseModel):
    """KYC document response"""
    id: UUID
    application_id: UUID
    document_type: str
    file_name: str
    file_size: Optional[int] = None
    verification_status: str  # PENDING, VERIFIED, REJECTED
    verification_notes: Optional[str] = None
    uploaded_at: datetime
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class KYCVerifyRequest(BaseModel):
    """Officer verification of document"""
    status: str = Field(..., pattern="^(VERIFIED|REJECTED)$")
    notes: Optional[str] = None


# =============================================================================
# REPAYMENT & EMI SCHEMAS
# =============================================================================

class RepaymentResponse(BaseModel):
    """Single EMI/repayment record"""
    id: UUID
    emi_number: int
    due_date: date
    emi_amount: float
    principal_component: float
    interest_component: float
    outstanding_principal: float
    payment_status: str  # DUE, PAID, OVERDUE
    payment_date: Optional[datetime] = None
    payment_reference: Optional[str] = None
    late_fee: float = 0

    class Config:
        from_attributes = True


class EMIScheduleResponse(BaseModel):
    """Complete EMI schedule for a loan"""
    application_id: UUID
    loan_amount: float
    interest_rate: float
    tenure_months: int
    monthly_emi: float
    total_interest: float
    total_repayment: float
    schedule: List[RepaymentResponse]
    
    # Summary
    paid_emis: int
    pending_emis: int
    overdue_emis: int
    next_emi_date: Optional[date] = None
    next_emi_amount: Optional[float] = None


class PaymentRequest(BaseModel):
    """Payment submission"""
    repayment_id: UUID
    payment_method: str  # UPI, CARD, NETBANKING
    payment_reference: Optional[str] = None  # Auto-generated if not provided


class PaymentResponse(BaseModel):
    """Payment confirmation"""
    success: bool
    message: str
    payment_reference: str
    emi_number: int
    amount_paid: float
    payment_date: datetime


class UpcomingEMIResponse(BaseModel):
    """Upcoming EMI summary"""
    application_id: UUID
    loan_type: str
    emi_number: int
    due_date: date
    emi_amount: float
    days_until_due: int
    is_overdue: bool


# =============================================================================
# CREDIT SCORE & ELIGIBILITY SCHEMAS
# =============================================================================

class CreditScoreDisplayResponse(BaseModel):
    """Credit score display for customer"""
    score_band: str  # "750-800"
    rating: str  # Excellent, Good, Fair, Poor
    factors: List[Dict[str, str]]  # Contributing factors
    last_updated: datetime
    eligibility_amount: Optional[float] = None
    eligibility_products: List[str] = []


class EligibilityResponse(BaseModel):
    """Pre-approved eligibility"""
    has_application: bool
    pre_approved_amount: Optional[float] = None
    max_eligible_amount: float
    eligible_products: List[str]
    approval_probability: Optional[float] = None
    credit_rating: Optional[str] = None
    income_to_emi_ratio: Optional[float] = None


# =============================================================================
# SECURITY & PROFILE SCHEMAS
# =============================================================================

class PasswordChangeRequest(BaseModel):
    """Change password"""
    current_password: str
    new_password: str = Field(..., min_length=8)


class ProfileUpdateRequest(BaseModel):
    """Update user profile"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class PreferencesUpdateRequest(BaseModel):
    """Update user preferences"""
    enable_passkey: Optional[bool] = None
    remember_device: Optional[bool] = None


# =============================================================================
# AUDIT LOG SCHEMAS
# =============================================================================

class AuditLogResponse(BaseModel):
    """Audit log entry"""
    id: UUID
    action: str
    entity_type: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    extra_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class ActivityTimelineResponse(BaseModel):
    """User activity timeline"""
    total_events: int
    events: List[AuditLogResponse]


# =============================================================================
# KYC WORKFLOW SCHEMAS
# =============================================================================

class BankDetailsSubmit(BaseModel):
    """Submit bank account for KYC Step 2"""
    account_holder_name: str
    bank_name: str
    account_number: str  # Will be encrypted
    confirm_account_number: str
    ifsc_code: str
    account_type: str = "SAVINGS"


class BankDetailsResponse(BaseModel):
    """Bank details response (masked)"""
    id: UUID
    account_holder_name: str
    bank_name: str
    account_number_masked: str  # ****1234
    ifsc_code: str
    account_type: str
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AgreementSignRequest(BaseModel):
    """Sign loan agreement"""
    consent_checkbox: bool  # Must be true
    consent_text_acknowledged: str  # The text they agreed to


class LoanAgreementResponse(BaseModel):
    """Loan agreement details"""
    id: UUID
    agreement_version: str
    loan_amount: float
    interest_rate: float
    tenure_months: int
    emi_amount: float
    processing_fee: float
    total_payable: float
    agreement_summary: str
    consent_given: bool
    signed_at: Optional[datetime] = None
    status: str

    class Config:
        from_attributes = True


class KYCStatusResponse(BaseModel):
    """KYC progress status"""
    application_id: UUID
    loan_status: str
    kyc_eligible: bool
    step_1_documents: str
    step_1_docs_required: int
    step_1_docs_uploaded: int
    step_1_docs_verified: int
    step_2_bank_details: str
    step_3_agreement: str
    overall_status: str
    can_proceed_to_disbursement: bool


class DocumentUploadResponse(BaseModel):
    """Document upload response"""
    id: UUID
    document_type: str
    file_name: str
    mime_type: str
    verification_status: str
    uploaded_at: datetime

    class Config:
        from_attributes = True
