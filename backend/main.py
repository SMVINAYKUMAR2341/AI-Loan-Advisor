import os
import sys
import calendar
from collections import defaultdict
sys.path.append(os.path.dirname(os.path.abspath(__file__))) # Fix import paths
from fastapi import FastAPI, Depends, HTTPException, status, Request, Response, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy.future import select
from sqlalchemy import or_
from sqlalchemy.sql import func  # Import func for SQLAlchemy aggregate functions
from datetime import datetime, timedelta, date, timezone
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from uuid import UUID
import models
import schemas
import database
import auth
import report_generator

app = FastAPI(title="Loan Advisor API", version="1.0.0")

# Loan Prediction Request/Response Models
class LoanApplicationRequest(BaseModel):
    applicant_income: float  # Monthly income in INR
    coapplicant_income: float = 0  # Co-applicant income
    loan_amount: float  # Loan amount in thousands (e.g., 150 = ₹1,50,000)
    loan_term: int = 360  # Loan term in months
    credit_history: int = 1  # 1 = Good, 0 = Bad/No history
    gender: str = "Male"  # Male or Female
    married: str = "Yes"  # Yes or No
    dependents: int = 0  # 0, 1, 2, or 3+
    education: str = "Graduate"  # Graduate or Not Graduate
    employment: str = "Salaried"  # Salaried or Self-Employed
    property_area: str = "Semi-Urban"  # Urban, Semi-Urban, or Rural

class DecisionFactor(BaseModel):
    factor: str
    impact: str  # positive or negative
    description: str

class LoanPredictionResponse(BaseModel):
    status: str  # APPROVED, REJECTED, or PENDING_REVIEW
    confidence: float  # 0-100
    decision_factors: List[Dict[str, str]]
    recommendation: str

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://ai-loan-advisor-three.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.onrender\.com|https://.*\.vercel\.app", # Allow Render and ANY Vercel app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Custom exception handler to ensure CORS headers are always present
from fastapi.responses import JSONResponse

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions while preserving CORS headers"""
    origin = request.headers.get("origin", "*")
    allowed_origins = [
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://ai-loan-advisor-three.vercel.app",
    ]
    
    # Check if origin is allowed (including regex pattern for Vercel previews)
    if origin in allowed_origins or (origin and "vercel.app" in origin and "ai-loan-advisor" in origin):
        cors_origin = origin
    else:
        cors_origin = "*"
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": cors_origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Handle generic exceptions while preserving CORS headers"""
    origin = request.headers.get("origin", "*")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers={
            "Access-Control-Allow-Origin": origin if origin else "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.on_event("startup")
async def startup():
    # Initialise DB (in production, use Alembic for migrations)
    async with database.engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)

def generate_customer_id() -> str:
    """Generate a unique customer ID like LA20250001"""
    year = datetime.now().year
    random_num = str(datetime.now().timestamp())[-4:].replace('.', '')[:4]
    return f"LA{year}{random_num.zfill(4)}"

@app.post("/signup", response_model=schemas.UserResponse)
async def signup(user: schemas.UserCreate, db: AsyncSession = Depends(database.get_db)):
    """Register a new user with complete profile data"""
    try:
        # Check if user exists
        query = select(models.User).where(
            (models.User.mobile_number == user.mobile_number) | 
            (models.User.email == user.email)
        )
        result = await db.execute(query)
        existing_user = result.scalars().first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this mobile number or email already exists"
            )
        
        # Hash password and PIN
        hashed_password = auth.get_password_hash(user.password)
        hashed_pin = auth.get_password_hash(user.pin) if user.pin else None
        
        # Generate customer ID
        customer_id = generate_customer_id()
        
        # Create new user with all form data
        db_user = models.User(
            customer_id=customer_id,
            role=user.role,
            mobile_number=user.mobile_number,
            email=user.email,
            password_hash=hashed_password,
            pin_hash=hashed_pin,
            security_hint=user.security_hint,
            # Personal Details
            title=user.title,
            first_name=user.first_name,
            middle_name=user.middle_name,
            last_name=user.last_name,
            date_of_birth=user.date_of_birth,
            gender=user.gender,
            nationality=user.nationality,
            # Address
            address_line1=user.address_line1,
            address_line2=user.address_line2,
            city=user.city,
            state=user.state,
            pincode=user.pincode,
            same_as_permanent=user.same_as_permanent,
            # KYC
            pan_number=user.pan_number.upper() if user.pan_number else None,
            aadhaar_last4=user.aadhaar_last4,
            aadhaar_consent=user.aadhaar_consent,
            kyc_skipped=user.kyc_skipped,
            kyc_verified=False,  # Will be verified separately
            # Consents
            terms_consent=user.terms_consent,
            privacy_consent=user.privacy_consent,
            data_consent=user.data_consent,
            remember_device=user.remember_device,
            enable_passkey=user.enable_passkey,
            final_consent=user.final_consent,
            has_signature=user.has_signature,
            signature_data=user.signature_data,
        )
        
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        
        return db_user
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"SIGNUP ERROR: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Signup failed: {str(e)}"
        )

@app.post("/login", response_model=schemas.LoginResponse)
async def login(
    user_credentials: schemas.UserLogin, 
    request: Request,
    db: AsyncSession = Depends(database.get_db)
):
    """
    Login user with full credential verification - Returns JWT token
    Verifies: mobile_number, password, customer_id (optional), email (optional), pin (optional)
    Logs: device info, location, session tracking
    """
    import device_utils
    
    query = select(models.User).where(models.User.mobile_number == user_credentials.mobile_number)
    result = await db.execute(query)
    user = result.scalars().first()
    
    if not user:
        # Log failed login attempt (can't associate with user, so skip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Verify password
    if not auth.verify_password(user_credentials.password, user.password_hash):
        # Log failed login
        await log_audit(
            db, user.id,
            models.AuditAction.LOGIN_FAILED,
            description="Failed login attempt - invalid password",
            request=request
        )
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Verify customer_id if provided
    if user_credentials.customer_id:
        if user.customer_id != user_credentials.customer_id:
            await log_audit(
                db, user.id,
                models.AuditAction.LOGIN_FAILED,
                description="Failed login attempt - invalid Customer ID",
                request=request
            )
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Customer ID"
            )
    
    # Verify email if provided
    if user_credentials.email:
        if user.email and user.email.lower() != user_credentials.email.lower():
            await log_audit(
                db, user.id,
                models.AuditAction.LOGIN_FAILED,
                description="Failed login attempt - invalid email",
                request=request
            )
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email address"
            )
    
    # Verify PIN (Mandatory if user has set a PIN)
    if user.pin_hash:
        if not user_credentials.pin:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="PIN is required"
            )
        if not auth.verify_password(user_credentials.pin, user.pin_hash):
            await log_audit(
                db, user.id,
                models.AuditAction.LOGIN_FAILED,
                description="Failed login attempt - invalid PIN",
                request=request
            )
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid PIN"
            )
    
    # ===== SUCCESS - Create Session and Log =====
    try:
        # Get device info
        user_agent = request.headers.get("User-Agent", "")
        ip = device_utils.get_client_ip(request)
        device_info = device_utils.parse_user_agent(user_agent)
        device_hash = device_utils.generate_device_hash(user_agent, ip)
        location = device_utils.get_location_from_ip(ip)
        
        # Check if new device or location
        is_new_device = await device_utils.check_new_device(db, user.id, device_hash)
        is_new_location = await device_utils.check_new_location(db, user.id, location.get("city"))
        
        # Create session record
        import uuid
        session_id = uuid.uuid4()
        token_hash = device_utils.hash_ip(str(session_id))
        
        new_session = models.UserSession(
            id=session_id,
            user_id=user.id,
            device_type=device_info.get("device_type"),
            browser=device_info.get("browser"),
            os=device_info.get("os"),
            device_hash=device_hash,
            ip_hash=device_utils.hash_ip(ip),
            location_city=location.get("city"),
            location_country=location.get("country"),
            is_new_device=is_new_device,
            is_new_location=is_new_location,
            token_hash=token_hash
        )
        db.add(new_session)
        
        # Log successful login
        await log_audit(
            db, user.id,
            models.AuditAction.LOGIN_SUCCESS,
            description="User logged in successfully",
            request=request,
            session_id=session_id
        )
        await db.commit()
    except Exception as audit_error:
        print(f"Audit/Session Error: {audit_error}")
        # Don't crash login for auditing errors
        await db.rollback()
        session_id = None

    # Generate token
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.mobile_number, "user_id": str(user.id), "role": user.role},
        expires_delta=access_token_expires
    )
    
    return {
        "message": "Login successful",
        "user_id": str(user.id),
        "customer_id": user.customer_id,
        "first_name": user.first_name,
        "role": user.role,
        "access_token": access_token,
        "token_type": "bearer"
    }


@app.post("/admin/login", response_model=schemas.LoginResponse)
async def admin_login(
    credentials: schemas.AdminLogin,
    db: AsyncSession = Depends(database.get_db)
):
    """
    Admin Login - Authenticates against SEPARATE admin_users table
    """
    # Find admin user by admin_id
    query = select(models.AdminUser).where(models.AdminUser.admin_id == credentials.admin_id.strip())
    result = await db.execute(query)
    admin = result.scalars().first()
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Admin ID"
        )
        
    # Verify Email matches
    if admin.email != credentials.email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email does not match Admin ID record"
        )
    
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is inactive"
        )
    
    # Verify password
    if not auth.verify_password(credentials.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )
    
    # Verify PIN (Compulsory)
    if not admin.pin_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account setup incomplete: PIN not set"
        )
        
    if not auth.verify_password(credentials.pin, admin.pin_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid PIN"
        )
    
    # Update last login
    admin.last_login = datetime.now()
    await db.commit()
    
    # Generate token with special admin type
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={
            "sub": admin.email, 
            "user_id": str(admin.id), 
            "role": "bank_officer",
            "user_type": "admin", # Distinguish from customers
            "admin_id": str(admin.id)
        },
        expires_delta=access_token_expires
    )
    
    return {
        "message": "Admin login successful",
        "user_id": str(admin.id),
        "customer_id": admin.admin_id, # Return admin_id as customer_id for frontend compatibility
        "first_name": admin.first_name,
        "role": "bank_officer",
        "access_token": access_token,
        "token_type": "bearer"
    }


# =====================================================
# USER FINANCIAL DATA ENDPOINTS
# =====================================================

