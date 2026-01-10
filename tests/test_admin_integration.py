import pytest
import asyncio
import sys
import os

# Add backend to path if running from root
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from httpx import AsyncClient, ASGITransport
from main import app
import models
import auth
from database import get_db, engine
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

# Test Credentials
ADMIN_EMAIL = "Vinaykumarsm2341@gmail.com"
ADMIN_PASS = "Vinay@123"

@pytest.mark.asyncio
async def test_admin_login_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Login with correct credentials
        login_data = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASS
        }
        response = await ac.post("/admin/login", json=login_data)
        
        # Verify success
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["role"] == "bank_officer"
        token = data["access_token"]
        
        # 2. Access Protected Admin Route
        headers = {"Authorization": f"Bearer {token}"}
        stats_response = await ac.get("/admin/dashboard/stats", headers=headers)
        
        assert stats_response.status_code == 200
        stats = stats_response.json()
        assert "total_loans" in stats
        
        # 3. Access Protected Route with Consumer Token (FAIL Test)
        # Create/Get a consumer user
        # (Skipping full customer creation for brevity, assuming token logic handles it)
        # We can construct a fake customer token
        customer_token = auth.create_access_token(
           data={"sub": "customer@test.com", "role": "customer", "user_id": "fake-uuid"}
        )
        bad_headers = {"Authorization": f"Bearer {customer_token}"}
        
        fail_response = await ac.get("/admin/dashboard/stats", headers=bad_headers)
        assert fail_response.status_code == 403 or fail_response.status_code == 401
        print("Access control verified")

if __name__ == "__main__":
    # If running directly, use asyncio run
    asyncio.run(test_admin_login_flow())
    print("Test Passed!")
