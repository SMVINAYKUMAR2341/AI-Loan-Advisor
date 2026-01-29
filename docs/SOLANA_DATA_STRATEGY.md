# 🗄️ Solana Data Strategy: Audit Logs, Tickets & Storage

**Goal:** Secure critical data using Solana's immutability without exposing PII (Personally Identifiable Information).

---

## 🏗️ Hybrid Storage Architecture

We use a **3-Layer Storage Model** to balance security, privacy, and cost.

| Layer | Technology | Usage | Examples |
|-------|------------|-------|----------|
| **1. Private** | **PostgreSQL** (Existing) | PII, fast queries, chat logs, raw data | User Profile, Chat Messages, Full Loan Form |
| **2. Verifiable** | **IPFS / Arweave** | Large immutable files, public documents | Property Deeds, Valuation Reports, Signed Agreements |
| **3. Immutable** | **Solana Blockchain** | Proof of existence, state, value transfer | Audit Hashes, Loan State (Approved/Paid), Collateral Escrow |

---

## 1. 🛡️ Audit Logs (Enhanced)

**Current Status:** Exists in Postgres (`AuditLog` model).  
**New Feature:** **"On-Chain Anchoring"**

We will not write *every* log to Solana (too expensive/slow). Instead, we use **Merkle Hashing** or **Critical Event Anchoring**.

### Implementation Plan

1.  **Add `tx_signature` column** to `audit_logs` table.
2.  **Critical Events** (Disbursement, Loan Approval, Security Breach) are written to Solana *immediately*.
    -   Action: Admin approves loan.
    -   System: Writes to Postgres AND sends "Memo" transaction to Solana with `SHA256(log_id + timestamp + user_id)`.
    -   Result: Permanent proof that approval happened at that exact time.
3.  **Standard Events** are batched daily (optional Ph.2).

### Schema Update (Backend)
```python
# In models.py > AuditLog
solana_tx_signature = Column(String(88), nullable=True) # Checksum/Proof on-chain
is_anchored = Column(Boolean, default=False)
```

---

## 2. 🎫 Support Tickets (Wallet-Linked)

**Current Status:** Exists in Postgres (`SupportTicket` model).  
**New Feature:** **"Verified Identity Support"**

1.  **Wallet Linking**: Tickets are linked to the user's Solana Wallet Address.
2.  **Phishing Prevention**: When support responds, they sign the message with the **Admin Wallet**.
    -   Frontend verifies the signature.
    -   User sees a "✅ Verified Admin" badge next to the reply.
    -   Prevents fake support agents.

### Schema Update (Backend)
```python
# In models.py > TicketMessage
sender_wallet = Column(String(44), nullable=True) # Address of sender
signature = Column(String(88), nullable=True) # Cryptographic proof of message
```

---

## 3. 📝 Loan Application Storage (The "Golden Record")

**Current Status:** Exists in Postgres (`LoanApplication` model).  
**New Feature:** **"State Mirroring"**

The "Real" state of the loan moves to the blockchain for transparency, while Postgres mirrors it for the UI.

### Integration Flow:

1.  **Submission (Postgres):** User submits form. Data is saved to Postgres. Status: `APPLIED`.
2.  **Hashing (IPFS):** System generates a PDF snapshot of the application, hashes it, uploads to IPFS.
3.  **Anchoring (Solana):**
    -   **Smart Contract**: `LoanRegistry`
    -   **Action**: `create_loan(loan_id, user_wallet, principal, ipfs_hash)`
    -   **Result**: The loan is now "Live" on-chain.
4.  **Updates:** When status changes (e.g., `Repayment Made`), the Smart Contract is updated first. Postgres listens and updates local DB.

### Schema Update (Backend)
```python
# In models.py > LoanApplication
on_chain_id = Column(String(88), nullable=True) # PDA (Program Derived Address)
ipfs_hash = Column(String(100), nullable=True) # CID of application snapshot
smart_contract_state = Column(String(20), nullable=True) # Active, Defaulted, Closed
```

---

## ✅ Summary of Changes Required

| Feature | Postgres Change | Solana Action |
|---------|-----------------|---------------|
| **Audit Logs** | Add `tx_signature` | Send "Memo" transaction for critical logs |
| **Tickets** | Add `signature`, `wallet` | Admin signs replies with private key |
| **Loan App** | Add `on_chain_id`, `state` | Create Loan Account on-chain |

This strategy ensures you are **RBI Compliant** (Data Localization in Postgres) while being **DeFi Ready** (Immutable Proofs on Solana).
