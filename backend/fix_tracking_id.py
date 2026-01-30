import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine
from sqlalchemy import text

async def fix_tracking_id():
    """Check and add tracking_id column"""
    print("=" * 60)
    print("CHECKING DATABASE COLUMNS")
    print("=" * 60)
    
    async with engine.begin() as conn:
        # List all columns
        print("\n1. Current columns in loan_applications:")
        result = await conn.execute(text("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name='loan_applications' 
            ORDER BY ordinal_position;
        """))
        columns = result.fetchall()
        for col in columns:
            print(f"   {col[0]:30} {col[1]:20} nullable={col[2]}")
        
        # Check if tracking_id exists
        has_tracking_id = any(col[0] == 'tracking_id' for col in columns)
        
        if has_tracking_id:
            print("\n✓ tracking_id column EXISTS")
        else:
            print("\n✗ tracking_id column MISSING - Adding now...")
            
            # Add the column
            await conn.execute(text("""
                ALTER TABLE loan_applications 
                ADD COLUMN tracking_id VARCHAR(20);
            """))
            print("✓ Column added")
            
            # Create index
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_loan_applications_tracking_id 
                ON loan_applications(tracking_id);
            """))
            print("✓ Index created")
            
            # Verify
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='loan_applications' AND column_name='tracking_id';
            """))
            if result.fetchone():
                print("✓ VERIFIED: tracking_id column now exists!")
            else:
                print("✗ ERROR: Column still not found!")
    
    print("\n" + "=" * 60)
    print("DONE")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(fix_tracking_id())
