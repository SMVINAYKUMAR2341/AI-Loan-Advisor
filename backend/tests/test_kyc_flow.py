import pytest
import requests
import os

BASE_URL = "http://localhost:8000"

import random
import string

def random_string(length=10):
    return ''.join(random.choice(string.ascii_lowercase) for i in range(length))

@pytest.fixture(scope="module")
def test_user():
    # Create a user and a loan application
    user_data = {
        "mobile_number": f"9{random.randint(100000000, 999999999)}",
        "email": f"{random_string()}@example.com",
        "password": "password123",
        "first_name": "Test",
        "last_name": "User",
    }
    response = requests.post(f"{BASE_URL}/signup", json=user_data)
    assert response.status_code == 200

    login_data = {"mobile_number": user_data["mobile_number"], "password": "password123"}
    response = requests.post(f"{BASE_URL}/login", json=login_data)
    assert response.status_code == 200
    token = response.json()["access_token"]

    application_data = {
            "applicant_income": 50000,
            "coapplicant_income": 0,
            "loan_amount": 100000,
            "loan_term": 360,
            "credit_history": 1,
            "gender": "Male",
            "married": "No",
            "dependents": 0,
            "education": "Graduate",
            "employment": "Salaried",
            "property_area": "Urban",
        }
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/loan-application", json=application_data, headers=headers)
        print(response.json())
        assert response.status_code == 200
    application_id = response.json()["id"]

    return {"token": token, "application_id": application_id}

def test_upload_success(test_user):
    token = test_user["token"]
    application_id = test_user["application_id"]
    headers = {"Authorization": f"Bearer {token}"}

    with open("test_aadhaar.jpg", "wb") as f:
        f.write(b"test image data")

    files = {"file": ("test_aadhaar.jpg", open("test_aadhaar.jpg", "rb"), "image/jpeg")}
    data = {
        "application_id": application_id,
        "document_type": "AADHAAR_FRONT",
        "document_number": "123456789012",
    }

    response = requests.post(f"{BASE_URL}/documents/upload", headers=headers, data=data, files=files)
    assert response.status_code == 200
    assert response.json()["file_name"] == "test_aadhaar.jpg"

    os.remove("test_aadhaar.jpg")

def test_upload_invalid_file_type(test_user):
    token = test_user["token"]
    application_id = test_user["application_id"]
    headers = {"Authorization": f"Bearer {token}"}

    with open("test.txt", "wb") as f:
        f.write(b"test data")

    files = {"file": ("test.txt", open("test.txt", "rb"), "text/plain")}
    data = {
        "application_id": application_id,
        "document_type": "AADHAAR_FRONT",
        "document_number": "123456789012",
    }

    response = requests.post(f"{BASE_URL}/documents/upload", headers=headers, data=data, files=files)
    assert response.status_code == 400
    assert response.json()["error_code"] == "INVALID_FILE_TYPE"

    os.remove("test.txt")

def test_upload_file_size_exceeded(test_user):
    token = test_user["token"]
    application_id = test_user["application_id"]
    headers = {"Authorization": f"Bearer {token}"}

    with open("large_file.jpg", "wb") as f:
        f.write(b"a" * (6 * 1024 * 1024))  # 6MB

    files = {"file": ("large_file.jpg", open("large_file.jpg", "rb"), "image/jpeg")}
    data = {
        "application_id": application_id,
        "document_type": "AADHAAR_FRONT",
        "document_number": "123456789012",
    }

    response = requests.post(f"{BASE_URL}/documents/upload", headers=headers, data=data, files=files)
    assert response.status_code == 400
    assert response.json()["error_code"] == "FILE_SIZE_EXCEEDED"

    os.remove("large_file.jpg")

def test_upload_invalid_aadhaar(test_user):
    token = test_user["token"]
    application_id = test_user["application_id"]
    headers = {"Authorization": f"Bearer {token}"}

    with open("test_aadhaar.jpg", "wb") as f:
        f.write(b"test image data")

    files = {"file": ("test_aadhaar.jpg", open("test_aadhaar.jpg", "rb"), "image/jpeg")}
    data = {
        "application_id": application_id,
        "document_type": "AADHAAR_FRONT",
        "document_number": "12345678901",  # Invalid number
    }

    response = requests.post(f"{BASE_URL}/documents/upload", headers=headers, data=data, files=files)
    assert response.status_code == 400
    assert response.json()["error_code"] == "INVALID_AADHAAR_NUMBER"

    os.remove("test_aadhaar.jpg")

def test_upload_invalid_pan(test_user):
    token = test_user["token"]
    application_id = test_user["application_id"]
    headers = {"Authorization": f"Bearer {token}"}

    with open("test_pan.jpg", "wb") as f:
        f.write(b"test image data")

    files = {"file": ("test_pan.jpg", open("test_pan.jpg", "rb"), "image/jpeg")}
    data = {
        "application_id": application_id,
        "document_type": "PAN",
        "document_number": "ABCDE1234",  # Invalid number
    }

    response = requests.post(f"{BASE_URL}/documents/upload", headers=headers, data=data, files=files)
    assert response.status_code == 400
    assert response.json()["error_code"] == "INVALID_PAN_NUMBER"

    os.remove("test_pan.jpg")
