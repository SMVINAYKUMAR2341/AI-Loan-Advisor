"""
Device & Session Utilities for Banking-Grade Audit Logging.

Provides:
- User-Agent parsing for device, browser, OS detection
- IP hashing for privacy-compliant storage
- Location lookup (city-level, coarse)
- New device/location detection
"""

import hashlib
import re
from typing import Optional
from datetime import datetime


def parse_user_agent(user_agent: str) -> dict:
    """
    Extract device type, browser, and OS from User-Agent string.
    Returns a dict with device_type, browser, os fields.
    """
    if not user_agent:
        return {"device_type": "Unknown", "browser": "Unknown", "os": "Unknown"}
    
    ua = user_agent.lower()
    
    # Detect device type
    device_type = "Desktop"
    if any(mobile in ua for mobile in ["mobile", "android", "iphone", "ipod"]):
        device_type = "Mobile"
    elif any(tablet in ua for tablet in ["tablet", "ipad"]):
        device_type = "Tablet"
    
    # Detect browser
    browser = "Unknown"
    if "edg/" in ua or "edge/" in ua:
        browser = "Microsoft Edge"
    elif "chrome/" in ua and "chromium" not in ua:
        browser = "Google Chrome"
    elif "firefox/" in ua:
        browser = "Mozilla Firefox"
    elif "safari/" in ua and "chrome" not in ua:
        browser = "Safari"
    elif "opera" in ua or "opr/" in ua:
        browser = "Opera"
    elif "msie" in ua or "trident/" in ua:
        browser = "Internet Explorer"
    
    # Detect OS
    os_name = "Unknown"
    if "windows nt 10" in ua:
        os_name = "Windows 10/11"
    elif "windows nt" in ua:
        os_name = "Windows"
    elif "mac os x" in ua:
        os_name = "macOS"
    elif "android" in ua:
        os_name = "Android"
    elif "iphone" in ua or "ipad" in ua:
        os_name = "iOS"
    elif "linux" in ua:
        os_name = "Linux"
    
    return {
        "device_type": device_type,
        "browser": browser,
        "os": os_name
    }


def hash_ip(ip: str) -> str:
    """
    SHA256 hash an IP address for privacy-compliant storage.
    Returns first 16 characters of the hash.
    """
    if not ip:
        return ""
    # Add salt for additional security
    salted = f"LOAN_APP_SALT_{ip}"
    return hashlib.sha256(salted.encode()).hexdigest()[:16]


def mask_ip(ip: str) -> str:
    """
    Mask an IP address for display purposes.
    Shows only first two octets for IPv4.
    Example: 192.168.1.100 -> 192.168.*.*
    """
    if not ip:
        return "Unknown"
    
    if ":" in ip:  # IPv6
        parts = ip.split(":")
        if len(parts) >= 2:
            return f"{parts[0]}:{parts[1]}:****:****"
        return ip
    
    parts = ip.split(".")
    if len(parts) == 4:
        return f"{parts[0]}.{parts[1]}.*.*"
    return ip


def get_location_from_ip(ip: str) -> dict:
    """
    Get coarse location (city, country) from IP address.
    
    In production, this would use a geolocation service like:
    - MaxMind GeoIP2
    - ip-api.com
    - ipinfo.io
    
    For now, returns a placeholder based on common patterns.
    """
    if not ip:
        return {"city": "Unknown", "country": "Unknown"}
    
    # In production, integrate with a real GeoIP service
    # For demo, we'll return a generic location
    # This should be replaced with actual GeoIP lookup
    
    # Check for common private IP ranges (local development)
    if ip.startswith("127.") or ip.startswith("192.168.") or ip.startswith("10."):
        return {"city": "Local", "country": "Development"}
    
    if ip.startswith("localhost"):
        return {"city": "Local", "country": "Development"}
    
    # Default Indian location for demo
    return {"city": "Mumbai", "country": "India"}


def generate_device_hash(user_agent: str, ip: str) -> str:
    """
    Generate a hash for device fingerprinting.
    Used to detect if user is logging in from a new device.
    """
    device_info = parse_user_agent(user_agent)
    fingerprint = f"{device_info['device_type']}|{device_info['browser']}|{device_info['os']}|{hash_ip(ip)}"
    return hashlib.sha256(fingerprint.encode()).hexdigest()[:32]


