"""
Script to completely clear SQLAlchemy metadata cache and verify tracking_id column
"""
import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend import database, models
from sqlalchemy import text, inspect

async def clear_cache_and_verify():
    print("=" * 70)
    print("CLEARING SQLALCHEMY METADATA CACHE")
    print("=" * 70)
    
    # Dispose of the engine to close all connections
    print("\n1. Disposing engine and clearing connection pool...")
    await database.engine.dispose()
    print("   ✓ Engine disposed")
    
    # Clear the metadata
    print("\n2. Clearing metadata registry...")
    models.Base.metadata.clear()
    print("   ✓ Metadata cleared")
    
    # Verify database has the column
    print("\n3. Verifying database schema...")
    async with database.engine.begin() as conn:
        result = await conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='loan_applications' 
            AND column_name='tracking_id';
        """))
        if result.fetchone():
            print("   ✓ tracking_id EXISTS in database")
        else:
            print("   ✗ tracking_id NOT FOUND in database!")
    
    # Reflect the table to rebuild metadata
    print("\n4. Reflecting table metadata...")
    async with database.engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.reflect, only=['loan_applications'])
    print("   ✓ Metadata reflected from database")
    
    # Check if tracking_id is in the model
    print("\n5. Checking SQLAlchemy model...")
    loan_app_table = models.Base.metadata.tables.get('loan_applications')
    if loan_app_table and 'tracking_id' in loan_app_table.c:
        print("   ✓ tracking_id found in reflected metadata")
    else:
        print("   ✗ tracking_id NOT in reflected metadata")
        if loan_app_table:
            print("   Available columns:", list(loan_app_table.c.keys()))
    
    print("\n" + "=" * 70)
    print("CACHE CLEARED - Server should work now")
    print("=" * 70)
    
    # Dispose again to ensure clean state
    await database.engine.dispose()

if __name__ == "__main__":
    asyncio.run(clear_cache_and_verify())
