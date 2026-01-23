"""
Database Cleanup Script - Removes all loan applications and predictions
Uses TRUNCATE CASCADE to handle all foreign key constraints
"""
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from database import AsyncSessionLocal

async def clean_loan_data():
    """Delete all loan applications, predictions, and related data using CASCADE"""
    
    async with AsyncSessionLocal() as session:
        print("=" * 60)
        print("CLEANING LOAN DATA FROM DATABASE")
        print("=" * 60)
        
        try:
            # Use TRUNCATE with CASCADE to handle all foreign keys
            await session.execute(text("TRUNCATE TABLE loan_applications CASCADE"))
            await session.commit()
            print("✓ Cleaned loan_applications and all related tables (CASCADE)")
        except Exception as e:
            await session.rollback()
            print(f"⚠ Error with CASCADE: {str(e)[:80]}")
            
            # Fallback: try deleting from each table individually
            print("\nTrying individual table cleanup...")
            tables = [
                "audit_logs", "notifications", "repayments", "disbursements",
                "officer_reviews", "kyc_documents", "loan_agreements", 
                "loan_predictions", "loan_applications"
            ]
            for table in tables:
                try:
                    async with AsyncSessionLocal() as s:
                        await s.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
                        await s.commit()
                        print(f"✓ Truncated {table}")
                except Exception as te:
                    print(f"⚠ {table}: skipped")
        
        print("=" * 60)
        print("DATABASE CLEANUP COMPLETE!")
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(clean_loan_data())
