import asyncio
from sqlalchemy import text
from backend.database import AsyncSessionLocal

async def cleanup_users():
    target_mobile = "8095006741"
    print(f"Connecting to database (Neon) to clean up all users EXCEPT {target_mobile}...")
    
    async with AsyncSessionLocal() as session:
        # 1. Check if the target user exists
        result = await session.execute(text("SELECT id FROM users WHERE mobile_number = :mobile"), {"mobile": target_mobile})
        target_user = result.fetchone()
        
        if not target_user:
            print(f"❌ ERROR: User {target_mobile} not found in database. Aborting cleanup to prevent data loss.")
            return

        target_id = target_user[0]
        print(f"Found target user: {target_mobile} (ID: {target_id})")

        # 2. Delete dependent records first (to avoid FK violations)
        # Note: If models have CASCADE, this might be redundant but safe.
        tables_to_clean = [
            "audit_logs",
            "user_sessions",
            "kyc_status_tracking",
            "loan_agreements",
            "bank_account_details",
            "kyc_documents",
            "officer_reviews",
            "loan_predictions",
            "repayments",
            "loan_applications"
        ]

        print("Cleaning up dependent records for other users...")
        for table in tables_to_clean:
            # For tables that have user_id
            try:
                if table in ["audit_logs", "user_sessions", "bank_account_details", "loan_agreements", "kyc_documents"]:
                    res = await session.execute(
                        text(f"DELETE FROM {table} WHERE user_id != :target_id"),
                        {"target_id": target_id}
                    )
                    print(f"  {table}: Deleted {res.rowcount} rows")
            except Exception as e:
                 print(f"  Could not clean {table}: {e}")

        # 3. Delete other users
        print("Deleting other users...")
        res = await session.execute(
            text("DELETE FROM users WHERE id != :target_id"),
            {"target_id": target_id}
        )
        print(f"  users: Deleted {res.rowcount} users")
        
        await session.commit()
        print("\n✅ Cleanup complete! Only user 8095006741 remains.")

if __name__ == "__main__":
    asyncio.run(cleanup_users())
