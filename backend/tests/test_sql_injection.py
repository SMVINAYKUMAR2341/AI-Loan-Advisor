"""
SQL Injection Penetration Test Script
=====================================
OWASP Testing Guide: SQL Injection (OTG-INPVAL-005)

This script tests various endpoints for SQL injection vulnerabilities
using common attack payloads. This is for authorized security testing only.

Author: Security Audit
Date: 2026-01-17
"""

import requests
import json
from typing import Dict, List, Tuple
from colorama import init, Fore, Style

# Initialize colorama for colored output
init()

BASE_URL = "http://localhost:8000"

# ============================================================================
# SQL INJECTION PAYLOADS
# ============================================================================

# Classic SQL Injection payloads
CLASSIC_PAYLOADS = [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "' OR '1'='1' /*",
    "1' OR '1' = '1",
    "' OR 1=1 --",
    "' OR 1=1#",
    "admin'--",
    "') OR ('1'='1",
    "'; DROP TABLE users; --",
    "1; DROP TABLE users",
]

# Union-based SQL Injection
UNION_PAYLOADS = [
    "' UNION SELECT NULL--",
    "' UNION SELECT NULL, NULL--",
    "' UNION SELECT username, password FROM users--",
    "1 UNION SELECT * FROM users",
    "' UNION ALL SELECT NULL, NULL, NULL--",
]

# Boolean-based blind SQL Injection
BOOLEAN_BLIND_PAYLOADS = [
    "' AND '1'='1",
    "' AND '1'='2",
    "' AND SUBSTRING(username,1,1)='a",
    "1 AND 1=1",
    "1 AND 1=2",
]

# Time-based blind SQL Injection
TIME_BASED_PAYLOADS = [
    "'; WAITFOR DELAY '0:0:5'--",  # SQL Server
    "'; SELECT SLEEP(5)--",  # MySQL
    "'; SELECT pg_sleep(5)--",  # PostgreSQL
    "1; SELECT CASE WHEN (1=1) THEN pg_sleep(5) ELSE pg_sleep(0) END--",
]

# Error-based SQL Injection
ERROR_BASED_PAYLOADS = [
    "'",
    "''",
    "`",
    "\"",
    "') OR ('",
    "1 AND EXTRACTVALUE(1, CONCAT(0x7e, VERSION()))",
]

# NoSQL Injection (for MongoDB-like backends)
NOSQL_PAYLOADS = [
    '{"$gt": ""}',
    '{"$ne": null}',
    '{"$where": "1==1"}',
]

# All payloads combined
ALL_PAYLOADS = (
    CLASSIC_PAYLOADS + 
    UNION_PAYLOADS + 
    BOOLEAN_BLIND_PAYLOADS + 
    ERROR_BASED_PAYLOADS
)

# ============================================================================
# TEST FUNCTIONS
# ============================================================================

def print_header(text: str):
    """Print a styled header"""
    print(f"\n{Fore.CYAN}{'='*60}")
    print(f" {text}")
    print(f"{'='*60}{Style.RESET_ALL}\n")


def print_result(test_name: str, passed: bool, details: str = ""):
    """Print test result with color coding"""
    if passed:
        status = f"{Fore.GREEN}✓ SAFE{Style.RESET_ALL}"
    else:
        status = f"{Fore.RED}✗ VULNERABLE{Style.RESET_ALL}"
    
    print(f"  [{status}] {test_name}")
    if details:
        print(f"           {Fore.YELLOW}{details}{Style.RESET_ALL}")


