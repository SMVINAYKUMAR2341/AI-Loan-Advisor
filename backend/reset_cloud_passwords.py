"""
Reset all user passwords in Neon Cloud to Test@1234
"""
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from passlib.context import CryptContext

# Database URL
DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_4qNVJct3Bwio@ep-ancient-smoke-a1z5yh5g-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
NEW_PASSWORD = "Test@1234"
HASHED_PASSWORD = pwd_context.hash(NEW_PASSWORD)

async def reset_passwords():
    print(f"Connecting to Neon Cloud...")
    engine = create_async_engine(DATABASE_URL)
    
    async with engine.begin() as conn:
        print(f"Setting all passwords to: {NEW_PASSWORD}")
        await conn.execute(
            text("UPDATE users SET password_hash = :hash"),
            {"hash": HASHED_PASSWORD}
        )
        print("✅ All passwords updated successfully!")

if __name__ == "__main__":
    asyncio.run(reset_passwords())
