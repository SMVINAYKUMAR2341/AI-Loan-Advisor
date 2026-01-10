import asyncio
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import AsyncSessionLocal
from sqlalchemy import select
import models
import auth

async def check_admin_users():
    print("Connecting to database...")
    async with AsyncSessionLocal() as db:
        print("Querying AdminUser table...")
        result = await db.execute(select(models.AdminUser))
        admins = result.scalars().all()
        
        print(f"Found {len(admins)} admin users.")
        
        for admin in admins:
            print("\n" + "="*40)
            print(f"Admin ID (repr): {repr(admin.admin_id)}")
            print(f"Email (repr):    {repr(admin.email)}")
            print(f"Name:           {admin.first_name} {admin.last_name}")
            print(f"Is Active:      {admin.is_active}")
            
            # Verify Password
            try:
                is_pass = auth.verify_password("Vinay@123", admin.password_hash)
                print(f"Test Password 'Vinay@123': {'✅ Valid' if is_pass else '❌ Invalid'}")
            except Exception as e:
                print(f"Password Check Error: {e}")

            # Verify PIN
            try:
                if admin.pin_hash:
                    is_pin = auth.verify_password("234124", admin.pin_hash)
                    print(f"Test PIN '234124':      {'✅ Valid' if is_pin else '❌ Invalid'}")
                else:
                    print("PIN Hash: None (Account incomplete)")
            except Exception as e:
                print(f"PIN Check Error: {e}")
            print("="*40 + "\n")

if __name__ == "__main__":
    asyncio.run(check_admin_users())
