import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine
from sqlalchemy import text

async def add_tracking_id_column():
    """Add tracking_id column to loan_applications table"""
    print("Connecting to database...")
    async with engine.begin() as conn:
        # Check if column exists
        check_sql = """
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='loan_applications' AND column_name='tracking_id';
        """
        result = await conn.execute(text(check_sql))
        exists = result.fetchone()
        
        if exists:
            print("tracking_id column already exists!")
            return
        
        print("Adding tracking_id column...")
        alter_sql = """
        ALTER TABLE loan_applications 
        ADD COLUMN tracking_id VARCHAR(20) UNIQUE;
        """
        await conn.execute(text(alter_sql))
        
        print("Creating index on tracking_id...")
        index_sql = """
        CREATE INDEX IF NOT EXISTS idx_loan_applications_tracking_id 
        ON loan_applications(tracking_id);
        """
        await conn.execute(text(index_sql))
        
    print("Done! tracking_id column added successfully.")

if __name__ == "__main__":
    asyncio.run(add_tracking_id_column())
