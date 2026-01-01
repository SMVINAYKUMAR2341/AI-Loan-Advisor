"""
Loan Model Training Script - Uses Only User-Input-Mappable Features
This ensures the trained model can be used at prediction time with actual user inputs.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report, roc_auc_score, accuracy_score, confusion_matrix
import joblib
import os
import warnings
warnings.filterwarnings('ignore')

# Paths
DATA_PATH = "loan final dataset.csv"
MODEL_PATH = "backend/loan_model.joblib"
SCALER_PATH = "backend/loan_scaler.joblib"
ENCODER_PATH = "backend/loan_encoders.joblib"

# Features that can be mapped from user input
# These are the ONLY features we'll use for training
USER_INPUT_FEATURES = [
    'Age',                  # User provides age
    'AnnualIncome',         # Derived from monthly_income * 12
    'EmploymentStatus',     # User provides employment_status
    'EducationLevel',       # User provides education_level
    'Experience',           # User provides experience
    'LoanAmount',           # User provides loan_amount
    'LoanDuration',         # User provides loan_duration (months)
    'JobTenure',            # User provides job_tenure (years as months)
    'MaritalStatus',        # User provides marital_status
    'NumberOfDependents',   # User provides number_of_dependents
    'HomeOwnershipStatus',  # User provides home_ownership_status
    'LoanPurpose',          # User provides loan_purpose
]

# Features to EXCLUDE (cannot be recreated from user input accurately)
EXCLUDE_FEATURES = [
    'ApplicationDate',      # Date field
    'CreditScore',          # This is estimated, not input
    'RiskScore',            # Derived/computed feature (data leakage)
    'InterestRate',         # Computed based on risk
    'MonthlyLoanPayment',   # Computed
    'TotalDebtToIncomeRatio', # Computed
    'NetWorth',             # Not provided by user
    'BaseInterestRate',     # Computed
    'SavingsAccountBalance', # Not provided
    'CheckingAccountBalance', # Not provided
    'PreviousLoanDefaults', # Not provided
    'PaymentHistory',       # Not provided
    'LoanApproved',         # This is the TARGET
]

def load_data():
    """Load dataset"""
    df = pd.read_csv(DATA_PATH)
    print("=" * 60)
    print("ML MODEL TRAINING - USER INPUT FEATURES ONLY")
    print("=" * 60)
    print(f"\nDataset: {df.shape[0]} rows, {df.shape[1]} columns")
    print(f"\nAll columns in dataset: {list(df.columns)}")
    return df

def select_features(df):
    """Select only features that can be mapped from user input"""
    print("\n" + "=" * 60)
    print("FEATURE SELECTION")
    print("=" * 60)
    
    # Check which user input features exist in dataset
    available_features = []
    missing_features = []
    
    for feat in USER_INPUT_FEATURES:
        if feat in df.columns:
            available_features.append(feat)
        else:
            missing_features.append(feat)
    
    print(f"Available features: {available_features}")
    if missing_features:
        print(f"Missing features (will skip): {missing_features}")
    
    # Also add MonthlyDebtPayments if available (user provides this)
    if 'MonthlyDebtPayments' in df.columns:
        available_features.append('MonthlyDebtPayments')
    
    # Select features + target
    target = 'LoanApproved'
    X = df[available_features].copy()
    y = df[target].copy()
    
    print(f"\nFinal feature count: {len(available_features)}")
    print(f"Target distribution: {dict(y.value_counts())}")
    
    return X, y, available_features

def preprocess(X, y):
    """Preprocess data"""
    print("\n" + "=" * 60)
    print("PREPROCESSING")
    print("=" * 60)
    
    # Handle missing values
    for col in X.columns:
        if X[col].dtype == 'object':
            X[col] = X[col].fillna('Unknown')
        else:
            X[col] = X[col].fillna(X[col].median())
    
    # Identify categorical and numerical columns
    categorical_cols = X.select_dtypes(include=['object']).columns.tolist()
    numerical_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    
    print(f"Categorical: {categorical_cols}")
    print(f"Numerical: {len(numerical_cols)} columns")
    
    # Encode categorical columns
    encoders = {}
    for col in categorical_cols:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        encoders[col] = le
        print(f"  Encoded {col}: {list(le.classes_)}")
    
    # Scale numerical columns
    scaler = StandardScaler()
    X[numerical_cols] = scaler.fit_transform(X[numerical_cols])
    
    # Save preprocessors
    os.makedirs(os.path.dirname(SCALER_PATH), exist_ok=True)
    joblib.dump({'scaler': scaler, 'numerical_cols': numerical_cols}, SCALER_PATH)
    joblib.dump(encoders, ENCODER_PATH)
    print(f"\nSaved: {SCALER_PATH}, {ENCODER_PATH}")
    
    return X, y, encoders, scaler, numerical_cols, categorical_cols

def train_model(X_train, y_train):
    """Train model with balanced class weights"""
    print("\n" + "=" * 60)
    print("TRAINING MODEL")
    print("=" * 60)
    
    # Random Forest with balanced class weights
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight='balanced',  # Handle imbalanced data
        random_state=42,
        n_jobs=-1
    )
    
    print("Training Random Forest (balanced class weights)...")
    model.fit(X_train, y_train)
    
    # Cross-validation
    cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='roc_auc')
    print(f"5-Fold CV ROC-AUC: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
    
    # Calibrate for better probability estimates
    print("Calibrating probabilities...")
    calibrated = CalibratedClassifierCV(model, method='isotonic', cv=3)
    calibrated.fit(X_train, y_train)
    
    return calibrated

def evaluate(model, X_test, y_test):
    """Evaluate model"""
    print("\n" + "=" * 60)
    print("EVALUATION")
    print("=" * 60)
    
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    
    accuracy = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    
    print(f"\nTest Accuracy: {accuracy:.4f}")
    print(f"Test ROC-AUC: {auc:.4f}")
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Rejected', 'Approved']))
    
    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    print(f"\nConfusion Matrix:")
    print(f"  TN={cm[0,0]:4d}  FP={cm[0,1]:4d}")
    print(f"  FN={cm[1,0]:4d}  TP={cm[1,1]:4d}")
    
    # Probability distribution
    print("\nProbability Distribution (approved class):")
    print(f"  Min: {y_proba.min():.3f}, Max: {y_proba.max():.3f}")
    print(f"  Mean: {y_proba.mean():.3f}, Median: {np.median(y_proba):.3f}")
    
    return auc

def save_model(model, feature_names, numerical_cols, categorical_cols):
    """Save model with metadata"""
    model_data = {
        'model': model,
        'feature_names': feature_names,
        'numerical_cols': numerical_cols,
        'categorical_cols': categorical_cols
    }
    joblib.dump(model_data, MODEL_PATH)
    print(f"\nModel saved to: {MODEL_PATH}")
    print(f"Features: {feature_names}")

def main():
    # Load data
    df = load_data()
    
    # Select user-input-mappable features
    X, y, feature_names = select_features(df)
    
    # Preprocess
    X, y, encoders, scaler, numerical_cols, categorical_cols = preprocess(X, y)
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\nTrain: {len(X_train)} | Test: {len(X_test)}")
    
    # Train
    model = train_model(X_train, y_train)
    
    # Evaluate
    evaluate(model, X_test, y_test)
    
    # Save
    save_model(model, feature_names, numerical_cols, categorical_cols)
    
    print("\n" + "=" * 60)
    print("TRAINING COMPLETE!")
    print("=" * 60)

if __name__ == "__main__":
    main()
