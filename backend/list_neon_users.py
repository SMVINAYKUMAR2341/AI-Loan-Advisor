import asyncio
from sqlalchemy import text
from backend.database import AsyncSessionLocal

async def list_neon_users():
    print("Connecting to database (Neon)...")
    async with AsyncSessionLocal() as session:
        result = await session.execute(text('SELECT id, mobile_number, email, role FROM users'))
        users = result.fetchall()
        print(f"\nUsers in Neon ({len(users)}):")
        for u in users:
            print(f"  ID: {u.id}, Mobile: {u.mobile_number}, Email: {u.email}, Role: {u.role}")

if __name__ == "__main__":
    asyncio.run(list_neon_users())
