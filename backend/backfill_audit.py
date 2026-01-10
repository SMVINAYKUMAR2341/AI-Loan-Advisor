import asyncio
import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import AsyncSessionLocal
from sqlalchemy import select
import models

async def backfill():
    print("Starting audit log backfill...")
    async with AsyncSessionLocal() as db:
        # Get all applications
        result = await db.execute(select(models.LoanApplication))
        apps = result.scalars().all()
        
        count = 0
        for app in apps:
            # Check if log exists
            log_query = select(models.AuditLog).where(
                models.AuditLog.entity_id == app.id,
                models.AuditLog.action == "LOAN_APPLIED"
            )
            log_result = await db.execute(log_query)
            if log_result.scalars().first():
                continue
                
            # Create Audit Log
            print(f"Creating log for app {app.id}")
            log = models.AuditLog(
                user_id=app.user_id,
                action="LOAN_APPLIED",
                event_category="LOAN",
                severity="INFO",
                entity_type="LOAN_APPLICATION",
                entity_id=app.id,
                description=f"Applied for {app.loan_purpose} loan of ₹{app.loan_amount:,}",
                created_at=app.created_at, # Preserve original timestamp
                metadata={"amount": app.loan_amount, "purpose": app.loan_purpose}
            )
            db.add(log)
            count += 1
            
        await db.commit()
        print(f"Success! Backfilled {count} missing audit logs.")

if __name__ == "__main__":
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(backfill())
