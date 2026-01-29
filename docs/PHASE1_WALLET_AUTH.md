# 🔐 Phase 1: Wallet Authentication - Implementation Instructions

**What to do:** Follow each step, copy the code, and paste in the specified locations.

---

## Step 1: Install Dependencies

### Frontend - Run in terminal:
```bash
cd frontend
npm install @solana/web3.js @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets bs58
```

### Backend - Run in terminal:
```bash
cd backend
pip install solana pynacl base58
```

---

## Step 2: Create New File - WalletProvider.tsx

### [CREATE NEW FILE] `frontend/src/components/WalletProvider.tsx`

**Copy this entire content:**

```tsx
import { FC, ReactNode, useMemo } from 'react';
import { 
    ConnectionProvider, 
    WalletProvider as SolanaWalletProvider 
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
    PhantomWalletAdapter, 
    SolflareWalletAdapter,
    BackpackWalletAdapter,
    LedgerWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet modal CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
    children: ReactNode;
}

export const WalletProvider: FC<Props> = ({ children }) => {
    const network = 'devnet';
    const endpoint = useMemo(() => clusterApiUrl('devnet'), []);

    const wallets = useMemo(() => [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
        new BackpackWalletAdapter(),
        new LedgerWalletAdapter(),
    ], []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <SolanaWalletProvider wallets={wallets} autoConnect={false}>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </SolanaWalletProvider>
        </ConnectionProvider>
    );
};

export default WalletProvider;
```

---

## Step 3: Create New File - useWalletAuth.ts

### [CREATE NEW FILE] `frontend/src/hooks/useWalletAuth.ts`

**Copy this entire content:**

```typescript
import { useWallet } from '@solana/wallet-adapter-react';
import { useCallback } from 'react';
import bs58 from 'bs58';

const API_BASE = 'http://localhost:8000';

export function useWalletAuth() {
    const { publicKey, signMessage, connected, connecting } = useWallet();

    const signAuthMessage = useCallback(async (customMessage?: string) => {
        if (!publicKey || !signMessage) {
            throw new Error('Wallet not connected');
        }

        const timestamp = Date.now();
        const message = customMessage || `Login to AI Loan Advisor: ${timestamp}`;
        const messageBytes = new TextEncoder().encode(message);
        
        const signature = await signMessage(messageBytes);
        const signatureB58 = bs58.encode(signature);

        return {
            walletAddress: publicKey.toBase58(),
            signature: signatureB58,
            message,
            timestamp
        };
    }, [publicKey, signMessage]);

    const walletLogin = useCallback(async () => {
        const { walletAddress, signature, message } = await signAuthMessage();
        
        const response = await fetch(`${API_BASE}/wallet/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet_address: walletAddress, signature, message })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Wallet login failed');
        }
        
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        return data;
    }, [signAuthMessage]);

    const walletSignup = useCallback(async (userData: {
        mobile_number: string;
        email: string;
        password: string;
        first_name: string;
        last_name: string;
        middle_name?: string;
    }) => {
        const { walletAddress, signature, message } = await signAuthMessage('Sign up to AI Loan Advisor');
        
        const response = await fetch(`${API_BASE}/wallet/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                wallet_address: walletAddress,
                signature,
                message,
                ...userData
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Wallet signup failed');
        }
        
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        return data;
    }, [signAuthMessage]);

    const linkWallet = useCallback(async () => {
        const { walletAddress, signature, message } = await signAuthMessage('Link wallet to account');
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE}/wallet/link`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ wallet_address: walletAddress, signature, message })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to link wallet');
        }
        
        return response.json();
    }, [signAuthMessage]);

    return {
        publicKey,
        connected,
        connecting,
        walletAddress: publicKey?.toBase58() || null,
        signAuthMessage,
        walletLogin,
        walletSignup,
        linkWallet
    };
}
```

---

## Step 4: Modify main.tsx

### [REPLACE] File: `frontend/src/main.tsx`

**Find this (current content):**
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**Replace with:**
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { WalletProvider } from './components/WalletProvider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </React.StrictMode>,
)
```

---

## Step 5: Modify Login.tsx

### [ADD AFTER] File: `frontend/src/pages/Login.tsx` - Line 6 (after imports)