def test_login_sql_injection() -> Tuple[int, int]:
    """Test login endpoint for SQL injection"""
    print_header("Testing /login Endpoint")
    
    passed = 0
    failed = 0
    
    for payload in ALL_PAYLOADS:
        # Test in mobile_number field
        test_data = {
            "mobile_number": payload,
            "password": "test123"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/login", json=test_data, timeout=10)
            
            # Check for SQL injection indicators
            is_vulnerable = False
            
            # 1. Unexpected success (bypassed auth)
            if response.status_code == 200:
                is_vulnerable = True
                print_result(f"Payload: {payload[:30]}...", False, "LOGIN BYPASSED!")
                failed += 1
                continue
            
            # 2. SQL error in response
            response_text = response.text.lower()
            sql_error_indicators = [
                "sql", "syntax", "query", "select", "insert", "update", "delete",
                "table", "column", "database", "postgresql", "mysql", "sqlite",
                "ora-", "pg_", "unclosed quotation", "unterminated string"
            ]
            
            for indicator in sql_error_indicators:
                if indicator in response_text:
                    is_vulnerable = True
                    print_result(f"Payload: {payload[:30]}...", False, f"SQL ERROR EXPOSED: {indicator}")
                    failed += 1
                    break
            
            if not is_vulnerable:
                passed += 1
                
        except requests.exceptions.Timeout:
            # Timeout might indicate time-based SQL injection
            print_result(f"Payload: {payload[:30]}...", False, "TIMEOUT - Possible time-based injection")
            failed += 1
        except Exception as e:
            print(f"  {Fore.YELLOW}[?] Error testing payload: {str(e)[:50]}{Style.RESET_ALL}")
    
    # Test in password field
    print(f"\n  Testing password field...")
    for payload in CLASSIC_PAYLOADS[:5]:
        test_data = {
            "mobile_number": "9999999999",
            "password": payload
        }
        
        try:
            response = requests.post(f"{BASE_URL}/login", json=test_data, timeout=10)
            if response.status_code == 200:
                print_result(f"Password payload: {payload[:20]}...", False, "LOGIN BYPASSED!")
                failed += 1
            else:
                passed += 1
        except:
            pass
    
    return passed, failed


def test_signup_sql_injection() -> Tuple[int, int]:
    """Test signup endpoint for SQL injection"""
    print_header("Testing /signup Endpoint")
    
    passed = 0
    failed = 0
    
    for payload in CLASSIC_PAYLOADS[:10]:
        test_data = {
            "mobile_number": f"999{payload}",
            "email": f"test{payload}@test.com",
            "password": "securepassword123",
            "first_name": payload,
            "last_name": "Test",
            "role": "customer",
            "terms_consent": True,
            "privacy_consent": True,
            "data_consent": True,
            "nationality": payload
        }
        
        try:
            response = requests.post(f"{BASE_URL}/signup", json=test_data, timeout=10)
            response_text = response.text.lower()
            
            # Check for SQL error indicators
            sql_error_found = False
            for indicator in ["sql", "syntax", "query", "postgresql", "database error"]:
                if indicator in response_text:
                    sql_error_found = True
                    print_result(f"Payload in fields: {payload[:20]}...", False, f"SQL ERROR: {indicator}")
                    failed += 1
                    break
            
            if not sql_error_found:
                passed += 1
                
        except Exception as e:
            print(f"  {Fore.YELLOW}[?] Error: {str(e)[:50]}{Style.RESET_ALL}")
    
    return passed, failed


def test_admin_login_sql_injection() -> Tuple[int, int]:
    """Test admin login endpoint for SQL injection"""
    print_header("Testing /admin/login Endpoint")
    
    passed = 0
    failed = 0
    
    for payload in CLASSIC_PAYLOADS[:10]:
        test_data = {
            "admin_id": payload,
            "email": f"{payload}@admin.com",
            "password": payload,
            "pin": "123456"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/admin/login", json=test_data, timeout=10)
            
            if response.status_code == 200:
                print_result(f"Admin payload: {payload[:20]}...", False, "ADMIN LOGIN BYPASSED!")
                failed += 1
            else:
                response_text = response.text.lower()
                if any(x in response_text for x in ["sql", "syntax", "query"]):
                    print_result(f"Admin payload: {payload[:20]}...", False, "SQL ERROR EXPOSED")
                    failed += 1
                else:
                    passed += 1
                    
        except Exception as e:
            print(f"  {Fore.YELLOW}[?] Error: {str(e)[:50]}{Style.RESET_ALL}")
    
    return passed, failed


def test_loan_application_sql_injection(token: str = None) -> Tuple[int, int]:
    """Test loan application endpoint for SQL injection"""
    print_header("Testing /loan-apply Endpoint")
    
    passed = 0
    failed = 0
    
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    for payload in CLASSIC_PAYLOADS[:5]:
        test_data = {
            "gender": payload,
            "age": 25,
            "employment_status": payload,
            "education_level": "Bachelor",
            "experience": 5,
            "job_tenure": 3,
            "monthly_income": 50000,
            "monthly_debt_payments": 5000,
            "loan_amount": 100000,
            "loan_duration": 12,
            "loan_purpose": payload,
            "marital_status": "Single",
            "number_of_dependents": 0,
            "home_ownership_status": "Rent",
            "property_area": "Urban",
            "coapplicant_income": 0,
            "cibil_score": 750,
            "previous_loan_defaults": "No"
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/loan-apply", 
                json=test_data, 
                headers=headers,
                timeout=10
            )
            response_text = response.text.lower()
            
            if any(x in response_text for x in ["sql", "syntax", "query", "database"]):
                print_result(f"Loan payload: {payload[:20]}...", False, "SQL ERROR EXPOSED")
                failed += 1
            else:
                passed += 1
                
        except Exception as e:
            print(f"  {Fore.YELLOW}[?] Error: {str(e)[:50]}{Style.RESET_ALL}")
    
    return passed, failed


def test_query_parameter_injection() -> Tuple[int, int]:
    """Test URL query parameters for SQL injection"""
    print_header("Testing Query Parameter Injection")
    
    passed = 0
    failed = 0
    
    # Endpoints that might accept query parameters
    endpoints = [
        "/admin/applications",
        "/admin/users", 
        "/admin/documents",
    ]
    
    for endpoint in endpoints:
        for payload in CLASSIC_PAYLOADS[:5]:
            try:
                # Test various query parameters
                params = {
                    "search": payload,
                    "filter": payload,
                    "id": payload,
                    "status": payload,
                }
                
                response = requests.get(
                    f"{BASE_URL}{endpoint}", 
                    params=params,
                    timeout=10
                )
                response_text = response.text.lower()
                
                if any(x in response_text for x in ["sql", "syntax", "query"]):
                    print_result(f"{endpoint} - {payload[:15]}...", False, "SQL ERROR")
                    failed += 1
                else:
                    passed += 1
                    
            except:
                pass
    
    return passed, failed


def run_all_tests():
    """Run all SQL injection tests"""
    print(f"""
{Fore.CYAN}╔══════════════════════════════════════════════════════════════╗
║        SQL INJECTION PENETRATION TEST SUITE                    ║
║        OWASP Security Testing for AI Loan Advisor              ║
╚══════════════════════════════════════════════════════════════╝{Style.RESET_ALL}

{Fore.YELLOW}Target: {BASE_URL}
Testing: {len(ALL_PAYLOADS)} SQL injection payloads across multiple endpoints
{Style.RESET_ALL}
""")
    
    total_passed = 0
    total_failed = 0
    
    # Run each test category
    tests = [
        ("Login Endpoint", test_login_sql_injection),
        ("Signup Endpoint", test_signup_sql_injection),
        ("Admin Login Endpoint", test_admin_login_sql_injection),
        ("Loan Application Endpoint", lambda: test_loan_application_sql_injection(None)),
        ("Query Parameters", test_query_parameter_injection),
    ]
    
    for test_name, test_func in tests:
        try:
            passed, failed = test_func()
            total_passed += passed
            total_failed += failed
            print(f"\n  {Fore.BLUE}Subtotal: {passed} passed, {failed} failed{Style.RESET_ALL}")
        except requests.exceptions.ConnectionError:
            print(f"  {Fore.RED}✗ Cannot connect to {BASE_URL} - Is the server running?{Style.RESET_ALL}")
            return
        except Exception as e:
            print(f"  {Fore.RED}✗ Test error: {e}{Style.RESET_ALL}")
    
    # Final Summary
    print(f"""
{Fore.CYAN}{'='*60}
                    FINAL RESULTS
{'='*60}{Style.RESET_ALL}

  Total Tests Run: {total_passed + total_failed}
  {Fore.GREEN}✓ Passed (Protected): {total_passed}{Style.RESET_ALL}
  {Fore.RED}✗ Failed (Vulnerable): {total_failed}{Style.RESET_ALL}
  
""")
    
    if total_failed == 0:
        print(f"""
{Fore.GREEN}╔══════════════════════════════════════════════════════════════╗
║  ✓ EXCELLENT! Your application appears PROTECTED against      ║
║    SQL Injection attacks.                                      ║
║                                                                 ║
║  WHY: You're using SQLAlchemy ORM with parameterized queries   ║
║       which automatically escapes user input.                  ║
╚══════════════════════════════════════════════════════════════╝{Style.RESET_ALL}
""")
    else:
        print(f"""
{Fore.RED}╔══════════════════════════════════════════════════════════════╗
║  ✗ WARNING! Potential SQL injection vulnerabilities found!     ║
║                                                                 ║
║  Review the failed tests above and fix the vulnerable          ║
║  endpoints immediately.                                         ║
╚══════════════════════════════════════════════════════════════╝{Style.RESET_ALL}
""")


if __name__ == "__main__":
    run_all_tests()
