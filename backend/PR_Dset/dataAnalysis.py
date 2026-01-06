import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
# from sklearn.feature_selection import *
f = ["cb_person_cred_hist_length"]
data = pd.read_csv("loan_data_copy.csv")
print(data[f].value_counts())
print(data[data['person_age']>100])
# print(data.groupby("person_home_ownership").count(),"\n\n")
# print(data.groupby("loan_status").count(),"\n\n")
# print(data.groupby("loan_intent").count(),"\n\n")
# print(data.groupby("person_education").count(),"\n\n")
# print(data.value_counts())
# print(data.corr(method='pearson'))
features = [
    "person_age",
    "person_gender",
    "person_education",
    "person_income",
    "person_emp_exp",
    "person_home_ownership",
    "loan_amnt",
    "loan_intent",
    "loan_int_rate",
    "loan_percent_income",
    "cb_person_cred_hist_length",
    "credit_score",
    "previous_loan_defaults_on_file"
]



data0 = data[data['loan_status']==0]
data1 = data[data['loan_status']==1]

# print(data0['cb_person_cred_hist_length'].mode())
# print(data1['cb_person_cred_hist_length'].mode())