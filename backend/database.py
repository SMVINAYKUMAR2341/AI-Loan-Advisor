from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL")

# Cloud Run + Cloud SQL configuration
if not DATABASE_URL:
    db_user = os.getenv("DB_USER", "loan_app_user")
    db_password = os.getenv("DB_PASSWORD")
    db_name = os.getenv("DB_NAME", "loan_app_db")
    cloud_sql_connection = os.getenv("CLOUD_SQL_CONNECTION")

    if not db_password:
        raise RuntimeError("DB_PASSWORD is not configured")

    if not cloud_sql_connection:
        raise RuntimeError("CLOUD_SQL_CONNECTION is not configured")

    DATABASE_URL = (
        f"postgresql+asyncpg://{db_user}:{db_password}@/{db_name}"
        f"?host=/cloudsql/{cloud_sql_connection}"
    )

# Fix for asyncpg when using sslmode in DATABASE_URL
if DATABASE_URL and "sslmode=" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("sslmode=require", "ssl=require")

logger.info("Connecting to database...")

# Database engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    connect_args={
        "server_settings": {
            "application_name": "loan_approval_system"
        },
        "command_timeout": 60,
        "timeout": 30,
    }
)

# Async session
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base model
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
