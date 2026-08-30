import os
os.environ["JOBLIB_MULTIPROCESSING"] = "0"
os.environ["LOKY_MAX_CPU_COUNT"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"

import sys
import json
import pickle
import warnings
import pandas as pd

from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

warnings.filterwarnings("ignore")

BASE_DIR       = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SYNTHETIC_DATA = os.path.join(BASE_DIR, "data", "synthetic_training_data.csv")
REAL_DATA      = os.path.join(BASE_DIR, "data", "user_activity_export.csv")
DATA_PATH      = SYNTHETIC_DATA if os.path.exists(SYNTHETIC_DATA) else REAL_DATA

MODEL_DIR  = os.path.join(BASE_DIR, "ai", "models")
REPORT_DIR = os.path.join(BASE_DIR, "ai", "reports")
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(REPORT_DIR, exist_ok=True)

def main():
    df = pd.read_csv(DATA_PATH)
    df["productive"] = df["productive"].astype(str).str.lower().map({"true": 1, "false": 0})
    df = df.dropna(subset=["productive"])
    df["productive"] = df["productive"].astype(int)

    le_user_type   = LabelEncoder()
    le_app_website = LabelEncoder()

    df["user_type_enc"]   = le_user_type.fit_transform(df["user_type"].astype(str))
    df["app_website_enc"] = le_app_website.fit_transform(df["app_website"].astype(str))

    df["duration_minutes"] = pd.to_numeric(df["duration_minutes"], errors="coerce").fillna(0)
    df["switch_tabs"]      = pd.to_numeric(df["switch_tabs"], errors="coerce").fillna(0)

    FEATURES = ["duration_minutes", "switch_tabs", "user_type_enc", "app_website_enc"]
    TARGET   = "productive"

    X = df[FEATURES]
    y = df[TARGET]

    # 70% Train, 30% Test (random split)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.30, random_state=None)

    dt = DecisionTreeClassifier(criterion="gini", random_state=42)
    rf = RandomForestClassifier(n_estimators=30, criterion="gini", random_state=42)

    dt.fit(X_train, y_train)
    rf.fit(X_train, y_train)

    dt_pred = dt.predict(X_test)
    rf_pred = rf.predict(X_test)

    dt_acc  = accuracy_score(y_test, dt_pred)
    dt_prec = precision_score(y_test, dt_pred, zero_division=0)
    dt_rec  = recall_score(y_test, dt_pred, zero_division=0)
    dt_f1   = f1_score(y_test, dt_pred, zero_division=0)

    rf_acc  = accuracy_score(y_test, rf_pred)
    rf_prec = precision_score(y_test, rf_pred, zero_division=0)
    rf_rec  = recall_score(y_test, rf_pred, zero_division=0)
    rf_f1   = f1_score(y_test, rf_pred, zero_division=0)

    models_res = {
        "Decision Tree": {
            "model": dt,
            "accuracy": round(dt_acc * 100, 2),
            "precision": round(dt_prec * 100, 2),
            "recall": round(dt_rec * 100, 2),
            "f1_score": round(dt_f1 * 100, 2),
        },
        "Random Forest": {
            "model": rf,
            "accuracy": round(rf_acc * 100, 2),
            "precision": round(rf_prec * 100, 2),
            "recall": round(rf_rec * 100, 2),
            "f1_score": round(rf_f1 * 100, 2),
        }
    }

    best_name = "Random Forest" if rf_f1 >= dt_f1 else "Decision Tree"

    # Save models
    with open(os.path.join(MODEL_DIR, "decision_tree.pkl"), "wb") as f:
        pickle.dump(dt, f)
    with open(os.path.join(MODEL_DIR, "random_forest.pkl"), "wb") as f:
        pickle.dump(rf, f)
    with open(os.path.join(MODEL_DIR, "label_encoders.pkl"), "wb") as f:
        pickle.dump({"user_type": le_user_type, "app_website": le_app_website}, f)

    metrics_data = {
        "dataset": "Synthetic Activity Dataset (500 samples)",
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "train_split": "70%",
        "test_split": "30%",
        "best_model": best_name,
        "models": {
            k: {
                "accuracy": v["accuracy"],
                "precision": v["precision"],
                "recall": v["recall"],
                "f1_score": v["f1_score"],
            }
            for k, v in models_res.items()
        }
    }

    metrics_path = os.path.join(MODEL_DIR, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics_data, f, indent=2)

    print("METRICS_SUCCESS", flush=True)

if __name__ == "__main__":
    main()
