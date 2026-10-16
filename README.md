## 🏗️ System Architecture

```mermaid
flowchart LR

    %% =========================
    %% USERS
    %% =========================

    U[👤 Customer]
    A[👨‍💼 Bank Admin]

    %% =========================
    %% FRONTEND
    %% =========================

    FE["React + Vite<br/>Frontend"]

    %% =========================
    %% BACKEND
    %% =========================

    API["FastAPI<br/>REST API"]

    AUTH["JWT Authentication<br/>RBAC"]

    LOAN["Loan Application<br/>Service"]

    KYC["KYC & Document<br/>Verification"]

    ADMIN["Admin Management<br/>Service"]

    REPORT["PDF + QR<br/>Report Generator"]

    %% =========================
    %% MACHINE LEARNING
    %% =========================

    PRE["Data<br/>Preprocessing"]

    ML["Loan Eligibility<br/>ML Model"]

    PRED["Loan Prediction"]

    SHAP["SHAP<br/>Explainability"]

    %% =========================
    %% DATABASE
    %% =========================

    DB[("PostgreSQL<br/>Database")]

    %% =========================
    %% STORAGE
    %% =========================

    STORAGE[("Document<br/>Storage")]

    %% =========================
    %% USER FLOW
    %% =========================

    U --> FE
    A --> FE

    FE --> API

    %% =========================
    %% API SERVICES
    %% =========================

    API --> AUTH
    API --> LOAN
    API --> KYC
    API --> ADMIN
    API --> REPORT

    %% =========================
    %% DATABASE
    %% =========================

    AUTH --> DB
    LOAN --> DB
    KYC --> DB
    ADMIN --> DB
    REPORT --> DB

    %% =========================
    %% MACHINE LEARNING PIPELINE
    %% =========================

    LOAN --> PRE
    PRE --> ML

    ML --> PRED
    ML --> SHAP

    SHAP --> PRED
    PRED --> LOAN

    %% =========================
    %% DOCUMENT STORAGE
    %% =========================

    KYC --> STORAGE
    REPORT --> STORAGE

    %% =========================
    %% ADMIN WORKFLOW
    %% =========================

    ADMIN --> KYC
    ADMIN --> LOAN
