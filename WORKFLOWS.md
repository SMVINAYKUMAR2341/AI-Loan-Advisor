# System Workflows

The following sequence diagrams illustrate the key workflows within the Loan Management System.

## 1. Support Ticket System Workflow
This flow demonstrates how a customer raises a support request and how an admin resolves it.

![Support Ticket Workflow](workflow_diagrams/ticket_system.png)

<details>
<summary>View Source (Mermaid)</summary>

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant CustomerUI as Customer Dashboard
    participant Backend as Backend API (Port 8002)
    participant AdminUI as Admin Dashboard
    actor Admin

    Note over Customer, Backend: Ticket Creation
    Customer->>CustomerUI: Clicks "Support"
    CustomerUI->>Backend: GET /tickets (List Check)
    Backend-->>CustomerUI: Return Ticket List
    Customer->>CustomerUI: Click "New Ticket" & Submit Form
    CustomerUI->>Backend: POST /tickets (Create)
    Backend-->>CustomerUI: Ticket Created (ID: TKT-123)

    Note over Backend, Admin: Admin Resolution
    Admin->>AdminUI: Navigates to "Support Tickets"
    AdminUI->>Backend: GET /admin/tickets?status=OPEN
    Backend-->>AdminUI: Return List of Open Tickets
    Admin->>AdminUI: Selects Ticket #TKT-123
    AdminUI->>Backend: GET /admin/tickets/{id}
    Backend-->>AdminUI: Return Details & Messages
    Admin->>AdminUI: Types Reply & Clicks Send
    AdminUI->>Backend: POST /admin/tickets/{id}/messages
    Backend-->>AdminUI: Message Saved
    Admin->>AdminUI: Updates Status to "RESOLVED"
    AdminUI->>Backend: PUT /admin/tickets/{id}/status
    Backend-->>AdminUI: Status Updated

    Note over Customer, Backend: Customer Viewing Reply
    Customer->>CustomerUI: Refresh Ticket View
    CustomerUI->>Backend: GET /tickets/{id}
    Backend-->>CustomerUI: Return Messages (inc. Admin Reply)
```
</details>

## 2. KYC Document Verification Workflow
This flow shows the process of a customer uploading documents and an admin verifying them.

![KYC Verification Workflow](workflow_diagrams/kyc_verification.png)

<details>
<summary>View Source (Mermaid)</summary>

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant CustomerUI as Customer Dashboard
    participant Backend as Backend API
    participant AdminUI as Admin Dashboard
    actor Admin

    Note over Customer, Backend: Document Submission
    Customer->>CustomerUI: Uploads ID Proof (AADHAAR/PAN)
    CustomerUI->>Backend: POST /documents/upload
    Backend->>Backend: Store File & Create DB Record
    Backend-->>CustomerUI: Upload Success (Status: PENDING)

    Note over Backend, Admin: Verification Process
    Admin->>AdminUI: Navigates to "Documents"
    AdminUI->>Backend: GET /admin/documents?status=PENDING
    Backend-->>AdminUI: Return Pending Docs
    Admin->>AdminUI: Clicks "View" on Document
    AdminUI->>Backend: GET /documents/{id}/view
    Backend-->>AdminUI: Serves File Content
    
    alt Document is Valid
        Admin->>AdminUI: Clicks "Approve"
        AdminUI->>Backend: POST /admin/documents/{id}/verify (Status=VERIFIED)
        Backend-->>AdminUI: Success
    else Document is Invalid
        Admin->>AdminUI: Clicks "Reject" & Enters Reason
        AdminUI->>Backend: POST /admin/documents/{id}/verify (Status=REJECTED)
        Backend-->>AdminUI: Success
    end
```
</details>

## 3. Loan Repayment Tracking Workflow
This flow illustrates a customer making an EMI payment and the admin tracking it.

![Repayment Workflow](workflow_diagrams/repayment.png)

<details>
<summary>View Source (Mermaid)</summary>

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant CustomerUI as Customer Dashboard
    participant Backend as Backend API
    participant AdminUI as Admin Dashboard
    actor Admin

    Note over Customer, Backend: Making a Payment
    Customer->>CustomerUI: Views Active Loan
    Customer->>CustomerUI: Clicks "Pay EMI"
    CustomerUI->>Backend: POST /repayments/create_order
    Backend-->>CustomerUI: Payment Order ID
    Customer->>CustomerUI: Completes Payment (Simulated)
    CustomerUI->>Backend: POST /repayments/verify
    Backend->>Backend: Update Loan Balance & Record Transaction
    Backend-->>CustomerUI: Payment Success Receipt

    Note over Backend, Admin: Tracking & Auditing
    Admin->>AdminUI: Navigates to "EMI Tracking"
    AdminUI->>Backend: GET /admin/repayments
    Backend-->>AdminUI: Return Recent Transactions
    Admin->>AdminUI: Reviews Payment Status
    Admin->>AdminUI: Downloads Report
    AdminUI->>Backend: GET /admin/applications/{id}/download-report
    Backend-->>AdminUI: PDF Report
```
</details>

## 4. Admin Audit & Monitoring Workflow (Proposed)
This represents the flow for monitoring system activities and alerts.

![Monitoring Workflow](workflow_diagrams/monitoring.png)

<details>
<summary>View Source (Mermaid)</summary>

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant AdminUI as Admin Dashboard
    participant Backend as Backend API
    participant DB as Database

    Note over Admin, DB: System Monitoring
    Admin->>AdminUI: Views Dashboard Home
    AdminUI->>Backend: GET /admin/dashboard/stats
    Backend->>DB: Query Aggregated Stats (Loans, Users, Volume)
    DB-->>Backend: Result Data
    Backend-->>AdminUI: Display Key Metrics

    Note over Admin, DB: Activity Review
    Admin->>AdminUI: Checks "Notifications"
    AdminUI->>Backend: GET /admin/notifications
    Backend-->>AdminUI: Return System Alerts
    Admin->>AdminUI: Sends Manual Alert to Customer
    AdminUI->>Backend: POST /admin/notifications/send
    Backend->>DB: Create Notification Record
    Backend-->>AdminUI: Sent Successfully
```
</details>
