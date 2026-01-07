"""
Loan Model Training Script - Uses PR_Dset/loan_data.csv with SMOTE + OneHotEncoding
Based on the optimized approach from PR_Dset/extra/Xgboost.ipynb
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.metrics import classification_report, roc_auc_score, accuracy_score, confusion_matrix
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
import joblib
import os
import warnings
warnings.filterwarnings('ignore')

# Paths - Using the dataset from PR_Dset (as per extra notebook)
DATA_PATH = "PR_Dset/loan_data.csv"
MODEL_PATH = "loan_model.joblib"
SCALER_PATH = "loan_scaler.joblib"
ENCODER_PATH = "loan_encoders.joblib"

# Columns to drop (as per extra notebook)
DROP_COLS = ['loan_int_rate', 'person_gender']

# Target column
TARGET = 'loan_status'


def load_data():
    """Load dataset"""
    df = pd.read_csv(DATA_PATH)
    print("=" * 60)
    print("ML MODEL TRAINING - PR_Dset/loan_data.csv")
    print("Using SMOTE + OneHotEncoding (from extra/Xgboost.ipynb)")
    print("=" * 60)
    print(f"\nDataset: {df.shape[0]} rows, {df.shape[1]} columns")
    print(f"Columns: {list(df.columns)}")
    return df


def preprocess(df):
    """Preprocess data - following extra notebook approach"""
    print("\n" + "=" * 60)
    print("PREPROCESSING")
    print("=" * 60)
    
    # Drop columns not useful for prediction
    df = df.drop(columns=DROP_COLS, errors='ignore')
    print(f"Dropped: {DROP_COLS}")
    
    # Drop duplicates
    original_len = len(df)
    df = df.drop_duplicates()
    print(f"Dropped {original_len - len(df)} duplicates")
    
    # Handle missing values
    df = df.dropna()
    print(f"Final shape after cleaning: {df.shape}")
    
    # Identify categorical columns
    cat_columns = df.select_dtypes(include=['object']).columns.tolist()
    num_columns = df.select_dtypes(include=[np.number]).columns.tolist()
    num_columns = [c for c in num_columns if c != TARGET]
    
    print(f"\nCategorical columns: {cat_columns}")
    print(f"Numerical columns: {num_columns}")
    
    # OneHotEncode categorical columns
    ohe = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
    encoded = ohe.fit_transform(df[cat_columns])
    df_ohe = pd.DataFrame(encoded, columns=ohe.get_feature_names_out(cat_columns), index=df.index)
    
    print(f"OneHotEncoded features: {df_ohe.shape[1]}")
    
    # Scale numerical columns
    scaler = StandardScaler()
    df_num = df[num_columns].copy()
    df_num_scaled = pd.DataFrame(scaler.fit_transform(df_num), columns=num_columns, index=df.index)
    
    # Combine encoded and numerical
    df_encoded = pd.concat([df_ohe, df_num_scaled], axis=1)
    
    # Separate features and target
    X = df_encoded
    y = df[TARGET]
    
    print(f"\nFinal feature shape: {X.shape}")
    print(f"Target distribution:\n{y.value_counts()}")
    
    # Save preprocessors
    joblib.dump({
        'ohe': ohe,
        'scaler': scaler,
        'cat_columns': cat_columns,
        'num_columns': num_columns,
        'feature_names': list(X.columns)
    }, ENCODER_PATH)
    print(f"\nSaved encoders to: {ENCODER_PATH}")
    
    return X, y, ohe, scaler, cat_columns, num_columns


def apply_smote(X, y):
    """Apply SMOTE for class imbalance"""
    print("\n" + "=" * 60)
    print("APPLYING SMOTE")
    print("=" * 60)
    
    print(f"Before SMOTE: {dict(pd.Series(y).value_counts())}")
    
    sm = SMOTE(random_state=42)
    X_resampled, y_resampled = sm.fit_resample(X, y)
    
    print(f"After SMOTE: {dict(pd.Series(y_resampled).value_counts())}")
    
    return X_resampled, y_resampled


def train_model(X_train, y_train):
    """Train XGBoost model with optimized hyperparameters"""
    print("\n" + "=" * 60)
    print("TRAINING MODEL (XGBoost)")
    print("=" * 60)
    
    # Best parameters from GridSearchCV in extra notebook
    model = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric='logloss',
        random_state=42,
        n_jobs=-1
    )
    
    print("Training XGBoost with optimized parameters...")
    print("  n_estimators=300, max_depth=6, learning_rate=0.1")
    print("  subsample=0.8, colsample_bytree=0.8")
    
    model.fit(X_train, y_train)
    
    # Cross-validation
    cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='roc_auc')
    print(f"\n5-Fold CV ROC-AUC: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
    
    return model


def evaluate(model, X_test, y_test):
    """Evaluate model"""
    print("\n" + "=" * 60)
    print("EVALUATION")
    print("=" * 60)
    
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    
    accuracy = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    
    print(f"\nTest Accuracy: {accuracy * 100:.2f}%")
    print(f"Test ROC-AUC: {auc:.4f}")
    
    print("\nDetailed Classification Report:")
    # In this dataset: 0 = Approved, 1 = Rejected
    print(classification_report(y_test, y_pred, target_names=['Approved', 'Rejected']))
    
    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    print(f"\nConfusion Matrix:")
    print(f"  TN={cm[0,0]:5d}  FP={cm[0,1]:5d}")
    print(f"  FN={cm[1,0]:5d}  TP={cm[1,1]:5d}")
    
    return auc


def save_model(model, feature_names):
    """Save model with metadata"""
    model_data = {
        'model': model,
        'feature_names': feature_names,
        'dataset': 'PR_Dset/loan_data.csv',
        'preprocessing': 'SMOTE + OneHotEncoding',
        'version': '3.0'
    }
    joblib.dump(model_data, MODEL_PATH)
    print(f"\nModel saved to: {MODEL_PATH}")
    print(f"Total features: {len(feature_names)}")


def main():
    # Load data
    df = load_data()
    
    # Preprocess
    X, y, ohe, scaler, cat_columns, num_columns = preprocess(df)
    
    # Apply SMOTE
    X_resampled, y_resampled = apply_smote(X, y)
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X_resampled, y_resampled, test_size=0.2, random_state=42, stratify=y_resampled
    )
    print(f"\nTrain: {len(X_train)} | Test: {len(X_test)}")
    
    # Train
    model = train_model(X_train, y_train)
    
    # Evaluate
    evaluate(model, X_test, y_test)
    
    # Save
    save_model(model, list(X.columns))
    
    print("\n" + "=" * 60)
    print("TRAINING COMPLETE!")
    print("=" * 60)


if __name__ == "__main__":
    main()
