You need a complete **project walkthrough**, not just authentication. The previous explanation covered only one subsystem.

I'll treat your AI-Powered Loan Eligibility Advisor as an end-to-end software engineering project and cover:

1. Problem statement and project objectives.
2. Overall architecture and technology stack.
3. Frontend structure, pages, components and API integration.
4. Backend architecture, APIs and business logic.
5. PostgreSQL database design and relationships.
6. Loan eligibility prediction using XGBoost.
7. Model training, preprocessing and prediction pipeline.
8. Explainable AI using SHAP.
9. Authentication and role-based access.
10. Admin dashboard, reports and PDF generation.
11. Deployment, configuration and environment variables.
12. Complete request/data flow, limitations and interview questions.
13. Resume-ready project description and technical bullets.

I'll distinguish implemented features from features that are merely documented or partially implemented. That distinction matters when an interviewer asks you to demonstrate the code.

# **Complete project explanation: AI-Powered Loan Eligibility Advisor**

Repository inspected

GitHub default branch: main

[A Trustworthy Model for Loan Eligibility Assessment | Towards AI](https://images.openai.com/static-rsc-4/BD2gqhdvFxLfmjCl9_MYitOjneB14YniDbajsjGRTM3lFPd_76dK5dwJY_BUUHm_9uoP_mk4wpFWFznXhPB-ec8yCFHnQev1csQInE06_YgDvEQBIyeOMyq52C9pOTrXpVVutc-U16oYMpO1r9Zbs1qaca_ubQfVWDzH7qI2Vco?purpose=inline)

[Design of a Dashboard to Track Loan Applications by Blessing Uwah on Dribbble](https://images.openai.com/static-rsc-4/Ps6Q3hMm60qVSSpKSsEWjzrRlTfNMSY_lXMnN9amxuuEM3B6dnjthwg4bzDWUDIAn3AW2yO5XS4jzr_LyzxzL-sl6Um_fR6Pla5BtIJFvRDTGVRk70ajusRsxbyFLOSmDXPSmwduZqvYiNMYVQAVQsiySfHWlKHnM-llS3uXbCo?purpose=inline)

[GitHub - poloclub/webshap: JavaScript library to explain any machine learning models anywhere! · GitHub](https://images.openai.com/static-rsc-4/r6qJqbL9MwFzAgTBIG-NqzzUvnltjjADMoI5_CC2dkTL_dRbbNsc5RyGsaHDex52UjK-DiL25B068FqiaSHy5HStCgD-KWUdHt1UtqzOytPD87ouIQIHvMbE-NqszL4P_Jm97YLCQ67xmOyBbOeEkMoGXwCcPvEDHSPROmChEM8?purpose=inline)

12

**Repository:** [AI-Loan-Advisor](https://github.com/SMVINAYKUMAR2341/AI-Loan-Advisor?utm_source=chatgpt.com)

## **1. What exactly does this project do?**

Your project is a full-stack digital loan assessment and management platform.

It is not just a machine learning model that predicts whether someone gets a loan.

It combines three major systems:

1. **Customer banking portal:** Customers register, submit loan applications, view eligibility results, upload KYC documents, track loans and manage repayments.
2. **AI underwriting engine:** An XGBoost model evaluates applicant information, while financial calculations and business rules determine the final recommendation. SHAP provides explanations of the model's prediction.
3. **Bank administrator portal:** Bank officers review applications, verify documents, approve or reject requests, process disbursements and monitor repayments.

### **The problem it addresses**

Traditional loan assessment can be difficult for applicants because:

- Applicants do not understand why their applications are rejected.
- Loan eligibility calculations involve multiple financial parameters.
- Document verification and application tracking can be fragmented.
- Banks need a centralized way to monitor applications and repayment activity.

Your platform attempts to connect these activities in one system.

### **The overall system architecture**

## **System architecture**

**Customer portal**

React + TypeScript + Vite

**Admin portal**

React + TypeScript + Vite

REST API / HTTP requests

**FastAPI backend**

Request validation · Business logic · API orchestration · Security

**ML / AI engine**

XGBoost · SHAP · Pandas · Scikit-learn

**Financial services**

Credit assessment · EMI · Risk rules

**Document services**

KYC · OCR · Bank statement analysis

**Reporting / chatbot**

PDF · QR · OpenRouter · DeepSeek

**PostgreSQL database**

SQLAlchemy 2.0 · AsyncPG · Persistent application records

The important architectural decision is separating the frontend, backend, ML inference, and persistence layers. This allows the prediction engine to operate independently of the presentation layer.

## **2. Complete technology stack**

| Layer                    | Technologies                     | Purpose                                       |
| ------------------------ | -------------------------------- | --------------------------------------------- |
| Frontend                 | React 18, TypeScript             | User interfaces                               |
| Build tooling            | Vite                             | Frontend development and production builds    |
| Styling                  | Tailwind CSS, Radix UI           | Responsive components                         |
| Routing                  | React Router                     | Page navigation                               |
| Charts                   | Recharts                         | Financial visualizations                      |
| API                      | FastAPI                          | Backend REST services                         |
| Validation               | Pydantic                         | Request and response validation               |
| Database                 | PostgreSQL                       | Persistent application data                   |
| ORM                      | SQLAlchemy 2.0                   | Database operations                           |
| Database driver          | AsyncPG                          | Asynchronous PostgreSQL connectivity          |
| ML                       | XGBoost                          | Loan risk prediction                          |
| Data processing          | Pandas, NumPy                    | Feature processing                            |
| Preprocessing            | Scikit-learn                     | One-hot encoding and standardization          |
| Imbalanced data          | SMOTE                            | Class balancing during training               |
| Explainability           | SHAP                             | Feature-level prediction explanations         |
| Model persistence        | Joblib                           | Loading trained model artifacts               |
| Authentication           | JWT, Passlib, OAuth2             | API authentication                            |
| PDF                      | FPDF2                            | Loan analysis reports                         |
| QR codes                 | qrcode                           | Report-sharing QR codes                       |
| AI chatbot               | OpenRouter, DeepSeek             | Financial question answering                  |
| OCR                      | OCR.space, Tesseract integration | Document text extraction                      |
| Deployment configuration | Docker, Vercel configuration     | Application packaging and frontend deployment |

## **3. Frontend architecture — React and TypeScript**

Your repository contains separate customer and bank-administrator applications.

This distinction is important when explaining your architecture.

### **A. Customer application**

Location:

`frontend/src/`

Main files:

| File                       | Responsibility                  |
| -------------------------- | ------------------------------- |
| `App.tsx`                  | Main application and routing    |
| `pages/Index.tsx`          | Landing page                    |
| `pages/Login.tsx`          | Customer login                  |
| `pages/Signup.tsx`         | Customer registration           |
| `pages/Dashboard.tsx`      | Main customer banking dashboard |
| `services/api.ts`          | Backend API communication       |
| `components/AIChatbot.tsx` | AI credit advisor               |
| `components/profile/`      | Profile and security features   |

The customer application uses React Router to navigate between pages.

The main routes are:

```
<Routes>
  <Route path="/" element={<Index />} />
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

### **B. Customer dashboard**

The main dashboard is implemented in `Dashboard.tsx`.

It contains these sections:

**Home**

Financial overview and eligibility

**My Loans**

Applications and loan status

**Apply for Loan**

Financial and personal information

**Repayments**

EMI schedules and payments

**Documents**

KYC document management

**Security**

Profile and account settings

**Activity**

Audit and activity history

**Support**

Customer support tickets

The dashboard uses React state to maintain the active section and application data.

For example:

```
const [activeSection, setActiveSection] =
    useState<SectionKey>("home");

const [loanApplications, setLoanApplications] =
    useState<LoanApplicationItem[]>([]);

const [advisorResult, setAdvisorResult] =
    useState<LoanAdvisorResult | null>(null);
```

The dashboard also uses Recharts to display financial data through bar charts, pie charts, line charts and radar charts.

### **C. API integration**

Location: `frontend/src/services/api.ts`

This file acts as the frontend API service layer.

Instead of writing HTTP requests independently throughout the application, it provides reusable functions.

Examples:

```
signup(data)
login(data)
getCurrentUser()
updateProfile(data)
getCreditScore()
getEligibility()
submitLoanApplication(data)
getMyApplications()
```

The frontend sends JSON requests to the backend and processes the JSON responses.

For authenticated requests, `authFetch()` attaches the JWT to the Authorization header.

This keeps the UI and backend communication relatively organized.

### **D. Admin application**

Location: `loan-admin-hub-main/`

This is a separate React application, not simply another dashboard section in the customer frontend.

Important files:

| File                             | Responsibility           |
| -------------------------------- | ------------------------ |
| `src/App.tsx`                    | Admin routing            |
| `src/lib/api.ts`                 | API integration          |
| `src/pages/Login.tsx`            | Admin login              |
| `src/pages/Dashboard.tsx`        | Administrative analytics |
| `src/pages/Customers.tsx`        | Customer management      |
| `src/pages/LoanApplications.tsx` | Application management   |
| `src/pages/LoanDetails.tsx`      | Application review       |
| `src/pages/Documents.tsx`        | Document verification    |
| `src/pages/LoanDisbursement.tsx` | Disbursement processing  |
| `src/pages/EMITracking.tsx`      | Repayment monitoring     |
| `src/pages/Reports.tsx`          | Reports                  |
| `src/pages/Tickets.tsx`          | Customer support         |

There is also a `frontend/secure-identity-hub-main/` directory containing another profile/security-oriented UI scaffold. Do not confuse it with the primary customer dashboard or claim that every file in that directory is part of the deployed application.

## **4. Backend architecture — FastAPI**

Location: `backend/`

The backend is the central processing layer of your application.

The main file is:

`backend/main.py`

It contains approximately 7,400 lines of code and handles the majority of API endpoints.

Rather than putting all the logic into individual route handlers, the project has separate modules for authentication, prediction, reporting, database access and external integrations.

### **Important backend files**

| File                         | What it does                               |
| ---------------------------- | ------------------------------------------ |
| `main.py`                    | API routes and application orchestration   |
| `auth.py`                    | JWT, password hashing and RBAC             |
| `database.py`                | PostgreSQL connection and async sessions   |
| `models.py`                  | SQLAlchemy database models                 |
| `schemas.py`                 | Pydantic request/response schemas          |
| `loan_advisor.py`            | Main loan analysis engine                  |
| `loan_predictor.py`          | Separate loan prediction implementation    |
| `train_model.py`             | XGBoost training pipeline                  |
| `report_generator.py`        | PDF report generation                      |
| `bank_statement_analyzer.py` | Bank statement analysis                    |
| `kyc_validator.py`           | Document and KYC validation utilities      |
| `external_services.py`       | OCR, payment and verification integrations |
| `chatbot_model.py`           | AI chatbot response generation             |
| `device_utils.py`            | Device and request-related utilities       |
| `exceptions.py`              | Custom exception handling                  |

### **How a request travels through the backend**

Consider a customer submitting a loan application.

1. **Frontend**

   Customer submits the loan form.
2. **FastAPI endpoint**

   `POST /loan-application`
3. **Pydantic validation**

   Validates the application payload.
4. **Authentication**

   Identifies the logged-in customer.
5. **SQLAlchemy**

   Creates the application record in PostgreSQL.
6. **LoanAdvisor**

   Calls the ML and financial analysis pipeline.
7. **PostgreSQL**

   Stores prediction results and explanations.
8. **JSON response**

   Sends the decision, probability, EMI and explanations to React.

The key implementation is in `main.py`, inside the `/loan-application` endpoint.

It stores the input features, invokes the advisor and persists the prediction:

```
advisor = get_advisor()result = await run_prediction_with_backpressure(    advisor.analyze,    features)db_prediction = models.LoanPrediction(    application_id=db_application.id,    approval_probability=result['approval_probability'],    decision=result['decision'],    decision_reason=result['decision_reason'],    interest_rate=result['interest_rate']['annual'],    emi=result['emi']['monthly'],    shap_summary=result['explanations'])
```

This is an important part of your project because it connects machine learning inference with actual application persistence.

The `run_prediction_with_backpressure()` mechanism also prevents prediction requests from overwhelming the backend under concurrent load.

## **5. Machine learning — the most important technical component**

This is where you should spend considerable preparation time.

Your repository contains an XGBoost-based loan prediction system.

The model is trained using financial and applicant information to estimate whether an applicant is likely to repay a loan.

### **A. Dataset**

Location:

`backend/PR_Dset/`

Important files:

- `loan_data.csv`
- `loan_dataS.csv`
- `loan_dataUnderSmapled.csv`
- `modelTraining.py`
- `underSampling.py`
- `finalModel.json`
- `finalModel.ubj`
- `extra/Xgboost.ipynb`

The main training script is:

`backend/train_model.py`

The dataset contains information such as:

| Feature                          | Meaning                        |
| -------------------------------- | ------------------------------ |
| `person_age`                     | Applicant's age                |
| `person_education`               | Education level                |
| `person_income`                  | Annual income                  |
| `person_emp_exp`                 | Employment experience          |
| `person_home_ownership`          | Own, rent or mortgage          |
| `loan_amnt`                      | Requested loan amount          |
| `loan_intent`                    | Purpose of the loan            |
| `loan_percent_income`            | Loan amount relative to income |
| `cb_person_cred_hist_length`     | Credit history length          |
| `credit_score`                   | Credit score                   |
| `previous_loan_defaults_on_file` | Previous default history       |
| `loan_status`                    | Target variable                |

The model learns patterns from historical training records.

### **B. Model training pipeline**

Your `train_model.py` follows these steps:

## **XGBoost training pipeline**

1. **Load dataset**

   Read `loan_data.csv` using Pandas.
2. **Data cleaning**

   Remove duplicates and rows containing missing values. Drop `loan_int_rate` and `person_gender`.
3. **Feature preprocessing**

   Separate categorical and numerical columns.
4. **One-Hot Encoding**

   Convert categorical variables into numerical indicator columns.
5. **StandardScaler**

   Standardize numerical features.
6. **SMOTE**

   Generate synthetic minority-class training examples to address class imbalance.
7. **Train XGBoost**

   Train the classifier using the processed features.
8. **Evaluate model**

   Calculate accuracy, ROC-AUC, classification report and confusion matrix.
9. **Save model**

   Persist the model and preprocessing objects using Joblib.

### **C. Why One-Hot Encoding?**

Machine learning algorithms require numerical inputs.

Suppose your dataset has:

| Education |
| --------- |
| Bachelor  |
| Master    |
| PhD       |

One-Hot Encoding transforms this into:

| Bachelor | Master | PhD |
| -------- | ------ | --- |
| 1        | 0      | 0   |
| 0        | 1      | 0   |
| 0        | 0      | 1   |

The model can now process these categorical variables.

Your code:

```
ohe = OneHotEncoder(    sparse_output=False,    handle_unknown='ignore')encoded = ohe.fit_transform(df[cat_columns])
```

`handle_unknown='ignore'` helps prevent inference failures when an unfamiliar category appears.

### **D. Why StandardScaler?**

Different numerical features have different scales.

For example:

- Age: 25
- Annual income: 600000
- Loan amount: 500000

StandardScaler transforms numerical values using:

\\[ z = \frac{x-\mu}{\sigma} \\]

Where:

- \\(x\\) = original value
- \\(\mu\\) = mean
- \\(\sigma\\) = standard deviation

Your implementation:

```
scaler = StandardScaler()df_num_scaled = pd.DataFrame(    scaler.fit_transform(df[num_columns]),    columns=num_columns,    index=df.index)
```

The same fitted encoder and scaler are loaded during prediction. This is necessary to keep training and inference transformations consistent.

### **E. Why SMOTE?**

Your dataset may contain more approved examples than rejected examples, or vice versa.

If a classifier is trained on an imbalanced dataset, it may become biased toward the majority class.

SMOTE means Synthetic Minority Over-sampling Technique.

It generates synthetic minority-class examples by interpolating between nearby observations.

Your code:

```
sm = SMOTE(random_state=42)X_resampled, y_resampled = sm.fit_resample(    X,    y)
```

The purpose is to improve the model's ability to learn minority-class patterns.

**An important issue I found:** your training script applies SMOTE before the train/test split. That can cause data leakage because synthetic training samples may incorporate information from observations that later enter the test set. The correct order is to split first and apply SMOTE only to the training partition, preferably through an imbalanced-learn pipeline.

This is worth fixing before reporting model performance.

### **F. XGBoost training**

Your model uses:

```
model = XGBClassifier(    n_estimators=300,    max_depth=6,    learning_rate=0.1,    subsample=0.8,    colsample_bytree=0.8,    eval_metric='logloss',    random_state=42,    n_jobs=-1)model.fit(X_train, y_train)
```

Understand these parameters:

| Parameter              | Meaning                                    |
| ---------------------- | ------------------------------------------ |
| `n_estimators=300`     | Number of boosting trees                   |
| `max_depth=6`          | Maximum depth of each tree                 |
| `learning_rate=0.1`    | Contribution of each boosting iteration    |
| `subsample=0.8`        | Fraction of training samples used per tree |
| `colsample_bytree=0.8` | Fraction of features used per tree         |
| `eval_metric=logloss`  | Classification probability loss metric     |

XGBoost is a gradient-boosted decision tree algorithm. It builds trees sequentially, with later trees learning from errors made by earlier trees.

### **G. Model evaluation**

Your training script uses:

- Accuracy
- ROC-AUC
- Classification report
- Confusion matrix
- Five-fold cross-validation using ROC-AUC

You should understand the difference:

| Metric    | What it measures                                          |
| --------- | --------------------------------------------------------- |
| Accuracy  | Overall proportion of correct predictions                 |
| Precision | How many predicted positive cases are actually positive   |
| Recall    | How many actual positive cases were correctly identified  |
| F1-score  | Harmonic mean of precision and recall                     |
| ROC-AUC   | Ability to rank positive examples above negative examples |

Do not quote an accuracy percentage on your resume unless you have verified the final evaluation using a leakage-free test set.

## **6. Loan prediction — how the actual application works**

There is an important distinction between your model training and your application inference.

Your primary application flow uses:

`backend/loan_advisor.py`

The endpoint is:

`POST /loan-application`

There is also a separate endpoint:

`POST /predict-loan`

That second endpoint uses `loan_predictor.py` and is a separate, simpler prediction path.

For the main application, understand the `LoanAdvisor.analyze()` method.

### **A. Input collection**

The frontend collects:

- Age
- Employment status
- Education level
- Work experience
- Job tenure
- Monthly income
- Monthly debt payments
- Loan amount
- Loan duration
- Loan purpose
- Marital status
- Number of dependents
- Home ownership
- Property area
- Co-applicant income

It also accepts a manually supplied CIBIL score and previous-default information in the persisted application flow.

### **B. Financial feature calculations**

The backend derives additional information.

Annual income:

\\[ AnnualIncome = MonthlyIncome \times 12 \\]

Debt-to-income ratio:

\\[ DTI = \frac{MonthlyDebtPayments}{MonthlyIncome} \\]

Loan-to-income ratio:

\\[ LTI = \frac{LoanAmount}{AnnualIncome} \\]

These ratios help evaluate the applicant's repayment capacity.

### **C. Credit score estimation**

Your `CreditScoreEstimator` estimates a credit-score range and rating based on applicant information.

It should not be described as fetching an actual CIBIL report.

The code does not establish a live credit bureau integration. The application accepts a manually entered score in its main loan submission flow.

### **D. Interest rate calculation**

The `InterestRateCalculator` determines a risk-adjusted interest rate.

The general logic is:

\\[ FinalRate = BaseRate + RiskPremium + Adjustments \\]

The code considers credit rating, risk, employment type and loan tenure.

The resulting interest rate is used by the EMI calculation.

### **E. EMI calculation**

The `EMICalculator` uses the standard reducing-balance EMI formula:

\\[ EMI = \frac{P \times r \times (1+r)^n} {(1+r)^n-1} \\]

Where:

- \\(P\\) = Principal amount
- \\(r\\) = Monthly interest rate
- \\(n\\) = Number of monthly installments

For example, suppose:

- Principal = ₹5,00,000
- Annual interest = 12%
- Tenure = 60 months

Monthly interest:

\\[ r = \frac{0.12}{12}=0.01 \\]

The EMI is approximately ₹11,122.

The backend also calculates total interest and total repayment.

### **F. Co-applicant evaluation**

Your `CoApplicantEvaluator` checks whether a co-applicant could improve repayment affordability.

For example:

If an applicant has insufficient income relative to the requested EMI, the system can suggest adding a co-applicant.

When co-applicant income is provided, the analysis calculates combined effective income and updates the affordability calculation.

### **G. Final decision engine**

The `DecisionEngine` combines the ML probability with financial rules.

The possible results are:

**APPROVED**

Meets decision criteria

**PENDING_REVIEW**

Requires manual review

**REJECTED**

Fails decision criteria

The business rules consider factors such as:

- EMI-to-income ratio
- Credit rating
- Loan-to-income ratio
- Loan duration
- Employment and financial stability

For example, the code rejects an application when the EMI-to-income ratio exceeds 55%, and may send cases with a ratio between 45% and 55% for manual review.

These are project-defined rules, not proof of universal RBI underwriting thresholds.

### **H. How the result reaches the frontend**

The advisor returns a structured response containing:

```
{
  "decision": "APPROVED",
  "approval_probability": 85.5,
  "credit_score": {},
  "interest_rate": {},
  "emi": {},
  "income_analysis": {},
  "coapplicant": {},
  "explanations": [],
  "kyc_required": true,
  "next_steps": []
}
```

This is an illustrative response structure, not a captured prediction from your model.

The frontend uses these values to display the prediction result, financial breakdown and next steps.

## **7. Explainable AI — SHAP**

This is one of the most important differentiating components of your project.

A normal machine learning model might say:

> Your loan approval probability is 82%.

But an applicant also wants to know:

- Why is the probability high?
- Did income improve the result?
- Did previous defaults reduce the result?
- Did the requested loan amount increase risk?

Your project uses SHAP to explain the model's prediction.

### **What is SHAP?**

SHAP stands for SHapley Additive exPlanations.

It assigns a contribution value to individual features to explain how they influence a model prediction.

For example, consider this illustrative explanation:

**Example: Loan prediction explanation**

Approval probability

# **82%**

**Annual income**

Positive

**Credit score**

Positive

**Employment experience**

Positive

**Loan amount relative to income**

Negative

**Previous defaults**

Negative

Illustrative feature contributions, not actual SHAP values from a specific application.

### **How your implementation works**

Location: `backend/loan_advisor.py`

During model initialization:

```
import shapself.shap_explainer = shap.TreeExplainer(    self.model)
```

When a customer submits an application:

```
shap_values = self.shap_explainer.shap_values(    self._last_processed_input)
```

The system then:

1. Gets the SHAP values for the prediction.
2. Identifies the most influential features.
3. Sorts features by absolute SHAP value.
4. Determines positive or negative impact.
5. Converts technical feature names into readable descriptions.
6. Returns the top contributing factors to the frontend.

For example:

```
feature_importance.sort(    key=lambda x: abs(x['_shap_value']),    reverse=True)
```

This sorts the explanations by contribution magnitude.

Your implementation returns up to eight feature explanations.

If SHAP is unavailable or explanation generation fails, the code falls back to a rule-based explanation mechanism.

**Interview distinction:** SHAP explains the model's prediction; it does not independently approve or reject the loan. The final decision also passes through your business-rule decision engine.

## **8. PostgreSQL database architecture**

Location: `backend/models.py`

Your application uses PostgreSQL with SQLAlchemy ORM.

The database stores customer details, loan applications, predictions, KYC documents, repayment information, administrative decisions and audit history.

### **Important database models**

I identified these SQLAlchemy classes in your repository:

| Model                  | Purpose                               |
| ---------------------- | ------------------------------------- |
| `User`                 | Customer accounts                     |
| `AdminUser`            | Bank administrator accounts           |
| `LoanApplication`      | Applicant information and loan inputs |
| `LoanPrediction`       | ML prediction and explanation results |
| `OfficerReview`        | Human review and final decision       |
| `KYCDocument`          | Uploaded verification documents       |
| `Repayment`            | EMI schedule and payment records      |
| `BankAccountDetails`   | Customer bank account details         |
| `LoanAgreement`        | Agreement and consent records         |
| `AdminBankDetails`     | Bank disbursement account information |
| `KYCStatusTracking`    | KYC progress                          |
| `DeletionRequest`      | Account/application deletion requests |
| `AuditLog`             | Activity and audit records            |
| `UserSession`          | Session tracking                      |
| `Disbursement`         | Loan fund transfer records            |
| `Notification`         | Customer notifications                |
| `SupportTicket`        | Customer support requests             |
| `TicketMessage`        | Support conversations                 |
| `NotificationTemplate` | Notification templates                |

### **Important relationships**

**User**

Customer account

**LoanApplication**

One customer can submit multiple applications

**LoanPrediction**

ML output and SHAP

**OfficerReview**

Human decision

**KYCDocument**

Document verification

**LoanAgreement**

Consent and agreement

**Disbursement**

Fund transfer record

**Repayment**

EMI records

This is a conceptual relationship diagram; the exact database constraints and cardinalities should be checked against the individual model definitions.

### **How database connections work**

Location: `backend/database.py`

You use:

```
engine = create_async_engine(    DATABASE_URL,    echo=False,    pool_pre_ping=True,    pool_size=db_pool_size,    max_overflow=db_max_overflow)
```

And create asynchronous sessions:

```
AsyncSessionLocal = sessionmaker(    bind=engine,    class_=AsyncSession,    expire_on_commit=False,    autocommit=False,    autoflush=False)
```

Why asynchronous database operations?

Traditional synchronous database calls can block the executing thread while waiting for a database response.

AsyncSQLAlchemy with AsyncPG allows the FastAPI application to yield control while waiting for database I/O, which helps with concurrent requests.

Your database configuration also supports connection-pool tuning and Cloud SQL Unix socket connectivity.

## **9. Complete customer loan application workflow**

This is how the main features work together.

## **Customer journey**

1. **Account registration**

   Customer enters credentials, personal details, address and consent information.
2. **Login**

   Backend authenticates the customer and issues a JWT.
3. **Loan application**

   Customer enters financial, employment and loan details.
4. **AI underwriting**

   XGBoost predicts repayment-related risk. Financial calculations and business rules produce a recommendation.
5. **Explainability**

   SHAP generates feature-level explanations.
6. **Report generation**

   The system creates a PDF containing the loan analysis.
7. **KYC verification**

   Customer uploads identity, address and financial documents.
8. **Bank details**

   Customer submits bank account information.
9. **Agreement**

   Customer reviews and signs the loan agreement.
10. **Officer review**

    Bank administrator reviews the application and verification information.
11. **Disbursement**

    Administrator processes an approved loan and records the transaction.
12. **Repayment tracking**

    Customer views EMI schedules and payment history.

An important architectural detail is that the ML result and the bank officer's final decision are separate concepts.

A model can recommend approval, but the administrator has functionality to review the case and record a justified final decision.

This is useful when explaining human-in-the-loop decision-making.

## **10. KYC and document verification**

Relevant files:

- `backend/kyc_validator.py`
- `backend/external_services.py`
- `backend/main.py`
- `backend/models.py`

The KYC subsystem supports:

- PAN details
- Aadhaar details
- Address proof
- Income proof
- Bank statements
- Document uploads
- Verification status
- Admin document review

### **Document upload flow**

The customer uploads a document through the frontend.

The backend receives it using FastAPI file-upload handling.

It associates the document with an application and records details such as document type, filename, size and verification status.

The relevant API endpoints include:

| Endpoint                                            | Function                             |
| --------------------------------------------------- | ------------------------------------ |
| `POST /documents/upload`                            | Document upload                      |
| `GET /documents/{application_id}`                   | Retrieve documents                   |
| `POST /documents/{document_id}/verify`              | Document verification                |
| `GET /kyc/{application_id}/status`                  | KYC progress                         |
| `POST /kyc/{application_id}/documents`              | KYC document upload                  |
| `GET /kyc/user-verified-documents`                  | Retrieve reusable verified documents |
| `POST /kyc/{application_id}/link-previous-document` | Reuse an existing identity document  |

### **OCR**

Your external integration includes OCR.space.

The code submits document images for text extraction and then searches the extracted text for patterns such as:

- PAN number format
- Aadhaar number format
- Document identification keywords

There is also Tesseract-based OCR support in the document validation utility when the required dependency is available.

However, OCR is not equivalent to official government identity verification.

The code also contains simulated bank-account verification and simplified Aadhaar checksum logic. Therefore, don't claim that the project performs live UIDAI, NSDL or bank verification.

### **Repeat-customer document reuse**

One interesting workflow is document reuse.

For a second loan application:

- Previously verified identity documents can be linked to the new application.
- Updated bank statements are still required.
- The administrator can inspect document history across applications.

This reduces repeated document uploads while preserving the need for current financial information.

## **11. Bank statement analysis**

File:

`backend/bank_statement_analyzer.py`

This module supports the financial-document analysis side of the system.

Its purpose is to derive useful information from bank transaction records rather than relying exclusively on the applicant's manually entered income and debt figures.

The repository also contains:

`backend/mock_bank_transactions.json`

And mock statement-analysis endpoints:

- `GET /mock/bank-transactions`
- `POST /mock/analyze-statement`
- `GET /mock/analyze-statement`

This functionality should be explained as bank statement/transaction analysis with mock-data support, not as a live integration with a customer's bank account.

The distinction matters because a real Account Aggregator or banking API integration would require a separate consent and data-access integration.

## **12. PDF report generation and QR code sharing**

File:

`backend/report_generator.py`

The system generates a detailed loan analysis PDF using FPDF2.

The report contains sections covering:

1. Customer and account information.
2. Approval probability and decision.
3. Credit profile.
4. Loan cost breakdown.
5. EMI calculations.
6. AI decision factors.
7. Risk assessment.
8. KYC information.
9. Loan agreement and terms.

The code also generates visual elements such as approval gauges, pie charts and risk charts.

The main function is:

```
def generate_loan_report_pdf(    application,    analysis_result):    pdf = RBICompliantLoanReport()    pdf.add_page()    pdf.add_cover_section(        application,        analysis_result    )    pdf.add_page()    pdf.add_approval_score_section(        analysis_result    )    pdf.add_executive_summary(        analysis_result    )    return pdf.output()
```

### **QR code sharing**

The project also has:

- `GET /loan-application/{application_id}/report`
- `GET /loan-application/{application_id}/report-qr`
- `GET /shared-report/{token}`

The intention is to allow a customer to generate a report and share or access it through a QR code.

The README documents a 24-hour expiry for shared report links. Before claiming this as an enforced security guarantee, verify the token creation and expiry validation in the corresponding endpoint implementation.

Also, the report's RBI-style presentation does not by itself establish regulatory certification or compliance.

## **13. AI Credit Advisor chatbot**

File:

`backend/chatbot_model.py`

Your chatbot uses a hybrid response architecture.

**Customer asks a question**

**FastAPI&#x20;**`/chat`**&#x20;endpoint**

**OpenRouter API**

DeepSeek chat model

**Response available?**

Success

**Return AI response**

Failure

**Local knowledge fallback**

The chatbot is configured with:

```
OPENROUTER_URL = (    "https://openrouter.ai/api/v1/chat/completions")MODEL_NAME = "deepseek/deepseek-chat"
```

It provides guidance about:

- Loan eligibility.
- Credit score improvement.
- EMI calculations.
- Interest rates.
- Required documents.
- Loan rejection reasons.

### **Why hybrid architecture?**

If the OpenRouter API is unavailable, the application can still provide responses from its local financial knowledge base.

This makes the chatbot less dependent on an external AI service.

One important technical distinction: this is an API-integrated LLM chatbot, not a custom-trained large language model or a RAG pipeline. Its fallback is keyword-based financial knowledge retrieval.

## **14. Admin dashboard and loan lifecycle management**

Your admin application provides the operational side of the platform.

This is more than an analytics dashboard.

It contains several business workflows.

### **A. Application review**

An administrator can:

- View loan applications.
- Search customer and application information.
- View AI approval probability.
- Inspect decision explanations.
- Approve applications.
- Reject applications.
- Request additional documents.
- Provide a mandatory justification for decisions.

Relevant endpoints include:

```
GET  /admin/applications
GET  /admin/applications/{app_id}
PUT  /admin/applications/{application_id}/decision
POST /admin/applications/{application_id}/request-documents
```

### **B. Loan disbursement**

After approval and completion of required checks, the administrator can process a disbursement.

The backend has:

```
POST /admin/disbursements/{application_id}
GET  /admin/disbursements
```

The `Disbursement` model records information associated with the transfer.

Be precise here: the code supports recording and processing a disbursement workflow, but the repository's mock payment integrations do not establish that actual bank transfers are performed.

### **C. Analytics and reports**

The dashboard exposes metrics such as:

- Total loan applications.
- Total disbursed amount.
- Pending applications.
- Approval rate.
- Monthly application trends.
- Loan status distribution.
- EMI collection trends.

The backend provides:

```
GET /admin/dashboard/stats
GET /admin/reports/stats
```

The frontend uses Recharts to visualize the returned information.

### **D. Notifications and support**

Other admin features include:

- Customer notifications.
- Bulk reminders.
- Notification templates.
- Customer support tickets.
- Ticket messages.
- Ticket status management.
- Document verification.
- EMI tracking.

These features connect the loan assessment process with ongoing customer management.

## **15. EMI and repayment management**

The repayment subsystem handles loan repayment after disbursement.

The `Repayment` model stores individual EMI records.

Each record can include:

- EMI number.
- Due date.
- EMI amount.
- Principal component.
- Interest component.
- Outstanding principal.
- Payment status.
- Payment date.
- Payment reference.
- Late fee.

### **Repayment flow**

1. The backend creates or maintains an EMI schedule.
2. Customer views upcoming installments.
3. Customer initiates a payment.
4. The backend records payment information.
5. Repayment status is updated.
6. Customer can view payment history.

Important endpoints:

| Endpoint                           | Purpose                            |
| ---------------------------------- | ---------------------------------- |
| `GET /repayments/{application_id}` | Retrieve EMI schedule              |
| `GET /repayments/upcoming`         | Upcoming installments              |
| `POST /repayments/pay`             | Submit payment request             |
| `GET /repayments/me`               | Customer repayment history         |
| `GET /admin/repayments`            | Administrator repayment monitoring |

The project also contains mock payment functionality and Razorpay/Stripe integration code. Do not describe the entire repayment process as a live production payment gateway without verifying the configured payment provider and successful transaction flow.

## **16. Deployment and infrastructure**

Your repository contains deployment-related configurations.

### **Backend**

The `Dockerfile`:

1. Uses Python 3.11 slim.
2. Installs backend requirements.
3. Copies backend source code.
4. Starts FastAPI through Uvicorn.
5. Supports multiple workers through an environment variable.

Example:

```
FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt ./backend/requirements.txt

RUN pip install --no-cache-dir \
    -r backend/requirements.txt

COPY backend ./backend

ENV PYTHONUNBUFFERED=1

CMD ["sh", "-c", \
"uvicorn backend.main:app \
--host 0.0.0.0 \
--port ${PORT:-8080} \
--workers ${WEB_CONCURRENCY:-4}"]
```

### **Database**

The backend supports:

- PostgreSQL connection through `DATABASE_URL`.
- AsyncPG.
- SQLAlchemy connection pooling.
- Cloud SQL connection through Unix sockets.
- Connection timeout and pool configuration.

### **Frontend**

The frontend has:

- Vite production build configuration.
- `VITE_API_URL` for backend communication.
- Vercel configuration files.

### **Overall deployment architecture**

**Vercel**

React frontend hosting

**Docker / Uvicorn**

FastAPI backend

**Cloud SQL / PostgreSQL**

Persistent application and financial records

**External services**

OpenRouter · OCR · Payment providers

This describes the intended deployment configuration. The presence of configuration files does not prove that every service is currently deployed or operational.

# **17. Important engineering issues I found in your repository**

I would not ignore these. A technical interviewer may discover them if they examine your GitHub repository.

| Issue                             | Why it matters                                             | Recommended action                                      |
| --------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------- |
| SMOTE before train/test split     | Potential data leakage                                     | Split first, resample training data only                |
| Model target-class mapping        | Different files contain conflicting class interpretations  | Verify actual dataset labels and `model.classes_`       |
| Rule-based score fallback         | A missing model can still produce a recommendation         | Clearly distinguish ML predictions from fallback scores |
| Manual CIBIL score                | Not a live bureau check                                    | Explain that the current input is manually supplied     |
| Simplified Aadhaar validation     | Does not establish official identity verification          | Use a legitimate verification provider                  |
| Simulated bank verification       | Does not establish a real penny-drop transaction           | Integrate a bank verification API                       |
| Mock payment workflows            | Payment records are not proof of actual settlement         | Verify provider integration and payment webhooks        |
| Hardcoded demo admin credentials  | Credential exposure                                        | Remove and rotate credentials                           |
| JWT secret configuration mismatch | Environment variable may not configure the intended secret | Standardize the variable and fail securely              |
| Large `main.py`                   | Difficult to maintain and test                             | Split routes into FastAPI routers and service modules   |

There is another particularly important ML issue.

Your training script documents one interpretation of the target classes, while `loan_predictor.py` and `loan_advisor.py` contain conflicting comments about which class represents approval.

For example, `loan_advisor.py` uses:

```
proba = self.model.predict_proba(input_df)[0]ml_score = float(proba[0])
```

You should not assume that `proba[0]` represents approval without checking the actual target labels and `model.classes_`.

This can materially reverse a prediction.

**Before putting a model accuracy or approval-performance figure on your resume, verify this mapping and retrain using a leakage-free evaluation pipeline.**

# **18. What you should write in your resume**

For an SDE or Software Engineer position, don't make the project sound like you only trained an ML model.

Your project demonstrates backend development, database design, frontend integration, API development and ML integration.

I would use the following version:

### AI-Powered Loan Eligibility Advisor

**Technologies:** Python, FastAPI, React, TypeScript, PostgreSQL, SQLAlchemy, XGBoost, SHAP, JWT, Docker

- Developed a full-stack loan assessment platform using React, TypeScript and FastAPI, integrating customer and bank-admin portals with REST APIs and PostgreSQL.
- Integrated an XGBoost-based loan risk prediction pipeline with feature preprocessing, SMOTE, One-Hot Encoding and StandardScaler to evaluate applicant financial profiles.
- Implemented explainable AI using SHAP to identify influential prediction features and provide interpretable loan risk insights.
- Engineered backend workflows for loan applications, financial calculations, EMI schedules, KYC document management, administrative reviews and disbursement tracking.
- Built PDF loan analysis reports, QR-based report sharing, audit logging and JWT-based role-controlled API access.

I would keep this to four or five bullets depending on available resume space.

Do not add unverified accuracy percentages, claims of RBI certification, live CIBIL integration or real banking disbursement.

# **19. How to explain the entire project in an interview**

This is the explanation I would prepare first.

I developed an AI-Powered Loan Eligibility Advisor, which is a full-stack digital lending platform designed to simplify loan assessment and management.

The application has two interfaces: a customer portal and a bank administrator portal.

On the frontend, I used React, TypeScript and Vite. The backend is developed using FastAPI, and PostgreSQL is used for persistent storage through SQLAlchemy.

The main feature is the loan eligibility prediction engine. It uses an XGBoost classifier trained on financial and applicant information. During training, I used Pandas for data processing, One-Hot Encoding for categorical features, StandardScaler for numerical features and SMOTE to address class imbalance.

When a customer submits an application, the backend processes the information, runs the prediction pipeline and combines the model output with financial calculations and business rules. These include credit assessment, loan-to-income ratio, EMI affordability and interest rate calculations.

I integrated SHAP to explain the model's predictions by identifying the financial factors that positively or negatively influence the result.

The platform also supports PDF report generation, QR-based report sharing, KYC document management, bank statement analysis, an AI credit advisor chatbot and repayment tracking.

The administrator portal allows bank officers to review applications, request documents, record approval or rejection decisions, verify KYC documents and manage disbursement records.

I also implemented JWT authentication, role-based access control and audit logging to manage access and record important user activities.

The objective was to build an end-to-end loan assessment platform that combines predictive analytics, explainability and loan lifecycle management.

# **20. Interview questions you should prepare**

These are the areas I expect an interviewer to explore based on your actual repository.

**Interview preparation checklist**

30 questions

1\. Python and backend

What is FastAPI, and why did you use it?

What is the difference between synchronous and asynchronous programming?

What is Pydantic?

What is dependency injection in FastAPI?

How does SQLAlchemy ORM work?

How do you handle database transactions and rollbacks?

2\. Machine learning

3\. Explainable AI

4\. Database and APIs

5\. System design and security

## **21. What I recommend you learn first**

Don't try to memorize all 7,400 lines of `main.py`. That is not how you prepare for an SDE interview.

Study the actual execution path.

| Priority | File                               | What you must understand         |
| -------- | ---------------------------------- | -------------------------------- |
| 1        | `backend/main.py`                  | `/loan-application` request flow |
| 2        | `backend/loan_advisor.py`          | Complete analysis logic          |
| 3        | `backend/train_model.py`           | ML training                      |
| 4        | `backend/models.py`                | Database design                  |
| 5        | `backend/database.py`              | Async database operations        |
| 6        | `backend/schemas.py`               | Request validation               |
| 7        | `backend/auth.py`                  | Authentication and RBAC          |
| 8        | `frontend/src/pages/Dashboard.tsx` | Frontend application flow        |
| 9        | `frontend/src/services/api.ts`     | API integration                  |
| 10       | `backend/report_generator.py`      | PDF generation                   |

### **Your learning sequence**

## **7-day project preparation plan**

## **1**

**Day 1**

Project architecture, React, TypeScript and REST APIs

## **2**

**Day 2**

FastAPI, Pydantic, dependency injection and request flow

## **3**

**Day 3**

PostgreSQL, SQLAlchemy, database relationships and transactions

## **4**

**Day 4**

Python ML preprocessing, SMOTE and XGBoost

## **5**

**Day 5**

SHAP, EMI calculations and decision engine

## **6**

**Day 6**

KYC, PDF reports, chatbot and admin workflows

## **7**

**Day 7**

Authentication, debugging, system design and mock interview

## **22. Your project in one sentence**

**An explainable AI-powered digital lending platform that integrates XGBoost-based loan risk prediction, financial analysis, customer onboarding, KYC workflows and bank-admin loan lifecycle management using React, FastAPI and PostgreSQL.**

**My final recommendation:** Your strongest SDE interview story is not simply that you used XGBoost. It is that you connected a trained ML model to a working backend, persisted its outputs, exposed them through APIs, displayed them in a frontend, and built operational workflows around those predictions.

That is the end-to-end engineering story you should be able to demonstrate.
