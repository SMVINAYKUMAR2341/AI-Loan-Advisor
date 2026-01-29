# Neon Database Connection Issues - Troubleshooting Guide

## Problem Identified

**Error:** `NeonDbError: Failed to fetch` and `[Errno 11001] getaddrinfo failed`

**Root Cause:** DNS resolution failure - the system cannot reach the Neon database server.

## Possible Causes

### 1. **Network Connectivity Issues**
- No internet connection
- Firewall blocking database ports (5432)
- VPN/Proxy interfering with connections
- Corporate network restrictions

### 2. **Neon Database Status**
- **Free tier databases auto-suspend after inactivity**
- Database might be paused or deleted
- Neon service outage (rare)

### 3. **DNS Resolution Problems**
- DNS server issues
- Hostname cannot be resolved
- Network configuration problems

## Solutions

### Immediate Fixes

#### 1. Check Internet Connection
```powershell
# Test basic connectivity
ping 8.8.8.8

# Test DNS resolution
nslookup ep-ancient-smoke-a1z5yh5g-pooler.ap-southeast-1.aws.neon.tech
```

#### 2. Wake Up Neon Database
1. Go to https://console.neon.tech
2. Login to your account
3. Check if your database is **Active** or **Suspended**
4. If suspended, click to **Activate** it
5. Wait 30-60 seconds for it to wake up

#### 3. Test Database Connection
```powershell
cd backend
python test_neon_connection.py
```

#### 4. Check Firewall
```powershell
# Windows Firewall - ensure outbound connections allowed on port 5432
netsh advfirewall show allprofiles
```

### Long-term Solutions

#### Option 1: Use Local PostgreSQL (Recommended for Development)
```powershell
# Install PostgreSQL locally
# Then update .env:
# DATABASE_URL=postgresql+asyncpg://postgres:password@localhost/loan_db
```

#### Option 2: Keep Neon Database Active
- Upgrade to paid tier (no auto-suspend)
- Or set up a cron job to ping the database every 4 hours

#### Option 3: Use Railway/Supabase as Alternative
- Railway: https://railway.app
- Supabase: https://supabase.com
- Both offer free PostgreSQL with better uptime

## Backend Improvements Made

### 1. Enhanced Database Configuration (`database.py`)
- ✅ Increased pool size for better concurrency
- ✅ Added connection timeout settings
- ✅ Improved error handling and logging
- ✅ Better pool recycling

### 2. Health Check Endpoint (`/health`)
- ✅ Now tests actual database connectivity
- ✅ Returns database status in response
- ✅ Helps diagnose connection issues

### 3. Connection Test Script (`test_neon_connection.py`)
- ✅ Comprehensive database diagnostics
- ✅ Tests engine, session, and pool
- ✅ Lists all tables
- ✅ Verifies JSON serialization

## Running the Backend

### Start Backend Server
```powershell
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Check Health Endpoint
```powershell
# In browser or curl:
curl http://localhost:8000/health
```

Expected response when healthy:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-01-27T..."
}
```

## Preventing Future Issues

1. **Monitor Database Status**
   - Set up uptime monitoring (e.g., UptimeRobot)
   - Get alerts when database goes down

2. **Use Connection Pooling Wisely**
   - Pool settings already optimized
   - Don't create too many concurrent connections

3. **Handle Errors Gracefully**
   - Backend now has better error recovery
   - Frontend should retry failed requests

4. **Consider Migration Strategy**
   - For production, use reliable database hosting
   - Neon free tier is good for development only

## Testing Connection Now

Run this command to diagnose:
```powershell
cd backend
python test_neon_connection.py
```

If you see "getaddrinfo failed":
1. Check your internet connection
2. Visit Neon console and wake up the database
3. Wait 60 seconds and try again

## Need More Help?

1. Check Neon status: https://status.neon.tech
2. Review Neon logs in console
3. Try connecting from different network
4. Contact Neon support if persistent issues