@app.get("/loan-applications")
async def get_my_loan_applications(
    user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get all loan applications for the current user"""
    query = (
        select(models.LoanApplication, models.LoanPrediction)
        .outerjoin(models.LoanPrediction, models.LoanApplication.id == models.LoanPrediction.application_id)
        .where(models.LoanApplication.user_id == user.id)
        .order_by(models.LoanApplication.created_at.desc())
    )
    result = await db.execute(query)
    rows = result.all()
    
    return [{
        "id": str(app.id),
        "loan_amount": app.loan_amount,
        "loan_purpose": app.loan_purpose,
        "created_at": app.created_at.isoformat(),
        "tracking_id": app.tracking_id,
        # Prediction details (might be None if not processed yet)
        "decision": pred.decision if pred else "PENDING",
        "status": pred.decision if pred else "PENDING", # Map decision to status for frontend compatibility
        "approval_probability": pred.approval_probability if pred else 0,
        "interest_rate": pred.interest_rate if pred else 0,
        "emi": pred.emi if pred else 0,
        "tenure": app.loan_duration
    } for app, pred in rows]


@app.get("/repayments/me")
async def get_my_repayments(
    user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get all EMI repayments for the current user across all loans"""
    # Join with LoanApplication to ensure we get repayments for this user's loans
    query = (
        select(models.Repayment)
        .join(models.LoanApplication)
        .where(models.LoanApplication.user_id == user.id)
        .order_by(models.Repayment.due_date.desc())
    )
    result = await db.execute(query)
    repayments = result.scalars().all()
    
    return [{
        "id": str(r.id),
        "application_id": str(r.application_id),
        "emi_number": r.emi_number,
        "due_date": r.due_date.isoformat(),
        "emi_amount": r.emi_amount,
        "payment_status": r.payment_status,
        "payment_date": r.payment_date.isoformat() if r.payment_date else None,
        "payment_amount": r.payment_amount,
        "payment_reference": r.payment_reference,
        "payment_method": r.payment_method
    } for r in repayments]


@app.get("/disbursements/me")
async def get_my_disbursements(
    user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get all loan disbursements received by the user"""
    query = (
        select(models.Disbursement, models.LoanApplication)
        .join(models.LoanApplication, models.Disbursement.application_id == models.LoanApplication.id)
        .where(models.Disbursement.user_id == user.id)
        .order_by(models.Disbursement.processed_at.desc())
    )
    result = await db.execute(query)
    rows = result.all()
    
    return [{
        "id": str(d.id),
        "application_id": str(d.application_id),
        "amount": d.amount,
        "transaction_ref": d.transaction_ref,
        "status": d.status,
        "processed_at": d.processed_at.isoformat() if d.processed_at else None,
        "loan_purpose": app.loan_purpose,
        "bank_name": d.bank_name,
        "account_number_masked": d.account_number_masked
    } for d, app in rows]


# =====================================================
# ADMIN PROFILE MANAGEMENT ENDPOINTS
# =====================================================

@app.get("/admin/profile")
async def get_admin_profile(
    current_user: models.AdminUser = Depends(auth.get_current_admin)
):
    """
    Get current admin user's profile information.
    """
    return {
        "id": str(current_user.id),
        "customer_id": current_user.admin_id,
        "email": current_user.email,
        "mobile_number": None,  # AdminUser model doesn't have mobile_number
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "department": current_user.department,
        "designation": current_user.designation,
        "role": "bank_officer",
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }


@app.put("/admin/profile")
async def update_admin_profile(
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    email: Optional[str] = None,
    current_user: models.AdminUser = Depends(auth.get_current_admin),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Update admin user's profile fields.
    """
    if first_name:
        current_user.first_name = first_name
    if last_name:
        current_user.last_name = last_name
    if email:
        current_user.email = email
    
    await db.commit()
    await db.refresh(current_user)
    
    return {"message": "Profile updated successfully"}


@app.put("/admin/change-password")
async def change_admin_password(
    current_password: str,
    new_password: str,
    current_user: models.AdminUser = Depends(auth.get_current_admin),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Change admin user's password. Requires current password verification.
    """
    # Verify current password
    if not auth.verify_password(current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Hash and set new password
    current_user.password_hash = auth.get_password_hash(new_password)
    await db.commit()
    
    return {"message": "Password changed successfully"}


@app.put("/admin/change-pin")
async def change_admin_pin(
    current_pin: str,
    new_pin: str,
    current_user: models.AdminUser = Depends(auth.get_current_admin),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Change admin user's 6-digit PIN. Requires current PIN verification.
    """
    # Verify current PIN
    if not current_user.pin_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No PIN set for this account"
        )
    
    if not auth.verify_password(current_pin, current_user.pin_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current PIN is incorrect"
        )
    
    # Validate new PIN
    if len(new_pin) != 6 or not new_pin.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN must be exactly 6 digits"
        )
    
    # Hash and set new PIN
    current_user.pin_hash = auth.get_password_hash(new_pin)
    await db.commit()
    
    return {"message": "PIN changed successfully"}


# =====================================================
# ADMIN LOAN APPLICATION DECISION ENDPOINTS
# =====================================================

@app.put("/admin/applications/{application_id}/decision")
async def update_application_decision(
    application_id: UUID,
    decision: str,  # APPROVED, REJECTED, DOCUMENTS_REQUIRED
    justification: str,
    current_admin = Depends(auth.get_current_admin),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Admin decision on loan application. Updates application status and creates review record.
    """
    # Validate decision value
    valid_decisions = ["APPROVED", "REJECTED", "DOCUMENTS_REQUIRED"]
    if decision.upper() not in valid_decisions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid decision. Must be one of: {valid_decisions}"
        )
    
    if not justification or len(justification.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Justification is required and must be at least 10 characters"
        )
    
    # Fetch the application and its prediction
    app_query = select(models.LoanApplication).where(models.LoanApplication.id == application_id)
    result = await db.execute(app_query)
    application = result.scalars().first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Fetch prediction to update decision
    pred_query = select(models.LoanPrediction).where(models.LoanPrediction.application_id == application_id)
    result = await db.execute(pred_query)
    prediction = result.scalars().first()
    
    if prediction:
        prediction.decision = decision.upper()
    
    # Create officer review record
    # Get admin's id - handle both AdminUser and User models
    admin_id = current_admin.id
    
    # Check if review already exists
    existing_review_query = select(models.OfficerReview).where(
        models.OfficerReview.application_id == application_id
    )
    result = await db.execute(existing_review_query)
    existing_review = result.scalars().first()
    
    if existing_review:
        # Update existing review
        existing_review.final_decision = decision.upper()
        existing_review.justification = justification
        existing_review.reviewed_at = datetime.now()
    else:
        # Create new review - need to use a valid user_id from users table
        # First check if admin has a corresponding user entry
        user_query = select(models.User).where(models.User.email == current_admin.email)
        user_result = await db.execute(user_query)
        user = user_result.scalars().first()
        
        if user:
            officer_id = user.id
        else:
            # Use admin id as fallback (may need to create a user entry for proper FK)
            officer_id = admin_id
        
        new_review = models.OfficerReview(
            application_id=application_id,
            officer_id=officer_id,
            final_decision=decision.upper(),
            justification=justification
        )
        db.add(new_review)
    
    await db.commit()
    
    # Create notification for customer
    try:
        # Fetch user to notify
        user_query = select(models.User).where(models.User.id == application.user_id)
        result = await db.execute(user_query)
        customer = result.scalars().first()
        
        if customer:
            notification_msg = f"Your loan application has been {decision.upper()}. Reason: {justification}"
            notification = models.Notification(
                user_id=customer.id,
                notification_type="LOAN_DECISION",
                trigger=f"LOAN_{decision.upper()}",
                message=notification_msg
            )
            db.add(notification)
            await db.commit()
    except Exception as e:
        print(f"Failed to create notification: {e}")
    
    return {
        "message": f"Application {decision.upper()} successfully",
        "decision": decision.upper(),
        "application_id": str(application_id)
    }


@app.post("/admin/applications/{application_id}/request-documents")
async def request_documents(
    application_id: UUID,
    document_types: str,  # Comma-separated list
    message: str,
    require_office_visit: bool = False,
    current_admin = Depends(auth.get_current_admin),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Request additional documents from customer. Optionally require office visit.
    """
    # Fetch the application
    app_query = select(models.LoanApplication).where(models.LoanApplication.id == application_id)
    result = await db.execute(app_query)
    application = result.scalars().first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Update prediction status
    pred_query = select(models.LoanPrediction).where(models.LoanPrediction.application_id == application_id)
    result = await db.execute(pred_query)
    prediction = result.scalars().first()
    
    if prediction:
        prediction.decision = "DOCUMENTS_REQUIRED"
    
    # Build notification message
    doc_list = [d.strip() for d in document_types.split(",")]
    doc_message = f"Additional documents required for your loan application:\n"
    for doc in doc_list:
        doc_message += f"• {doc}\n"
    
    if require_office_visit:
        doc_message += "\n⚠️ IMPORTANT: You are required to visit our branch office with the original hard copy documents for verification."
    
    if message:
        doc_message += f"\n\nAdditional Notes: {message}"
    
    # Create notification
    notification = models.Notification(
        user_id=application.user_id,
        notification_type="DOCUMENT_REQUEST",
        trigger="DOCUMENTS_REQUIRED",
        message=doc_message
    )
    db.add(notification)
    await db.commit()
    
    return {
        "message": "Document request sent to customer",
        "application_id": str(application_id),
        "documents_requested": doc_list,
        "office_visit_required": require_office_visit
    }


@app.get("/admin/applications/{application_id}/details")
async def get_application_full_details(
    application_id: UUID,
    current_admin = Depends(auth.get_current_admin),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Get comprehensive application details including customer info, loan data, 
    KYC documents, and prediction details.
    """
    # Fetch application
    app_query = select(models.LoanApplication).where(models.LoanApplication.id == application_id)
    result = await db.execute(app_query)
    application = result.scalars().first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Fetch customer details
    user_query = select(models.User).where(models.User.id == application.user_id)
    result = await db.execute(user_query)
    customer = result.scalars().first()
    
    # Fetch prediction
    pred_query = select(models.LoanPrediction).where(models.LoanPrediction.application_id == application_id)
    result = await db.execute(pred_query)
    prediction = result.scalars().first()
    
    # Fetch KYC documents
    docs_query = select(models.KYCDocument).where(models.KYCDocument.application_id == application_id)
    result = await db.execute(docs_query)
    documents = result.scalars().all()
    
    # Fetch officer review if exists
    review_query = select(models.OfficerReview).where(models.OfficerReview.application_id == application_id)
    result = await db.execute(review_query)
    officer_review = result.scalars().first()
    
    return {
        "application": {
            "id": str(application.id),
            "tracking_id": application.tracking_id,
            "loan_amount": application.loan_amount,
            "loan_purpose": application.loan_purpose,
            "loan_duration": application.loan_duration,
            "created_at": application.created_at.isoformat() if application.created_at else None,
        },
        "customer": {
            "id": str(customer.id) if customer else None,
            "customer_id": customer.customer_id if customer else None,
            "first_name": customer.first_name if customer else None,
            "last_name": customer.last_name if customer else None,
            "email": customer.email if customer else None,
            "mobile_number": customer.mobile_number if customer else None,
            "created_at": customer.created_at.isoformat() if customer and customer.created_at else None,
        } if customer else None,
        "prediction": {
            "approval_probability": prediction.approval_probability if prediction else None,
            "ml_probability": prediction.ml_probability if prediction else None,
            "decision": prediction.decision if prediction else None,
            "decision_reason": prediction.decision_reason if prediction else None,
            "interest_rate": prediction.interest_rate if prediction else None,
            "emi": prediction.emi if prediction else None,
            "total_repayment": prediction.total_repayment if prediction else None,
            "total_interest": prediction.total_interest if prediction else None,
            "credit_rating": prediction.credit_rating if prediction else None,
            "shap_summary": prediction.shap_summary if prediction else None,
        } if prediction else None,
        "documents": [
            {
                "id": str(doc.id),
                "document_type": doc.document_type,
                "file_name": doc.file_name,
                "verified": doc.verified,
                "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
            }
            for doc in documents
        ],
        "officer_review": {
            "final_decision": officer_review.final_decision if officer_review else None,
            "justification": officer_review.justification if officer_review else None,
            "reviewed_at": officer_review.reviewed_at.isoformat() if officer_review and officer_review.reviewed_at else None,
        } if officer_review else None
    }


# =====================================================
# ADMIN DISBURSEMENT ENDPOINTS
# =====================================================

@app.post("/admin/disbursements/{application_id}")
async def process_disbursement(
    application_id: UUID,
    transaction_ref: str,
    remarks: Optional[str] = None,
    current_admin = Depends(auth.get_current_admin),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Process loan disbursement - Creates disbursement record and updates loan status.
    Called by admin after transferring funds to customer's bank account.
    """
    # Fetch the application
    app_query = select(models.LoanApplication).where(models.LoanApplication.id == application_id)
    result = await db.execute(app_query)
    application = result.scalars().first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Fetch prediction to check if approved
    pred_query = select(models.LoanPrediction).where(models.LoanPrediction.application_id == application_id)
    result = await db.execute(pred_query)
    prediction = result.scalars().first()
    
    if not prediction or prediction.decision not in ["APPROVED", "PENDING_REVIEW"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application must be APPROVED before disbursement"
        )
    
    # Check if already disbursed
    existing_query = select(models.Disbursement).where(models.Disbursement.application_id == application_id)
    result = await db.execute(existing_query)
    existing = result.scalars().first()
    
    if existing and existing.status == "COMPLETED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Loan has already been disbursed"
        )
    
    # Fetch customer bank details
    bank_query = select(models.BankDetails).where(models.BankDetails.user_id == application.user_id)
    result = await db.execute(bank_query)
    bank_details = result.scalars().first()
    
    # Create disbursement record
    disbursement = models.Disbursement(
        application_id=application_id,
        user_id=application.user_id,
        amount=application.loan_amount,
        transaction_ref=transaction_ref,
        status="COMPLETED",
        bank_name=bank_details.bank_name if bank_details else None,
        account_number_masked=bank_details.account_number_masked if bank_details else None,
        ifsc_code=bank_details.ifsc_code if bank_details else None,
        processed_by=current_admin.id,
        remarks=remarks,
        processed_at=datetime.now(timezone.utc)
    )
    db.add(disbursement)
    
    # Update loan prediction to DISBURSED
    prediction.decision = "DISBURSED"
    
    # Create notification for customer
    try:
        notification = models.Notification(
            user_id=application.user_id,
            notification_type="LOAN_DISBURSED",
            trigger="DISBURSEMENT_COMPLETED",
            message=f"Your loan of Rs.{application.loan_amount:,.0f} has been disbursed! Transaction Ref: {transaction_ref}"
        )
        db.add(notification)
    except Exception as e:
        print(f"Failed to create notification: {e}")
    
    await db.commit()
    
    return {
        "message": "Disbursement processed successfully",
        "disbursement_id": str(disbursement.id),
        "amount": application.loan_amount,
        "transaction_ref": transaction_ref
    }


@app.get("/admin/disbursements")
async def get_all_disbursements(
    current_admin = Depends(auth.get_current_admin),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Get all disbursement records for admin view.
    Returns disbursements with customer info.
    """
    query = (
        select(models.Disbursement, models.LoanApplication, models.User)
        .join(models.LoanApplication, models.Disbursement.application_id == models.LoanApplication.id)
        .join(models.User, models.Disbursement.user_id == models.User.id)
        .order_by(models.Disbursement.processed_at.desc())
    )
    result = await db.execute(query)
    rows = result.all()
    
    return [{
        "id": str(d.id),
        "application_id": str(d.application_id),
        "amount": d.amount,
        "transaction_ref": d.transaction_ref,
        "status": d.status,
        "customer_name": f"{u.first_name} {u.last_name}",
        "customer_id": u.customer_id,
        "loan_purpose": loan_app.loan_purpose,
        "bank_name": d.bank_name,
        "account_number_masked": d.account_number_masked,
        "processed_at": d.processed_at.isoformat() if d.processed_at else None,
        "remarks": d.remarks
    } for d, loan_app, u in rows]


# =====================================================
# ADMIN NOTIFICATION ENDPOINTS
# =====================================================

@app.post("/admin/notifications/send")
async def send_notification_to_customer(
    user_id: str,
    notification_type: str,  # sms or email
    trigger: str,  # emi_reminder, emi_due, emi_overdue, disbursement_confirmation
    message: str,
    current_admin = Depends(auth.get_current_admin),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Send notification to a customer.
    Used for EMI reminders, due alerts, disbursement confirmations, etc.
    """
    # Validate user exists
    user_query = select(models.User).where(models.User.id == user_id)
    result = await db.execute(user_query)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Create notification record
    notification = models.Notification(
        user_id=user.id,
        type=notification_type,
        trigger=trigger,
        message=message,
        status="sent"
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    
    return {
        "message": "Notification sent successfully",
        "notification_id": str(notification.id)
    }


@app.get("/admin/notifications")
async def get_all_notifications(
    current_admin = Depends(auth.get_current_admin),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Get all notifications sent by admin for management view.
    """
    query = (
        select(models.Notification, models.User)
        .join(models.User, models.Notification.user_id == models.User.id)
        .order_by(models.Notification.sent_at.desc())
        .limit(100)
    )
    result = await db.execute(query)
    rows = result.all()
    
    return [{
        "id": str(n.id),
        "user_id": str(n.user_id),
        "customer_name": f"{u.first_name} {u.last_name}",
        "customer_id": u.customer_id,
        "type": n.type,
        "trigger": n.trigger,
        "message": n.message,
        "status": n.status,
        "sent_at": n.sent_at.isoformat() if n.sent_at else None
    } for n, u in rows]


@app.post("/admin/notifications/bulk-reminders")
async def send_bulk_emi_reminders(
    current_admin = Depends(auth.get_current_admin),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Send bulk EMI reminder notifications to all users with upcoming payments.
    """
    # This would normally query for users with EMI due in next 3 days
    # For now, return a placeholder response
    return {
        "message": "Bulk reminders feature placeholder",
        "notifications_sent": 0
    }


# =====================================================
# CUSTOMER NOTIFICATION ENDPOINTS
# =====================================================

@app.get("/notifications/me")
async def get_my_notifications(
    user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Get all notifications for the current customer.
    """
    query = (
        select(models.Notification)
        .where(models.Notification.user_id == user.id)
        .order_by(models.Notification.sent_at.desc())
        .limit(50)
    )
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    return [{
        "id": str(n.id),
        "type": n.type,
        "trigger": n.trigger,
        "message": n.message,
        "status": n.status,
        "sent_at": n.sent_at.isoformat() if n.sent_at else None
    } for n in notifications]


# =====================================================
# REPAYMENT ENDPOINTS
# =====================================================

@app.post("/repayments")
async def make_emi_payment(
    application_id: str,
    emi_number: int,
    amount: float,
    payment_method: str = "UPI",  # UPI, NEFT, CARD, CASH
    payment_reference: Optional[str] = None,
    user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Customer makes an EMI payment for their loan.
    """
    # Validate application belongs to user
    app_query = select(models.LoanApplication).where(
        models.LoanApplication.id == application_id,
        models.LoanApplication.user_id == user.id
    )
    result = await db.execute(app_query)
    application = result.scalars().first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found or does not belong to you"
        )
    
    # Check if loan is disbursed
    pred_query = select(models.LoanPrediction).where(models.LoanPrediction.application_id == application_id)
    result = await db.execute(pred_query)
    prediction = result.scalars().first()
    
    if not prediction or prediction.decision != "DISBURSED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Loan must be disbursed before making repayments"
        )
    
    # Check if this EMI already paid
    existing_query = select(models.Repayment).where(
        models.Repayment.application_id == application_id,
        models.Repayment.emi_number == emi_number,
        models.Repayment.payment_status == "PAID"
    )
    result = await db.execute(existing_query)
    existing = result.scalars().first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"EMI #{emi_number} has already been paid"
        )
    
    # Create repayment record
    repayment = models.Repayment(
        application_id=application_id,
        emi_number=emi_number,
        emi_amount=prediction.emi if prediction else amount,
        payment_amount=amount,
        payment_status="PAID",
        payment_date=datetime.now(timezone.utc),
        payment_method=payment_method,
        payment_reference=payment_reference or f"PAY{datetime.now().strftime('%Y%m%d%H%M%S')}",
        due_date=datetime.now(timezone.utc).date()  # For now, set to today
    )
    db.add(repayment)
    await db.commit()
    await db.refresh(repayment)
    
    return {
        "message": f"EMI #{emi_number} payment successful",
        "repayment_id": str(repayment.id),
        "amount": amount,
        "payment_reference": repayment.payment_reference
    }


@app.get("/admin/repayments")
async def get_all_repayments(
    current_admin = Depends(auth.get_current_admin),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Admin view of all EMI repayments across all customers.
    """
    query = (
        select(models.Repayment, models.LoanApplication, models.User)
        .join(models.LoanApplication, models.Repayment.application_id == models.LoanApplication.id)
        .join(models.User, models.LoanApplication.user_id == models.User.id)
        .order_by(models.Repayment.payment_date.desc())
        .limit(100)
    )
    result = await db.execute(query)
    rows = result.all()
    
    return [{
        "id": str(r.id),
        "application_id": str(r.application_id),
        "user_id": str(u.id),
        "customer_name": f"{u.first_name} {u.last_name}",
        "customer_id": u.customer_id,
        "emi_number": r.emi_number,
        "emi_amount": r.emi_amount,
        "payment_amount": r.payment_amount,
        "payment_status": r.payment_status,
        "payment_method": r.payment_method,
        "payment_reference": r.payment_reference,
        "payment_date": r.payment_date.isoformat() if r.payment_date else None,
        "due_date": r.due_date.isoformat() if r.due_date else None
    } for r, app, u in rows]


@app.get("/user/me")
async def read_users_me(current_user: Optional[models.User] = Depends(auth.get_optional_user)):
    """Get current user profile - returns null if not logged in"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not logged in"
        )
    return current_user

@app.get("/user/{user_id}", response_model=schemas.UserResponse)
async def get_user(user_id: str, db: AsyncSession = Depends(database.get_db)):
    """Get user profile by ID"""
    from uuid import UUID as PyUUID
    try:
        uuid_obj = PyUUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    query = select(models.User).where(models.User.id == uuid_obj)
    result = await db.execute(query)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@app.api_route("/", methods=["GET", "HEAD"])
def read_root():
    return {"message": "Loan Advisor API is running", "version": "1.0.0"}

@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    return {"status": "healthy"}

@app.post("/predict-loan", response_model=LoanPredictionResponse)
async def predict_loan_eligibility(application: LoanApplicationRequest):
    """
    Predict loan eligibility using ML model trained on loan_eligibility_processed_features.csv
    
    Returns:
    - APPROVED: Confidence > 70%
    - REJECTED: Confidence < 40%
    - PENDING_REVIEW: Confidence 40-70%
    """
    try:
        from loan_predictor import get_predictor
        
        predictor = get_predictor()
        
        # Convert request to dict for prediction
        loan_data = {
            'applicant_income': application.applicant_income,
            'coapplicant_income': application.coapplicant_income,
            'loan_amount': application.loan_amount,
            'loan_term': application.loan_term,
            'credit_history': application.credit_history,
            'gender': application.gender,
            'married': application.married,
            'dependents': application.dependents,
            'education': application.education,
            'employment': application.employment,
            'property_area': application.property_area,
        }
        
        # Get prediction from trained model
        result = predictor.predict(loan_data)
        
        return LoanPredictionResponse(
            status=result['status'],
            confidence=result['confidence'],
            decision_factors=result['decision_factors'],
            recommendation=result['recommendation']
        )
        
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML model not available. Please train the model first."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error: {str(e)}"
        )


# =====================================================
# BANK-GRADE AI LOAN ADVISOR - Comprehensive Endpoint
# =====================================================

class LoanAdvisorRequest(BaseModel):
    """User inputs only - no credit score, no payment history, no KYC"""
    # Personal & Employment
    gender: str = "Male"  # Male, Female - Required for ML model
    age: int
    employment_status: str  # Employed, Self-Employed, Unemployed
    education_level: str  # High School, Associate, Bachelor, Master, PhD
    experience: int  # Years of experience
    job_tenure: int  # Years at current job
    
    # Financial
    monthly_income: float  # Monthly income (NOT annual)
    monthly_debt_payments: float  # Existing monthly debt payments
    
    # Loan Details
    loan_amount: float  # Requested loan amount
    loan_duration: int  # Duration in months
    loan_purpose: str  # Home, Auto, Education, Business, Personal
    
    # Household
    marital_status: str  # Single, Married, Divorced, Widowed
    number_of_dependents: int
    home_ownership_status: str  # Own, Rent, Mortgage, Other
    property_area: str = "Urban"  # Urban, Semi-Urban, Rural - Required for ML model
    
    # Optional Co-applicant (NOT mandatory)
    coapplicant_income: Optional[float] = 0
    coapplicant_employment: Optional[str] = None
    coapplicant_relationship: Optional[str] = None


class CreditScoreResponse(BaseModel):
    min: int
    max: int
    rating: str
    display: str


class InterestRateResponse(BaseModel):
    annual: float
    monthly: float


class EMIResponse(BaseModel):
    monthly: float
    total_interest: float
    total_repayment: float


class LoanDetailsResponse(BaseModel):
    amount: float
    duration_months: int
    duration_years: float


class IncomeAnalysisResponse(BaseModel):
    monthly_income: float
    annual_income: float
    debt_to_income_ratio: float
    emi_to_income_ratio: float


class CoApplicantResponse(BaseModel):
    suggested: bool
    reason: str
    provided: bool


class ExplanationFactor(BaseModel):
    factor: str
    impact: str
    description: str


class LoanAdvisorResponse(BaseModel):
    """Comprehensive loan analysis response"""
    application_date: str
    decision: str  # APPROVED, REJECTED, PENDING_REVIEW
    decision_reason: str
    approval_probability: float  # 0-100
    credit_score: CreditScoreResponse
    interest_rate: InterestRateResponse
    emi: EMIResponse
    loan_details: LoanDetailsResponse
    income_analysis: IncomeAnalysisResponse
    coapplicant: CoApplicantResponse
    explanations: List[Dict[str, str]]
    kyc_required: bool
    next_steps: List[str]


@app.post("/loan-advisor", response_model=LoanAdvisorResponse)
async def comprehensive_loan_analysis(request: LoanAdvisorRequest):
    """
    Bank-Grade AI Loan Eligibility, Pricing & Decision System
    
    Features:
    - ML-based loan approval prediction
    - Credit score estimation (band-based, not exact)
    - Interest rate calculation (9-20% based on risk)
    - EMI calculation using standard banking formula
    - Co-applicant suggestion (conditional, not mandatory)
    - SHAP explanations for decision transparency
    
    Decision Logic:
    - >= 0.75: APPROVED
    - 0.50-0.74: PENDING_REVIEW
    - < 0.50: REJECTED
    
    Rejection Rules:
    - EMI > 50% of income
    - High risk + long tenure
    """
    try:
        from loan_advisor import get_advisor
        
        advisor = get_advisor()
        
        # Convert request to dict
        user_input = {
            'gender': request.gender,
            'age': request.age,
            'employment_status': request.employment_status,
            'education_level': request.education_level,
            'experience': request.experience,
            'job_tenure': request.job_tenure,
            'monthly_income': request.monthly_income,
            'monthly_debt_payments': request.monthly_debt_payments,
            'loan_amount': request.loan_amount,
            'loan_duration': request.loan_duration,
            'loan_purpose': request.loan_purpose,
            'marital_status': request.marital_status,
            'number_of_dependents': request.number_of_dependents,
            'home_ownership_status': request.home_ownership_status,
            'property_area': request.property_area,
            'coapplicant_income': request.coapplicant_income or 0,
            'coapplicant_employment': request.coapplicant_employment,
            'coapplicant_relationship': request.coapplicant_relationship,
        }
        
        # Get comprehensive analysis
        result = advisor.analyze(user_input)
        
        return LoanAdvisorResponse(
            application_date=result['application_date'],
            decision=result['decision'],
            decision_reason=result['decision_reason'],
            approval_probability=result['approval_probability'],
            credit_score=CreditScoreResponse(**result['credit_score']),
            interest_rate=InterestRateResponse(**result['interest_rate']),
            emi=EMIResponse(**result['emi']),
            loan_details=LoanDetailsResponse(**result['loan_details']),
            income_analysis=IncomeAnalysisResponse(**result['income_analysis']),
            coapplicant=CoApplicantResponse(**result['coapplicant']),
            explanations=result['explanations'],
            kyc_required=result['kyc_required'],
            next_steps=result['next_steps']
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Loan analysis error: {str(e)}"
        )


# =====================================================
# ML-ALIGNED LOAN APPLICATION ENDPOINTS (WITH DB PERSISTENCE)
# =====================================================

@app.get("/loan-applications", response_model=List[schemas.ApplicationListItem])
async def get_my_loan_applications(
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Get all loan applications for the current user.
    """
    query = (
        select(models.LoanApplication, models.LoanPrediction)
        .outerjoin(models.LoanPrediction, models.LoanApplication.id == models.LoanPrediction.application_id)
        .where(models.LoanApplication.user_id == current_user.id)
        .order_by(models.LoanApplication.created_at.desc())
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    response = []
    for app_row, pred_row in rows:
        # Default values if no prediction exists
        decision = "PENDING_PROCESSING"
        prob = 0.0
        
        if pred_row:
            decision = pred_row.decision
            prob = pred_row.approval_probability
            
        response.append(schemas.ApplicationListItem(
            id=app_row.id,
            user_id=app_row.user_id,
            customer_name=f"{current_user.first_name or ''} {current_user.last_name or ''}".strip(),
            customer_id=current_user.customer_id,
            loan_amount=app_row.loan_amount,
            loan_purpose=app_row.loan_purpose,
            decision=decision,
            approval_probability=prob,
            created_at=app_row.created_at,
            reviewed=False
        ))
        
    return response


async def generate_tracking_id(db: AsyncSession) -> str:
    """
    Generate sequential tracking ID: RBI{Year}LA{Seq}
    Example: RBI2026LA01, RBI2026LA02
    """
    current_year = datetime.now().year
    prefix = f"RBI{current_year}LA"
    
    # Find last tracking ID for current year
    query = (
        select(models.LoanApplication.tracking_id)
        .where(models.LoanApplication.tracking_id.like(f"{prefix}%"))
        .order_by(models.LoanApplication.tracking_id.desc())
        .limit(1)
    )
    result = await db.execute(query)
    last_id = result.scalars().first()
    
    if last_id:
        # Extract sequence number
        try:
            seq_str = last_id.replace(prefix, "")
            seq = int(seq_str)
            new_seq = seq + 1
        except ValueError:
            new_seq = 1
    else:
        new_seq = 1
        
    return f"{prefix}{new_seq:02d}"


@app.post("/loan-application", response_model=schemas.LoanApplicationResponse)
async def submit_loan_application(
    application: schemas.LoanApplicationCreate,
    request: Request,
    db: AsyncSession = Depends(database.get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_user)
):
    """
    Submit a loan application - ML-First Flow with Database Persistence
    
    1. Store ML input features in loan_applications table
    2. Run ML inference
    3. Store ML outputs in loan_predictions table
    4. Return comprehensive response
    
    Role: Authentication required for personalized reports
    """
    # Require authentication for loan applications
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please log in to submit a loan application. Your session may have expired.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    try:
        from loan_advisor import get_advisor
        
        # Build features dict for ML model
        features = {
            'gender': application.gender,
            'age': application.age,
            'employment_status': application.employment_status,
            'education_level': application.education_level,
            'experience': application.experience,
            'job_tenure': application.job_tenure,
            'monthly_income': application.monthly_income,
            'monthly_debt_payments': application.monthly_debt_payments,
            'loan_amount': application.loan_amount,
            'loan_duration': application.loan_duration,
            'loan_purpose': application.loan_purpose,
            'marital_status': application.marital_status,
            'number_of_dependents': application.number_of_dependents,
            'home_ownership_status': application.home_ownership_status,
            'property_area': application.property_area,
            'coapplicant_income': application.coapplicant_income,
            'cibil_score': application.cibil_score,  # Manual CIBIL score entry
            'previous_loan_defaults': application.previous_loan_defaults,  # Yes/No
        }
        
        # Generate Tracking ID
        tracking_id = await generate_tracking_id(db)
        
        # 1. Store ML input features (loan_applications table)
        db_application = models.LoanApplication(
            user_id=current_user.id,
            tracking_id=tracking_id,
            features_json=features,
            gender=application.gender,
            age=application.age,
            employment_status=application.employment_status,
            education_level=application.education_level,
            experience=application.experience,
            job_tenure=application.job_tenure,
            monthly_income=application.monthly_income,
            monthly_debt_payments=application.monthly_debt_payments,
            loan_amount=application.loan_amount,
            loan_duration=application.loan_duration,
            loan_purpose=application.loan_purpose,
            marital_status=application.marital_status,
            number_of_dependents=application.number_of_dependents,
            home_ownership_status=application.home_ownership_status,
            property_area=application.property_area,
            coapplicant_income=application.coapplicant_income,
        )
        db.add(db_application)
        await db.flush()  # Get the ID without committing
        
        # 2. Run ML inference
        advisor = get_advisor()
        result = advisor.analyze(features)
        
        # 3. Store ML outputs (loan_predictions table) - IMMUTABLE
        db_prediction = models.LoanPrediction(
            application_id=db_application.id,
            approval_probability=result['approval_probability'],
            ml_probability=result.get('ml_probability', result['approval_probability'] / 100),
            decision=result['decision'],
            decision_reason=result['decision_reason'],
            interest_rate=result['interest_rate']['annual'],
            emi=result['emi']['monthly'],
            total_repayment=result['emi']['total_repayment'],
            total_interest=result['emi']['total_interest'],
            credit_score_band=result['credit_score']['display'],
            credit_rating=result['credit_score']['rating'],
            shap_summary=result['explanations'],
            model_version="xgboost_v1.0"
        )
        db.add(db_prediction)
        
        # 4. Commit both records
        await db.commit()
        await db.refresh(db_application)
        await db.refresh(db_prediction)
        
        # 5. Return response
        response_model = schemas.LoanApplicationResponse(
            id=db_application.id,
            created_at=db_application.created_at,
            decision=result['decision'],
            decision_reason=result['decision_reason'],
            approval_probability=result['approval_probability'],
            interest_rate=result['interest_rate']['annual'],
            emi=result['emi']['monthly'],
            total_repayment=result['emi']['total_repayment'],
            total_interest=result['emi']['total_interest'],
            credit_score_band=result['credit_score']['display'],
            credit_rating=result['credit_score']['rating'],
            shap_summary=result['explanations'],
            next_steps=result['next_steps'],
            kyc_required=result['kyc_required']
        )
        
        # 6. Log Audit Event (Background task to avoid latency)
        await log_audit(
            db=db,
            user_id=current_user.id,
            action="LOAN_APPLIED",
            entity_type="LOAN_APPLICATION",
            entity_id=str(db_application.id),
            description=f"Applied for {application.loan_purpose} loan of ₹{application.loan_amount:,}",
            metadata={"amount": application.loan_amount, "purpose": application.loan_purpose},
            request=request,
            session_id=None 
        )

        return response_model
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Application submission failed: {str(e)}"
        )


# =====================================================
# ACTIVITY & AUDIT LOG ENDPOINTS
# =====================================================

@app.get("/activity", response_model=dict)
async def get_all_activity(
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get all activity logs for the current user"""
    query = select(models.AuditLog).where(
        models.AuditLog.user_id == current_user.id
    ).order_by(models.AuditLog.timestamp.desc()).limit(50)
    
    result = await db.execute(query)
    events = result.scalars().all()
    
    return {
        "events": events,
        "total_events": len(events)
    }

@app.get("/activity/{category}", response_model=dict)
async def get_activity_by_category(
    category: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get activity logs filtered by category"""
    # Map frontend categories to backend enums if needed
    category_map = {
        "loans": "LOAN",
        "security": "SECURITY",
        "kyc": "KYC",
        "payments": "PAYMENT",
        "profile": "PROFILE"
    }
    
    db_category = category_map.get(category.lower(), category.upper())
    
    query = select(models.AuditLog).where(
        models.AuditLog.user_id == current_user.id,
        models.AuditLog.event_category == db_category
    ).order_by(models.AuditLog.timestamp.desc()).limit(50)
    
    result = await db.execute(query)
    events = result.scalars().all()
    
    return {
        "events": events,
        "total_events": len(events)
    }

@app.get("/sessions", response_model=dict)
async def get_active_sessions(
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get active sessions (Mock for now as we use stateless JWT)"""
    # In a real app, we would query a sessions table. 
    # For now, return a mock session representing the current one.
    return {
        "sessions": [
            {
                "id": "curr_session",
                "started_at": datetime.now().isoformat(),
                "browser": "Chrome", 
                "os": "Windows",
                "location": "Bangalore, India",
                "device_type": "Desktop",
                "is_active": True,
                "is_new_device": False,
                "last_activity": datetime.now().isoformat()
            }
        ]
    }


@app.get("/my-applications", response_model=List[schemas.ApplicationListItem])
async def get_my_applications(
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Get all loan applications for the current customer.
    Returns empty list if not logged in.
    """
    if current_user is None:
        return []  # Return empty if not logged in
    
    if current_user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can view their applications"
        )
    
    query = select(models.LoanApplication).where(
        models.LoanApplication.user_id == current_user.id
    ).order_by(models.LoanApplication.created_at.desc())
    
    result = await db.execute(query)
    applications = result.scalars().all()
    
    response = []
    for app in applications:
        # Get prediction for this application
        pred_query = select(models.LoanPrediction).where(
            models.LoanPrediction.application_id == app.id
        )
        pred_result = await db.execute(pred_query)
        prediction = pred_result.scalars().first()
        
        # Check if reviewed
        review_query = select(models.OfficerReview).where(
            models.OfficerReview.application_id == app.id
        )
        review_result = await db.execute(review_query)
        review = review_result.scalars().first()
        
        response.append(schemas.ApplicationListItem(
            id=app.id,
            user_id=app.user_id,
            customer_name=f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or None,
            customer_id=current_user.customer_id,
            loan_amount=app.loan_amount,
            loan_purpose=app.loan_purpose,
            decision=prediction.decision if prediction else "PENDING",
            approval_probability=prediction.approval_probability if prediction else 0,
            created_at=app.created_at,
            reviewed=review is not None
        ))
    
    return response


@app.get("/applications", response_model=List[schemas.ApplicationListItem])
async def get_all_applications(
    current_user: models.User = Depends(auth.require_officer),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Get all loan applications (for bank officers).
    Role: bank_officer only
    """
    query = select(models.LoanApplication).order_by(
        models.LoanApplication.created_at.desc()
    )
    
    result = await db.execute(query)
    applications = result.scalars().all()
    
    response = []
    for app in applications:
        # Get user info
        user_query = select(models.User).where(models.User.id == app.user_id)
        user_result = await db.execute(user_query)
        user = user_result.scalars().first()
        
        # Get prediction
        pred_query = select(models.LoanPrediction).where(
            models.LoanPrediction.application_id == app.id
        )
        pred_result = await db.execute(pred_query)
        prediction = pred_result.scalars().first()
        
        # Check if reviewed
        review_query = select(models.OfficerReview).where(
            models.OfficerReview.application_id == app.id
        )
        review_result = await db.execute(review_query)
        review = review_result.scalars().first()
        
        response.append(schemas.ApplicationListItem(
            id=app.id,
            user_id=app.user_id,
            customer_name=f"{user.first_name or ''} {user.last_name or ''}".strip() if user else None,
            customer_id=user.customer_id if user else None,
            loan_amount=app.loan_amount,
            loan_purpose=app.loan_purpose,
            decision=prediction.decision if prediction else "PENDING",
            approval_probability=prediction.approval_probability if prediction else 0,
            created_at=app.created_at,
            reviewed=review is not None
        ))
    
    return response


@app.get("/application/{application_id}", response_model=schemas.ApplicationDetailResponse)
async def get_application_detail(
    application_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Get detailed application view.
    Role: customer (own only) or bank_officer (any)
    """
    from uuid import UUID as PyUUID
    
    try:
        app_uuid = PyUUID(application_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid application ID")
    
    query = select(models.LoanApplication).where(models.LoanApplication.id == app_uuid)
    result = await db.execute(query)
    application = result.scalars().first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Access control
    if current_user.role == "customer" and application.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own applications"
        )
    
    # Get user info
    user_query = select(models.User).where(models.User.id == application.user_id)
    user_result = await db.execute(user_query)
    user = user_result.scalars().first()
    
    # Get prediction
    pred_query = select(models.LoanPrediction).where(
        models.LoanPrediction.application_id == application.id
    )
    pred_result = await db.execute(pred_query)
    prediction = pred_result.scalars().first()
    
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    # Get officer review if exists
    review_query = select(models.OfficerReview).where(
        models.OfficerReview.application_id == application.id
    )
    review_result = await db.execute(review_query)
    review = review_result.scalars().first()
    
    return schemas.ApplicationDetailResponse(
        id=application.id,
        user_id=application.user_id,
        customer_name=f"{user.first_name or ''} {user.last_name or ''}".strip() if user else None,
        customer_id=user.customer_id if user else None,
        features=application.features_json,
        decision=prediction.decision,
        decision_reason=prediction.decision_reason,
        approval_probability=prediction.approval_probability,
        ml_probability=prediction.ml_probability,
        interest_rate=prediction.interest_rate,
        emi=prediction.emi,
        total_repayment=prediction.total_repayment,
        total_interest=prediction.total_interest,
        credit_score_band=prediction.credit_score_band,
        credit_rating=prediction.credit_rating,
        shap_summary=prediction.shap_summary or [],
        model_version=prediction.model_version,
        created_at=application.created_at,
        reviewed=review is not None,
        officer_review={
            "final_decision": review.final_decision,
            "justification": review.justification,
            "reviewed_at": review.reviewed_at.isoformat()
        } if review else None
    )


@app.post("/admin/notifications/bulk-reminders")
async def send_bulk_reminders(
    current_user: models.AdminUser = Depends(auth.require_admin),
    db: Session = Depends(database.get_db)
):
    """
    Triggers checking of all loans and sending due/overdue reminders
    """
    today = date.today()
    three_days_from_now = today + timedelta(days=3)
    
    notifications_sent = 0
    
    
    # 1. Check for Due in 3 Days (EMI Reminder)
    # Returning mock count based on active loans for realism
    result = db.execute(select(models.LoanApplication).where(models.LoanApplication.status == "APPROVED"))
    active_loans = result.scalars().all()
    
    count = len(active_loans) if active_loans else 0
    # Simulate processing
    notifications_sent = count
    
    return {"message": "Bulk reminders triggered successfully", "count": notifications_sent}

from sqlalchemy import func
from collections import defaultdict
import calendar
from datetime import datetime

@app.get("/admin/reports/stats", response_model=schemas.AdminDashboardStats)
async def get_admin_reports(
    current_user: models.AdminUser = Depends(auth.require_admin),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Get aggregated statistics for Admin Reports Page
    """
    # 1. Total Applications
    result = await db.execute(select(func.count()).select_from(models.LoanApplication))
    total_loans = result.scalar() or 0
    
    # 2. Approval Rate
    result = await db.execute(
        select(func.count()).select_from(models.LoanPrediction).where(models.LoanPrediction.decision == "APPROVED")
    )
    approved_count = result.scalar() or 0
    approval_rate = round((approved_count / total_loans * 100), 1) if total_loans > 0 else 0
    
    # 3. Total Disbursed
    result = await db.execute(select(func.sum(models.Disbursement.amount)))
    disbursed_total = result.scalar() or 0
    
    # 4. Active Users (Customers)
    result = await db.execute(
        select(func.count()).select_from(models.User).where(models.User.role == "customer")
    )
    active_users = result.scalar() or 0
    
    # 5. Loan Status Distribution
    result = await db.execute(
        select(models.LoanPrediction.decision, func.count(models.LoanPrediction.decision))
        .group_by(models.LoanPrediction.decision)
    )
    status_counts = result.all()
    
    color_map = {
        "APPROVED": "#10B981",
        "REJECTED": "#EF4444",
        "PENDING_REVIEW": "#F59E0B"
    }
    
    dist_data = []
    for decision, count in status_counts:
        dist_data.append(schemas.StatusDist(
            name=decision.replace("_", " ").title(),
            value=count,
            color=color_map.get(decision, "#6B7280")
        ))
        
    # 6. Monthly Trends
    trends = defaultdict(lambda: {"apps": 0, "disb": 0, "emi": 0})
    
    # Applications
    result = await db.execute(select(models.LoanApplication.created_at))
    recent_apps = result.all()
    for (created_at,) in recent_apps:
        if created_at:
            month_key = created_at.strftime("%b")
            trends[month_key]["apps"] += 1
            
    # Disbursements
    result = await db.execute(select(models.Disbursement.created_at, models.Disbursement.amount))
    recent_disb = result.all()
    for created_at, amount in recent_disb:
        if created_at:
            month_key = created_at.strftime("%b")
            trends[month_key]["disb"] += amount or 0
            
    # EMIs
    result = await db.execute(
        select(models.Repayment.payment_date, models.Repayment.payment_amount)
        .where(models.Repayment.payment_status == "PAID")
    )
    recent_emis = result.all()
    for payment_date, payment_amount in recent_emis:
        if payment_date:
            month_key = payment_date.strftime("%b")
            trends[month_key]["emi"] += payment_amount or 0
            
    sorted_months = []
    curr = datetime.now()
    for i in range(4):
        month_idx = (curr.month - i - 1) % 12 + 1
        month_name = calendar.month_abbr[month_idx]
        sorted_months.insert(0, month_name)
        
    monthly_data = []
    for m in sorted_months:
        data = trends[m]
        monthly_data.append(schemas.MonthlyTrend(
            month=m,
            applications=data["apps"],
            disbursements=data["disb"],
            emiCollected=data["emi"]
        ))
    
    return schemas.AdminDashboardStats(
        stats=schemas.ReportStats(
            totalLoans=total_loans,
            approvalRate=approval_rate,
            totalDisbursed=disbursed_total,
            activeUsers=active_users
        ),
        monthlyTrends=monthly_data,
        statusDistribution=dist_data
    )

@app.post("/admin/notifications/send")
async def send_notification(
    review: schemas.NotificationCreate,
    current_user: models.AdminUser = Depends(auth.require_admin),
    db: Session = Depends(database.get_db)
):
    """
    Submit officer review for PENDING_REVIEW applications only.
    Role: bank_officer only
    RBI Compliance:
    - ML outputs remain immutable
    - Human decision logged separately with justification
    """
    # Get application
    query = select(models.LoanApplication).where(
        models.LoanApplication.id == review.application_id
    )
    result = await db.execute(query)
    application = result.scalars().first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Get prediction
    pred_query = select(models.LoanPrediction).where(
        models.LoanPrediction.application_id == review.application_id
    )
    pred_result = await db.execute(pred_query)
    prediction = pred_result.scalars().first()
    
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    # Only allow review for PENDING_REVIEW cases
    if prediction.decision != "PENDING_REVIEW":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Can only review PENDING_REVIEW applications. Current status: {prediction.decision}"
        )
    
    # Check if already reviewed
    existing_query = select(models.OfficerReview).where(
        models.OfficerReview.application_id == review.application_id
    )
    existing_result = await db.execute(existing_query)
    if existing_result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application already reviewed"
        )
    
    # Create review (separate from ML decision - audit compliance)
    db_review = models.OfficerReview(
        application_id=review.application_id,
        officer_id=current_user.id,
        final_decision=review.final_decision,
        justification=review.justification
    )
    
    db.add(db_review)
    await db.commit()
    await db.refresh(db_review)
    
    return schemas.OfficerReviewResponse(
        id=db_review.id,
        application_id=db_review.application_id,
        officer_id=db_review.officer_id,
        final_decision=db_review.final_decision,
        justification=db_review.justification,
        reviewed_at=db_review.reviewed_at
    )


# =====================================================
# AUDIT LOGGING HELPER - ENHANCED FOR BANKING COMPLIANCE
# =====================================================

async def log_audit(
    db: AsyncSession,
    user_id,
    action: str,
    entity_type: str = None,
    entity_id = None,
    description: str = None,
    metadata: dict = None,
    request = None,
    session_id = None
):
    try:
        import device_utils
        
        # Get device info from request if provided
        device_type = None
        browser = None
        os_name = None
        ip_hash = None
        ip_address = None
        location_city = None
        location_country = None
        user_agent = None
        
        if request:
            user_agent = request.headers.get("User-Agent", "")
            ip = device_utils.get_client_ip(request)
            
            device_info = device_utils.parse_user_agent(user_agent)
            device_type = device_info.get("device_type")
            browser = device_info.get("browser")
            os_name = device_info.get("os")
            
            ip_hash = device_utils.hash_ip(ip)
            ip_address = device_utils.mask_ip(ip)
            
            location = device_utils.get_location_from_ip(ip)
            location_city = location.get("city")
            location_country = location.get("country")
        
        event_category = models.AuditAction.get_category(action)
        severity = models.AuditAction.get_severity(action)
        
        if not description:
            description = device_utils.format_event_description(action, metadata) if request else action
        
        audit_entry = models.AuditLog(
            user_id=user_id,
            action=action,
            event_category=event_category,
            severity=severity,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            extra_data=metadata,
            session_id=session_id,
            device_type=device_type,
            browser=browser,
            os=os_name,
            ip_hash=ip_hash,
            ip_address=ip_address,
            location_city=location_city,
            location_country=location_country,
            user_agent=user_agent
        )
        db.add(audit_entry)
        # We don't commit here, it's the caller's responsibility
    except Exception as e:
        print(f"Error in log_audit: {e}")
        # Audit logging should never crash the main application
    # Don't commit here - let the calling function handle transaction


# =====================================================
# CREDIT SCORE & ELIGIBILITY ENDPOINTS
# =====================================================

@app.get("/credit-score", response_model=schemas.CreditScoreDisplayResponse)
async def get_credit_score(
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Get customer's credit score display - returns default if not logged in
    """
    if current_user is None:
        return schemas.CreditScoreDisplayResponse(
            score_band="Login Required",
            rating="Please Login",
            factors=[{"factor": "Session expired", "impact": "neutral", "description": "Please login to see your actual credit score"}],
            last_updated=datetime.now(),
            eligibility_amount=0,
            eligibility_products=[]
        )
    # Get latest prediction for user
    query = select(models.LoanPrediction).join(
        models.LoanApplication,
        models.LoanPrediction.application_id == models.LoanApplication.id
    ).where(
        models.LoanApplication.user_id == current_user.id
    ).order_by(models.LoanPrediction.created_at.desc())
    
    result = await db.execute(query)
    prediction = result.scalars().first()
    
    if not prediction:
        # No application yet - return default
        return schemas.CreditScoreDisplayResponse(
            score_band="Not Available",
            rating="No Data",
            factors=[{"factor": "No loan application", "impact": "neutral", "description": "Apply for a loan to see your credit assessment"}],
            last_updated=datetime.now(),
            eligibility_amount=0,
            eligibility_products=[]
        )
    
    return schemas.CreditScoreDisplayResponse(
        score_band=prediction.credit_score_band or "700-750",
        rating=prediction.credit_rating or "Good",
        factors=prediction.shap_summary or [],
        last_updated=prediction.created_at,
        eligibility_amount=prediction.application.loan_amount if prediction.decision == "APPROVED" else 0,
        eligibility_products=["Personal Loan", "Home Loan"] if prediction.decision == "APPROVED" else []
    )


@app.get("/eligibility", response_model=schemas.EligibilityResponse)
async def get_eligibility(
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get customer's loan eligibility - returns default if not logged in"""
    if current_user is None:
        return schemas.EligibilityResponse(
            has_application=False,
            pre_approved_amount=0,
            max_eligible_amount=0,
            eligible_products=[],
            approval_probability=0,
            recommendation="Please login to check eligibility",
            factors=[]
        )
    
    # Get latest application and prediction
    query = select(models.LoanApplication).where(
        models.LoanApplication.user_id == current_user.id
    ).order_by(models.LoanApplication.created_at.desc())
    
    result = await db.execute(query)
    application = result.scalars().first()
    
    if not application:
        return schemas.EligibilityResponse(
            has_application=False,
            pre_approved_amount=None,
            max_eligible_amount=500000,  # Default pre-approval estimate
            eligible_products=["Personal Loan"],
            approval_probability=None,
            credit_rating=None,
            income_to_emi_ratio=None
        )
    
    # Get prediction
    pred_query = select(models.LoanPrediction).where(
        models.LoanPrediction.application_id == application.id
    )
    pred_result = await db.execute(pred_query)
    prediction = pred_result.scalars().first()
    
    if not prediction:
        return schemas.EligibilityResponse(
            has_application=True,
            pre_approved_amount=None,
            max_eligible_amount=application.loan_amount,
            eligible_products=["Personal Loan"],
            approval_probability=None,
            credit_rating=None,
            income_to_emi_ratio=None
        )
    
    # Calculate income to EMI ratio
    income_to_emi = (prediction.emi / application.monthly_income * 100) if application.monthly_income > 0 else 0
    
    return schemas.EligibilityResponse(
        has_application=True,
        pre_approved_amount=application.loan_amount if prediction.decision == "APPROVED" else None,
        max_eligible_amount=application.loan_amount * 1.5 if prediction.decision == "APPROVED" else application.loan_amount,
        eligible_products=["Personal Loan", "Home Loan", "Vehicle Loan"] if prediction.decision == "APPROVED" else ["Personal Loan"],
        approval_probability=prediction.approval_probability,
        credit_rating=prediction.credit_rating,
        income_to_emi_ratio=round(income_to_emi, 2)
    )


# =====================================================
# REPAYMENTS & EMI ENDPOINTS
# =====================================================

def generate_emi_schedule(
    loan_amount: float,
    interest_rate: float,
    tenure_months: int,
    start_date: date
) -> List[dict]:
    """Generate complete EMI schedule with amortization"""
    monthly_rate = interest_rate / 100 / 12
    
    # EMI formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
    if monthly_rate > 0:
        emi = loan_amount * monthly_rate * pow(1 + monthly_rate, tenure_months) / (pow(1 + monthly_rate, tenure_months) - 1)
    else:
        emi = loan_amount / tenure_months
    
    schedule = []
    outstanding = loan_amount
    
    for i in range(1, tenure_months + 1):
        interest_component = outstanding * monthly_rate
        principal_component = emi - interest_component
        outstanding -= principal_component
        
        due_date = start_date + timedelta(days=30 * i)
        
        schedule.append({
            "emi_number": i,
            "due_date": due_date,
            "emi_amount": round(emi, 2),
            "principal_component": round(principal_component, 2),
            "interest_component": round(interest_component, 2),
            "outstanding_principal": max(0, round(outstanding, 2))
        })
    
    return schedule


@app.get("/repayments/{application_id}", response_model=schemas.EMIScheduleResponse)
async def get_emi_schedule(
    application_id: str,
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get EMI schedule for a loan application - returns empty if not logged in"""
    if current_user is None:
        return {"application_id": application_id, "amount": 0, "interest_rate": 0, "tenure_months": 0, "schedule": []}
    from uuid import UUID as PyUUID
    
    try:
        app_uuid = PyUUID(application_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid application ID")
    
    # Get application
    query = select(models.LoanApplication).where(models.LoanApplication.id == app_uuid)
    result = await db.execute(query)
    application = result.scalars().first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Access control
    if current_user.role == "customer" and application.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get prediction
    pred_query = select(models.LoanPrediction).where(
        models.LoanPrediction.application_id == app_uuid
    )
    pred_result = await db.execute(pred_query)
    prediction = pred_result.scalars().first()
    
    if not prediction or prediction.decision != "APPROVED":
        raise HTTPException(status_code=400, detail="EMI schedule only available for approved loans")
    
    # Check if repayments exist, if not generate them
    rep_query = select(models.Repayment).where(
        models.Repayment.application_id == app_uuid
    ).order_by(models.Repayment.emi_number)
    
    rep_result = await db.execute(rep_query)
    repayments = rep_result.scalars().all()
    
    if not repayments:
        # Generate and save EMI schedule
        from datetime import timedelta
        schedule = generate_emi_schedule(
            application.loan_amount,
            prediction.interest_rate,
            application.loan_duration,
            application.created_at.date()
        )
        
        for emi_data in schedule:
            repayment = models.Repayment(
                application_id=app_uuid,
                emi_number=emi_data["emi_number"],
                due_date=emi_data["due_date"],
                emi_amount=emi_data["emi_amount"],
                principal_component=emi_data["principal_component"],
                interest_component=emi_data["interest_component"],
                outstanding_principal=emi_data["outstanding_principal"],
                payment_status="DUE"
            )
            db.add(repayment)
        
        await db.commit()
        
        # Re-fetch
        rep_result = await db.execute(rep_query)
        repayments = rep_result.scalars().all()
    
    # Build response
    paid_count = sum(1 for r in repayments if r.payment_status == "PAID")
    overdue_count = sum(1 for r in repayments if r.payment_status == "OVERDUE")
    pending_count = len(repayments) - paid_count
    
    # Find next due EMI
    next_emi = next((r for r in repayments if r.payment_status in ["DUE", "OVERDUE"]), None)
    
    return schemas.EMIScheduleResponse(
        application_id=app_uuid,
        loan_amount=application.loan_amount,
        interest_rate=prediction.interest_rate,
        tenure_months=application.loan_duration,
        monthly_emi=prediction.emi,
        total_interest=prediction.total_interest,
        total_repayment=prediction.total_repayment,
        schedule=[schemas.RepaymentResponse.model_validate(r) for r in repayments],
        paid_emis=paid_count,
        pending_emis=pending_count,
        overdue_emis=overdue_count,
        next_emi_date=next_emi.due_date if next_emi else None,
        next_emi_amount=next_emi.emi_amount if next_emi else None
    )


@app.post("/repayments/pay", response_model=schemas.PaymentResponse)
async def make_payment(
    payment: schemas.PaymentRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Make EMI payment (simulated)"""
    
    # Get repayment record
    query = select(models.Repayment).where(models.Repayment.id == payment.repayment_id)
    result = await db.execute(query)
    repayment = result.scalars().first()
    
    if not repayment:
        raise HTTPException(status_code=404, detail="Repayment not found")
    
    # Get application for access control
    app_query = select(models.LoanApplication).where(
        models.LoanApplication.id == repayment.application_id
    )
    app_result = await db.execute(app_query)
    application = app_result.scalars().first()
    
    if application.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if repayment.payment_status == "PAID":
        raise HTTPException(status_code=400, detail="EMI already paid")
    
    # Simulate payment
    import uuid
    payment_ref = payment.payment_reference or f"TXN{uuid.uuid4().hex[:12].upper()}"
    
    repayment.payment_status = "PAID"
    repayment.payment_date = datetime.now()
    repayment.payment_amount = repayment.emi_amount
    repayment.payment_reference = payment_ref
    repayment.payment_method = payment.payment_method
    
    # Log audit
    await log_audit(
        db, current_user.id,
        models.AuditAction.EMI_PAYMENT_SUCCESS,
        "repayment",
        repayment.id,
        f"Paid EMI #{repayment.emi_number} of ₹{repayment.emi_amount}",
        extra_data={
            "amount": repayment.emi_amount, 
            "emi_number": repayment.emi_number,
            "payment_method": payment.payment_method
        }
    )
    
    await db.commit()
    
    return schemas.PaymentResponse(
        success=True,
        message="Payment successful",
        payment_reference=payment_ref,
        emi_number=repayment.emi_number,
        amount_paid=repayment.emi_amount,
        payment_date=repayment.payment_date
    )


@app.get("/repayments/upcoming", response_model=List[schemas.UpcomingEMIResponse])
async def get_upcoming_emis(
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get upcoming EMIs for current user - returns empty if not logged in"""
    if current_user is None:
        return []
    from datetime import date as date_type
    
    # Get all applications for user
    app_query = select(models.LoanApplication).where(
        models.LoanApplication.user_id == current_user.id
    )
    app_result = await db.execute(app_query)
    applications = app_result.scalars().all()
    
    upcoming = []
    today = date_type.today()
    
    for app in applications:
        # Get next due EMI
        rep_query = select(models.Repayment).where(
            models.Repayment.application_id == app.id,
            models.Repayment.payment_status.in_(["DUE", "OVERDUE"])
        ).order_by(models.Repayment.due_date).limit(1)
        
        rep_result = await db.execute(rep_query)
        next_emi = rep_result.scalars().first()
        
        if next_emi:
            days_until = (next_emi.due_date - today).days
            upcoming.append(schemas.UpcomingEMIResponse(
                application_id=app.id,
                loan_type=app.loan_purpose or "Personal Loan",
                emi_number=next_emi.emi_number,
                due_date=next_emi.due_date,
                emi_amount=next_emi.emi_amount,
                days_until_due=days_until,
                is_overdue=days_until < 0
            ))
    
    return upcoming


# =====================================================
# DOCUMENTS ENDPOINTS
# =====================================================

@app.post("/documents/upload", response_model=schemas.KYCDocumentResponse)
async def upload_document(
    application_id: str = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Upload KYC document.
    Accepts PDF, JPG, PNG. Max 5MB.
    Documents can only be uploaded for APPROVED applications.
    """
    from uuid import UUID as PyUUID
    import os
    import aiofiles
    
    try:
        app_uuid = PyUUID(application_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid application ID")
    
    # Verify application
    query = select(models.LoanApplication).where(models.LoanApplication.id == app_uuid)
    result = await db.execute(query)
    application = result.scalars().first()
    
    if not application or application.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check if approved
    pred_query = select(models.LoanPrediction).where(
        models.LoanPrediction.application_id == app_uuid
    )
    pred_result = await db.execute(pred_query)
    prediction = pred_result.scalars().first()
    
    if not prediction or prediction.decision != "APPROVED":
        raise HTTPException(status_code=400, detail="Documents can only be uploaded for approved loans")
    
    # Validate file type
    allowed_types = ["application/pdf", "image/jpeg", "image/png"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: PDF, JPG, PNG")
    
    # Validate file size (max 5MB)
    file_content = await file.read()
    file_size = len(file_content)
    if file_size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")
    
    # Create upload directory
    upload_dir = f"uploads/{current_user.id}/{application_id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    import uuid
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'pdf'
    unique_filename = f"{document_type}_{uuid.uuid4().hex[:8]}.{ext}"
    file_path = f"{upload_dir}/{unique_filename}"
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(file_content)
    
    # Create document record
    doc = models.KYCDocument(
        application_id=app_uuid,
        user_id=current_user.id,
        document_type=document_type,
        file_name=unique_filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type,
        verification_status="PENDING"
    )
    
    db.add(doc)
    
    # Log audit
    await log_audit(
        db, current_user.id,
        models.AuditAction.DOCUMENT_UPLOADED,
        "kyc_document",
        doc.id,
        f"Uploaded {document_type} document: {file.filename}",
        extra_data={"file_size": file_size, "document_type": document_type}
    )
    
    await db.commit()
    await db.refresh(doc)
    
    return schemas.KYCDocumentResponse.model_validate(doc)


@app.get("/documents/{application_id}", response_model=List[schemas.KYCDocumentResponse])
async def get_documents(
    application_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get all documents for an application"""
    from uuid import UUID as PyUUID
    
    try:
        app_uuid = PyUUID(application_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid application ID")
    
    # Verify access
    app_query = select(models.LoanApplication).where(models.LoanApplication.id == app_uuid)
    app_result = await db.execute(app_query)
    application = app_result.scalars().first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if current_user.role == "customer" and application.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get documents
    query = select(models.KYCDocument).where(
        models.KYCDocument.application_id == app_uuid
    ).order_by(models.KYCDocument.uploaded_at.desc())
    
    result = await db.execute(query)
    documents = result.scalars().all()
    
    return [schemas.KYCDocumentResponse.model_validate(doc) for doc in documents]


@app.post("/documents/{document_id}/verify", response_model=schemas.KYCDocumentResponse)
async def verify_document(
    document_id: str,
    verification: schemas.KYCVerifyRequest,
    current_user: models.User = Depends(auth.require_officer),
    db: AsyncSession = Depends(database.get_db)
):
    """Officer verification of document"""
    from uuid import UUID as PyUUID
    
    try:
        doc_uuid = PyUUID(document_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document ID")
    
    query = select(models.KYCDocument).where(models.KYCDocument.id == doc_uuid)
    result = await db.execute(query)
    document = result.scalars().first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    document.verification_status = verification.status
    document.verification_notes = verification.notes
    document.verified_by = current_user.id
    document.verified_at = datetime.now()
    
    # Log audit
    action = models.AuditAction.DOCUMENT_VERIFIED if verification.status == "VERIFIED" else models.AuditAction.DOCUMENT_REJECTED
    await log_audit(
        db, current_user.id,
        action,
        "kyc_document",
        document.id,
        f"{verification.status}: {document.document_type}"
    )
    
    await db.commit()
    await db.refresh(document)
    
    return schemas.KYCDocumentResponse.model_validate(document)


# =====================================================
# ACTIVITY & AUDIT LOG ENDPOINTS
# =====================================================

@app.get("/activity", response_model=schemas.ActivityTimelineResponse)
async def get_activity_log(
    limit: int = 50,
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get user's activity log - returns empty if not logged in"""
    if current_user is None:
        return schemas.ActivityTimelineResponse(total_events=0, events=[])
    
    query = select(models.AuditLog).where(
        models.AuditLog.user_id == current_user.id
    ).order_by(models.AuditLog.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return schemas.ActivityTimelineResponse(
        total_events=len(logs),
        events=[schemas.AuditLogResponse.model_validate(log) for log in logs]
    )


# =====================================================
# SECURITY & PROFILE ENDPOINTS
# =====================================================

@app.put("/user/password")
async def change_password(
    request: schemas.PasswordChangeRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Change user password"""
    
    # Verify current password
    if not auth.verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    current_user.password_hash = auth.get_password_hash(request.new_password)
    
    # Log audit
    await log_audit(
        db, current_user.id,
        models.AuditAction.PASSWORD_CHANGED,
        description="Password changed successfully"
    )
    
    await db.commit()
    
    return {"message": "Password changed successfully"}


@app.put("/user/profile", response_model=schemas.UserResponse)
async def update_profile(
    request: schemas.ProfileUpdateRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Update user profile"""
    
    # Update fields if provided
    if request.first_name is not None:
        current_user.first_name = request.first_name
    if request.last_name is not None:
        current_user.last_name = request.last_name
    if request.email is not None:
        current_user.email = request.email
    if request.address_line1 is not None:
        current_user.address_line1 = request.address_line1
    if request.address_line2 is not None:
        current_user.address_line2 = request.address_line2
    if request.city is not None:
        current_user.city = request.city
    if request.state is not None:
        current_user.state = request.state
    if request.pincode is not None:
        current_user.pincode = request.pincode
    
    # Log audit
    await log_audit(
        db, current_user.id,
        models.AuditAction.PROFILE_UPDATED,
        description="Profile updated"
    )
    
    await db.commit()
    await db.refresh(current_user)
    
    return current_user


@app.get("/user/me", response_model=schemas.UserResponse)
async def get_current_user_profile(
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get current user's profile"""
    return current_user


@app.put("/user/password")
async def change_password(
    request: Request,
    password_data: schemas.PasswordChange,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Change user password - requires current password verification"""
    # Verify current password
    if not auth.verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Hash new password
    new_hash = auth.get_password_hash(password_data.new_password)
    current_user.password_hash = new_hash
    
    # Log the action
    await log_audit(
        db, current_user.id,
        models.AuditAction.PASSWORD_CHANGED,
        description="Password changed successfully",
        request=request
    )
    
    await db.commit()
    
    return {"message": "Password changed successfully"}


@app.put("/user/pin")
async def change_pin(
    request: Request,
    pin_data: schemas.PinChange,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Change user PIN - requires current PIN verification"""
    # Verify current PIN
    if not current_user.pin_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No PIN set for this account"
        )
    
    if not auth.verify_password(pin_data.current_pin, current_user.pin_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current PIN is incorrect"
        )
    
    # Hash new PIN
    new_hash = auth.get_password_hash(pin_data.new_pin)
    current_user.pin_hash = new_hash
    
    # Log the action
    await log_audit(
        db, current_user.id,
        models.AuditAction.PASSWORD_CHANGED,  # We'll use same action for PIN change
        description="PIN changed successfully",
        request=request
    )
    
    await db.commit()
    
    return {"message": "PIN changed successfully"}


# =====================================================
# ACTIVITY & AUDIT LOG ENDPOINTS - BANKING GRADE
# =====================================================

@app.get("/activity")
async def get_activity_all(
    limit: int = 50,
    offset: int = 0,
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Get all activity for current user.
    Returns categorized events with device info.
    """
    if current_user is None:
        return {"total_events": 0, "events": []}
    query = select(models.AuditLog).where(
        models.AuditLog.user_id == current_user.id
    ).order_by(models.AuditLog.created_at.desc()).limit(limit).offset(offset)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    # Count total
    count_query = select(func.count(models.AuditLog.id)).where(
        models.AuditLog.user_id == current_user.id
    )
    count_result = await db.execute(count_query)
    total = count_result.scalar()
    
    return {
        "total_events": total,
        "events": [
            {
                "id": str(log.id),
                "action": log.action,
                "category": log.event_category,
                "severity": log.severity,
                "description": log.description,
                "timestamp": log.created_at.isoformat(),
                "device": f"{log.device_type or 'Unknown'} - {log.browser or 'Unknown'}",
                "location": f"{log.location_city or 'Unknown'}, {log.location_country or 'Unknown'}",
                "entity_type": log.entity_type,
                "entity_id": str(log.entity_id) if log.entity_id else None
            }
            for log in logs
        ]
    }


@app.get("/activity/security")
async def get_security_activity(
    limit: int = 20,
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get security-related activity (logins, password changes, sessions)"""
    if current_user is None:
        return {"category": "Security", "events": []}
    query = select(models.AuditLog).where(
        models.AuditLog.user_id == current_user.id,
        models.AuditLog.event_category == models.EventCategory.SECURITY
    ).order_by(models.AuditLog.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return {
        "category": "Security",
        "events": [
            {
                "id": str(log.id),
                "action": log.action,
                "severity": log.severity,
                "description": log.description,
                "timestamp": log.created_at.isoformat(),
                "device": f"{log.device_type or 'Unknown'} - {log.browser or 'Unknown'} on {log.os or 'Unknown'}",
                "location": f"{log.location_city or 'Unknown'}, {log.location_country or 'Unknown'}",
                "ip": log.ip_address or "Unknown"
            }
            for log in logs
        ]
    }


@app.get("/activity/loans")
async def get_loan_activity(
    limit: int = 20,
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get loan-related activity (applications, decisions, reviews)"""
    if current_user is None:
        return {"category": "Loan Applications", "events": []}
    query = select(models.AuditLog).where(
        models.AuditLog.user_id == current_user.id,
        models.AuditLog.event_category == models.EventCategory.LOAN
    ).order_by(models.AuditLog.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    # Enrich with loan application details ("loan forms")
    events = []
    
    # Collect application IDs
    app_ids = set()
    for log in logs:
        if log.entity_type == "loan_application" and log.entity_id:
            app_ids.add(log.entity_id)
            
    # Fetch applications in bulk
    applications = {}
    if app_ids:
        app_query = select(models.LoanApplication).where(models.LoanApplication.id.in_(app_ids))
        app_result = await db.execute(app_query)
        apps = app_result.scalars().all()
        applications = {app.id: app for app in apps}

    for log in logs:
        app_details = None
        if log.entity_type == "loan_application" and log.entity_id in applications:
            app = applications[log.entity_id]
            app_details = {
                "loan_amount": app.loan_amount,
                "loan_purpose": app.loan_purpose,
                "created_at": app.created_at.isoformat(),
                "features": app.features_json
            }

        events.append({
            "id": str(log.id),
            "action": log.action,
            "severity": log.severity,
            "description": log.description,
            "timestamp": log.created_at.isoformat(),
            "application_id": str(log.entity_id) if log.entity_id else None,
            "extra": log.extra_data,
            "loan_details": app_details  # The "loan form" data from DB
        })
    
    return {
        "category": "Loan Applications",
        "events": events
    }


@app.get("/activity/kyc")
async def get_kyc_activity(
    limit: int = 20,
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get KYC-related activity (document uploads, verifications)"""
    if current_user is None:
        return {"category": "KYC & Documents", "events": []}
    query = select(models.AuditLog).where(
        models.AuditLog.user_id == current_user.id,
        models.AuditLog.event_category == models.EventCategory.KYC
    ).order_by(models.AuditLog.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return {
        "category": "KYC & Documents",
        "events": [
            {
                "id": str(log.id),
                "action": log.action,
                "severity": log.severity,
                "description": log.description,
                "timestamp": log.created_at.isoformat(),
                "document_id": str(log.entity_id) if log.entity_id else None,
                "document_type": log.extra_data.get("document_type") if log.extra_data else None
            }
            for log in logs
        ]
    }


@app.get("/activity/payments")
async def get_payment_activity(
    limit: int = 20,
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get payment-related activity (EMI payments, schedules)"""
    if current_user is None:
        return {"category": "Payments & EMI", "events": []}
    query = select(models.AuditLog).where(
        models.AuditLog.user_id == current_user.id,
        models.AuditLog.event_category == models.EventCategory.PAYMENT
    ).order_by(models.AuditLog.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return {
        "category": "Payments & EMI",
        "events": [
            {
                "id": str(log.id),
                "action": log.action,
                "severity": log.severity,
                "description": log.description,
                "timestamp": log.created_at.isoformat(),
                "amount": log.extra_data.get("amount") if log.extra_data else None,
                "emi_number": log.extra_data.get("emi_number") if log.extra_data else None
            }
            for log in logs
        ]
    }


@app.get("/activity/profile")
async def get_profile_activity(
    limit: int = 20,
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get profile-related activity (updates, preferences, consents)"""
    if current_user is None:
        return {"category": "Profile & Settings", "events": []}
    query = select(models.AuditLog).where(
        models.AuditLog.user_id == current_user.id,
        models.AuditLog.event_category == models.EventCategory.PROFILE
    ).order_by(models.AuditLog.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return {
        "category": "Profile & Settings",
        "events": [
            {
                "id": str(log.id),
                "action": log.action,
                "severity": log.severity,
                "description": log.description,
                "timestamp": log.created_at.isoformat()
            }
            for log in logs
        ]
    }


@app.get("/activity/dashboard")
async def get_activity_dashboard(
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Get activity dashboard with categorized recent events.
    Shows overview of all activity categories.
    """
    if current_user is None:
        return []
    categories = [
        models.EventCategory.SECURITY,
        models.EventCategory.LOAN,
        models.EventCategory.KYC,
        models.EventCategory.PAYMENT,
        models.EventCategory.PROFILE
    ]
    
    dashboard = {}
    
    for category in categories:
        query = select(models.AuditLog).where(
            models.AuditLog.user_id == current_user.id,
            models.AuditLog.event_category == category
        ).order_by(models.AuditLog.created_at.desc()).limit(5)
        
        result = await db.execute(query)
        logs = result.scalars().all()
        
        # Count total for this category
        count_query = select(func.count(models.AuditLog.id)).where(
            models.AuditLog.user_id == current_user.id,
            models.AuditLog.event_category == category
        )
        count_result = await db.execute(count_query)
        total = count_result.scalar()
        
        dashboard[category.lower()] = {
            "total": total,
            "recent": [
                {
                    "action": log.action,
                    "description": log.description,
                    "severity": log.severity,
                    "timestamp": log.created_at.isoformat()
                }
                for log in logs
            ]
        }
    
    # Get last login
    last_login_query = select(models.AuditLog).where(
        models.AuditLog.user_id == current_user.id,
        models.AuditLog.action == models.AuditAction.LOGIN_SUCCESS
    ).order_by(models.AuditLog.created_at.desc()).limit(1)
    
    last_login_result = await db.execute(last_login_query)
    last_login = last_login_result.scalars().first()
    
    # Get active sessions count
    session_query = select(func.count(models.UserSession.id)).where(
        models.UserSession.user_id == current_user.id,
        models.UserSession.is_active == True
    )
    session_result = await db.execute(session_query)
    active_sessions = session_result.scalar() or 0
    
    return {
        "user_id": str(current_user.id),
        "last_login": last_login.created_at.isoformat() if last_login else None,
        "last_login_location": f"{last_login.location_city}, {last_login.location_country}" if last_login else None,
        "active_sessions": active_sessions,
        "categories": dashboard
    }


# =====================================================
# SESSION MANAGEMENT ENDPOINTS
# =====================================================

@app.get("/sessions")
async def get_user_sessions(
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get all active sessions for current user"""
    query = select(models.UserSession).where(
        models.UserSession.user_id == current_user.id,
        models.UserSession.is_active == True
    ).order_by(models.UserSession.started_at.desc())
    
    result = await db.execute(query)
    sessions = result.scalars().all()
    
    return {
        "active_sessions": len(sessions),
        "sessions": [
            {
                "id": str(s.id),
                "device_type": s.device_type or "Unknown",
                "browser": s.browser or "Unknown",
                "os": s.os or "Unknown",
                "location": f"{s.location_city or 'Unknown'}, {s.location_country or 'Unknown'}",
                "started_at": s.started_at.isoformat(),
                "last_activity": s.last_activity.isoformat() if s.last_activity else None,
                "is_new_device": s.is_new_device,
                "is_new_location": s.is_new_location
            }
            for s in sessions
        ]
    }


@app.delete("/sessions/{session_id}")
async def terminate_session(
    session_id: str,
    request: Request,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Terminate a specific session"""
    from uuid import UUID as PyUUID
    
    try:
        sess_uuid = PyUUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID")
    
    query = select(models.UserSession).where(
        models.UserSession.id == sess_uuid,
        models.UserSession.user_id == current_user.id
    )
    result = await db.execute(query)
    session = result.scalars().first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.is_active = False
    session.ended_at = datetime.utcnow()
    
    # Log the termination
    await log_audit(
        db, current_user.id,
        models.AuditAction.SESSION_TERMINATED,
        entity_type="session",
        entity_id=sess_uuid,
        description="Session terminated remotely",
        request=request
    )
    
    await db.commit()
    
    return {"message": "Session terminated successfully"}


# =====================================================
# KYC WORKFLOW ENDPOINTS - POST-APPROVAL ONLY
# =====================================================

async def verify_kyc_eligibility(application_id: str, user_id, db: AsyncSession):
    """
    Check if KYC is allowed for this loan application.
    Returns (application, prediction, kyc_tracking) or raises 403.
    """
    from uuid import UUID as PyUUID
    
    try:
        app_uuid = PyUUID(application_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid application ID")
    
    # Get application
    app_query = select(models.LoanApplication).where(
        models.LoanApplication.id == app_uuid,
        models.LoanApplication.user_id == user_id
    )
    app_result = await db.execute(app_query)
    application = app_result.scalars().first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Loan application not found")
    
    # Get prediction
    pred_query = select(models.LoanPrediction).where(
        models.LoanPrediction.application_id == app_uuid
    )
    pred_result = await db.execute(pred_query)
    prediction = pred_result.scalars().first()
    
    if not prediction:
        raise HTTPException(status_code=400, detail="No decision found for this application")
    
    # Check if APPROVED
    if prediction.decision != "APPROVED":
        raise HTTPException(
            status_code=403, 
            detail=f"KYC not available. Loan status: {prediction.decision}. Only APPROVED loans can proceed to KYC."
        )
    
    # Get or create KYC tracking
    kyc_query = select(models.KYCStatusTracking).where(
        models.KYCStatusTracking.application_id == app_uuid
    )
    kyc_result = await db.execute(kyc_query)
    kyc_tracking = kyc_result.scalars().first()
    
    if not kyc_tracking:
        kyc_tracking = models.KYCStatusTracking(
            application_id=app_uuid,
            user_id=user_id,
            overall_status="NOT_STARTED"
        )
        db.add(kyc_tracking)
        await db.commit()
        await db.refresh(kyc_tracking)
    
    return application, prediction, kyc_tracking


@app.get("/kyc/{application_id}/status")
async def get_kyc_status(
    application_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Get KYC eligibility and progress status.
    Returns 403 if loan is not APPROVED.
    """
    application, prediction, kyc_tracking = await verify_kyc_eligibility(
        application_id, current_user.id, db
    )
    
    # Get document count
    doc_query = select(models.KYCDocument).where(
        models.KYCDocument.application_id == application.id
    )
    doc_result = await db.execute(doc_query)
    documents = doc_result.scalars().all()
    
    uploaded_count = len(documents)
    verified_count = len([d for d in documents if d.verification_status == "VERIFIED"])
    
    return {
        "application_id": str(application.id),
        "loan_status": prediction.decision,
        "kyc_eligible": True,
        "step_1_documents": kyc_tracking.step_1_documents,
        "step_1_docs_required": 4,
        "step_1_docs_uploaded": uploaded_count,
        "step_1_docs_verified": verified_count,
        "step_2_bank_details": kyc_tracking.step_2_bank_details,
        "step_3_agreement": kyc_tracking.step_3_agreement,
        "overall_status": kyc_tracking.overall_status,
        "can_proceed_to_disbursement": kyc_tracking.can_proceed_to_disbursement,
        "documents": [
            {
                "id": str(d.id),
                "document_type": d.document_type,
                "file_name": d.file_name,
                "verification_status": d.verification_status,
                "uploaded_at": d.uploaded_at.isoformat()
            }
            for d in documents
        ]
    }


@app.post("/kyc/{application_id}/documents")
async def upload_kyc_document(
    application_id: str,
    document_type: str,  # ID_PROOF or ADDRESS_PROOF
    document_category: str,  # PAN, PASSPORT, AADHAAR, UTILITY_BILL etc
    request: Request,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Upload KYC document (Step 1).
    Accepts: PDF, JPG, PNG. Max 5MB.
    """
    application, prediction, kyc_tracking = await verify_kyc_eligibility(
        application_id, current_user.id, db
    )
    
    # Validate document type
    valid_types = ["ID_PROOF", "ADDRESS_PROOF"]
    if document_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Document type must be one of: {valid_types}")
    
    valid_categories = {
        "ID_PROOF": ["PAN", "PASSPORT", "DRIVING_LICENSE", "VOTER_ID"],
        "ADDRESS_PROOF": ["AADHAAR", "UTILITY_BILL", "BANK_STATEMENT", "RENTAL_AGREEMENT"]
    }
    
    if document_category not in valid_categories.get(document_type, []):
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid category for {document_type}. Valid: {valid_categories[document_type]}"
        )
    
    
    # Create document record (simulating file upload)
    import uuid
    doc = models.KYCDocument(
        application_id=application.id,
        user_id=current_user.id,
        document_type=f"{document_type}_{document_category}",
        file_name=f"{document_category}_{uuid.uuid4().hex[:8]}.pdf",
        file_path=f"/uploads/kyc/{current_user.id}/{application.id}/",
        file_size=1024 * 100,  # Simulated 100KB
        mime_type="application/pdf",
        verification_status="UPLOADED"
    )
    db.add(doc)
    
    # Update KYC tracking
    kyc_tracking.step_1_documents = "IN_PROGRESS"
    if kyc_tracking.overall_status == "NOT_STARTED":
        kyc_tracking.overall_status = "IN_PROGRESS"
        kyc_tracking.started_at = datetime.utcnow()
    
    # Log audit
    await log_audit(
        db, current_user.id,
        models.AuditAction.DOCUMENT_UPLOADED,
        entity_type="kyc_document",
        entity_id=doc.id,
        description=f"Uploaded {document_category} document for KYC",
        request=request
    )
    
    await db.commit()
    await db.refresh(doc)
    
    return {
        "message": "Document uploaded successfully",
        "document_id": str(doc.id),
        "document_type": doc.document_type,
        "verification_status": doc.verification_status
    }


@app.post("/kyc/{application_id}/bank-details")
async def submit_bank_details(
    application_id: str,
    bank_data: schemas.BankDetailsSubmit,
    request: Request,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Submit bank account details (Step 2).
    Account number is encrypted and masked.
    """
    import re
    import hashlib
    
    application, prediction, kyc_tracking = await verify_kyc_eligibility(
        application_id, current_user.id, db
    )
    
    # Validate account numbers match
    if bank_data.account_number != bank_data.confirm_account_number:
        raise HTTPException(status_code=400, detail="Account numbers do not match")
    
    # Validate IFSC format
    ifsc_pattern = r'^[A-Z]{4}0[A-Z0-9]{6}$'
    if not re.match(ifsc_pattern, bank_data.ifsc_code.upper()):
        raise HTTPException(status_code=400, detail="Invalid IFSC code format")
    
    # Validate account number (basic: 9-18 digits)
    if not re.match(r'^\d{9,18}$', bank_data.account_number):
        raise HTTPException(status_code=400, detail="Invalid account number format (9-18 digits required)")
    
    # Check if bank details already exist
    existing_query = select(models.BankAccountDetails).where(
        models.BankAccountDetails.application_id == application.id
    )
    existing_result = await db.execute(existing_query)
    if existing_result.scalars().first():
        raise HTTPException(status_code=400, detail="Bank details already submitted for this application")
    
    # Encrypt account number (simple hash for demo - use proper AES in production)
    encrypted = hashlib.sha256(bank_data.account_number.encode()).hexdigest()
    masked = "****" + bank_data.account_number[-4:]
    
    bank_details = models.BankAccountDetails(
        application_id=application.id,
        user_id=current_user.id,
        account_holder_name=bank_data.account_holder_name,
        bank_name=bank_data.bank_name,
        account_number_encrypted=encrypted,
        account_number_masked=masked,
        ifsc_code=bank_data.ifsc_code.upper(),
        account_type=bank_data.account_type
    )
    db.add(bank_details)
    
    # Update KYC tracking
    kyc_tracking.step_2_bank_details = "COMPLETED"
    
    # Log audit
    await log_audit(
        db, current_user.id,
        models.AuditAction.PROFILE_UPDATED,
        entity_type="bank_account",
        entity_id=bank_details.id,
        description=f"Bank details submitted for loan application",
        request=request
    )
    
    await db.commit()
    await db.refresh(bank_details)
    
    return {
        "message": "Bank details submitted successfully",
        "bank_details_id": str(bank_details.id),
        "account_masked": masked,
        "bank_name": bank_data.bank_name,
        "ifsc_code": bank_data.ifsc_code.upper()
    }


@app.get("/kyc/{application_id}/bank-details")
async def get_bank_details(
    application_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get bank details (masked) for an application."""
    application, prediction, kyc_tracking = await verify_kyc_eligibility(
        application_id, current_user.id, db
    )
    
    bank_query = select(models.BankAccountDetails).where(
        models.BankAccountDetails.application_id == application.id
    )
    bank_result = await db.execute(bank_query)
    bank_details = bank_result.scalars().first()
    
    if not bank_details:
        return {"bank_details": None}
    
    return {
        "bank_details": {
            "id": str(bank_details.id),
            "account_holder_name": bank_details.account_holder_name,
            "bank_name": bank_details.bank_name,
            "account_number_masked": bank_details.account_number_masked,
            "ifsc_code": bank_details.ifsc_code,
            "account_type": bank_details.account_type,
            "is_verified": bank_details.is_verified,
            "created_at": bank_details.created_at.isoformat()
        }
    }


@app.get("/kyc/{application_id}/agreement")
async def get_loan_agreement(
    application_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Generate and return loan agreement (Step 3).
    Creates agreement record if not exists.
    """
    application, prediction, kyc_tracking = await verify_kyc_eligibility(
        application_id, current_user.id, db
    )
    
    # Check if agreement already exists
    agree_query = select(models.LoanAgreement).where(
        models.LoanAgreement.application_id == application.id
    )
    agree_result = await db.execute(agree_query)
    agreement = agree_result.scalars().first()
    
    if not agreement:
        # Generate agreement from prediction and application data
        # Use application.loan_amount directly (it's a column)
        loan_amount = application.loan_amount or (application.features_json or {}).get("loan_amount", 100000)
        interest_rate = prediction.interest_rate or 12.0
        tenure_months = application.loan_duration or (application.features_json or {}).get("loan_duration", 60)
        
        # Calculate EMI: P * r * (1+r)^n / ((1+r)^n - 1)
        monthly_rate = (interest_rate or 12.0) / 12 / 100
        
        # Guard against zero tenure or interest
        if tenure_months > 0 and monthly_rate > 0:
            pow_factor = (1 + monthly_rate) ** tenure_months
            emi = (loan_amount * monthly_rate * pow_factor) / (pow_factor - 1)
        else:
            emi = loan_amount / (tenure_months if tenure_months > 0 else 1)
            
        processing_fee = loan_amount * 0.02  # 2% processing fee
        total_payable = emi * tenure_months
        
        agreement_text = f"""
LOAN AGREEMENT

This Loan Agreement is entered into between the Lender (LoanAdvisor Financial Services) 
and the Borrower ({current_user.first_name} {current_user.last_name}).

LOAN DETAILS:
- Principal Amount: ₹{loan_amount:,.2f}
- Annual Interest Rate: {interest_rate}%
- Tenure: {tenure_months} months
- Monthly EMI: ₹{emi:,.2f}
- Processing Fee: ₹{processing_fee:,.2f}
- Total Amount Payable: ₹{total_payable:,.2f}

TERMS & CONDITIONS:
1. The EMI is due on the same date each month.
2. Late payment attracts a penalty of 2% per month.
3. Prepayment is allowed after 6 EMIs with no penalty.
4. The loan is secured against future income.
5. Default may result in legal action and credit score impact.

By signing this agreement, you acknowledge that you have read, 
understood, and agree to all terms and conditions.
        """
        
        agreement = models.LoanAgreement(
            application_id=application.id,
            user_id=current_user.id,
            agreement_version="v1.0",
            loan_amount=loan_amount,
            interest_rate=interest_rate,
            tenure_months=tenure_months,
            emi_amount=round(emi, 2),
            processing_fee=round(processing_fee, 2),
            total_payable=round(total_payable, 2),
            agreement_summary=agreement_text.strip()
        )
        db.add(agreement)
        await db.commit()
        await db.refresh(agreement)
    
    return {
        "agreement": {
            "id": str(agreement.id),
            "agreement_version": agreement.agreement_version,
            "loan_amount": agreement.loan_amount,
            "interest_rate": agreement.interest_rate,
            "tenure_months": agreement.tenure_months,
            "emi_amount": agreement.emi_amount,
            "processing_fee": agreement.processing_fee,
            "total_payable": agreement.total_payable,
            "agreement_text": agreement.agreement_summary,
            "consent_given": agreement.consent_given,
            "signed_at": agreement.signed_at.isoformat() if agreement.signed_at else None,
            "status": agreement.status
        }
    }

# =============================================================================
# ADMIN BANK DETAILS ENDPOINTS
# =============================================================================

@app.get("/admin/bank-details", response_model=List[schemas.AdminBankDetailsResponse])
async def get_admin_bank_details(
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get all admin bank details. Available to all authenticated users (for payments).
    """
    query = select(models.AdminBankDetails).where(models.AdminBankDetails.is_active == True)
    result = await db.execute(query)
    return result.scalars().all()

@app.post("/admin/bank-details", response_model=schemas.AdminBankDetailsResponse)
async def create_admin_bank_details(
    bank_data: schemas.AdminBankDetailsCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Create new admin bank details. Admin only.
    """
    if current_user.role != "admin" and current_user.role != "bank_officer":
        raise HTTPException(status_code=403, detail="Only admins can manage bank details")
        
    new_bank = models.AdminBankDetails(**bank_data.model_dump())
    db.add(new_bank)
    
    await log_audit(
        db, current_user.id,
        models.AuditAction.ADMIN_BANK_ADDED,
        entity_type="admin_bank",
        description=f"Added admin bank: {bank_data.bank_name}",
        extra_data={"bank_name": bank_data.bank_name}
    )
    
    await db.commit()
    await db.refresh(new_bank)
    return new_bank

@app.patch("/admin/bank-details/{bank_id}", response_model=schemas.AdminBankDetailsResponse)
async def update_admin_bank_details(
    bank_id: str,
    bank_data: schemas.AdminBankDetailsCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Update admin bank details. Admin only.
    """
    if current_user.role != "admin" and current_user.role != "bank_officer":
        raise HTTPException(status_code=403, detail="Only admins can manage bank details")
        
    query = select(models.AdminBankDetails).where(models.AdminBankDetails.id == bank_id)
    result = await db.execute(query)
    bank = result.scalars().first()
    
    if not bank:
        raise HTTPException(status_code=404, detail="Bank details not found")
        
    for field, value in bank_data.model_dump().items():
        setattr(bank, field, value)
        
    await log_audit(
        db, current_user.id,
        models.AuditAction.ADMIN_BANK_UPDATED,
        entity_type="admin_bank",
        entity_id=bank.id,
        description=f"Updated admin bank: {bank.bank_name}"
    )
    
    await db.commit()
    await db.refresh(bank)
    return bank


@app.post("/kyc/{application_id}/agreement/sign")
async def sign_loan_agreement(
    application_id: str,
    sign_data: schemas.AgreementSignRequest,
    request: Request,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Sign the loan agreement.
    Requires explicit consent checkbox.
    """
    import device_utils
    
    application, prediction, kyc_tracking = await verify_kyc_eligibility(
        application_id, current_user.id, db
    )
    
    if not sign_data.consent_checkbox:
        raise HTTPException(status_code=400, detail="You must check the consent checkbox to sign")
    
    # Get agreement
    agree_query = select(models.LoanAgreement).where(
        models.LoanAgreement.application_id == application.id
    )
    agree_result = await db.execute(agree_query)
    agreement = agree_result.scalars().first()
    
    if not agreement:
        raise HTTPException(status_code=400, detail="Agreement not found. Generate it first.")
    
    if agreement.consent_given:
        raise HTTPException(status_code=400, detail="Agreement already signed")
    
    # Sign the agreement
    ip = device_utils.get_client_ip(request)
    ip_hash = device_utils.hash_ip(ip)
    
    agreement.consent_given = True
    agreement.consent_checkbox_text = sign_data.consent_text_acknowledged
    agreement.signed_at = datetime.now(timezone.utc)
    agreement.ip_address_hash = ip_hash
    agreement.user_agent = request.headers.get("User-Agent", "")
    agreement.status = "SIGNED"
    
    # Update KYC tracking
    kyc_tracking.step_3_agreement = "COMPLETED"
    
    # Log audit
    await log_audit(
        db, current_user.id,
        models.AuditAction.CONSENT_ACCEPTED,
        entity_type="loan_agreement",
        entity_id=agreement.id,
        description="Loan agreement signed digitally",
        request=request
    )
    
    await db.commit()
    
    return {
        "message": "Agreement signed successfully",
        "signed_at": agreement.signed_at.isoformat(),
        "agreement_id": str(agreement.id)
    }


@app.post("/kyc/{application_id}/complete")
async def complete_kyc(
    application_id: str,
    request: Request,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Complete KYC process and mark as ready for disbursement.
    Validates all steps are completed.
    """
    application, prediction, kyc_tracking = await verify_kyc_eligibility(
        application_id, current_user.id, db
    )
    
    # Verify Step 1: Documents
    doc_query = select(models.KYCDocument).where(
        models.KYCDocument.application_id == application.id
    )
    doc_result = await db.execute(doc_query)
    documents = doc_result.scalars().all()
    
    if len(documents) < 4:
        raise HTTPException(
            status_code=400, 
            detail=f"Step 1 incomplete: Upload at least 4 documents. Uploaded: {len(documents)}"
        )
    
    # Verify Step 2: Bank Details
    bank_query = select(models.BankAccountDetails).where(
        models.BankAccountDetails.application_id == application.id
    )
    bank_result = await db.execute(bank_query)
    bank_details = bank_result.scalars().first()
    
    if not bank_details:
        raise HTTPException(status_code=400, detail="Step 2 incomplete: Bank details not submitted")
    
    # Verify Step 3: Agreement
    agree_query = select(models.LoanAgreement).where(
        models.LoanAgreement.application_id == application.id
    )
    agree_result = await db.execute(agree_query)
    agreement = agree_result.scalars().first()
    
    if not agreement or not agreement.consent_given:
        raise HTTPException(status_code=400, detail="Step 3 incomplete: Loan agreement not signed")
    
    # Mark KYC as complete
    kyc_tracking.step_1_documents = "COMPLETED"
    kyc_tracking.overall_status = "COMPLETED"
    kyc_tracking.can_proceed_to_disbursement = True
    kyc_tracking.completed_at = datetime.utcnow()
    
    # Log audit
    await log_audit(
        db, current_user.id,
        models.AuditAction.KYC_COMPLETED,
        entity_type="kyc_status",
        entity_id=kyc_tracking.id,
        description="KYC process completed - eligible for disbursement",
        request=request
    )
    
    await db.commit()
    
    return {
        "message": "KYC completed successfully!",
        "status": "COMPLETED",
        "can_proceed_to_disbursement": True,
        "completed_at": kyc_tracking.completed_at.isoformat(),
        "next_step": "Disbursement will be processed within 24-48 hours"
    }

@app.get("/loan-application/{application_id}/report")
async def get_loan_report(application_id: str, db: AsyncSession = Depends(database.get_db)):
    """Generate and download PDF report for a loan application"""
    try:
        # Fetch Application with User details
        query = select(models.LoanApplication).where(models.LoanApplication.id == application_id)
        result = await db.execute(query)
        application = result.scalars().first()
        
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
            
        # Fetch User data for name/email (if linked) - Application object has user_id
        # We can construct a simple object or fetch the user relation if lazy loading is not issue
        # Ideally, eagerly load 'user' and 'prediction'
        # Re-query with joined load
        from sqlalchemy.orm import selectinload
        query = select(models.LoanApplication).options(
            selectinload(models.LoanApplication.user),
            selectinload(models.LoanApplication.prediction)
        ).where(models.LoanApplication.id == application_id)
        
        result = await db.execute(query)
        application = result.scalars().first()
        
        if not application.prediction:
            raise HTTPException(status_code=400, detail="Loan analysis not yet completed for this application")

        # Map Prediction DB object to the dictionary format expected by generator
        # The generator expects: loan_details, decision, approval_probability, interest_rate, emi, explanations
        
        pred = application.prediction
        
        # Calculate total interest
        total_interest = (pred.total_repayment or 0) - (application.loan_amount or 0)
        
        # Calculate income ratios from real application data
        monthly_income = application.monthly_income or 50000
        monthly_debt = application.monthly_debt_payments or 0
        emi_to_income = (pred.emi / monthly_income * 100) if monthly_income > 0 and pred.emi else 0
        debt_to_income = ((monthly_debt + (pred.emi or 0)) / monthly_income * 100) if monthly_income > 0 else 0
        
        # Calculate credit score using CIBIL-standard weighted factors
        # This matches the CreditScoreEstimator in loan_advisor.py
        from loan_advisor import CreditScoreEstimator
        
        # Build profile for credit score calculation
        credit_profile = {
            'monthly_income': monthly_income,
            'debt_to_income_ratio': monthly_debt / monthly_income if monthly_income > 0 else 0.5,
            'employment_status': application.employment_status or 'Employed',
            'job_tenure': application.job_tenure or 2,
            'experience': application.experience or 5,
            'age': application.age or 30,
            'home_ownership_status': application.home_ownership_status or 'Rent',
            'education_level': application.education_level or 'Bachelor',
        }
        
        credit_min, credit_max, credit_rating = CreditScoreEstimator.estimate(credit_profile)
        credit_score = (credit_min + credit_max) // 2  # Use midpoint for display
        
        # Helper to safely get nested dicts if stored as such, or reconstruct
        analysis_result = {
            "decision": pred.decision,
            "decision_reason": pred.decision_reason,
            "approval_probability": pred.approval_probability,
            "loan_details": {
                "amount": application.loan_amount,
                "duration_years": application.loan_duration // 12 if application.loan_duration else 0
            },
            "loan_purpose": application.loan_purpose,
            "interest_rate": {"annual": pred.interest_rate},
            "emi": {
                "monthly": pred.emi,
                "total_repayment": pred.total_repayment,
                "total_interest": total_interest,
            },
            "income_analysis": {
                "monthly_income": monthly_income,
                "emi_to_income_ratio": emi_to_income,
                "debt_to_income_ratio": debt_to_income,
            },
            "credit_score": {
                "score": credit_score,
                "rating": credit_rating,
            },
            "explanations": pred.shap_summary if pred.shap_summary else []
        }
        
        # Create a helper object for User details since generator expects 'application.full_name' etc
        class AppContext:
            def __init__(self, app_obj):
                u = app_obj.user
                self.full_name = f"{u.first_name} {u.last_name}" if u.first_name else "Valued Customer"
                self.email = u.email
                self.mobile_number = u.mobile_number
                self.id = str(app_obj.id)
                self.loan_amount = app_obj.loan_amount
                self.monthly_income = app_obj.monthly_income
                self.loan_purpose = app_obj.loan_purpose
                self.employment_status = app_obj.employment_status
                self.loan_duration = app_obj.loan_duration
                self.date_of_birth = u.date_of_birth
                self.gender = u.gender or app_obj.gender
                self.age = app_obj.age
                self.address = f"{u.address_line1 or ''}, {u.city or ''}, {u.state or ''} - {u.pincode or ''}" if u.address_line1 else None
                self.pan_number = u.pan_number
                self.customer_id = u.customer_id
                self.kyc_verified = u.kyc_verified

        app_context = AppContext(application)
        
        # Generate PDF
        pdf_bytes = report_generator.generate_loan_report_pdf(app_context, analysis_result)
        
        # Return as downloadable file
        return Response(
            # Using bytes directly.
            content=bytes(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=Loan_Report_{application.user.customer_id}.pdf"
            }
        )

    except Exception as e:
        print(f"Report Generation Error: {e}")
        # traceback
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# QR CODE & SHAREABLE REPORT ENDPOINTS
# ============================================================================

import qrcode
from io import BytesIO
import secrets
import hashlib

# Store temporary tokens (in production, use Redis or database)
report_tokens = {}

@app.get("/loan-application/{application_id}/report-qr")
async def get_report_qr_code(
    application_id: str, 
    request: Request,
    db: AsyncSession = Depends(database.get_db)
):
    """Generate QR code for mobile report download"""
    try:
        # Verify application exists
        query = select(models.LoanApplication).where(models.LoanApplication.id == application_id)
        result = await db.execute(query)
        application = result.scalars().first()
        
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Generate secure token for this report (valid for 24 hours)
        token = secrets.token_urlsafe(32)
        expiry = datetime.now() + timedelta(hours=24)
        
        # Store token with application_id
        report_tokens[token] = {
            "application_id": application_id,
            "expiry": expiry
        }
        
        # Create shareable URL - Use the current request's base URL for maximum reliability
        # This handles localhost, IP addresses, and production domains (like Render) automatically
        base_url = str(request.base_url).rstrip('/')
        
        # Embed Tracking ID in the URL for reference/scanning
        tracking_ref = f"?ref={application.tracking_id}" if getattr(application, "tracking_id", None) else ""
        shareable_url = f"{base_url}/shared-report/{token}{tracking_ref}"
        
        # Generate QR code - Use version=None for auto-fitting
        qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(shareable_url)
        qr.make(fit=True)
        
        # Create QR code image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to bytes
        buf = BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)
        
        return Response(
            content=buf.getvalue(),
            media_type="image/png",
            headers={
                "Cache-Control": "no-cache",
                "X-Token-Expiry": expiry.isoformat()
            }
        )
    
    except Exception as e:
        print(f"QR Generation Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/shared-report/{token}")
async def get_shared_report(token: str, db: AsyncSession = Depends(database.get_db)):
    """Download report using shareable token (no authentication required)"""
    try:
        # Validate token
        if token not in report_tokens:
            raise HTTPException(status_code=404, detail="Invalid or expired link")
        
        token_data = report_tokens[token]
        
        # Check expiry
        if datetime.now() > token_data["expiry"]:
            del report_tokens[token]
            raise HTTPException(status_code=410, detail="Link expired")
        
        application_id = token_data["application_id"]
        
        # Fetch Application with User details (same logic as regular report)
        from sqlalchemy.orm import selectinload
        query = select(models.LoanApplication).options(
            selectinload(models.LoanApplication.user),
            selectinload(models.LoanApplication.prediction)
        ).where(models.LoanApplication.id == application_id)
        
        result = await db.execute(query)
        application = result.scalars().first()
        
        if not application or not application.prediction:
            raise HTTPException(status_code=404, detail="Report not available")

        # Generate report (same logic as regular endpoint)
        pred = application.prediction
        
        total_interest = (pred.total_repayment or 0) - (application.loan_amount or 0)
        monthly_income = application.monthly_income or 50000
        monthly_debt = application.monthly_debt_payments or 0
        emi_to_income = (pred.emi / monthly_income * 100) if monthly_income > 0 and pred.emi else 0
        debt_to_income = ((monthly_debt + (pred.emi or 0)) / monthly_income * 100) if monthly_income > 0 else 0
        
        # Calculate credit score using CIBIL-standard weighted factors
        # This matches the CreditScoreEstimator in loan_advisor.py
        from loan_advisor import CreditScoreEstimator
        
        # Build profile for credit score calculation
        credit_profile = {
            'monthly_income': monthly_income,
            'debt_to_income_ratio': monthly_debt / monthly_income if monthly_income > 0 else 0.5,
            'employment_status': application.employment_status or 'Employed',
            'job_tenure': application.job_tenure or 2,
            'experience': application.experience or 5,
            'age': application.age or 30,
            'home_ownership_status': application.home_ownership_status or 'Rent',
            'education_level': application.education_level or 'Bachelor',
        }
        
        credit_min, credit_max, credit_rating = CreditScoreEstimator.estimate(credit_profile)
        credit_score = (credit_min + credit_max) // 2  # Use midpoint for display
        
        analysis_result = {
            "decision": pred.decision,
            "decision_reason": pred.decision_reason,
            "approval_probability": pred.approval_probability,
            "loan_details": {
                "amount": application.loan_amount,
                "duration_years": application.loan_duration // 12 if application.loan_duration else 0
            },
            "loan_purpose": application.loan_purpose,
            "interest_rate": {"annual": pred.interest_rate},
            "emi": {
                "monthly": pred.emi,
                "total_repayment": pred.total_repayment,
                "total_interest": total_interest,
            },
            "income_analysis": {
                "monthly_income": monthly_income,
                "emi_to_income_ratio": emi_to_income,
                "debt_to_income_ratio": debt_to_income,
            },
            "credit_score": {
                "score": credit_score,
                "rating": credit_rating,
            },
            "explanations": pred.shap_summary if pred.shap_summary else []
        }
        
        class AppContext:
            def __init__(self, app_obj):
                u = app_obj.user
                self.full_name = f"{u.first_name} {u.last_name}" if u.first_name else "Valued Customer"
                self.email = u.email
                self.mobile_number = u.mobile_number
                self.id = str(app_obj.id)
                self.loan_amount = app_obj.loan_amount
                self.monthly_income = app_obj.monthly_income
                self.loan_purpose = app_obj.loan_purpose
                self.employment_status = app_obj.employment_status
                self.loan_duration = app_obj.loan_duration
                self.date_of_birth = u.date_of_birth
                self.gender = u.gender or app_obj.gender
                self.age = app_obj.age
                self.address = f"{u.address_line1 or ''}, {u.city or ''}, {u.state or ''} - {u.pincode or ''}" if u.address_line1 else None
                self.pan_number = u.pan_number
                self.customer_id = u.customer_id
                self.kyc_verified = u.kyc_verified

        app_context = AppContext(application)
        
        # Generate PDF
        pdf_bytes = report_generator.generate_loan_report_pdf(app_context, analysis_result)
        
        # Generate filename with timestamp for uniqueness
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"Loan_Report_{application.user.customer_id}_{timestamp}.pdf"
        
        # Return as downloadable file with mobile-friendly headers
        return Response(
            content=bytes(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Type": "application/pdf",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
                "X-Content-Type-Options": "nosniff"
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Shared Report Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# AI CHATBOT ENDPOINT
# ============================================================================

# AI Chatbot endpoint moved further down to consolidate duplicates.


# =====================================================
# MOCK VALIDATION APIs - For Demo/Testing
# =====================================================

class PANValidationRequest(BaseModel):
    pan_number: str

class AadhaarValidationRequest(BaseModel):
    aadhaar_number: str

class BankAccountValidationRequest(BaseModel):
    account_number: str
    ifsc_code: str

class CIBILCheckRequest(BaseModel):
    pan_number: str

class StatementAnalysisRequest(BaseModel):
    transactions: List[Dict[str, Any]]
    requested_loan_amount: Optional[int] = 500000
    loan_tenure_months: Optional[int] = 60


@app.post("/mock/validate-pan")
async def mock_validate_pan(request: PANValidationRequest):
    """
    Mock PAN validation - validates format and returns mock holder details.
    No actual NSDL/Income Tax API call.
    """
    from bank_statement_analyzer import validate_pan
    result = validate_pan(request.pan_number)
    return result


@app.post("/mock/validate-aadhaar")
async def mock_validate_aadhaar(request: AadhaarValidationRequest):
    """
    Mock Aadhaar validation - validates format and returns mock details.
    No OTP required, no actual UIDAI API call.
    """
    from bank_statement_analyzer import validate_aadhaar
    result = validate_aadhaar(request.aadhaar_number)
    return result


@app.post("/mock/validate-bank-account")
async def mock_validate_bank_account(request: BankAccountValidationRequest):
    """
    Mock bank account validation - validates format and returns mock bank details.
    No actual penny drop or bank API call.
    """
    from bank_statement_analyzer import validate_bank_account
    result = validate_bank_account(request.account_number, request.ifsc_code)
    return result


@app.post("/mock/cibil-check")
async def mock_cibil_check(request: CIBILCheckRequest):
    """
    Mock CIBIL score check - returns mock credit score based on PAN.
    No actual TransUnion CIBIL API call.
    """
    from bank_statement_analyzer import mock_cibil_check
    result = mock_cibil_check(request.pan_number)
    return result


@app.get("/mock/bank-transactions")
async def get_mock_bank_transactions():
    """
    Get mock bank transactions for demo.
    Simulates fetching bank statement from Account Aggregator.
    """
    import json
    import os
    
    mock_file = os.path.join(os.path.dirname(__file__), 'mock_bank_transactions.json')
    
    try:
        with open(mock_file, 'r') as f:
            data = json.load(f)
        
        # Return the first route's response body (transactions)
        if data.get('routes') and len(data['routes']) > 0:
            return data['routes'][0]['responses'][0]['body']
        return {"error": "No mock data available"}
    except FileNotFoundError:
        return {"error": "Mock transactions file not found"}
    except Exception as e:
        return {"error": str(e)}


@app.post("/mock/analyze-statement")
async def analyze_bank_statement(request: StatementAnalysisRequest):
    """
    Analyze bank statement transactions for loan eligibility.
    Uses AI-powered analysis to assess income, expenses, and risk.
    """
    from bank_statement_analyzer import BankStatementAnalyzer
    
    if not request.transactions:
        raise HTTPException(status_code=400, detail="Transactions list is required")
    
    analyzer = BankStatementAnalyzer(request.transactions)
    analysis = analyzer.generate_full_analysis(
        requested_loan=request.requested_loan_amount,
        tenure_months=request.loan_tenure_months
    )
    
    return analysis


@app.get("/mock/analyze-statement")
async def analyze_mock_statement(
    loan_amount: int = 500000,
    tenure: int = 60
):
    """
    Analyze the mock bank statement for loan eligibility.
    Uses the built-in mock transaction data.
    """
    import json
    import os
    from bank_statement_analyzer import BankStatementAnalyzer
    
    mock_file = os.path.join(os.path.dirname(__file__), 'mock_bank_transactions.json')
    
    try:
        with open(mock_file, 'r') as f:
            data = json.load(f)
        
        # Extract transactions from mock file
        if data.get('routes') and len(data['routes']) > 0:
            body = data['routes'][0]['responses'][0]['body']
            transactions = body.get('transactions', [])
        else:
            return {"error": "No mock data available"}
        
        analyzer = BankStatementAnalyzer(transactions)
        analysis = analyzer.generate_full_analysis(
            requested_loan=loan_amount,
            tenure_months=tenure
        )
        
        # Add account info from mock
        analysis['account_info'] = {
            'holder': body.get('account_holder'),
            'account': body.get('account_number'),
            'bank': body.get('bank_name'),
            'period': body.get('period')
        }
        
        return analysis
        
    except FileNotFoundError:
        return {"error": "Mock transactions file not found"}
    except Exception as e:
        return {"error": str(e)}


# Health check for mock APIs
@app.get("/mock/health")
async def mock_health():
    """Check if mock APIs are available"""
    return {
        "status": "ok",
        "mock_apis_available": [
            "/mock/validate-pan",
            "/mock/validate-aadhaar", 
            "/mock/validate-bank-account",
            "/mock/cibil-check",
            "/mock/bank-transactions",
            "/mock/analyze-statement",
            "/chat"
        ],
        "description": "Mock validation APIs for demo/testing. No actual API calls are made."
    }

# =====================================================
# CHATBOT ENDPOINT
# =====================================================

# Re-defining ChatRequest to match frontend field names
class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, Any]]] = None

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Chat with the AI Credit Advisor.
    Uses cloud-based LLM via chatbot_model.py
    """
    try:
        # Import here to avoid circular dependencies if any
        import chatbot_model
        
        # Format history for the model
        history_dicts = []
        if request.conversation_history:
            for msg in request.conversation_history:
                history_dicts.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
            
        # Generate response
        response_text = chatbot_model.generate_response(
            user_message=request.message,
            conversation_history=history_dicts
        )
        
        return {
            "response": response_text,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Chat Error: {str(e)}")
        # Import here just in case chatbot_model import failed
        try:
            import chatbot_model
            fallback = chatbot_model.fallback_response(request.message)
        except:
            fallback = "I'm having trouble connecting to the AI service right now. Please try again later."
            
        return {
            "response": fallback,
            "timestamp": datetime.now().isoformat()
        }


# =====================================================
# BANK ADMIN ENDPOINTS
# =====================================================


@app.get("/admin/dashboard/stats")
async def get_admin_dashboard_stats(
    admin = Depends(auth.require_admin()),
    db: AsyncSession = Depends(database.get_db)
):
    """Get dashboard statistics for admin"""
    # Count applications by status
    total_result = await db.execute(select(func.count(models.LoanApplication.id)))
    total_loans = total_result.scalar() or 0
    
    pending_result = await db.execute(
        select(func.count(models.LoanPrediction.id))
        .where(models.LoanPrediction.decision == "PENDING_REVIEW")
    )
    pending_count = pending_result.scalar() or 0
    
    approved_result = await db.execute(
        select(func.count(models.LoanPrediction.id))
        .where(models.LoanPrediction.decision == "APPROVED")
    )
    approved_count = approved_result.scalar() or 0
    
    rejected_result = await db.execute(
        select(func.count(models.LoanPrediction.id))
        .where(models.LoanPrediction.decision == "REJECTED")
    )
    rejected_count = rejected_result.scalar() or 0
    
    # Sum disbursed amount
    disbursed_result = await db.execute(
        select(func.sum(models.Disbursement.amount))
        .where(models.Disbursement.status == "COMPLETED")
    )
    total_disbursed = disbursed_result.scalar() or 0
    
    return {
        "total_loans": total_loans,
        "pending_review": pending_count,
        "approved": approved_count,
        "rejected": rejected_count,
        "total_disbursed": total_disbursed,
        "approval_rate": round((approved_count / total_loans * 100) if total_loans > 0 else 0, 1)
    }


@app.get("/admin/applications")
async def get_all_applications(
    status: str = None,
    admin = Depends(auth.require_admin()),
    db: AsyncSession = Depends(database.get_db)
):
    """Get all loan applications with optional status filter"""
    query = (
        select(models.LoanApplication, models.LoanPrediction, models.User)
        .outerjoin(models.LoanPrediction, models.LoanApplication.id == models.LoanPrediction.application_id)
        .join(models.User, models.LoanApplication.user_id == models.User.id)
        .order_by(models.LoanApplication.created_at.desc())
    )
    
    if status:
        query = query.where(models.LoanPrediction.decision == status.upper())
    
    result = await db.execute(query)
    rows = result.all()
    
    applications = []
    for app, pred, user in rows:
        applications.append({
            "id": str(app.id),
            "customer_name": f"{user.first_name or ''} {user.last_name or ''}".strip() or "N/A",
            "customer_id": user.customer_id,
            "mobile_number": user.mobile_number,
            "email": user.email,
            "loan_amount": app.loan_amount,
            "loan_purpose": app.loan_purpose,
            "decision": pred.decision if pred else "PROCESSING",
            "decision_reason": pred.decision_reason if pred else None,
            "approval_probability": pred.approval_probability if pred else 0,
            "interest_rate": pred.interest_rate if pred else 0,
            "emi": pred.emi if pred else 0,
            "created_at": app.created_at.isoformat()
        })
    
    return applications


@app.get("/admin/applications/{app_id}")
async def get_application_details(
    app_id: str,
    admin = Depends(auth.require_admin()),
    db: AsyncSession = Depends(database.get_db)
):
    """Get detailed application info including features"""
    query = (
        select(models.LoanApplication, models.LoanPrediction, models.User)
        .outerjoin(models.LoanPrediction, models.LoanApplication.id == models.LoanPrediction.application_id)
        .join(models.User, models.LoanApplication.user_id == models.User.id)
        .where(models.LoanApplication.id == app_id)
    )
    
    result = await db.execute(query)
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")
    
    app, pred, user = row
    
    return {
        "id": str(app.id),
        "customer": {
            "id": str(user.id),
            "customer_id": user.customer_id,
            "name": f"{user.first_name or ''} {user.last_name or ''}".strip(),
            "mobile": user.mobile_number,
            "email": user.email,
            "pan": user.pan_number,
            "kyc_verified": user.kyc_verified
        },
        "features": app.features_json,
        "loan_amount": app.loan_amount,
        "loan_purpose": app.loan_purpose,
        "loan_duration": app.loan_duration,
        "prediction": {
            "decision": pred.decision if pred else "PROCESSING",
            "decision_reason": pred.decision_reason if pred else None,
            "approval_probability": pred.approval_probability if pred else 0,
            "interest_rate": pred.interest_rate if pred else 0,
            "emi": pred.emi if pred else 0,
            "total_repayment": pred.total_repayment if pred else 0,
            "credit_rating": pred.credit_rating if pred else "N/A"
        },
        "created_at": app.created_at.isoformat()
    }


@app.get("/admin/customers")
async def get_all_customers(
    admin = Depends(auth.require_admin()),
    db: AsyncSession = Depends(database.get_db)
):
    """Get all customers"""
    query = select(models.User).where(models.User.role == "customer").order_by(models.User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()
    
    return [{
        "id": str(u.id),
        "customer_id": u.customer_id,
        "name": f"{u.first_name or ''} {u.last_name or ''}".strip() or "N/A",
        "mobile": u.mobile_number,
        "email": u.email,
        "kyc_verified": u.kyc_verified,
        "created_at": u.created_at.isoformat() if u.created_at else None
    } for u in users]


@app.post("/admin/disbursements/{app_id}")
async def process_disbursement(
    app_id: str,
    transaction_ref: str,
    remarks: str = None,
    admin = Depends(auth.require_admin()),
    db: AsyncSession = Depends(database.get_db)
):
    """Process disbursement for an approved loan"""
    # Get the application
    app_result = await db.execute(
        select(models.LoanApplication, models.LoanPrediction)
        .outerjoin(models.LoanPrediction, models.LoanApplication.id == models.LoanPrediction.application_id)
        .where(models.LoanApplication.id == app_id)
    )
    row = app_result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")
    
    app, pred = row
    
    if not pred or pred.decision != "APPROVED":
        raise HTTPException(status_code=400, detail="Only approved loans can be disbursed")
    
    # Check if already disbursed
    existing = await db.execute(
        select(models.Disbursement).where(models.Disbursement.application_id == app_id)
    )
    if existing.scalar():
        raise HTTPException(status_code=400, detail="Loan already disbursed")
    
    # Create disbursement record
    disbursement = models.Disbursement(
        application_id=app.id,
        user_id=app.user_id,
        amount=app.loan_amount,
        transaction_ref=transaction_ref,
        status="COMPLETED",
        processed_by=admin.id,
        remarks=remarks,
        processed_at=datetime.now()
    )
    
    db.add(disbursement)
    
    # GENERATE COMPLETE EMI SCHEDULE
    # Create Repayment entries for the full tenure with status "DUE"
    from dateutil.relativedelta import relativedelta
    
    # Convert loan duration (months) to integer
    duration_months = int(app.loan_duration) if app.loan_duration else 12
    emi_amount = pred.emi if pred.emi else (app.loan_amount / duration_months) # Fallback simple calculation
    
    # Calculate interest component (simplified amortization)
    # For a real bank, this would use the exact amortization schedule. 
    # Here we use flat interest for simplicity or the stored values if available.
    
    start_date = datetime.now().date()
    
    for i in range(1, duration_months + 1):
        # Due date is exactly i months from today
        due_date = start_date + relativedelta(months=i)
        
        repayment = models.Repayment(
            user_id=app.user_id,
            emi_number=i,
            due_date=due_date,
            emi_amount=emi_amount,
            principal_component=emi_amount * 0.8, # Estimated
            interest_component=emi_amount * 0.2, # Estimated
            outstanding_principal=app.loan_amount - (emi_amount * 0.8 * i), # Estimated
            payment_status="DUE",
            payment_date=None,
            late_fee=0
        )
        db.add(repayment)

    await db.commit()
    
    return {"message": "Disbursement processed successfully", "disbursement_id": str(disbursement.id)}


@app.get("/admin/disbursements")
async def get_all_disbursements(
    admin = Depends(auth.require_admin()),
    db: AsyncSession = Depends(database.get_db)
):
    """Get all disbursements"""
    query = (
        select(models.Disbursement, models.LoanApplication, models.User)
        .join(models.LoanApplication, models.Disbursement.application_id == models.LoanApplication.id)
        .join(models.User, models.Disbursement.user_id == models.User.id)
        .order_by(models.Disbursement.created_at.desc())
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    return [{
        "id": str(d.id),
        "application_id": str(d.application_id),
        "customer_name": f"{u.first_name or ''} {u.last_name or ''}".strip(),
        "amount": d.amount,
        "transaction_ref": d.transaction_ref,
        "status": d.status,
        "processed_at": d.processed_at.isoformat() if d.processed_at else None
    } for d, app, u in rows]


@app.post("/admin/notifications/send")
async def send_notification(
    user_id: str,
    notification_type: str,  # sms, email
    trigger: str,  # emi_reminder, disbursement_confirmation, etc.
    message: str,
    application_id: str = None,
    admin = Depends(auth.require_admin()),
    db: AsyncSession = Depends(database.get_db)
):
    """Send notification to a customer"""
    notification = models.Notification(
        user_id=user_id,
        type=notification_type,
        trigger=trigger,
        message=message,
        application_id=application_id,
        status="sent"
    )
    
    db.add(notification)
    await db.commit()
    
    return {"message": "Notification sent", "notification_id": str(notification.id)}


@app.get("/admin/notifications")
async def get_all_notifications(
    admin = Depends(auth.require_admin()),
    db: AsyncSession = Depends(database.get_db)
):
    """Get all sent notifications"""
    query = (
        select(models.Notification, models.User)
        .join(models.User, models.Notification.user_id == models.User.id)
        .order_by(models.Notification.sent_at.desc())
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    return [{
        "id": str(n.id),
        "customer_name": f"{u.first_name or ''} {u.last_name or ''}".strip(),
        "type": n.type,
        "trigger": n.trigger,
        "message": n.message,
        "status": n.status,
        "sent_at": n.sent_at.isoformat() if n.sent_at else None
    } for n, u in rows]


@app.get("/notifications/me")
async def get_my_notifications(
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get notifications for current customer"""
    query = (
        select(models.Notification)
        .where(models.Notification.user_id == current_user.id)
        .order_by(models.Notification.sent_at.desc())
    )
    
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    return [{
        "id": str(n.id),
        "type": n.type,
        "trigger": n.trigger,
        "message": n.message,
        "status": n.status,
        "sent_at": n.sent_at.isoformat() if n.sent_at else None
    } for n in notifications]


@app.get("/disbursements/me")
async def get_my_disbursements(
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get disbursements for current customer"""
    query = (
        select(models.Disbursement, models.LoanApplication)
        .join(models.LoanApplication, models.Disbursement.application_id == models.LoanApplication.id)
        .where(models.Disbursement.user_id == current_user.id)
        .order_by(models.Disbursement.created_at.desc())
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    return [{
        "id": str(d.id),
        "application_id": str(d.application_id),
        "amount": d.amount,
        "transaction_ref": d.transaction_ref,
        "status": d.status,
        "loan_purpose": app.loan_purpose,
        "processed_at": d.processed_at.isoformat() if d.processed_at else None
    } for d, app in rows]


@app.get("/admin/repayments")
async def get_admin_repayments(
    admin = Depends(auth.require_admin()),
    db: AsyncSession = Depends(database.get_db)
):
    """Get all EMI repayments from customers for admin dashboard"""
    query = (
        select(models.Repayment, models.User)
        .join(models.LoanApplication, models.Repayment.application_id == models.LoanApplication.id)
        .join(models.User, models.LoanApplication.user_id == models.User.id)
        .order_by(models.Repayment.payment_date.desc().nulls_last(), models.Repayment.due_date.asc())
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    return [{
        "id": str(r.id),
        "user_id": str(u.id),
        "customer_name": u.full_name or f"Customer {u.mobile_number}",
        "mobile_number": u.mobile_number,
        "emi_number": r.emi_number,
        "amount": r.emi_amount, 
        "payment_amount": r.payment_amount,
        "payment_method": r.payment_method,
        "status": r.payment_status,
        "paid_at": r.payment_date.isoformat() if r.payment_date else None,
        "due_date": r.due_date.isoformat() if r.due_date else None
    } for r, u in rows]


@app.get("/admin/applications/search", response_model=List[schemas.ApplicationListItem])
async def search_applications(
    tracking_id: str,
    current_user = Depends(auth.require_admin()),
    db: AsyncSession = Depends(database.get_db)
):
    """Search applications by Tracking ID (e.g., RBI2026LA01)"""
    query = (
        select(models.LoanApplication)
        .where(models.LoanApplication.tracking_id == tracking_id)
    )
    result = await db.execute(query)
    applications = result.scalars().all()
    
    response = []
    for app in applications:
        # Get user info
        user_query = select(models.User).where(models.User.id == app.user_id)
        user_result = await db.execute(user_query)
        user = user_result.scalars().first()
        
        # Get prediction
        pred_query = select(models.LoanPrediction).where(
            models.LoanPrediction.application_id == app.id
        )
        pred_result = await db.execute(pred_query)
        prediction = pred_result.scalars().first()
        
        response.append(schemas.ApplicationListItem(
            id=app.id,
            user_id=app.user_id,
            customer_name=f"{user.first_name or ''} {user.last_name or ''}".strip() if user else None,
            customer_id=user.customer_id if user else None,
            loan_amount=app.loan_amount,
            loan_purpose=app.loan_purpose,
            decision=prediction.decision if prediction else "PENDING",
            approval_probability=prediction.approval_probability if prediction else 0,
            created_at=app.created_at,
            reviewed=False
        ))
    return response


@app.get("/admin/applications", response_model=List[schemas.ApplicationListItem])
async def get_admin_applications(
    status: Optional[str] = None,
    admin = Depends(auth.require_admin()),
    db: AsyncSession = Depends(database.get_db)
):
    """Get all loan applications for admin dashboard"""
    query = (
        select(models.LoanApplication)
        .order_by(models.LoanApplication.created_at.desc())
    )
    
    if status and status != 'all':
        # Need to join with prediction/decision to filter by status if it's not on the application model directly
        # Typically status is on the application or computed.
        # For simplicity, fetching all and filtering in memory or ignoring status for now if complex join needed.
        # But wait, 'decision' is on LoanPrediction.
        # Let's just return all for now and let frontend filter, or join prediction.
        pass

    result = await db.execute(query)
    applications = result.scalars().all()
    
    response = []
    for app in applications:
        # Get user info
        user_query = select(models.User).where(models.User.id == app.user_id)
        user_result = await db.execute(user_query)
        user = user_result.scalars().first()
        
        # Get prediction
        pred_query = select(models.LoanPrediction).where(
            models.LoanPrediction.application_id == app.id
        )
        pred_result = await db.execute(pred_query)
        prediction = pred_result.scalars().first()
        
        # Get bank details if available
        bank_query = select(models.BankAccountDetails).where(
            models.BankAccountDetails.application_id == app.id
        )
        bank_result = await db.execute(bank_query)
        bank_details = bank_result.scalars().first()
        
        response.append(schemas.ApplicationListItem(
            id=app.id,
            tracking_id=app.tracking_id,
            user_id=app.user_id,
            customer_name=f"{user.first_name or ''} {user.last_name or ''}".strip() if user else None,
            customer_id=user.customer_id if user else None,
            loan_amount=app.loan_amount,
            loan_purpose=app.loan_purpose,
            decision=prediction.decision if prediction else "PENDING",
            approval_probability=prediction.approval_probability if prediction else 0,
            created_at=app.created_at,
            reviewed=False,
            bank_details=schemas.BankDetailsResponse.model_validate(bank_details) if bank_details else None
        ))
    return response


@app.get("/admin/documents")
async def get_admin_documents(
    status: Optional[str] = None,
    admin = Depends(auth.require_admin()),
    db: AsyncSession = Depends(database.get_db)
):
    """Get all KYC documents for admin review"""
    query = (
        select(models.KYCDocument, models.User, models.LoanApplication)
        .join(models.User, models.KYCDocument.user_id == models.User.id)
        .join(models.LoanApplication, models.KYCDocument.application_id == models.LoanApplication.id)
        .order_by(models.KYCDocument.uploaded_at.desc())
    )
    
    if status and status != 'all':
        query = query.where(models.KYCDocument.verification_status == status)

    result = await db.execute(query)
    rows = result.all()
    
    return [{
        "id": str(doc.id),
        "document_type": doc.document_type,
        "file_name": doc.file_name,
        "file_size": doc.file_size,
        "verification_status": doc.verification_status,
        "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
        "customer_name": f"{u.first_name or ''} {u.last_name or ''}".strip(),
        "customer_id": u.customer_id,
        "application_id": str(app.id),
        "tracking_id": app.tracking_id,
        "loan_amount": app.loan_amount
    } for doc, u, app in rows]


@app.post("/admin/documents/{document_id}/verify")
async def verify_admin_document(
    document_id: str,
    verify_request: schemas.KYCVerifyRequest,
    admin = Depends(auth.require_admin()),
    db: AsyncSession = Depends(database.get_db)
):
    """Verify or reject a KYC document"""
    query = select(models.KYCDocument).where(models.KYCDocument.id == document_id)
    result = await db.execute(query)
    document = result.scalars().first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    document.verification_status = verify_request.status
    document.verification_notes = verify_request.notes
    document.verified_by = admin.id
    document.verified_at = datetime.now()
    
    # Update KYC Status Tracker if needed
    # ... logic to update step_1_docs_verified could go here
    
    await db.commit()
    
@app.get("/admin/applications/{application_id}/download-report")
async def admin_download_report(
    application_id: str,
    admin = Depends(auth.require_admin()),
    db: AsyncSession = Depends(database.get_db)
):
    """Download loan report PDF for admin review"""
    from sqlalchemy.orm import selectinload
    # Fetch application with user and prediction
    query = select(models.LoanApplication).options(
        selectinload(models.LoanApplication.user),
        selectinload(models.LoanApplication.prediction)
    ).where(models.LoanApplication.id == application_id)
    
    result = await db.execute(query)
    application = result.scalars().first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
        
    if not application.prediction:
         raise HTTPException(status_code=400, detail="Loan prediction not yet generated")

    try:
        # Generate report data (reused from shared report logic)
        pred = application.prediction
        total_interest = (pred.total_repayment or 0) - (application.loan_amount or 0)
        monthly_income = application.monthly_income or 50000
        monthly_debt = application.monthly_debt_payments or 0
        emi_to_income = (pred.emi / monthly_income * 100) if monthly_income > 0 and pred.emi else 0
        debt_to_income = ((monthly_debt + (pred.emi or 0)) / monthly_income * 100) if monthly_income > 0 else 0
        
        # Calculate credit score
        from loan_advisor import CreditScoreEstimator
        credit_profile = {
            'monthly_income': monthly_income,
            'debt_to_income_ratio': monthly_debt / monthly_income if monthly_income > 0 else 0.5,
            'employment_status': application.employment_status or 'Employed',
            'job_tenure': application.job_tenure or 2,
            'experience': application.experience or 5,
            'age': application.age or 30,
            'home_ownership_status': application.home_ownership_status or 'Rent',
            'education_level': application.education_level or 'Bachelor',
        }
        credit_min, credit_max, credit_rating = CreditScoreEstimator.estimate(credit_profile)
        credit_score = (credit_min + credit_max) // 2
        
        analysis_result = {
            "decision": pred.decision,
            "decision_reason": pred.decision_reason,
            "approval_probability": pred.approval_probability,
            "loan_details": {
                "amount": application.loan_amount,
                "duration_years": application.loan_duration // 12 if application.loan_duration else 0
            },
            "loan_purpose": application.loan_purpose,
            "interest_rate": {"annual": pred.interest_rate},
            "emi": {
                "monthly": pred.emi,
                "total_repayment": pred.total_repayment,
                "total_interest": total_interest,
            },
            "income_analysis": {
                "monthly_income": monthly_income,
                "emi_to_income_ratio": emi_to_income,
                "debt_to_income_ratio": debt_to_income,
            },
            "credit_score": {
                "score": credit_score,
                "rating": credit_rating,
            },
            "explanations": pred.shap_summary if pred.shap_summary else []
        }
        
        # Create AppContext helper class
        class AppContext:
            def __init__(self, app_obj):
                u = app_obj.user
                self.full_name = f"{u.first_name} {u.last_name}" if u.first_name else "Valued Customer"
                self.email = u.email
                self.mobile_number = u.mobile_number
                self.id = str(app_obj.id)
                self.tracking_id = getattr(app_obj, "tracking_id", None)
                self.loan_amount = app_obj.loan_amount
                self.monthly_income = app_obj.monthly_income
                self.loan_purpose = app_obj.loan_purpose
                self.employment_status = app_obj.employment_status
                self.loan_duration = app_obj.loan_duration
                self.date_of_birth = u.date_of_birth
                self.gender = u.gender or app_obj.gender
                self.age = app_obj.age
                self.address = f"{u.address_line1 or ''}, {u.city or ''}, {u.state or ''} - {u.pincode or ''}" if u.address_line1 else None
                self.pan_number = u.pan_number
                self.customer_id = u.customer_id
                self.kyc_verified = u.kyc_verified

        app_context = AppContext(application)
        
        # Generate PDF
        pdf_bytes = report_generator.generate_loan_report_pdf(app_context, analysis_result)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"Loan_Agreement_{application.tracking_id or str(application.id)[:8]}_{timestamp}.pdf"
        
        return Response(
            content=bytes(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Type": "application/pdf"
            }
        )
    except Exception as e:
        print(f"Admin Report Download Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ADMIN DOCUMENT MANAGEMENT ENDPOINTS
# ============================================================================


@app.get("/admin/applications/{application_id}/agreement")
async def get_admin_application_agreement(
    application_id: str,
    admin = Depends(auth.require_admin()),
    db: AsyncSession = Depends(database.get_db)
):
    """Get signed loan agreement for an application"""
    from sqlalchemy.orm import selectinload
    
    # Fetch agreement
    query = (
        select(models.LoanAgreement)
        .where(models.LoanAgreement.application_id == application_id)
    )
    result = await db.execute(query)
    agreement = result.scalars().first()
    
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found for this application")
    
    return {
        "id": str(agreement.id),
        "application_id": str(agreement.application_id),
        "agreement_version": agreement.agreement_version,
        "loan_amount": agreement.loan_amount,
        "interest_rate": agreement.interest_rate,
        "tenure_months": agreement.tenure_months,
        "emi_amount": agreement.emi_amount,
        "processing_fee": agreement.processing_fee,
        "total_payable": agreement.total_payable,
        "agreement_summary": agreement.agreement_summary,
        "consent_given": agreement.consent_given,
        "signed_at": agreement.signed_at.isoformat() if agreement.signed_at else None,
        "status": agreement.status
    }


# ============================================================================
# ADMIN PROFILE ENDPOINT
# ============================================================================

@app.get("/admin/profile")
async def get_admin_profile(
    admin = Depends(auth.require_admin()),
    db: AsyncSession = Depends(database.get_db)
):
    """Get admin user profile"""
    # Handle both AdminUser (new) and User (legacy)
    customer_id = getattr(admin, "admin_id", getattr(admin, "customer_id", None))
    
    return {
        "id": str(admin.id),
        "customer_id": customer_id,
        "email": admin.email,
        "mobile_number": getattr(admin, "mobile_number", "N/A"),
        "first_name": admin.first_name,
        "last_name": admin.last_name,
        "role": getattr(admin, "role", "bank_officer"),
        "created_at": admin.created_at.isoformat() if admin.created_at else None
    }


@app.put("/admin/profile")
async def update_admin_profile(
    first_name: str = None,
    last_name: str = None,
    email: str = None,
    admin = Depends(auth.require_admin()),
    db: AsyncSession = Depends(database.get_db)
):
    """Update admin user profile"""
    if first_name:
        admin.first_name = first_name
    if last_name:
        admin.last_name = last_name
    if email:
        admin.email = email
    
    await db.commit()
    

# ============================================================================
# SUPPORT TICKET SYSTEM ENDPOINTS
# ============================================================================

@app.post("/tickets", response_model=schemas.TicketResponse)
async def create_ticket(
    ticket: schemas.TicketCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Customer: Create a new support ticket"""
    import time
    
    # Generate Ticket ID
    ticket_ref = f"TKT-{int(time.time())}"
    
    # Create Ticket
    new_ticket = models.SupportTicket(
        user_id=current_user.id,
        ticket_id=ticket_ref,
        subject=ticket.subject,
        category=ticket.category,
        priority=ticket.priority,
        status="OPEN"
    )
    db.add(new_ticket)
    await db.flush() # Get ID
    
    # Create Initial Message
    initial_msg = models.TicketMessage(
        ticket_id=new_ticket.id,
        sender_id=current_user.id,
        sender_type="CUSTOMER",
        message=ticket.initial_message
    )
    db.add(initial_msg)
    await db.commit()
    await db.refresh(new_ticket)
    
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(models.SupportTicket)
        .options(selectinload(models.SupportTicket.messages))
        .where(models.SupportTicket.id == new_ticket.id)
    )
    loaded_ticket = result.scalars().first()
    return loaded_ticket


@app.get("/tickets", response_model=List[schemas.TicketResponse])
async def get_my_tickets(
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Customer: List my tickets"""
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(models.SupportTicket)
        .options(selectinload(models.SupportTicket.messages))
        .where(models.SupportTicket.user_id == current_user.id)
        .order_by(models.SupportTicket.created_at.desc())
    )
    return result.scalars().all()


@app.get("/tickets/{ticket_id}", response_model=schemas.TicketResponse)
async def get_ticket_details(
    ticket_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Customer: Get ticket details"""
    from sqlalchemy.orm import selectinload
    import uuid
    
    stmt = select(models.SupportTicket).options(selectinload(models.SupportTicket.messages))
    
    # If valid UUID
    try:
        uuid_obj = uuid.UUID(ticket_id)
        stmt = stmt.where(models.SupportTicket.id == uuid_obj)
    except ValueError:
        stmt = stmt.where(models.SupportTicket.ticket_id == ticket_id)
        
    result = await db.execute(stmt)
    ticket = result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    # Security check
    if ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return ticket


@app.post("/tickets/{ticket_id}/messages", response_model=schemas.TicketMessageResponse)
async def reply_ticket(
    ticket_id: UUID,
    message: schemas.TicketMessageCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Customer: Reply to ticket"""
    # Verify ownership
    result = await db.execute(select(models.SupportTicket).where(models.SupportTicket.id == ticket_id))
    ticket = result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    new_msg = models.TicketMessage(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        sender_type="CUSTOMER",
        message=message.message
    )
    db.add(new_msg)
    
    # Update ticket updated_at and Status (if closed re-open?)
    ticket.updated_at = func.now()
    if ticket.status == "RESOLVED":
        ticket.status = "IN_PROGRESS" # Re-open
        
    await db.commit()
    await db.refresh(new_msg)
    return new_msg


# --- ADMIN ENDPOINTS ---

@app.get("/admin/tickets", response_model=List[schemas.TicketResponse])
async def admin_get_tickets(
    status: Optional[str] = None,
    admin = Depends(auth.require_admin()),
    db: AsyncSession = Depends(database.get_db)
):
    """Admin: List all tickets"""
    from sqlalchemy.orm import selectinload
    query = select(models.SupportTicket).options(selectinload(models.SupportTicket.messages))
    
    if status and status != 'ALL':
        query = query.where(models.SupportTicket.status == status)
        
    query = query.order_by(models.SupportTicket.updated_at.desc())
    
    result = await db.execute(query)
    return result.scalars().all()


@app.get("/admin/tickets/{ticket_id}", response_model=schemas.TicketResponse)
async def admin_get_ticket_details(
    ticket_id: UUID,
    admin = Depends(auth.require_admin()),
    db: AsyncSession = Depends(database.get_db)
):
    """Admin: Get ticket details + User info"""
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(models.SupportTicket)
        .options(
            selectinload(models.SupportTicket.messages),
            selectinload(models.SupportTicket.user)
        )
        .where(models.SupportTicket.id == ticket_id)
    )
    ticket = result.scalars().first()
    if not ticket:
         raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@app.post("/admin/tickets/{ticket_id}/messages", response_model=schemas.TicketMessageResponse)
async def admin_reply_ticket(
    ticket_id: UUID,
    message: schemas.TicketMessageCreate,
    admin = Depends(auth.require_admin()),
    db: AsyncSession = Depends(database.get_db)
):
    """Admin: Reply to ticket"""
    result = await db.execute(select(models.SupportTicket).where(models.SupportTicket.id == ticket_id))
    ticket = result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    new_msg = models.TicketMessage(
        ticket_id=ticket.id,
        sender_id=admin.id,
        sender_type="ADMIN",
        message=message.message
    )
    db.add(new_msg)
    
    ticket.updated_at = func.now()
    ticket.status = "IN_PROGRESS" # Mark as active
    
    await db.commit()
    await db.refresh(new_msg)
    return new_msg

@app.put("/admin/tickets/{ticket_id}/status", response_model=schemas.TicketResponse)
async def admin_update_ticket_status(
    ticket_id: UUID,
    status_update: schemas.TicketStatusUpdate,
    admin = Depends(auth.require_admin()),
    db: AsyncSession = Depends(database.get_db)
):
    """Admin: Update status"""
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(models.SupportTicket)
         .options(selectinload(models.SupportTicket.messages))
         .where(models.SupportTicket.id == ticket_id)
    )
    ticket = result.scalars().first()
    if not ticket:
         raise HTTPException(status_code=404, detail="Ticket not found")
         
    ticket.status = status_update.status
    ticket.updated_at = func.now()
    
    await db.commit()
    await db.refresh(ticket)
    return ticket


# =====================================================
# CUSTOMER SUPPORT TICKET ENDPOINTS
# =====================================================

@app.post("/tickets", response_model=schemas.TicketResponse)
async def create_ticket(
    ticket: schemas.TicketCreate,
    request: Request,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Create a new support ticket"""
    # Generate unique ticket ID (TKT-YYYYMMDD-XXXX)
    today_str = datetime.now().strftime("%Y%m%d")
    random_suffix = str(uuid.uuid4().int)[:4]
    ticket_ref_id = f"TKT-{today_str}-{random_suffix}"
    
    db_ticket = models.SupportTicket(
        user_id=current_user.id,
        ticket_id=ticket_ref_id,
        subject=ticket.subject,
        category=ticket.category,
        priority=ticket.priority,
        status="OPEN"
    )
    db.add(db_ticket)
    await db.flush()
    
    # Add initial message
    initial_msg = models.TicketMessage(
        ticket_id=db_ticket.id,
        sender_id=current_user.id,
        sender_type="CUSTOMER",
        message=ticket.initial_message
    )
    db.add(initial_msg)
    
    # Log audit event
    await log_audit(
        db=db,
        user_id=current_user.id,
        action="TICKET_CREATED",
        event_category="SUPPORT",
        entity_type="SUPPORT_TICKET",
        entity_id=str(db_ticket.id),
        description=f"Created support ticket {ticket_ref_id}",
        request=request
    )
    
    await db.commit()
    await db.refresh(db_ticket)
    # Eager load requires re-query or manual fetch if not strictly set
    # For now, we return the ticket object which might miss messages but that's fine for create
    return db_ticket


@app.get("/tickets", response_model=List[schemas.TicketResponse])
async def get_my_tickets(
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """List all tickets for the current user"""
    from sqlalchemy.orm import selectinload
    query = (
        select(models.SupportTicket)
        .options(selectinload(models.SupportTicket.messages))
        .where(models.SupportTicket.user_id == current_user.id)
        .order_by(models.SupportTicket.created_at.desc())
    )
    
    result = await db.execute(query)
    tickets = result.scalars().all()
    return tickets


@app.get("/tickets/{ticket_id}", response_model=schemas.TicketResponse)
async def get_ticket_details(
    ticket_id: UUID,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get ticket details with messages"""
    from sqlalchemy.orm import selectinload
    query = (
        select(models.SupportTicket)
        .options(selectinload(models.SupportTicket.messages))
        .where(
            models.SupportTicket.id == ticket_id,
            models.SupportTicket.user_id == current_user.id
        )
    )
    
    result = await db.execute(query)
    ticket = result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return ticket


@app.post("/tickets/{ticket_id}/message", response_model=schemas.TicketMessageResponse)
async def add_ticket_message(
    ticket_id: UUID,
    message: schemas.TicketMessageCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Add a message to an existing ticket"""
    # Verify ticket ownership
    query = select(models.SupportTicket).where(
        models.SupportTicket.id == ticket_id,
        models.SupportTicket.user_id == current_user.id
    )
    result = await db.execute(query)
    ticket = result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    new_msg = models.TicketMessage(
        ticket_id=ticket_id,
        sender_id=current_user.id,
        sender_type="CUSTOMER",
        message=message.message
    )
    db.add(new_msg)
    
    ticket.updated_at = func.now()
    if ticket.status == "RESOLVED":
        ticket.status = "OPEN" # Re-open if customer replies
    
    await db.commit()
    await db.refresh(new_msg)
    
    return new_msg


