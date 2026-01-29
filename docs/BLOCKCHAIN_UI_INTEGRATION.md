# 🖥️ Dashboard Blockchain Integration Plan

Complete implementation guide for **Customer** and **Admin** dashboards.

---

## 📦 Shared Components (Both Dashboards)

### 1. WalletConnectButton.tsx
```tsx
// frontend/src/components/blockchain/WalletConnectButton.tsx
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';

export function WalletConnectButton() {
    const { connected, publicKey } = useWallet();
    
    return (
        <div className="flex items-center gap-2">
            {connected ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-400 text-sm font-mono">
                        {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
                    </span>
                </div>
            ) : (
                <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-lg !h-10 !text-sm" />
            )}
        </div>
    );
}
```

### 2. SolscanLink.tsx
```tsx
// frontend/src/components/blockchain/SolscanLink.tsx
interface Props {
    txSignature?: string;
    address?: string;
    label?: string;
}

export function SolscanLink({ txSignature, address, label }: Props) {
    const network = 'testnet'; // Change to 'mainnet' for production
    const baseUrl = `https://solscan.io`;
    
    const url = txSignature 
        ? `${baseUrl}/tx/${txSignature}?cluster=${network}`
        : `${baseUrl}/account/${address}?cluster=${network}`;
    
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" 
           className="text-purple-400 hover:text-purple-300 text-xs flex items-center gap-1">
            {label || 'View on Solana'} ↗
        </a>
    );
}
```

### 3. NetworkBadge.tsx
```tsx
// frontend/src/components/blockchain/NetworkBadge.tsx
export function NetworkBadge() {
    const network = 'Testnet'; // Read from env
    return (
        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
            ⛓️ {network}
        </span>
    );
}
```

---

## 👤 Customer Dashboard Components

### 4. ActiveLoanBlockchain.tsx (Enhance existing card)
```tsx
// Add to Active Loan Card
<div className="mt-4 pt-4 border-t border-white/10">
    <div className="flex items-center justify-between">
        <SolscanLink txSignature={loan.onChainTx} label="View on Solana" />
        <button 
            onClick={() => handlePayWithUSDC(loan.nextEmi)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm flex items-center gap-2"
        >
            <span>💜</span> Pay ₹{loan.nextEmi.toLocaleString()} with USDC
        </button>
    </div>
</div>
```

### 5. CreditScoreSBT.tsx
```tsx
// frontend/src/components/blockchain/CreditScoreSBT.tsx
interface Props {
    score: number;
    hasSBT: boolean;
    onMint: () => void;
}

export function CreditScoreSBT({ score, hasSBT, onMint }: Props) {
    return (
        <div className="mt-3">
            {hasSBT ? (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                    <span>🪙</span>
                    <span>On-Chain Verified ✓</span>
                    <SolscanLink address="YOUR_SBT_MINT" />
                </div>
            ) : (
                <button onClick={onMint} 
                    className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded text-xs hover:bg-purple-600/30">
                    Mint Credit Score as SBT
                </button>
            )}
        </div>
    );
}
```

### 6. CustomerCollateralPanel.tsx
```tsx
// frontend/src/components/blockchain/CustomerCollateralPanel.tsx
interface Collateral {
    type: string;
    amount: string;
    valueINR: number;
    icon: string;
}

export function CustomerCollateralPanel({ collaterals }: { collaterals: Collateral[] }) {
    const total = collaterals.reduce((sum, c) => sum + c.valueINR, 0);
    const loanAmount = 500000; // Get from context
    const ltv = ((loanAmount / total) * 100).toFixed(1);
    
    return (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                🔒 My Collateral
            </h3>
            <div className="space-y-2">
                {collaterals.map((c, i) => (
                    <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-400">{c.icon} {c.amount} {c.type}</span>
                        <span className="text-white">₹{c.valueINR.toLocaleString()}</span>
                    </div>
                ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 flex justify-between">
                <span className="text-gray-400">Total</span>
                <span className="text-white font-semibold">₹{total.toLocaleString()}</span>
            </div>
            <div className="mt-2 flex justify-between">
                <span className="text-gray-400">LTV Ratio</span>
                <span className={`font-semibold ${Number(ltv) < 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {ltv}% {Number(ltv) < 70 ? '✅' : '⚠️'}
                </span>
            </div>
        </div>
    );
}
```

### 7. PayWithUSDCModal.tsx
```tsx
// frontend/src/components/blockchain/PayWithUSDCModal.tsx
import { useWallet } from '@solana/wallet-adapter-react';

interface Props {
    amount: number;
    loanId: string;
    onClose: () => void;
    onSuccess: (txSig: string) => void;
}

export function PayWithUSDCModal({ amount, loanId, onClose, onSuccess }: Props) {
    const { publicKey, signTransaction } = useWallet();
    const [loading, setLoading] = useState(false);
    
    const handlePay = async () => {
        if (!publicKey) return;
        setLoading(true);
        try {
            // Call backend to create transaction
            const res = await fetch('/api/payments/usdc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ loanId, amount, payerWallet: publicKey.toBase58() })
            });
            const { transaction } = await res.json();
            
            // Sign and send
            const signed = await signTransaction(transaction);
            const txSig = await connection.sendRawTransaction(signed.serialize());
            
            onSuccess(txSig);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl p-6 w-96 border border-purple-500/30">
                <h3 className="text-white text-lg font-semibold mb-4">Pay with USDC</h3>
                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                    <p className="text-gray-400 text-sm">Amount</p>
                    <p className="text-white text-2xl font-bold">{amount} USDC</p>
                    <p className="text-gray-500 text-xs">≈ ₹{(amount * 84).toLocaleString()}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 bg-gray-700 rounded-lg text-white">
                        Cancel
                    </button>
                    <button onClick={handlePay} disabled={loading}
                        className="flex-1 py-2 bg-purple-600 rounded-lg text-white disabled:opacity-50">
                        {loading ? 'Processing...' : 'Confirm Payment'}
                    </button>
                </div>
            </div>
        </div>
    );
}
```

---

## 🏦 Admin Dashboard Components

### 8. TreasuryWalletCard.tsx
```tsx
// loan-admin-hub-main/src/components/blockchain/TreasuryWalletCard.tsx
interface Props {
    solBalance: number;
    usdcBalance: number;
    pendingDisbursements: number;
    walletAddress: string;
}

export function TreasuryWalletCard({ solBalance, usdcBalance, pendingDisbursements, walletAddress }: Props) {
    return (
        <div className="bg-gray-800/50 rounded-xl p-5 border border-purple-500/30">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                🏦 Treasury Wallet
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p className="text-gray-400 text-xs">SOL Balance</p>
                    <p className="text-white text-xl font-bold">{solBalance} SOL</p>
                    <p className="text-gray-500 text-xs">≈ ₹{(solBalance * 18000).toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-gray-400 text-xs">USDC Balance</p>
                    <p className="text-white text-xl font-bold">{usdcBalance.toLocaleString()}</p>
                    <p className="text-gray-500 text-xs">≈ ₹{(usdcBalance * 84).toLocaleString()}</p>
                </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-yellow-400 text-sm">⏳ {pendingDisbursements} Pending</span>
                <SolscanLink address={walletAddress} label="View Treasury" />
            </div>
        </div>
    );
}
```

### 9. CollateralOverviewCard.tsx
```tsx
// loan-admin-hub-main/src/components/blockchain/CollateralOverviewCard.tsx
interface Props {
    totalValue: number;
    cryptoValue: number;
    propertyValue: number;
    atRiskCount: number;
}

export function CollateralOverviewCard({ totalValue, cryptoValue, propertyValue, atRiskCount }: Props) {
    const cryptoPercent = ((cryptoValue / totalValue) * 100).toFixed(0);
    
    return (
        <div className="bg-gray-800/50 rounded-xl p-5 border border-white/10">
            <h3 className="text-white font-semibold mb-4">🔒 Locked Collateral</h3>
            <p className="text-3xl font-bold text-white mb-4">₹{totalValue.toLocaleString()}</p>
            <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-400">💜 Crypto</span>
                    <span className="text-white">₹{cryptoValue.toLocaleString()} ({cryptoPercent}%)</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-400">🏠 Property NFTs</span>
                    <span className="text-white">₹{propertyValue.toLocaleString()}</span>
                </div>
            </div>
            {atRiskCount > 0 && (
                <div className="p-2 bg-red-500/20 rounded text-red-400 text-sm">
                    ⚠️ {atRiskCount} loan(s) with LTV {">"} 80%
                </div>
            )}
        </div>
    );
}
```

### 10. DisburseWithUSDC.tsx (Add to Disbursement page)
```tsx
// Add to LoanDisbursement.tsx
<div className="mt-4 p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
    <h4 className="text-white font-medium mb-3">💜 Disburse with Crypto</h4>
    <div className="grid grid-cols-2 gap-3">
        <button onClick={() => handleDisburse('USDC')}
            className="py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white">
            Send USDC
        </button>
        <button onClick={() => handleDisburse('SOL')}
            className="py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 rounded-lg text-white">
            Send SOL
        </button>
    </div>
    <p className="text-gray-500 text-xs mt-2">Requires Treasury multisig approval for amounts {">"} ₹10L</p>
</div>
```

### 11. OnChainTransactions.tsx
```tsx
// Shared component for both dashboards
interface Transaction {
    hash: string;
    type: 'Disbursement' | 'EMI Payment' | 'Collateral';
    amount: string;
    timestamp: string;
}

export function OnChainTransactions({ transactions }: { transactions: Transaction[] }) {
    return (
        <div className="bg-gray-800/50 rounded-xl p-5 border border-white/10">
            <h3 className="text-white font-semibold mb-4">⛓️ Blockchain Transactions</h3>
            <div className="space-y-3">
                {transactions.map((tx, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                            <span className="text-gray-500">{tx.timestamp}</span>
                            <span className="text-white">{tx.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-400">{tx.amount}</span>
                            <SolscanLink txSignature={tx.hash} label="↗" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

---

## 📁 File Structure

```
frontend/src/components/blockchain/
├── WalletConnectButton.tsx
├── SolscanLink.tsx
├── NetworkBadge.tsx
├── CreditScoreSBT.tsx
├── CustomerCollateralPanel.tsx
├── PayWithUSDCModal.tsx
└── OnChainTransactions.tsx

loan-admin-hub-main/src/components/blockchain/
├── WalletConnectButton.tsx (copy from frontend)
├── SolscanLink.tsx (copy from frontend)
├── TreasuryWalletCard.tsx
├── CollateralOverviewCard.tsx
└── OnChainTransactions.tsx (copy from frontend)
```

---

## ✅ Implementation Order

1. Create `blockchain/` folder in both projects
2. Add shared components (WalletConnectButton, SolscanLink)
3. Add WalletConnectButton to both headers
4. Customer: Add PayWithUSDC to Active Loan card
5. Customer: Add CollateralPanel to sidebar/dashboard
6. Admin: Add TreasuryWalletCard to dashboard
7. Admin: Add DisburseWithUSDC to disbursement page
8. Both: Add OnChainTransactions panel
