import asyncio
import sys
import os

# Add root directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import AsyncSessionLocal
from backend import models
from sqlalchemy.future import select

async def list_users():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(models.User))
        users = result.scalars().all()
        
        print(f"\n{'='*60}")
        print(f"  REGISTERED USERS ({len(users)} total)")
        print(f"{'='*60}\n")
        
        for i, user in enumerate(users, 1):
            print(f"{i}. {user.first_name or 'N/A'} {user.last_name or ''}")
            print(f"   📱 Mobile: {user.mobile_number}")
            print(f"   📧 Email: {user.email or 'N/A'}")
            print(f"   🆔 Customer ID: {user.customer_id or 'N/A'}")
            print(f"   📅 Created: {user.created_at}")
            print()

if __name__ == "__main__":
    asyncio.run(list_users())
