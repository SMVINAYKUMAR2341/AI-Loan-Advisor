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


'''

data.replace({
    "Yes" : 1,
    "No" : 0,
    "male" : 1,
    "female" : 0
},inplace=True)

# print(chi2(data[features],data['loan_status'])) 

output for previous_loan_defaults_on_file : (array([6530.85714286]), array([0.]))
Strong relation

output for person_gender : (array([0.00635183]), array([0.93647718]))
No significant relation

'''
# output shows a very strong and significant relationship


# print(data['previous_loan_defaults_on_file'].value_counts())

# Simplified (basically)
data.to_csv("loan_dataS.csv",index=False)


''' 
    The point biseral coefficient is a method(score) used to determine
    correltaion between a continuous feture and a categorical(binary) feature
'''
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

X0 = data0["cb_person_cred_hist_length"]
X1 = data1["cb_person_cred_hist_length"]
print(pointBiseralCoeff(X0,X1)) 


'''
# X0 = data0['loan_percent_income']
# X0 = data0['credit_score']
# X0 = data0["person_income"]
X0 = data0["person_emp_exp"]
X0 = data0["cb_person_cred_hist_length"]
X0 = data0["loan_amnt"]

# X1 = data1['loan_percent_income']
# X1 = data1['credit_score']
# X1 = data1["person_income"]
X1 = data1["person_emp_exp"]
X1 = data1["cb_person_cred_hist_length"]
X1 = data1["loan_amnt"]


print(pointBiseralCoeff(X0,X1)) 

output : 0.3848803799720417 for "loan_percent_income"-> Shows a MODERATELY STRONG RELATIONSHIP
output : -0.007647176334884879 for "credit_score"
output : -0.13580771683574247 for "person_income"-> Shows a WEAK NEGATIVE RELATIONSHIP
output : -0.02048125886337787 for "person_emp_exp"-> Shows a VERY WEAK NEGATIVE RELATIONSHIP
output : -0.014850683660985917 for "cb_person_cred_hist_length"-> Shows a VERY WEAK RELATIONSHIP
output : 0.10771446698132857 for "loan_amnt"-> Shows a  WEAK RELATIONSHIP

'''