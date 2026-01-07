"""
Analyze PR_Dset for Approved, Pending, and Rejected distribution
Based on XGBoost model predictions and decision thresholds
"""
import pandas as pd
import joblib
import numpy as np
import os

def analyze_status_distribution():
    # Paths
    dataset_path = r'c:\Users\AsusUser\Downloads\InfosysSpringboard-Virtual-Internship-6.0-master\InfosysSpringboard-Virtual-Internship-6.0-master\backend\PR_Dset\loan_data.csv'
    model_path = r'c:\Users\AsusUser\Downloads\InfosysSpringboard-Virtual-Internship-6.0-master\InfosysSpringboard-Virtual-Internship-6.0-master\backend\loan_model.joblib'
    encoder_path = r'c:\Users\AsusUser\Downloads\InfosysSpringboard-Virtual-Internship-6.0-master\InfosysSpringboard-Virtual-Internship-6.0-master\backend\loan_encoders.joblib'
    
    if not os.path.exists(model_path) or not os.path.exists(encoder_path):
        print("Model or Encoders not found. Please train the model first.")
        return

    model_data = joblib.load(model_path)
    encoder_data = joblib.load(encoder_path)
    
    model = model_data['model']
    ohe = encoder_data['ohe']
    scaler = encoder_data['scaler']
    feature_names = encoder_data['feature_names']
    cat_columns = encoder_data['cat_columns']
    num_columns = encoder_data['num_columns']

    df = pd.read_csv(dataset_path)
    print(f"Total records in PR_Dset: {len(df)}")
    
    # Preprocess
    DROP_COLS = ['loan_int_rate', 'person_gender']
    df_clean = df.drop(columns=DROP_COLS, errors='ignore').dropna()
    
    # OHE
    encoded = ohe.transform(df_clean[cat_columns])
    df_ohe = pd.DataFrame(encoded, columns=ohe.get_feature_names_out(cat_columns), index=df_clean.index)
    
    # Scale
    df_num_scaled = pd.DataFrame(scaler.transform(df_clean[num_columns]), columns=num_columns, index=df_clean.index)
    
    # Combine
    X_processed = pd.concat([df_ohe, df_num_scaled], axis=1)
    X_processed = X_processed[feature_names]
    
    # Predict probabilities (0 = Approved class)
    probs = model.predict_proba(X_processed)[:, 0]
    
    # Apply decision thresholds
    # APPROVED: >= 75%
    # PENDING_REVIEW: 45% to 75%
    # REJECTED: < 45%
    
    approved = (probs >= 0.75).sum()
    pending = ((probs >= 0.45) & (probs < 0.75)).sum()
    rejected = (probs < 0.45).sum()
    
    total = len(probs)
    
    print("\n" + "="*60)
    print("STATUS DISTRIBUTION BASED ON XGBOOST MODEL")
    print("="*60)
    print(f"\nAPPROVED (>=75% confidence):     {approved:>6} ({approved/total*100:.2f}%)")
    print(f"PENDING_REVIEW (45-75%):         {pending:>6} ({pending/total*100:.2f}%)")
    print(f"REJECTED (<45% confidence):      {rejected:>6} ({rejected/total*100:.2f}%)")
    print("-"*60)
    print(f"TOTAL:                           {total:>6}")
    
    # Compare with actual labels in dataset
    print("\n" + "="*60)
    print("COMPARISON WITH ACTUAL DATASET LABELS")
    print("="*60)
    actual_approved = (df_clean['loan_status'] == 0).sum()
    actual_rejected = (df_clean['loan_status'] == 1).sum()
    print(f"\nActual Approved (loan_status=0): {actual_approved:>6} ({actual_approved/total*100:.2f}%)")
    print(f"Actual Rejected (loan_status=1): {actual_rejected:>6} ({actual_rejected/total*100:.2f}%)")
    
    # Breakdown by loan intent for PENDING cases
    df_clean['approval_prob'] = probs
    pending_df = df_clean[(df_clean['approval_prob'] >= 0.45) & (df_clean['approval_prob'] < 0.75)]
    
    print("\n" + "="*60)
    print("PENDING CASES BY LOAN INTENT")
    print("="*60)
    print(pending_df['loan_intent'].value_counts())
    
    print("\n" + "="*60)
    print("PENDING CASES - PREVIOUS DEFAULTS")
    print("="*60)
    print(pending_df['previous_loan_defaults_on_file'].value_counts())

if __name__ == "__main__":
    analyze_status_distribution()
