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

def _get_int_env(name: str, default: int, min_value: int = 1) -> int:
    raw_value = os.getenv(name, str(default))
    try:
        return max(min_value, int(raw_value))
    except ValueError:
        logger.warning("Invalid %s=%s. Falling back to %s", name, raw_value, default)
        return default

db_pool_size = _get_int_env("DB_POOL_SIZE", 40)
db_max_overflow = _get_int_env("DB_MAX_OVERFLOW", 80, min_value=0)
db_pool_timeout = _get_int_env("DB_POOL_TIMEOUT", 30)
db_pool_recycle = _get_int_env("DB_POOL_RECYCLE", 1800)
db_command_timeout = _get_int_env("DB_COMMAND_TIMEOUT", 60)
db_connect_timeout = _get_int_env("DB_CONNECT_TIMEOUT", 30)
db_use_pgbouncer = os.getenv("DB_USE_PGBOUNCER", "false").lower() == "true"

connect_args = {
    "server_settings": {
        "application_name": "loan_approval_system"
    },
    "command_timeout": db_command_timeout,
    "timeout": db_connect_timeout,
}

# Required for PgBouncer transaction pooling with asyncpg.
if db_use_pgbouncer:
    connect_args["statement_cache_size"] = 0

logger.info("Connecting to database...")

# Database engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_use_lifo=True,
    pool_recycle=db_pool_recycle,
    pool_size=db_pool_size,
    max_overflow=db_max_overflow,
    pool_timeout=db_pool_timeout,
    connect_args=connect_args,
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
