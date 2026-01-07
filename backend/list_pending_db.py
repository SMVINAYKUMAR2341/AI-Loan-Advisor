import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import models

# Database URL for Neon/PostgreSQL as used in main.py
DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_rF4pG8WkjOms@ep-yellow-sun-a5v5e730-pooler.us-east-2.aws.neon.tech/neondb?ssl=verify-full"

async def list_pending_applications():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Join loan_applications with loan_predictions to find PENDING_REVIEW cases
        query = select(models.LoanApplication, models.LoanPrediction).join(
            models.LoanPrediction, models.LoanApplication.id == models.LoanPrediction.application_id
        ).where(models.LoanPrediction.decision == 'PENDING_REVIEW')
        
        result = await session.execute(query)
        pending_cases = result.all()
        
        print("\n" + "="*80)
        print("🕵️ PENDING_REVIEW LOAN APPLICATIONS IN DATABASE")
        print("="*80)
        
        if not pending_cases:
            print("No pending applications found.")
        else:
            for app, pred in pending_cases:
                print(f"\nApplication ID: {app.id}")
                print(f"Customer: {app.user_id}")
                print(f"Status: {pred.decision}")
                print(f"Reason: {pred.decision_reason}")
                print(f"ML Confidence: {pred.approval_probability}%")
                print("-" * 40)
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(list_pending_applications())
