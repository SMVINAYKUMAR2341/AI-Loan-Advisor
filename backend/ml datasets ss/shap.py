# =======================================================================
#  FINAL FIX — MATCH PREPROCESSOR TO MODEL'S EXPECTED FEATURES
# =======================================================================

!pip install shap fpdf2 joblib scikit-learn xgboost reportlab

import pandas as pd
import shap
import joblib
import numpy as np
from google.colab import files
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
import matplotlib.pyplot as plt
from fpdf import FPDF

plt.switch_backend("Agg")

# ============================================================
# STEP 1 — UPLOAD MODEL
# ============================================================
print("Upload your MODEL (.joblib)")
uploaded = files.upload()
model_file = list(uploaded.keys())[0]
model = joblib.load(model_file)
print("✔ Model Loaded")

# GET FEATURE NAMES FROM MODEL
model_features = model.get_booster().feature_names
print("\nMODEL EXPECTS FEATURES =", len(model_features))
print(model_features)

# ============================================================
#  STEP 2 — UPLOAD DATASET
# ============================================================
print("\n Upload DATASET (.csv)")
uploaded = files.upload()
dataset_file = list(uploaded.keys())[0]
df = pd.read_csv(dataset_file)

print("\nDataset:", df.shape)

# ============================================================
#  STEP 3 — CLEAN TARGET + ID
# ============================================================
target_cols = ["Loan Status (Target)", "Loan Status", "Loan_Status"]
df = df.drop(columns=[c for c in target_cols if c in df.columns], errors="ignore")

df = df.drop(columns=[c for c in df.columns if "id" in c.lower()], errors="ignore")

# ============================================================
#  STEP 4 — BUILD PREPROCESSOR TO MATCH MODEL FEATURES
# ============================================================
cat_cols = df.select_dtypes(include="object").columns.tolist()
num_cols = df.select_dtypes(include=["int", "float"]).columns.tolist()

preprocessor = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
        ("num", StandardScaler(), num_cols),
    ]
)

preprocessor.fit(df)

# GET GENERATED FEATURE NAMES
ohe = preprocessor.named_transformers_["cat"]
encoded_cat_names = ohe.get_feature_names_out(cat_cols)
numeric_names = num_cols

generated_features = list(encoded_cat_names) + numeric_names
print("\n🧩 Preprocessor Generated Features =", len(generated_features))

# ============================================================
#  STEP 5 — ALIGN FEATURES EXACTLY WITH MODEL EXPECTATION
# ============================================================
missing = set(model_features) - set(generated_features)
extra = set(generated_features) - set(model_features)

print("\n MISSING FEATURES (needed for model):", missing)
print(" EXTRA FEATURES (not used in model):", extra)

# BUILD EXACT FEATURE ORDER
final_feature_order = model_features

# ============================================================
#  STEP 6 — USER INPUT
# ============================================================
user_input = {
    "Gender": "Male",
    "Married": "Yes",
    "Dependents": 1,
    "Education": "Graduate",
    "Employment Type": "Salaried",
    "Applicant Income": 5000,
    "Co-applicant Income": 0,
    "Loan Amount": 150,
    "Loan Amount Term": 360,
    "Credit History": 1.0,
    "Property Area": "Urban"
}

user_df = pd.DataFrame([user_input])

# Fill missing columns
for col in df.columns:
    if col not in user_df.columns:
        user_df[col] = df[col].mode()[0]

user_df = user_df[df.columns]  # exact alignment

# Preprocess
user_pre_full = preprocessor.transform(user_df)

# Convert to DataFrame with generated feature names
user_pre_df = pd.DataFrame(user_pre_full.toarray() 
                           if hasattr(user_pre_full, "toarray") else user_pre_full,
                           columns=generated_features)

# MATCH MODEL EXPECTED ORDER
user_pre_final = user_pre_df.reindex(columns=final_feature_order, fill_value=0)

print("\n✔ FINAL USER INPUT SHAPE:", user_pre_final.shape)

# ============================================================
#  STEP 7 — PREDICT
# ============================================================
prob = model.predict_proba(user_pre_final)[0][1]
pred = model.predict(user_pre_final)[0]
status = "Approved" if pred == 1 else "Rejected"

print("\nPrediction:", status)
print("Probability:", prob)

# ============================================================
#  STEP 8 — SHAP
# ============================================================
explainer = shap.TreeExplainer(model)
shap_vals = explainer(user_pre_final)

shap.plots.waterfall(shap_vals[0], show=False)
plt.savefig("waterfall.png", bbox_inches="tight")
plt.close()

shap.plots.bar(shap_vals, show=False)
plt.savefig("barplot.png", bbox_inches="tight")
plt.close()

# ============================================================
#  STEP 9 — PDF REPORT
# ============================================================
pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", "B", 18)
pdf.cell(180, 10, "Loan Eligibility Report", ln=True, align="C")

pdf.set_font("Arial", size=12)
pdf.cell(200, 10, f"Prediction: {status}", ln=True)
pdf.cell(200, 10, f"Probability: {prob:.4f}", ln=True)

pdf.set_font("Arial", "B", 14)
pdf.ln(5)
pdf.cell(200, 10, "User Input:", ln=True)
pdf.set_font("Arial", size=12)

for k, v in user_input.items():
    pdf.cell(200, 8, f"{k}: {v}", ln=True)

pdf.image("waterfall.png", w=180)
pdf.ln(5)
pdf.image("barplot.png", w=180)

pdf.output("Loan_Explanation_Report.pdf")
files.download("Loan_Explanation_Report.pdf")

print("\ DONE — PDF READY & DOWNLOADED!")
