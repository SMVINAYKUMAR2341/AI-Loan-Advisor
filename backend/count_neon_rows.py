import asyncio
from sqlalchemy import text
from backend.database import AsyncSessionLocal

async def count_rows():
    print("Connecting to database (Neon)...")
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        )
        tables = [row[0] for row in result.fetchall()]
        
        print("\nRow Counts:")
        for table in tables:
            try:
                res = await session.execute(text(f'SELECT count(*) FROM "{table}"'))
                count = res.scalar()
                print(f"  {table}: {count}")
            except Exception as e:
                print(f"  {table}: Error: {e}")

if __name__ == "__main__":
    asyncio.run(count_rows())
