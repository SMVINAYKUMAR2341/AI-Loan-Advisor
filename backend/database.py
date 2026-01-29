from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Database URL from environment variable
# Fallback to Neon DB for deployment support
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_4qNVJct3Bwio@ep-ancient-smoke-a1z5yh5g-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Fix for asyncpg: convert sslmode to ssl parameter
if DATABASE_URL and "sslmode=" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("sslmode=require", "ssl=require")

logger.info(f"Connecting to database (pool connection)...")

# Optimized pool configuration for Neon DB
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=300,     # Recycle connections after 5 minutes
    pool_size=10,         # Increased from 5 for better concurrency
    max_overflow=20,      # Increased overflow capacity
    pool_timeout=30,      # Connection timeout
    connect_args={
        "server_settings": {"application_name": "loan_approval_system"},
        "command_timeout": 60,
        "timeout": 30,
    }
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session error: {str(e)}")
            await session.rollback()
            raise
        finally:
            await session.close()
