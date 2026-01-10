import requests
import json

BASE_URL = "http://localhost:8000"

def test_pan_validation():
    print("Testing PAN Validation...")
    payload = {"pan_number": "ABCDE1234F"}
    try:
        response = requests.post(f"{BASE_URL}/mock/validate-pan", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

def test_aadhaar_validation():
    print("\nTesting Aadhaar Validation...")
    payload = {"aadhaar_number": "987654321012"}
    try:
        response = requests.post(f"{BASE_URL}/mock/validate-aadhaar", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_pan_validation()
    test_aadhaar_validation()
