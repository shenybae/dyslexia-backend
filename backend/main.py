from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import pandas as pd
import pickle

# Load model, scaler, and label encoder
model = pickle.load(open("best_mobile_dyslexia_model.pkl", "rb"))
scaler = pickle.load(open("best_mobile_dyslexia_model_scaler.pkl", "rb"))
label_encoder = pickle.load(open("best_mobile_dyslexia_model_labels.pkl", "rb"))

app = FastAPI()

# Allow Mobile App Access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Allow all mobile devices
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Dyslexia Prediction API is Running!"}

@app.post("/predict")
def predict(data: dict):
    # Convert JSON data into DataFrame
    X = pd.DataFrame([data])

    # Scale features before prediction
    X_scaled = scaler.transform(X)

    # Predict severity
    prediction = model.predict(X_scaled)
    difficulty_level = label_encoder.inverse_transform(prediction)[0]

    return {
        "difficulty_level": difficulty_level
    }
