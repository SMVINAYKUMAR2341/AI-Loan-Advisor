"""Quick script to count loan applications in database"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:admin@localhost:5432/loan_advisor")
async_engine = create_async_engine(DATABASE_URL)

async def count_loans():
    async with async_engine.connect() as conn:
        apps = (await conn.execute(text('SELECT COUNT(*) FROM loan_applications'))).scalar()
        preds = (await conn.execute(text('SELECT COUNT(*) FROM loan_predictions'))).scalar()
        
        print("\n" + "="*50)
        print("  DATABASE LOAN APPLICATION COUNTS")
        print("="*50)
        print(f"  📋 Loan Applications: {apps}")
        print(f"  🤖 Loan Predictions:  {preds}")
        print("="*50)
        
        # Show recent applications
        recent = await conn.execute(text('''
            SELECT la.id, la.loan_amount, la.loan_purpose, lp.decision, la.created_at
            FROM loan_applications la
            LEFT JOIN loan_predictions lp ON la.id = lp.application_id
            ORDER BY la.created_at DESC
            LIMIT 5
        '''))
        rows = recent.fetchall()
        
        if rows:
            print("\n  📑 Recent Applications:")
            for i, row in enumerate(rows, 1):
                print(f"     {i}. ₹{row[1]:,.0f} ({row[2]}) - {row[3] or 'Pending'}")
        print()

asyncio.run(count_loans())
