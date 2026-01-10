import sys
import os
import asyncio

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import engine
from sqlalchemy import inspect

async def list_tables():
    try:
        async with engine.connect() as conn:
            def get_names(sync_conn):
                inspector = inspect(sync_conn)
                return inspector.get_table_names()
                
            tables = await conn.run_sync(get_names)
            print("\n--- Database Tables ---")
            for t in tables:
                print(f"- {t}")
            
            required = ['support_tickets', 'ticket_messages']
            missing = [t for t in required if t not in tables]
            
            print("\n--- Verification ---")
            if not missing:
                print("✅ All Ticket System tables are present.")
            else:
                print(f"❌ Missing tables: {missing}")
    except Exception as e:
        print(f"Error checking tables: {e}")

if __name__ == "__main__":
    asyncio.run(list_tables())
