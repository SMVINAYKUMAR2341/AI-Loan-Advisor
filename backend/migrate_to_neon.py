"""
Export local PostgreSQL data to SQL and import to Neon
"""
import asyncio
import os
from sqlalchemy import create_engine, text, MetaData, Table
from sqlalchemy.orm import sessionmaker

# Local database
LOCAL_DB = "postgresql://postgres:Padma%40123@localhost/loan_app_db"

# Neon database  
NEON_DB = "postgresql://neondb_owner:npg_4qNVJct3Bwio@ep-ancient-smoke-a1z5yh5g-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

def export_local_data():
    """Export data from local PostgreSQL"""
    print("Connecting to local database...")
    engine = create_engine(LOCAL_DB)
    
    with engine.connect() as conn:
        # Get all tables
        result = conn.execute(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        """))
        tables = [row[0] for row in result]
        
        print(f"Found tables: {tables}")
        
        all_data = {}
        for table in tables:
            result = conn.execute(text(f"SELECT * FROM {table}"))
            rows = result.fetchall()
            columns = result.keys()
            all_data[table] = {"columns": list(columns), "rows": rows}
            print(f"  {table}: {len(rows)} rows")
        
        return all_data

def import_to_neon(data):
    """Import data to Neon database"""
    print("\nConnecting to Neon database...")
    engine = create_engine(NEON_DB)
    
    with engine.connect() as conn:
        for table, table_data in data.items():
            if not table_data["rows"]:
                print(f"  {table}: No data to import")
                continue
            
            columns = table_data["columns"]
            rows = table_data["rows"]
            
            # Clear existing data
            conn.execute(text(f"DELETE FROM {table}"))
            
            # Insert new data
            for row in rows:
                values = []
                for val in row:
                    if val is None:
                        values.append("NULL")
                    elif isinstance(val, (int, float)):
                        values.append(str(val))
                    elif isinstance(val, bool):
                        values.append("TRUE" if val else "FALSE")
                    else:
                        # Quote everything else (strings, UUIDs, datetimes)
                        escaped = str(val).replace("'", "''")
                        values.append(f"'{escaped}'")
                
                sql = f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({', '.join(values)})"
                try:
                    conn.execute(text(sql))
                except Exception as e:
                    print(f"    Error inserting into {table}: {e}")
            
            conn.commit()
            print(f"  {table}: Imported {len(rows)} rows")

if __name__ == "__main__":
    print("=== Local to Neon Data Migration ===\n")
    
    # Step 1: Export from local
    data = export_local_data()
    
    # Step 2: Import to Neon
    proceed = input("\nImport this data to Neon? (yes/no): ")
    if proceed.lower() == "yes":
        import_to_neon(data)
        print("\n✅ Migration complete!")
    else:
        print("Migration cancelled.")
