import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.feature_selection import *
features = [
    "previous_loan_defaults_on_file",
    "person_gemder"
]
data = pd.read_csv("loan_data.csv")




data.drop(columns=["loan_int_rate", "person_gender"], axis=1, inplace=True)

# output shows a very strong and significant relationship


# print(data['previous_loan_defaults_on_file'].value_counts())



def pointBiseralCoeff(x0,x1):
    m0 = x0.mean()
    m1 = x1.mean()
    s = np.concatenate([x0,x1]).std()
    n0 = len(x0)
    n1 = len(x1)
    n = n0 + n1

    return (((m1 - m0 )/s) * np.sqrt(n0*n1/(n**2)))


data0 = data[data['loan_status']==0]
data1 = data[data['loan_status']==1]

s0 = data0.sample(10000)

data = pd.concat([data1,s0],ignore_index=True)

# Simplified (basically)
data.to_csv("loan_dataUnderSmapled.csv",index=False)
