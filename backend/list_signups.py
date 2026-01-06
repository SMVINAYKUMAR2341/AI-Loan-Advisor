import asyncio
from sqlalchemy import text
from backend.database import AsyncSessionLocal

async def list_signups():
    print("Connecting to database (Neon)...")
    async with AsyncSessionLocal() as session:
        result = await session.execute(text('SELECT mobile_number, email, password_hash, created_at FROM users ORDER BY created_at DESC'))
        users = result.fetchall()
        print(f"\nSignups in Neon ({len(users)}):")
        print("-" * 100)
        print(f"{'Mobile':<15} | {'Email':<30} | {'Password Hash (First 20 chars)':<30} | {'Created At'}")
        print("-" * 100)
        for u in users:
            hash_start = u.password_hash[:20] + "..." if u.password_hash else "None"
            print(f"{u.mobile_number:<15} | {u.email or 'N/A':<30} | {hash_start:<30} | {u.created_at}")

if __name__ == "__main__":
    asyncio.run(list_signups())
