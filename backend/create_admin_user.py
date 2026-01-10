"""
Create Admin User Script
Creates a bank officer admin account in the SEPARATE admin_users table

Admin Credentials:
- Admin ID: LAAD202501
- Email: Vinaykumarsm2341@gmail.com
- Password: Vinay@123
- PIN: 234124
"""

import asyncio
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select
from database import AsyncSessionLocal, engine, Base
import models
from auth import get_password_hash

async def create_tables():
    """Create admin_users table if not exists"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tables verified/created")

async def create_admin_user():
    """Create the admin user in separate admin_users table"""
    
    # First ensure table exists
    await create_tables()
    
    async with AsyncSessionLocal() as db:
        # Check if admin already exists
        result = await db.execute(
            select(models.AdminUser).where(
                models.AdminUser.admin_id == "LAAD202501"
            )
        )
        existing_admin = result.scalar_one_or_none()
        
        if existing_admin:
            print("Admin already exists, updating credentials...")
            existing_admin.email = "Vinaykumarsm2341@gmail.com"
            existing_admin.password_hash = get_password_hash("Vinay@123")
            existing_admin.pin_hash = get_password_hash("234124")
            existing_admin.first_name = "Vinay"
            existing_admin.last_name = "Kumar"
            await db.commit()
            
            print("=" * 50)
            print("✅ ADMIN USER UPDATED!")
            print("=" * 50)
        else:
            # Create new admin user in separate table
            admin_user = models.AdminUser(
                admin_id="LAAD202501",
                email="Vinaykumarsm2341@gmail.com",
                password_hash=get_password_hash("Vinay@123"),
                pin_hash=get_password_hash("234124"),
                first_name="Vinay",
                last_name="Kumar",
                department="Loan Operations",
                designation="Senior Bank Officer",
                can_approve_loans=True,
                can_disburse=True,
                can_verify_kyc=True,
                can_send_notifications=True,
                is_active=True,
            )
            
            db.add(admin_user)
            await db.commit()
            
            print("=" * 50)
            print("✅ ADMIN USER CREATED IN SEPARATE TABLE!")
            print("=" * 50)
        
        print(f"Admin ID: LAAD202501")
        print(f"Email: Vinaykumarsm2341@gmail.com")
        print(f"Password: Vinay@123")
        print(f"PIN: 234124")
        print("=" * 50)
        print("\n📊 Database Tables:")
        print("  - users (customers only)")
        print("  - admin_users (bank officers only)")
        print("=" * 50)
        print("\nLogin to Admin Dashboard at:")
        print("http://localhost:8080")
        print("=" * 50)

if __name__ == "__main__":
    asyncio.run(create_admin_user())
