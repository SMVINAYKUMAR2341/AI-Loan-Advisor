import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Date, Text, Float, Integer, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    customer_id = Column(String(20), unique=True, index=True, nullable=True)  # Generated on successful signup
    
    # Role - customer or bank_officer
    role = Column(String(20), default="customer", nullable=False)  # customer, bank_officer
    
    # Account Credentials
    mobile_number = Column(String(15), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    pin_hash = Column(String(255), nullable=True)  # 6-digit PIN hashed
    security_hint = Column(String(50), nullable=True)
    
    # Personal Details
    title = Column(String(10), nullable=True)  # Mr, Ms, Mrs, Other
    first_name = Column(String(100), nullable=True)
    middle_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(10), nullable=True)  # Male, Female, Other
    nationality = Column(String(50), default="Indian")
    
    # Address Information
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(6), nullable=True)
    same_as_permanent = Column(Boolean, default=False)
    
    # KYC Details
    pan_number = Column(String(10), nullable=True)  # Encrypted/hashed in production
    aadhaar_last4 = Column(String(4), nullable=True)  # Only last 4 digits
    kyc_verified = Column(Boolean, default=False)
    kyc_skipped = Column(Boolean, default=False)
    aadhaar_consent = Column(Boolean, default=False)
    
    # Consent & Preferences
    terms_consent = Column(Boolean, default=False)
    privacy_consent = Column(Boolean, default=False)
    data_consent = Column(Boolean, default=False)
    remember_device = Column(Boolean, default=False)
    enable_passkey = Column(Boolean, default=False)
    final_consent = Column(Boolean, default=False)
    has_signature = Column(Boolean, default=False)
    signature_data = Column(Text, nullable=True)  # Base64 encoded signature image
    
    # Status & Timestamps
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    loan_applications = relationship("LoanApplication", back_populates="user")
    officer_reviews = relationship("OfficerReview", back_populates="officer", foreign_keys="OfficerReview.officer_id")


class LoanApplication(Base):
    """
    ML Input Snapshot - Stores exact features sent to the model.
    Purpose: audit, retraining, explainability
    """
    __tablename__ = "loan_applications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # ML Features - JSONB for exact model input preservation
    features_json = Column(JSONB, nullable=False)
    
    # Individual columns for querying/indexing (mirrors features_json)
    gender = Column(String(10))
    age = Column(Integer)
    employment_status = Column(String(30))
    education_level = Column(String(30))
    experience = Column(Integer)
    job_tenure = Column(Integer)
    monthly_income = Column(Float)
    monthly_debt_payments = Column(Float)
    loan_amount = Column(Float, index=True)
    loan_duration = Column(Integer)
    loan_purpose = Column(String(30))
    marital_status = Column(String(20))
    number_of_dependents = Column(Integer)
    home_ownership_status = Column(String(30))
    property_area = Column(String(20))
    coapplicant_income = Column(Float, default=0)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", back_populates="loan_applications")
    prediction = relationship("LoanPrediction", back_populates="application", uselist=False)
    officer_review = relationship("OfficerReview", back_populates="application", uselist=False)


class LoanPrediction(Base):
    """
    ML Output Snapshot - Stores exact model outputs.
    IMMUTABLE after creation - no UPDATE allowed.
    """
    __tablename__ = "loan_predictions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    application_id = Column(UUID(as_uuid=True), ForeignKey("loan_applications.id"), unique=True, nullable=False)
    
    # ML Outputs - IMMUTABLE after creation
    approval_probability = Column(Float, nullable=False)  # 0-100 (display scaled)
    ml_probability = Column(Float, nullable=False)  # 0-1 (raw model output)
    decision = Column(String(20), nullable=False, index=True)  # APPROVED, REJECTED, PENDING_REVIEW
    decision_reason = Column(Text)
    
    # Calculated outputs
    interest_rate = Column(Float, nullable=False)  # Annual %
    emi = Column(Float, nullable=False)  # Monthly EMI
    total_repayment = Column(Float, nullable=False)
    total_interest = Column(Float, nullable=False)
    credit_score_band = Column(String(20))  # "750-800" (estimated, not raw)
    credit_rating = Column(String(20))  # Excellent, Good, Fair, Poor
    
    # SHAP Explanations - JSONB for flexibility
    shap_summary = Column(JSONB)  # Top contributing features
    
    # Model versioning for reproducibility
    model_version = Column(String(50), default="xgboost_v1.0")
    
    # Immutability timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    application = relationship("LoanApplication", back_populates="prediction")


