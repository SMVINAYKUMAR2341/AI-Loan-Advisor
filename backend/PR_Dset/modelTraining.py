import xgboost as xgb
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import *
from sklearn.utils.class_weight import compute_class_weight
data = pd.read_csv("loan_dataS.csv")
# data = pd.read_csv("loan_dataUnderSmapled.csv")
X = data[data.columns[:-1]].to_numpy()
y = data[data.columns[-1]].to_numpy()

# features = [
#     'person_education',
#     'person_home_ownership',
#     'loan_intent',
#     'previous_loan_defaults_on_file'    
# ]

cc= [1,4,6,10]
ff = [0,2,3,5,7,8,9]
X = pd.DataFrame(X)

for col in cc:
    X[col] = X[col].astype('category')
for col in ff:
    X[col] = X[col].astype('float')


xTrain,xTest,yTrain,yTest = train_test_split(
                                                X, 
                                                 y, 
                                                 test_size=0.22,
                                                random_state=42,
                                                stratify=y
                                            )

# print(np.unique(yTrain))




cWeights = compute_class_weight(class_weight='balanced',classes=np.unique(yTrain),y=yTrain)
sample_weights = np.array([cWeights[0] if y==0 else cWeights[1] for y in yTrain])
print(cWeights)
xgbModel = xgb.XGBClassifier(scale_pos_weight = cWeights[0]/cWeights[1], enable_categorical=True)
# xgbModel = xgb.XGBClassifier(scale_pos_weight = 0.30, enable_categorical=True)
# xgbModel.fit(xTrain, yTrain, sample_weight = sample_weights)
xgbModel.fit(xTrain, yTrain,sample_weight = sample_weights )
y_pred = xgbModel.predict(xTest)
print(classification_report(yTest, y_pred))
print("Accuracy : ",accuracy_score(yTest, y_pred))
print("roc auc score : ",roc_auc_score(yTest, y_pred,multi_class='ovr', average='macro'))

xgbModel.save_model("finalModel.json")
'''
o/p :- 

[0.64285714 2.25      ]
              precision    recall  f1-score   support

           0       0.94      0.93      0.93      7700
           1       0.77      0.78      0.77      2200

    accuracy                           0.90      9900
   macro avg       0.85      0.86      0.85      9900
weighted avg       0.90      0.90      0.90      9900

Accuracy :  0.8981818181818182
roc auc score :  0.8556493506493508



'''