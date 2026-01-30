"""
Test script to verify tracking_id issue is resolved
"""
import asyncio
import sys
from backend.database import get_db
from backend import models
from sqlalchemy import select, inspect

async def test_model():
    """Test that LoanApplication model doesn't have tracking_id"""
    print("Testing LoanApplication model...")
    
    # Get all column names from the model
    mapper = inspect(models.LoanApplication)
    columns = [column.key for column in mapper.columns]
    
    print(f"LoanApplication columns: {columns}")
    
    if 'tracking_id' in columns:
        print("❌ FAILED: tracking_id still exists in model!")
        return False
    else:
        print("✅ PASSED: tracking_id successfully removed from model")
        return True

async def test_query():
    """Test that we can query LoanApplication without tracking_id"""
    print("\nTesting database query...")
    
    try:
        async for db in get_db():
            # Try to query first application
            query = select(models.LoanApplication).limit(1)
            result = await db.execute(query)
            app = result.scalars().first()
            
            if app:
                print(f"✅ PASSED: Successfully queried application {app.id}")
                print(f"   Generated tracking_id: {str(app.id)[:8].upper()}")
            else:
                print("⚠️ No applications found in database")
            
            return True
    except Exception as e:
        print(f"❌ FAILED: Query error: {e}")
        return False

async def main():
    """Run all tests"""
    print("=" * 60)
    print("TRACKING_ID FIX VERIFICATION")
    print("=" * 60)
    
    test1 = await test_model()
    test2 = await test_query()
    
    print("\n" + "=" * 60)
    if test1 and test2:
        print("✅ ALL TESTS PASSED - Fix is working!")
    else:
        print("❌ SOME TESTS FAILED - Fix incomplete")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
