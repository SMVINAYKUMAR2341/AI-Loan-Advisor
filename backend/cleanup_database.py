import asyncio
import sys
import os
from sqlalchemy import delete
from sqlalchemy.future import select

# Add root directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import AsyncSessionLocal
from backend import models

async def cleanup_database():
    target_email = "vinay@gmail.com"
    target_mobile = "8095006741"
    
    async with AsyncSessionLocal() as session:
        # 1. Find the target user ID to exclude
        result = await session.execute(
            select(models.User.id).where(
                (models.User.email == target_email) | 
                (models.User.mobile_number == target_mobile)
            )
        )
        target_user_id = result.scalar_one_or_none()
        
        if not target_user_id:
            print(f"Error: Target user {target_email} not found!")
            return

        print(f"Target User ID to keep: {target_user_id} ({target_email})")
        
        # 2. Identify all other user IDs
        result = await session.execute(
            select(models.User.id).where(models.User.id != target_user_id)
        )
        other_user_ids = result.scalars().all()
        
        if not other_user_ids:
            print("No other users found to delete.")
            return

        print(f"Found {len(other_user_ids)} users to delete.")

        # 3. Identify related loan application IDs for other users
        result = await session.execute(
            select(models.LoanApplication.id).where(models.LoanApplication.user_id.in_(other_user_ids))
        )
        other_app_ids = result.scalars().all()

        # 4. Delete dependent records in correct order
        
        # Tables dependent on loan_applications
        if other_app_ids:
            print(f"Deleting records for {len(other_app_ids)} loan applications...")
            
            await session.execute(delete(models.LoanPrediction).where(models.LoanPrediction.application_id.in_(other_app_ids)))
            await session.execute(delete(models.OfficerReview).where(models.OfficerReview.application_id.in_(other_app_ids)))
            await session.execute(delete(models.KYCDocument).where(models.KYCDocument.application_id.in_(other_app_ids)))
            await session.execute(delete(models.Repayment).where(models.Repayment.application_id.in_(other_app_ids)))
            await session.execute(delete(models.BankAccountDetails).where(models.BankAccountDetails.application_id.in_(other_app_ids)))
            await session.execute(delete(models.LoanAgreement).where(models.LoanAgreement.application_id.in_(other_app_ids)))
            await session.execute(delete(models.KYCStatusTracking).where(models.KYCStatusTracking.application_id.in_(other_app_ids)))

        # Tables dependent on users
        print("Deleting audit logs and sessions...")
        await session.execute(delete(models.AuditLog).where(models.AuditLog.user_id.in_(other_user_ids)))
        await session.execute(delete(models.UserSession).where(models.UserSession.user_id.in_(other_user_ids)))
        
        # Delete loan applications
        if other_app_ids:
            await session.execute(delete(models.LoanApplication).where(models.LoanApplication.id.in_(other_app_ids)))

        # 5. Delete the users
        print(f"Deleting {len(other_user_ids)} users...")
        await session.execute(delete(models.User).where(models.User.id.in_(other_user_ids)))

        # Commit all changes
        await session.commit()
        print("\nCleanup completed successfully!")

if __name__ == "__main__":
    asyncio.run(cleanup_database())
