"""
CRITICAL FIX: Add tracking_id column directly to Neon cloud database
"""
import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

load_dotenv()

# Get the exact database URL the server uses
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_4qNVJct3Bwio@ep-ancient-smoke-a1z5yh5g-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Fix for asyncpg
if "sslmode=" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("sslmode=require", "ssl=require")

print("=" * 70)
print("CRITICAL FIX: Adding tracking_id to ACTUAL server database")
print("=" * 70)
print(f"\nDatabase: {DATABASE_URL.split('@')[1].split('/')[0]}")

async def fix_neon_database():
    """Add tracking_id column to the Neon cloud database"""
    
    # Create engine with same settings as server
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=2
    )
    
    try:
        async with engine.begin() as conn:
            print("\n1. Checking current columns...")
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='loan_applications' 
                ORDER BY ordinal_position;
            """))
            columns = [row[0] for row in result.fetchall()]
            print(f"   Found {len(columns)} columns")
            
            if 'tracking_id' in columns:
                print("   ✓ tracking_id already exists")
            else:
                print("   ✗ tracking_id MISSING - adding now...")
                
                print("\n2. Adding tracking_id column...")
                await conn.execute(text("""
                    ALTER TABLE loan_applications 
                    ADD COLUMN tracking_id VARCHAR(20);
                """))
                print("   ✓ Column added")
                
                print("\n3. Creating index...")
                await conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_loan_applications_tracking_id 
                    ON loan_applications(tracking_id);
                """))
                print("   ✓ Index created")
            
            print("\n4. Verifying final state...")
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='loan_applications' AND column_name='tracking_id';
            """))
            if result.fetchone():
                print("   ✓✓✓ SUCCESS: tracking_id column verified in database!")
            else:
                print("   ✗✗✗ FAILED: Column still not found")
                
    finally:
        await engine.dispose()
    
    print("\n" + "=" * 70)
    print("FIX COMPLETE - Restart server now")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(fix_neon_database())