class OfficerReview(Base):
    """
    Human Decision Log - Only for PENDING_REVIEW cases.
    Stored separately from ML decisions for audit compliance.
    """
    __tablename__ = "officer_reviews"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    application_id = Column(UUID(as_uuid=True), ForeignKey("loan_applications.id"), nullable=False, index=True)
    officer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Human decision (only for PENDING_REVIEW cases)
    final_decision = Column(String(20), nullable=False)  # APPROVED, REJECTED
    justification = Column(Text, nullable=False)  # Required explanation for audit
    
    # Audit timestamp
    reviewed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    application = relationship("LoanApplication", back_populates="officer_review")
    officer = relationship("User", back_populates="officer_reviews", foreign_keys=[officer_id])


class KYCDocument(Base):
    """
    KYC Document Storage - For loan application document verification.
    Documents are uploaded after loan approval.
    """
    __tablename__ = "kyc_documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    application_id = Column(UUID(as_uuid=True), ForeignKey("loan_applications.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Document details
    document_type = Column(String(50), nullable=False)  # PAN, AADHAAR, ADDRESS_PROOF, INCOME_PROOF, BANK_STATEMENT
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)  # Stored path
    file_size = Column(Integer)  # bytes
    mime_type = Column(String(100))
    
    # Verification
    verification_status = Column(String(20), default="PENDING")  # PENDING, VERIFIED, REJECTED
    verification_notes = Column(Text, nullable=True)
    verified_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    application = relationship("LoanApplication", backref="documents")
    user = relationship("User", foreign_keys=[user_id])
    verifier = relationship("User", foreign_keys=[verified_by])


