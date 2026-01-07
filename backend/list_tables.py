import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from backend.database import AsyncSessionLocal

async def list_all_tables():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
        )
        tables = [row[0] for row in result.fetchall()]
        
        print("=" * 50)
        print("ALL DATABASE TABLES")
        print("=" * 50)
        for i, table in enumerate(tables, 1):
            print(f"  {i:2}. {table}")
        print("=" * 50)
        print(f"Total: {len(tables)} tables")
        
        # Check all required tables (all from models.py)
        required = [
            'users', 
            'loan_applications', 
            'loan_predictions', 
            'officer_reviews',
            'kyc_documents',
            'repayments',
            'bank_account_details',
            'loan_agreements',
            'kyc_status_tracking',
            'audit_logs',
            'user_sessions'
        ]
        
        print("\n" + "=" * 50)
        print("TABLE STATUS CHECK")
        print("=" * 50)
        missing = []
        for table in required:
            if table in tables:
                print(f"  ✓ {table}")
            else:
                print(f"  ✗ {table} (MISSING)")
                missing.append(table)
        
        print("=" * 50)
        if missing:
            print(f"WARNING: {len(missing)} table(s) missing!")
        else:
            print("SUCCESS: All 11 required tables present!")

if __name__ == "__main__":
    asyncio.run(list_all_tables())
