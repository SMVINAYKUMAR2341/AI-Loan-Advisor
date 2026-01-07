
import pandas as pd
import joblib
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder
import os

def analyze_pending():
    # Load model and data
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
    
    # Preprocess
    # 1. DROP COLS
    DROP_COLS = ['loan_int_rate', 'person_gender']
    df_clean = df.drop(columns=DROP_COLS, errors='ignore').dropna()
    
    # 2. OHE
    encoded = ohe.transform(df_clean[cat_columns])
    df_ohe = pd.DataFrame(encoded, columns=ohe.get_feature_names_out(cat_columns), index=df_clean.index)
    
    # 3. Scale
    df_num_scaled = pd.DataFrame(scaler.transform(df_clean[num_columns]), columns=num_columns, index=df_clean.index)
    
    # 4. Combine
    X_processed = pd.concat([df_ohe, df_num_scaled], axis=1)
    # Ensure column order matches
    X_processed = X_processed[feature_names]
    
    # Predict probabilities
    # 0 is Approved, 1 is Rejected
    probs = model.predict_proba(X_processed)[:, 0]
    
    df_clean['approval_prob'] = probs
    
    # Filter for PENDING (0.45 to 0.75)
    pending_df = df_clean[(df_clean['approval_prob'] >= 0.45) & (df_clean['approval_prob'] < 0.75)].copy()
    
    print(f"Total entries: {len(df_clean)}")
    print(f"Pending entries: {len(pending_df)} ({len(pending_df)/len(df_clean)*100:.2f}%)")
    
    if len(pending_df) == 0:
        print("No pending cases found with current thresholds.")
        return

    # Analyze characteristics of PENDING cases
    print("\n--- Archetypes of Pending Approvals ---")
    
    metrics = ['person_income', 'loan_amnt', 'credit_score', 'loan_percent_income']
    for m in metrics:
        print(f"\n{m}:")
        print(f"  Overall Mean: {df_clean[m].mean():.2f}")
        print(f"  Pending Mean: {pending_df[m].mean():.2f}")
        print(f"  Pending Range: {pending_df[m].min()} - {pending_df[m].max()}")

    # Categorical distribution
    print("\nLoan Purpose distribution in Pending:")
    print(pending_df['loan_intent'].value_counts(normalize=True).head())

    print("\nPrevious Defaults in Pending:")
    print(pending_df['previous_loan_defaults_on_file'].value_counts(normalize=True))

if __name__ == "__main__":
    analyze_pending()
