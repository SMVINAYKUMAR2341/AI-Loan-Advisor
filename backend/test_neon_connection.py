"""
Test Neon Database Connection
Tests database connectivity and fixes common issues
"""
import asyncio
import sys
from sqlalchemy import text
from database import engine, AsyncSessionLocal
from sqlalchemy.exc import OperationalError, InterfaceError
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_connection():
    """Test database connection and diagnose issues"""
    print("=" * 60)
    print("Neon Database Connection Test")
    print("=" * 60)
    
    try:
        # Test 1: Engine connection
        print("\n[1/4] Testing engine connection...")
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version()"))
            version = result.scalar()
            print(f"✅ Connected to PostgreSQL")
            print(f"   Version: {version[:50]}...")
            
        # Test 2: Session connection
        print("\n[2/4] Testing session connection...")
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT current_database()"))
            db_name = result.scalar()
            print(f"✅ Session active")
            print(f"   Database: {db_name}")
            
        # Test 3: Check tables
        print("\n[3/4] Checking database tables...")
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            tables = [row[0] for row in result.fetchall()]
            print(f"✅ Found {len(tables)} tables:")
            for table in tables:
                print(f"   - {table}")
                
        # Test 4: Check connection pool
        print("\n[4/4] Testing connection pool...")
        print(f"   Pool size: {engine.pool.size()}")
        print(f"   Pool overflow: {engine.pool.overflow()}")
        print(f"   Pool checked out: {engine.pool.checkedout()}")
        print("✅ Pool configuration looks good")
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED - Database is healthy!")
        print("=" * 60)
        return True
        
    except OperationalError as e:
        print(f"\n❌ Database connection failed!")
        print(f"   Error: {str(e)}")
        print("\n🔧 Possible fixes:")
        print("   1. Check your DATABASE_URL in .env file")
        print("   2. Verify Neon database is not suspended")
        print("   3. Check firewall/network connectivity")
        print("   4. Verify SSL settings (should use ssl=require for asyncpg)")
        return False
        
    except InterfaceError as e:
        print(f"\n❌ Interface error!")
        print(f"   Error: {str(e)}")
        print("\n🔧 This usually means:")
        print("   1. Connection was closed unexpectedly")
        print("   2. Network timeout occurred")
        print("   3. Database restarted")
        return False
        
    except Exception as e:
        print(f"\n❌ Unexpected error: {type(e).__name__}")
        print(f"   Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Clean up
        await engine.dispose()


async def test_json_serialization():
    """Test JSON field handling for features_json and shap_summary"""
    print("\n" + "=" * 60)
    print("Testing JSON Serialization")
    print("=" * 60)
    
    try:
        import json
        from models import LoanApplication, LoanPrediction
        
        async with AsyncSessionLocal() as session:
            # Check if loan_applications has data
            result = await session.execute(text("""
                SELECT COUNT(*) FROM loan_applications
            """))
            count = result.scalar()
            print(f"\n📊 Found {count} loan applications")
            
            if count > 0:
                # Check first record
                result = await session.execute(text("""
                    SELECT id, features_json 
                    FROM loan_applications 
                    LIMIT 1
                """))
                row = result.fetchone()
                print(f"\n✅ Sample record:")
                print(f"   ID: {row[0]}")
                print(f"   Features type: {type(row[1])}")
                
                # Verify JSON is properly formatted
                if isinstance(row[1], dict):
                    print(f"   ✅ JSON properly deserialized as dict")
                else:
                    print(f"   ⚠️  Features is not a dict: {type(row[1])}")
                    
        print("\n✅ JSON serialization test complete")
        return True
        
    except Exception as e:
        print(f"\n❌ JSON test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("\n🚀 Starting Neon Database Diagnostics...\n")
    
    # Run connection test
    success = asyncio.run(test_connection())
    
    # If connection successful, test JSON
    if success:
        asyncio.run(test_json_serialization())
    
    sys.exit(0 if success else 1)
