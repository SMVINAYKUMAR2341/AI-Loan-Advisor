"""Database bootstrap helpers for officer reviews and admin officers.

The application stores bank officers in ``admin_users``. Officer review rows
must therefore reference ``admin_users.id`` rather than the customer ``users``
table. These helpers are idempotent and refuse to hide orphaned review data.
"""

import logging
import os
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncSession
from sqlalchemy.future import select

import auth
import models

logger = logging.getLogger(__name__)
OFFICER_REVIEW_FK = "officer_reviews_officer_id_fkey"


async def migrate_officer_review_foreign_key(conn: AsyncConnection) -> None:
    """Point officer_reviews.officer_id at admin_users.id safely.

    Existing rows are remapped only when a legacy users row and an admin_users
    row share the same email. Any remaining orphan is reported and aborts the
    transaction instead of dropping data or disabling referential integrity.
    """
    table_exists = await conn.execute(text("""
        SELECT to_regclass('public.officer_reviews') IS NOT NULL
           AND to_regclass('public.admin_users') IS NOT NULL
    """))
    if not table_exists.scalar():
        return

    constraints = await conn.execute(text("""
        SELECT tc.constraint_name, ccu.table_name AS referenced_table
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
         AND ccu.table_schema = tc.table_schema
        WHERE tc.table_schema = 'public'
          AND tc.table_name = 'officer_reviews'
          AND kcu.column_name = 'officer_id'
          AND tc.constraint_type = 'FOREIGN KEY'
    """))
    constraint_rows = list(constraints.mappings())

    if any(row["referenced_table"] == "admin_users" for row in constraint_rows):
        return

    # Preserve legacy rows when an old users-based officer can be matched to
    # the corresponding admin account. No row is deleted.
    if any(row["referenced_table"] == "users" for row in constraint_rows):
        await conn.execute(text("""
            UPDATE officer_reviews AS review
            SET officer_id = admin.id
            FROM users AS legacy_user
            JOIN admin_users AS admin
              ON lower(admin.email) = lower(legacy_user.email)
            WHERE review.officer_id = legacy_user.id
              AND NOT EXISTS (
                  SELECT 1 FROM admin_users existing_admin
                  WHERE existing_admin.id = review.officer_id
              )
        """))

    orphan_rows = await conn.execute(text("""
        SELECT review.id, review.officer_id
        FROM officer_reviews AS review
        LEFT JOIN admin_users AS admin ON admin.id = review.officer_id
        WHERE admin.id IS NULL
        LIMIT 20
    """))
    orphans = list(orphan_rows.mappings())
    if orphans:
        orphan_ids = ", ".join(str(row["officer_id"]) for row in orphans)
        raise RuntimeError(
            "Cannot migrate officer_reviews.officer_id to admin_users.id; "
            f"unmapped officer IDs remain: {orphan_ids}"
        )

    for row in constraint_rows:
        name = str(row["constraint_name"]).replace('"', '""')
        await conn.execute(text(
            f'ALTER TABLE officer_reviews DROP CONSTRAINT "{name}"'
        ))

    await conn.execute(text(f"""
        ALTER TABLE officer_reviews
        ADD CONSTRAINT {OFFICER_REVIEW_FK}
        FOREIGN KEY (officer_id) REFERENCES admin_users(id)
    """))
    logger.info("Migrated officer_reviews.officer_id to admin_users.id")


async def ensure_admin_user_from_env(db: AsyncSession) -> models.AdminUser | None:
    """Create one configured admin officer exactly once, without hardcoded secrets.

    Seeding is opt-in. All four credential variables must be provided together:
    DEFAULT_ADMIN_ID, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD, and
    DEFAULT_ADMIN_PIN. Existing accounts are never overwritten.
    """
    env_names = (
        "DEFAULT_ADMIN_ID",
        "DEFAULT_ADMIN_EMAIL",
        "DEFAULT_ADMIN_PASSWORD",
        "DEFAULT_ADMIN_PIN",
    )
    values = {name: os.getenv(name) for name in env_names}
    configured = [value is not None for value in values.values()]
    if not any(configured):
        return None
    if not all(configured):
        missing = [name for name, value in values.items() if value is None]
        raise RuntimeError(
            "Incomplete admin seed configuration; missing: " + ", ".join(missing)
        )

    existing = await db.scalar(
        select(models.AdminUser).where(
            (models.AdminUser.admin_id == values["DEFAULT_ADMIN_ID"])
            | (models.AdminUser.email == values["DEFAULT_ADMIN_EMAIL"])
        )
    )
    if existing:
        if not existing.is_active:
            existing.is_active = True
            await db.commit()
        return existing

    admin = models.AdminUser(
        admin_id=values["DEFAULT_ADMIN_ID"],
        email=values["DEFAULT_ADMIN_EMAIL"],
        password_hash=auth.get_password_hash(values["DEFAULT_ADMIN_PASSWORD"]),
        pin_hash=auth.get_password_hash(values["DEFAULT_ADMIN_PIN"]),
        first_name=os.getenv("DEFAULT_ADMIN_FIRST_NAME", "Bank"),
        last_name=os.getenv("DEFAULT_ADMIN_LAST_NAME", "Officer"),
        department=os.getenv("DEFAULT_ADMIN_DEPARTMENT", "Loan Operations"),
        designation=os.getenv("DEFAULT_ADMIN_DESIGNATION", "Bank Officer"),
        is_active=True,
    )
    db.add(admin)
    await db.commit()
    await db.refresh(admin)
    logger.info("Created configured admin officer %s", admin.admin_id)
    return admin