**Find this line:**
```tsx
import { Phone, Lock, ArrowRight, RefreshCw, Shield, User, Mail, KeyRound } from "lucide-react";
```

**Add AFTER it:**
```tsx
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWalletAuth } from '@/hooks/useWalletAuth';
```

---

### [ADD AFTER] File: `frontend/src/pages/Login.tsx` - Line 28 (after existing useState)

**Find this line:**
```tsx
const [isLoading, setIsLoading] = useState(false);
```

**Add AFTER it:**
```tsx
    // Wallet auth
    const { connected, walletAddress, walletLogin } = useWalletAuth();
    const [walletLoginLoading, setWalletLoginLoading] = useState(false);

    const handleWalletLogin = async () => {
        if (!connected) return;
        setWalletLoginLoading(true);
        setError('');
        try {
            const result = await walletLogin();
            if (result.user_type === 'customer') {
                navigate('/dashboard', { replace: true });
            } else {
                navigate('/admin', { replace: true });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wallet login failed');
        } finally {
            setWalletLoginLoading(false);
        }
    };
```

---

### [ADD AFTER] File: `frontend/src/pages/Login.tsx` - Line 133 (after error message div, before form)

**Find this section:**
```tsx
                    {/* Error Message */}
                    {
                        error && (
                            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                                {error}
                            </div>
                        )
                    }
```

**Add AFTER it (before `<form>`):**
```tsx
                    {/* Wallet Login Option */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl border border-purple-500/30">
                        <h3 className="text-white font-medium mb-3 text-center">Quick Login with Wallet</h3>
                        
                        {!connected ? (
                            <div className="flex flex-col items-center gap-3">
                                <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-lg !h-12 !font-semibold !w-full !justify-center" />
                                <p className="text-xs text-gray-500 text-center">
                                    Connect your Solana wallet for one-click login
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-800/50 rounded-lg">
                                    <p className="text-xs text-gray-500">Connected Wallet</p>
                                    <p className="text-white font-mono text-sm truncate">{walletAddress}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleWalletLogin}
                                    disabled={walletLoginLoading}
                                    className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition disabled:opacity-50"
                                >
                                    {walletLoginLoading ? 'Signing in...' : 'Sign in with Wallet'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/20"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-transparent text-gray-500">or login with credentials</span>
                        </div>
                    </div>
```

---

## Step 6: Modify Signup.tsx

### [ADD AFTER] File: `frontend/src/pages/Signup.tsx` - Line 6 (after imports)

**Find this line:**
```tsx
import { Phone, Mail, Lock, RefreshCw, ArrowRight, ArrowLeft, Check, Shield, User, MapPin, FileText, PenTool, Eye, EyeOff, Home, Key } from "lucide-react";
```

**Add AFTER it:**
```tsx
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWalletAuth } from '@/hooks/useWalletAuth';
```

---

### [ADD AFTER] File: `frontend/src/pages/Signup.tsx` - Line 93 (after passkeySetup state)

**Find this line:**
```tsx
const [passkeySetup, setPasskeySetup] = useState<"pending" | "done" | "skipped">("pending");
```

**Add AFTER it:**
```tsx
    // Wallet auth
    const { connected, walletAddress, walletSignup } = useWalletAuth();
```

---

### [ADD AFTER] File: `frontend/src/pages/Signup.tsx` - Step 1 form (after password confirm field, before terms consent)

**Find the Step 1 password section and add this wallet UI after password fields but before checkbox consents.**

**Add this wallet connection section in Step 1:**
```tsx
{/* Solana Wallet Connection */}
<div className="mt-6 p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl border border-purple-500/30">
    <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
            <span className="text-white font-medium">Connect Solana Wallet</span>
            <span className="text-gray-500 text-xs">(Optional)</span>
        </div>
        {connected && (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                Connected ✓
            </span>
        )}
    </div>
    
    {!connected ? (
        <div className="flex justify-center">
            <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-lg !h-12 !font-semibold" />
        </div>
    ) : (
        <div className="p-3 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
            <p className="text-white font-mono text-sm truncate">{walletAddress}</p>
        </div>
    )}
    
    <p className="text-xs text-gray-500 mt-3 text-center">
        Enables: passwordless login, crypto payments, blockchain KYC
    </p>
</div>
```

---

## Step 7: Create Backend wallet_auth.py

### [CREATE NEW FILE] `backend/wallet_auth.py`

