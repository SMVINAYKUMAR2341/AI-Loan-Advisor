import asyncio
import sys
import os

# Add root directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from backend.database import AsyncSessionLocal

async def check_tables():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        )
        tables = [row[0] for row in result.fetchall()]
        print("Tables in database:", tables)
        
        # Check all required tables
        required = [
            'users', 
            'loan_applications', 
            'loan_predictions', 
            'officer_reviews',
            'kyc_documents',
            'repayments',
            'audit_logs'
        ]
        print("\nTable Status:")
        for table in required:
            if table in tables:
                print(f"  ✓ {table}")
            else:
                print(f"  ✗ {table} (missing)")

if __name__ == "__main__":
    asyncio.run(check_tables())
