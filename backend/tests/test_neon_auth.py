import requests
import json
import uuid

def test_auth_flow():
    base_url = "http://localhost:8000"
    
    # 1. Signup
    mobile = str(uuid.uuid4().int)[:10]
    signup_payload = {
        "mobile_number": mobile,
        "password": "TestPassword123",
        "email": f"test_{mobile}@example.com",
        "role": "customer"
    }
    
    print(f"Testing signup with mobile: {mobile}...")
    try:
        response = requests.post(f"{base_url}/signup", json=signup_payload)
        if response.status_code == 200:
            print("✅ Signup successful!")
            user_data = response.json()
            # print(json.dumps(user_data, indent=2))
        else:
            print(f"❌ Signup failed: {response.status_code}")
            print(response.text)
            return

        # 2. Login
        login_payload = {
            "mobile_number": mobile,
            "password": "TestPassword123"
        }
        
        print(f"\nTesting login...")
        response = requests.post(f"{base_url}/login", json=login_payload)
        if response.status_code == 200:
            print("✅ Login successful!")
            data = response.json()
            print("Token received:", data.get("access_token")[:20] + "...")
            
            # 3. Get /user/me
            token = data.get("access_token")
            headers = {"Authorization": f"Bearer {token}"}
            print("\nTesting /user/me...")
            response = requests.get(f"{base_url}/user/me", headers=headers)
            if response.status_code == 200:
                print("✅ Auth validation successful (user/me)!")
                print(f"Logged in user: {response.json().get('mobile_number')}")
            else:
                print(f"❌ Auth validation failed: {response.status_code}")
                print(response.text)
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_auth_flow()
