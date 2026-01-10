import requests
import json
import random
import string

BASE_URL = "http://localhost:8000"

def generate_random_digits(n):
    return ''.join(random.choices(string.digits, k=n))

def generate_user():
    mobile = "9" + generate_random_digits(9)
    email = f"user_{mobile}@test.com"
    return {
        "mobile_number": mobile,
        "email": email,
        "password": "password123",
        "first_name": "Test",
        "last_name": "User",
        "role": "customer",
        "terms_consent": True,
        "privacy_consent": True,
        "data_consent": True,
        "nationality": "Indian"
    }

def test_security_endpoints():
    print("1. Registering New User...")
    user_data = generate_user()
    resp = requests.post(f"{BASE_URL}/signup", json=user_data)
    if resp.status_code != 200:
        print(f"Signup failed: {resp.text}")
        return

    print("2. Logging in...")
    login_data = {
        "mobile_number": user_data["mobile_number"],
        "password": user_data["password"]
    }
    
    resp = requests.post(f"{BASE_URL}/login", json=login_data)
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return

    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful.")

    print("\n3. Fetching Active Sessions...")
    resp = requests.get(f"{BASE_URL}/sessions", headers=headers)
    if resp.status_code == 200:
        print("Sessions fetched successfully:")
        print(json.dumps(resp.json(), indent=2))
        
        sessions = resp.json().get("sessions", [])
        if len(sessions) > 0:
            print("Verified: At least one active session found.")
        else:
            print("Warning: No active sessions found (login should have created one).")
    else:
        print(f"Failed to fetch sessions: {resp.status_code} - {resp.text}")

    print("\n4. Fetching Security Activity...")
    resp = requests.get(f"{BASE_URL}/activity/security", headers=headers)
    if resp.status_code == 200:
        print("Security Activity fetched successfully:")
        print(json.dumps(resp.json(), indent=2))
    else:
        print(f"Failed to fetch security activity: {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    test_security_endpoints()