**Copy this entire content:**

```python
"""
Solana Wallet Authentication
"""
import base58
import nacl.signing
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from database import get_db
import models
import auth

router = APIRouter(prefix="/wallet", tags=["Wallet Auth"])


class WalletVerifyRequest(BaseModel):
    wallet_address: str
    signature: str
    message: str


class WalletLoginRequest(BaseModel):
    wallet_address: str
    signature: str
    message: str


class WalletSignupRequest(BaseModel):
    wallet_address: str
    signature: str
    message: str
    mobile_number: str
    email: str
    password: str
    first_name: str
    last_name: str
    middle_name: Optional[str] = None


class WalletLinkRequest(BaseModel):
    wallet_address: str
    signature: str
    message: str


def verify_solana_signature(wallet_address: str, signature_b58: str, message: str) -> bool:
    """Verify a Solana wallet signature."""
    try:
        public_key_bytes = base58.b58decode(wallet_address)
        signature_bytes = base58.b58decode(signature_b58)
        message_bytes = message.encode('utf-8')
        verify_key = nacl.signing.VerifyKey(public_key_bytes)
        verify_key.verify(message_bytes, signature_bytes)
        return True
    except Exception as e:
        print(f"Signature verification failed: {e}")
        return False


@router.post("/verify")
async def verify_wallet(request: WalletVerifyRequest):
    """Verify wallet signature."""
    is_valid = verify_solana_signature(request.wallet_address, request.signature, request.message)
    return {"valid": is_valid, "wallet_address": request.wallet_address}


@router.post("/signup")
async def wallet_signup(request: WalletSignupRequest, db: AsyncSession = Depends(get_db)):
    """Sign up with wallet + credentials."""
    if not verify_solana_signature(request.wallet_address, request.signature, request.message):
        raise HTTPException(400, "Invalid wallet signature")
    
    # Check if wallet already registered
    existing_wallet = await db.execute(
        select(models.WalletRegistry).where(models.WalletRegistry.wallet_address == request.wallet_address)
    )
    if existing_wallet.scalars().first():
        raise HTTPException(400, "Wallet already registered")
    
    # Check if email/mobile exists
    existing_user = await db.execute(
        select(models.User).where(
            (models.User.email == request.email) | (models.User.mobile_number == request.mobile_number)
        )
    )
    if existing_user.scalars().first():
        raise HTTPException(400, "Email or mobile number already registered")
    
    # Create user
    import uuid
    customer_id = f"CUS{uuid.uuid4().hex[:8].upper()}"
    
    new_user = models.User(
        customer_id=customer_id,
        mobile_number=request.mobile_number,
        email=request.email,
        hashed_password=auth.get_password_hash(request.password),
        first_name=request.first_name,
        middle_name=request.middle_name,
        last_name=request.last_name,
        role="customer",
        is_active=True
    )
    db.add(new_user)
    await db.flush()
    
    # Create wallet registry
    wallet_entry = models.WalletRegistry(
        wallet_address=request.wallet_address,
        user_id=new_user.id,
        role="customer"
    )
    db.add(wallet_entry)
    await db.commit()
    
    token = auth.create_access_token(
        data={"user_id": str(new_user.id), "customer_id": customer_id, "role": "customer", "wallet": request.wallet_address},
        expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {"status": "success", "customer_id": customer_id, "wallet_linked": True, "access_token": token, "token_type": "bearer"}


@router.post("/login")
async def wallet_login(request: WalletLoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with wallet only."""
    if not verify_solana_signature(request.wallet_address, request.signature, request.message):
        raise HTTPException(401, "Invalid wallet signature")
    
    # Find wallet
    result = await db.execute(
        select(models.WalletRegistry).where(
            models.WalletRegistry.wallet_address == request.wallet_address,
            models.WalletRegistry.is_active == True
        )
    )
    wallet_entry = result.scalars().first()
    
    if not wallet_entry:
        raise HTTPException(401, "Wallet not registered. Please sign up first.")
    
    # Get user
    if wallet_entry.role == "admin" and wallet_entry.admin_id:
        result = await db.execute(select(models.AdminUser).where(models.AdminUser.id == wallet_entry.admin_id))
        user = result.scalars().first()
        is_admin = True
    else:
        result = await db.execute(select(models.User).where(models.User.id == wallet_entry.user_id))
        user = result.scalars().first()
        is_admin = False
    
    if not user:
        raise HTTPException(401, "Account not found")
    
    # Update last used
    wallet_entry.last_used_at = datetime.utcnow()
    await db.commit()
    
    if is_admin:
        token = auth.create_access_token(
            data={"user_id": str(user.id), "admin_id": str(user.id), "user_type": "admin", "role": "admin"},
            expires_delta=timedelta(minutes=auth.ADMIN_TOKEN_EXPIRE_MINUTES)
        )
        return {"status": "success", "user_type": "admin", "access_token": token, "token_type": "bearer"}
    else:
        token = auth.create_access_token(
            data={"user_id": str(user.id), "customer_id": user.customer_id, "role": "customer"},
            expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return {"status": "success", "user_type": "customer", "customer_id": user.customer_id, "access_token": token, "token_type": "bearer"}


@router.post("/link")
async def link_wallet(request: WalletLinkRequest, current_user: models.User = Depends(auth.get_current_user), db: AsyncSession = Depends(get_db)):
    """Link wallet to existing account."""
    if not verify_solana_signature(request.wallet_address, request.signature, request.message):
        raise HTTPException(400, "Invalid wallet signature")
    
    existing = await db.execute(select(models.WalletRegistry).where(models.WalletRegistry.wallet_address == request.wallet_address))
    if existing.scalars().first():
        raise HTTPException(400, "Wallet already linked to another account")
    
    wallet_entry = models.WalletRegistry(wallet_address=request.wallet_address, user_id=current_user.id, role="customer")
    db.add(wallet_entry)
    await db.commit()
    
    return {"status": "success", "wallet_linked": True, "wallet_address": request.wallet_address}


@router.get("/status/{wallet_address}")
async def check_wallet_status(wallet_address: str, db: AsyncSession = Depends(get_db)):
    """Check if wallet is registered."""
    result = await db.execute(select(models.WalletRegistry).where(models.WalletRegistry.wallet_address == wallet_address))
    wallet = result.scalars().first()
    
    if not wallet:
        return {"registered": False, "wallet_address": wallet_address}
    
    return {"registered": True, "wallet_address": wallet_address, "role": wallet.role, "is_active": wallet.is_active}
```

