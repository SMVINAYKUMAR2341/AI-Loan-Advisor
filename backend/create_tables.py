import asyncio
import sys
import os

# Add root directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine
from backend import models

async def create_tables():
    print(f"Connecting to database...")
    print("Creating all tables...")
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    print("Done!")

if __name__ == "__main__":
    asyncio.run(create_tables())
