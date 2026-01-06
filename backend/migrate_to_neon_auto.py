"""
Export local PostgreSQL data to SQL and import to Neon (Non-interactive)
"""
import os
from sqlalchemy import create_engine, text

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
        
        # Define the correct order of insertion to handle foreign keys
        preferred_order = [
            'users', 
            'loan_applications', 
            'loan_predictions',  # Depends on loan_applications
            'officer_reviews',   # Depends on loan_applications and users
            'kyc_documents',     # Depends on loan_applications and users
            'repayments',        # Depends on loan_applications
            'audit_logs',         # Depends on users
            'user_sessions',     # Depends on users
            'bank_account_details', # Depends on loan_applications and users
            'loan_agreements',   # Depends on loan_applications and users
            'kyc_status_tracking' # Depends on loan_applications and users
        ]
        
        # Filter and sort tables
        sorted_tables = [t for t in preferred_order if t in tables]
        # Add any tables that might have been missed
        for t in tables:
            if t not in sorted_tables and t != 'spatial_ref_sys':
                sorted_tables.append(t)
        
        print(f"Sorted tables for migration: {sorted_tables}")
        
        all_data = {}
        for table in sorted_tables:
            result = conn.execute(text(f'SELECT * FROM "{table}"'))
            rows = result.fetchall()
            columns = result.keys()
            all_data[table] = {"columns": list(columns), "rows": rows}
            print(f"  {table}: {len(rows)} rows")
        
        return sorted_tables, all_data

def import_to_neon(sorted_tables, data):
    """Import data to Neon database"""
    print("\nConnecting to Neon database...")
    engine = create_engine(NEON_DB)
    
    with engine.connect() as conn:
        # Step 1: Delete all in reverse order to handle FKs
        print("\nCleaning up Neon database (reverse order)...")
        for table in reversed(sorted_tables):
            try:
                conn.execute(text(f'DELETE FROM "{table}"'))
                print(f"  {table}: Cleared")
            except Exception as e:
                print(f"    Warning: Could not clear {table}: {e}")
        conn.commit()

        # Step 2: Insert in forward order
        print("\nImporting data to Neon (forward order)...")
        for table in sorted_tables:
            table_data = data.get(table)
            if not table_data or not table_data["rows"]:
                print(f"  {table}: No data to import")
                continue
            
            columns = table_data["columns"]
            rows = table_data["rows"]
            
            print(f"  {table}: Inserting {len(rows)} rows...")
            
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
                
                col_names = [f'"{col}"' for col in columns]
                sql = f'INSERT INTO "{table}" ({", ".join(col_names)}) VALUES ({", ".join(values)})'
                try:
                    conn.execute(text(sql))
                except Exception as e:
                    print(f"    Error inserting into {table}: {e}")
            
            conn.commit()
            print(f"  {table}: Imported successfully")

if __name__ == "__main__":
    print("=== Local to Neon Data Migration (Auto) ===\n")
    try:
        sorted_tables, data = export_local_data()
        import_to_neon(sorted_tables, data)
        print("\n✅ Migration complete!")
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