---

## Step 8: Add WalletRegistry Model to models.py

### [ADD AFTER] File: `backend/models.py` - After AdminUser class (around line 102)

**Find the end of AdminUser class and add AFTER it:**

```python
class WalletRegistry(Base):
    """Wallet Registry - Links Solana wallets to user accounts."""
    __tablename__ = "wallet_registry"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    wallet_address = Column(String(44), unique=True, nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("admin_users.id"), nullable=True)
    role = Column(String(20), default="customer")
    linked_at = Column(DateTime(timezone=True), server_default=func.now())
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    
    user = relationship("User", foreign_keys=[user_id])
    admin = relationship("AdminUser", foreign_keys=[admin_id])
```

---

## Step 9: Add Router to main.py

### [ADD AFTER] File: `backend/main.py` - After other imports (around line 20-30)

**Find the import section and add:**

```python
from wallet_auth import router as wallet_router
```

### [ADD AFTER] File: `backend/main.py` - After other app.include_router calls

**Find where other routers are included and add:**

```python
app.include_router(wallet_router)
```

---

## Summary Checklist

```
[ ] Step 1: npm install (frontend) + pip install (backend)
[ ] Step 2: Create frontend/src/components/WalletProvider.tsx
[ ] Step 3: Create frontend/src/hooks/useWalletAuth.ts
[ ] Step 4: Replace frontend/src/main.tsx
[ ] Step 5: Modify frontend/src/pages/Login.tsx (3 additions)
[ ] Step 6: Modify frontend/src/pages/Signup.tsx (2 additions)
[ ] Step 7: Create backend/wallet_auth.py
[ ] Step 8: Add WalletRegistry to backend/models.py
[ ] Step 9: Add wallet_router to backend/main.py
```

---

## Test

1. Start backend: `cd backend && uvicorn main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Install Phantom wallet extension
4. Switch Phantom to Devnet
5. Go to Login page → Click "Select Wallet" → Connect Phantom
6. Click "Sign in with Wallet" → Approve signature
