"""
Reset Database Tables
=====================
WARNING: This will drop all tables and recreate them.
All existing data will be lost!
"""

import asyncio
import sys
import os

# Add root directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine
from backend import models

async def reset_database():
    print("⚠️  WARNING: Dropping all tables...")
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.drop_all)
    print("✅ All tables dropped.")
    
    print("🔧 Creating all tables with updated schema...")
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    print("✅ All tables created successfully!")
    print("\n🎉 Database schema is now in sync with models!")

if __name__ == "__main__":
    asyncio.run(reset_database())