async def check_new_device(db, user_id, device_hash: str) -> bool:
    """
    Check if this device hash is new for the user.
    Returns True if this is a new device.
    """
    from sqlalchemy import select
    import models
    
    query = select(models.UserSession).where(
        models.UserSession.user_id == user_id,
        models.UserSession.device_hash == device_hash
    )
    result = await db.execute(query)
    existing = result.scalars().first()
    
    return existing is None


async def check_new_location(db, user_id, location_city: str) -> bool:
    """
    Check if this location is new for the user.
    Returns True if user has never logged in from this city.
    """
    from sqlalchemy import select
    import models
    
    query = select(models.UserSession).where(
        models.UserSession.user_id == user_id,
        models.UserSession.location_city == location_city
    )
    result = await db.execute(query)
    existing = result.scalars().first()
    
    return existing is None


def get_client_ip(request) -> str:
    """
    Extract client IP from request, handling proxies.
    """
    # Check for forwarded IP (behind proxy/load balancer)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # Get the first IP in the chain (client IP)
        return forwarded.split(",")[0].strip()
    
    # Check for real IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fall back to direct client IP
    if hasattr(request, 'client') and request.client:
        return request.client.host
    
    return "Unknown"


def format_event_description(action: str, extra_context: dict = None) -> str:
    """
    Generate human-readable description for audit events.
    """
    descriptions = {
        # Security
        "LOGIN_SUCCESS": "Successfully logged in",
        "LOGIN_FAILED": "Failed login attempt",
        "LOGOUT": "Logged out of the session",
        "PASSWORD_CHANGED": "Password was changed",
        "SESSION_EXPIRED": "Session expired due to inactivity",
        "SESSION_TERMINATED": "Session was terminated remotely",
        "NEW_DEVICE_LOGIN": "Login from a new device detected",
        "NEW_LOCATION_LOGIN": "Login from a new location detected",
        "SIGNUP": "Account created successfully",
        
        # Loan
        "LOAN_APPLIED": "Submitted a new loan application",
        "AI_DECISION_GENERATED": "AI eligibility assessment completed",
        "LOAN_APPROVED": "Loan application was approved",
        "LOAN_REJECTED": "Loan application was rejected",
        "LOAN_PENDING_REVIEW": "Application sent for officer review",
        "OFFICER_REVIEW_STARTED": "Bank officer started reviewing application",
        "OFFICER_REVIEW_COMPLETED": "Bank officer completed the review",
        
        # KYC
        "KYC_INITIATED": "KYC verification process started",
        "DOCUMENT_UPLOADED": "Document uploaded for verification",
        "DOCUMENT_VERIFIED": "Document was verified successfully",
        "DOCUMENT_REJECTED": "Document verification failed",
        "KYC_COMPLETED": "KYC verification completed",
        
        # Payment
        "EMI_SCHEDULE_GENERATED": "EMI payment schedule created",
        "EMI_PAYMENT_ATTEMPTED": "EMI payment was initiated",
        "EMI_PAYMENT_SUCCESS": "EMI payment completed successfully",
        "EMI_PAYMENT_FAILED": "EMI payment failed",
        "EMI_OVERDUE": "EMI payment is overdue",
        "AUTO_DEBIT_ENABLED": "Auto-debit was enabled",
        "AUTO_DEBIT_DISABLED": "Auto-debit was disabled",
        
        # Profile
        "PROFILE_UPDATED": "Profile information was updated",
        "CONSENT_ACCEPTED": "Consent was accepted",
        "CONSENT_REVOKED": "Consent was revoked",
        "PREFERENCES_UPDATED": "Communication preferences updated",
    }
    
    description = descriptions.get(action, f"Action: {action}")
    
    # Add extra context if provided
    if extra_context:
        if "amount" in extra_context:
            description += f" (Amount: ₹{extra_context['amount']:,.2f})"
        if "document_type" in extra_context:
            description += f" ({extra_context['document_type']})"
        if "loan_id" in extra_context:
            description += f" (Loan: {extra_context['loan_id'][:8]}...)"
    
    return description
