"""
FINAL FIX: Force add tracking_id column with explicit error handling
"""
import asyncpg
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

# Get raw connection string
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_4qNVJct3Bwio@ep-ancient-smoke-a1z5yh5g-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Remove asyncpg+ prefix and convert sslmode to ssl
conn_string = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://").replace("?sslmode=require", "?ssl=require")

print("=" * 70)
print("FINAL FIX - Direct PostgreSQL Connection")
print("=" * 70)

async def add_column_direct():
    # Connect directly with asyncpg
    conn = await asyncpg.connect(conn_string)
    
    try:
        print("\n1. Checking table structure...")
        columns = await conn.fetch("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'loan_applications'
            ORDER BY ordinal_position;
        """)
        
        print(f"   Found {len(columns)} columns:")
        has_tracking_id = False
        for col in columns:
            if col['column_name'] == 'tracking_id':
                has_tracking_id = True
                print(f"   ✓ {col['column_name']}: {col['data_type']}")
            else:
                print(f"     {col['column_name']}: {col['data_type']}")
        
        if not has_tracking_id:
            print("\n2. Adding tracking_id column...")
            try:
                await conn.execute("""
                    ALTER TABLE loan_applications 
                    ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(20);
                """)
                print("   ✓ Column added!")
            except Exception as e:
                print(f"   ✗ Error: {e}")
            
            print("\n3. Creating index...")
            try:
                await conn.execute("""
                    CREATE INDEX IF NOT EXISTS idx_loan_applications_tracking_id 
                    ON loan_applications(tracking_id);
                """)
                print("   ✓ Index created!")
            except Exception as e:
                print(f"   ✗ Error: {e}")
        else:
            print("\n✓ tracking_id column already exists!")
        
        print("\n4. Final verification...")
        result = await conn.fetchrow("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='loan_applications' AND column_name='tracking_id';
        """)
        
        if result:
            print("   ✓✓✓ SUCCESS: tracking_id exists!")
        else:
            print("   ✗✗✗ FAILED: Still not found!")
            
    finally:
        await conn.close()
    
    print("\n" + "=" * 70)
    print("DONE")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(add_column_direct())
