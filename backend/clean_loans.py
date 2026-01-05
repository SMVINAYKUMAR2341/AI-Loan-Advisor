"""Clean all loan applications from database"""
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:admin@localhost:5432/loan_advisor")

# Fix for asyncpg: convert sslmode to ssl parameter
if DATABASE_URL and "sslmode=" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("sslmode=require", "ssl=require")

async_engine = create_async_engine(DATABASE_URL)

async def clean_loans():
    async with async_engine.begin() as conn:
        # TRUNCATE with CASCADE handles all foreign key dependencies automatically
        await conn.execute(text("TRUNCATE loan_applications CASCADE"))
        
        # Get new counts
        apps = (await conn.execute(text("SELECT COUNT(*) FROM loan_applications"))).scalar()
        preds = (await conn.execute(text("SELECT COUNT(*) FROM loan_predictions"))).scalar()
        
        print("\n" + "="*50)
        print("  ✅ DATABASE CLEANED SUCCESSFULLY!")
        print("="*50)
        print(f"  Loan applications remaining: {apps}")
        print(f"  Loan predictions remaining: {preds}")
        print("="*50 + "\n")

asyncio.run(clean_loans())