class Repayment(Base):
    """
    EMI Repayment Schedule - Generated after loan approval.
    Tracks each EMI payment status.
    """
    __tablename__ = "repayments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    application_id = Column(UUID(as_uuid=True), ForeignKey("loan_applications.id"), nullable=False, index=True)
    
    # EMI details
    emi_number = Column(Integer, nullable=False)  # 1, 2, 3, ...
    due_date = Column(Date, nullable=False, index=True)
    emi_amount = Column(Float, nullable=False)
    principal_component = Column(Float, nullable=False)
    interest_component = Column(Float, nullable=False)
    outstanding_principal = Column(Float, nullable=False)  # After this EMI
    
    # Payment status
    payment_status = Column(String(20), default="DUE")  # DUE, PAID, OVERDUE, PARTIALLY_PAID
    payment_date = Column(DateTime(timezone=True), nullable=True)
    payment_amount = Column(Float, nullable=True)
    payment_reference = Column(String(100), nullable=True)  # Transaction ID
    payment_method = Column(String(50), nullable=True)  # UPI, CARD, NETBANKING
    
    # Late fee if overdue
    late_fee = Column(Float, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    application = relationship("LoanApplication", backref="repayments")


# =====================================================
# KYC WORKFLOW TABLES - POST-APPROVAL
# =====================================================

class BankAccountDetails(Base):
    """
    Bank Account for Disbursement & Repayment.
    Created during KYC Step 2 after loan approval.
    Account number is encrypted at rest.
    """
    __tablename__ = "bank_account_details"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    application_id = Column(UUID(as_uuid=True), ForeignKey("loan_applications.id"), nullable=False, unique=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Bank details
    account_holder_name = Column(String(255), nullable=False)
    bank_name = Column(String(255), nullable=False)
    account_number_encrypted = Column(String(500), nullable=False)  # AES encrypted
    account_number_masked = Column(String(20), nullable=False)  # ****1234
    ifsc_code = Column(String(11), nullable=False)  # Format: ^[A-Z]{4}0[A-Z0-9]{6}$
    account_type = Column(String(20), default="SAVINGS")  # SAVINGS, CURRENT
    
    # Verification
    is_verified = Column(Boolean, default=False)
    verification_method = Column(String(50), nullable=True)  # PENNY_DROP, MANUAL
    verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    application = relationship("LoanApplication", backref="bank_account")
    user = relationship("User")


class LoanAgreement(Base):
    """
    Loan Agreement Signing Record.
    Created during KYC Step 3.
    Records consent, timestamp, and IP for legal compliance.
    """
    __tablename__ = "loan_agreements"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    application_id = Column(UUID(as_uuid=True), ForeignKey("loan_applications.id"), nullable=False, unique=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Agreement details
    agreement_version = Column(String(20), default="v1.0", nullable=False)
    loan_amount = Column(Float, nullable=False)
    interest_rate = Column(Float, nullable=False)  # Annual %
    tenure_months = Column(Integer, nullable=False)
    emi_amount = Column(Float, nullable=False)
    processing_fee = Column(Float, default=0)
    total_payable = Column(Float, nullable=False)
    
    # Agreement text (stored for legal record)
    agreement_summary = Column(Text, nullable=False)  # Key terms summary
    
    # Consent & Signing
    consent_given = Column(Boolean, default=False)
    consent_checkbox_text = Column(String(500), nullable=True)  # Exact checkbox text shown
    signed_at = Column(DateTime(timezone=True), nullable=True)
    ip_address_hash = Column(String(64), nullable=True)  # SHA256 hashed
    user_agent = Column(String(500), nullable=True)
    
    # Status
    status = Column(String(20), default="PENDING")  # PENDING, SIGNED, VOID
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    application = relationship("LoanApplication", backref="agreement")
    user = relationship("User")


class KYCStatusTracking(Base):
    """
    KYC Workflow Progress Tracker.
    One record per loan application.
    Tracks completion of each KYC step.
    """
    __tablename__ = "kyc_status_tracking"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    application_id = Column(UUID(as_uuid=True), ForeignKey("loan_applications.id"), nullable=False, unique=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Step Status: NOT_STARTED, IN_PROGRESS, COMPLETED, BLOCKED
    step_1_documents = Column(String(20), default="NOT_STARTED")
    step_1_docs_required = Column(Integer, default=2)  # ID + Address
    step_1_docs_uploaded = Column(Integer, default=0)
    step_1_docs_verified = Column(Integer, default=0)
    
    step_2_bank_details = Column(String(20), default="NOT_STARTED")
    
    step_3_agreement = Column(String(20), default="NOT_STARTED")
    
    # Overall Status
    overall_status = Column(String(20), default="NOT_STARTED")  # NOT_STARTED, IN_PROGRESS, COMPLETED, BLOCKED
    can_proceed_to_disbursement = Column(Boolean, default=False)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    application = relationship("LoanApplication", backref="kyc_status")
    user = relationship("User")


class AuditLog(Base):
    """
    Audit Trail - RBI-compliant immutable audit log.
    Logs all security-relevant user actions.
    IMMUTABLE: No UPDATE or DELETE allowed.
    """
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Event Classification
    action = Column(String(100), nullable=False, index=True)
    event_category = Column(String(50), nullable=False, index=True)  # SECURITY, LOAN, KYC, PAYMENT, PROFILE
    severity = Column(String(20), default="INFO")  # INFO, WARNING, CRITICAL
    
    # Entity Reference
    entity_type = Column(String(50), nullable=True)  # loan_application, kyc_document, repayment, session
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Human-readable context
    description = Column(Text, nullable=True)
    extra_data = Column(JSONB, nullable=True)
    
    # Device & Session Tracking
    session_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    device_type = Column(String(50), nullable=True)  # Desktop, Mobile, Tablet
    browser = Column(String(100), nullable=True)
    os = Column(String(100), nullable=True)
    ip_hash = Column(String(64), nullable=True)  # SHA256 hashed for privacy
    location_city = Column(String(100), nullable=True)
    location_country = Column(String(100), nullable=True)
    
    # Legacy fields for compatibility
    ip_address = Column(String(50), nullable=True)  # Masked IP for display
    user_agent = Column(String(500), nullable=True)
    
    # Immutable timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", backref="audit_logs")


class UserSession(Base):
    """
    Active Session Tracking - For security monitoring.
    Allows users to see and manage their active sessions.
    """
    __tablename__ = "user_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Device Info
    device_type = Column(String(50))  # Desktop, Mobile, Tablet
    browser = Column(String(100))
    os = Column(String(100))
    device_hash = Column(String(64))  # Hash of device fingerprint for detection
    
    # Location (coarse, city-level only)
    ip_hash = Column(String(64))
    location_city = Column(String(100))
    location_country = Column(String(100))
    
    # Session State
    is_active = Column(Boolean, default=True, index=True)
    is_new_device = Column(Boolean, default=False)
    is_new_location = Column(Boolean, default=False)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    last_activity = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    
    # JWT Token reference (hashed)
    token_hash = Column(String(64), nullable=True)
    
    # Relationships
    user = relationship("User", backref="sessions")


# =============================================================================
# EVENT CATEGORIES
# =============================================================================

class EventCategory:
    SECURITY = "SECURITY"
    LOAN = "LOAN"
    KYC = "KYC"
    PAYMENT = "PAYMENT"
    PROFILE = "PROFILE"


# =============================================================================
# COMPREHENSIVE AUDIT ACTIONS - Grouped by Category
# =============================================================================

class AuditAction:
    # =========================================================================
    # SECURITY EVENTS
    # =========================================================================
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAILED = "LOGIN_FAILED"
    LOGOUT = "LOGOUT"
    PASSWORD_CHANGED = "PASSWORD_CHANGED"
    SESSION_EXPIRED = "SESSION_EXPIRED"
    SESSION_TERMINATED = "SESSION_TERMINATED"
    NEW_DEVICE_LOGIN = "NEW_DEVICE_LOGIN"
    NEW_LOCATION_LOGIN = "NEW_LOCATION_LOGIN"
    SIGNUP = "SIGNUP"
    
    # =========================================================================
    # LOAN APPLICATION EVENTS
    # =========================================================================
    LOAN_APPLIED = "LOAN_APPLIED"
    AI_DECISION_GENERATED = "AI_DECISION_GENERATED"
    LOAN_APPROVED = "LOAN_APPROVED"
    LOAN_REJECTED = "LOAN_REJECTED"
    LOAN_PENDING_REVIEW = "LOAN_PENDING_REVIEW"
    OFFICER_REVIEW_STARTED = "OFFICER_REVIEW_STARTED"
    OFFICER_REVIEW_COMPLETED = "OFFICER_REVIEW_COMPLETED"
    
    # =========================================================================
    # KYC & DOCUMENT EVENTS
    # =========================================================================
    KYC_INITIATED = "KYC_INITIATED"
    DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED"
    DOCUMENT_VERIFIED = "DOCUMENT_VERIFIED"
    DOCUMENT_REJECTED = "DOCUMENT_REJECTED"
    KYC_COMPLETED = "KYC_COMPLETED"
    
    # =========================================================================
    # PAYMENT & EMI EVENTS
    # =========================================================================
    EMI_SCHEDULE_GENERATED = "EMI_SCHEDULE_GENERATED"
    EMI_PAYMENT_ATTEMPTED = "EMI_PAYMENT_ATTEMPTED"
    EMI_PAYMENT_SUCCESS = "EMI_PAYMENT_SUCCESS"
    EMI_PAYMENT_FAILED = "EMI_PAYMENT_FAILED"
    EMI_OVERDUE = "EMI_OVERDUE"
    AUTO_DEBIT_ENABLED = "AUTO_DEBIT_ENABLED"
    AUTO_DEBIT_DISABLED = "AUTO_DEBIT_DISABLED"
    
    # =========================================================================
    # PROFILE & CONSENT EVENTS
    # =========================================================================
    PROFILE_UPDATED = "PROFILE_UPDATED"
    CONSENT_ACCEPTED = "CONSENT_ACCEPTED"
    CONSENT_REVOKED = "CONSENT_REVOKED"
    PREFERENCES_UPDATED = "PREFERENCES_UPDATED"
    
    # Category mapping
    @staticmethod
    def get_category(action: str) -> str:
        security_actions = [
            "LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT", "PASSWORD_CHANGED",
            "SESSION_EXPIRED", "SESSION_TERMINATED", "NEW_DEVICE_LOGIN",
            "NEW_LOCATION_LOGIN", "SIGNUP"
        ]
        loan_actions = [
            "LOAN_APPLIED", "AI_DECISION_GENERATED", "LOAN_APPROVED",
            "LOAN_REJECTED", "LOAN_PENDING_REVIEW", "OFFICER_REVIEW_STARTED",
            "OFFICER_REVIEW_COMPLETED"
        ]
        kyc_actions = [
            "KYC_INITIATED", "DOCUMENT_UPLOADED", "DOCUMENT_VERIFIED",
            "DOCUMENT_REJECTED", "KYC_COMPLETED"
        ]
        payment_actions = [
            "EMI_SCHEDULE_GENERATED", "EMI_PAYMENT_ATTEMPTED", "EMI_PAYMENT_SUCCESS",
            "EMI_PAYMENT_FAILED", "EMI_OVERDUE", "AUTO_DEBIT_ENABLED", "AUTO_DEBIT_DISABLED"
        ]
        
        if action in security_actions:
            return EventCategory.SECURITY
        elif action in loan_actions:
            return EventCategory.LOAN
        elif action in kyc_actions:
            return EventCategory.KYC
        elif action in payment_actions:
            return EventCategory.PAYMENT
        else:
            return EventCategory.PROFILE
    
    @staticmethod
    def get_severity(action: str) -> str:
        critical_actions = ["LOGIN_FAILED", "PASSWORD_CHANGED", "NEW_DEVICE_LOGIN", "SESSION_TERMINATED"]
        warning_actions = ["LOAN_REJECTED", "DOCUMENT_REJECTED", "EMI_PAYMENT_FAILED", "EMI_OVERDUE"]
        
        if action in critical_actions:
            return "CRITICAL"
        elif action in warning_actions:
            return "WARNING"
        else:
            return "INFO"
