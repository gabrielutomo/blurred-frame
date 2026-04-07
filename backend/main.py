"""
FastAPI Backend for AI Image Detector
Endpoint: POST /predict — returns {label, confidence}
"""

import io
import os
import numpy as np
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
import tensorflow as tf

# ─── Config ───────────────────────────────────────────────────────────────────
MODEL_PATH = Path(__file__).parent / "model" / "cnn_model.h5"
IMG_SIZE = (32, 32)

# ─── Global model ─────────────────────────────────────────────────────────────
model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model on startup."""
    global model
    if MODEL_PATH.exists():
        print(f"[INFO] Loading model from {MODEL_PATH}...")
        model = tf.keras.models.load_model(str(MODEL_PATH))
        print("[INFO] Model loaded successfully!")
    else:
        print(f"[WARNING] Model not found at {MODEL_PATH}")
        print("[WARNING] Please run train_model.py first to train the model.")
    yield
    # Cleanup
    model = None


# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI Image Detector API",
    description="CNN-based classifier: Real vs AI-Generated images",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Helper ───────────────────────────────────────────────────────────────────
def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Load image bytes, resize, normalize, and add batch dim."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(IMG_SIZE)
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)  # (1, 64, 64, 3)


# ─── Routes ───────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "AI Image Detector API is running",
        "model_loaded": model is not None,
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": model is not None}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    global model
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model belum dimuat. Jalankan train_model.py terlebih dahulu."
        )

    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Tipe file tidak didukung: {file.content_type}. Gunakan JPEG, PNG, atau WebP."
        )

    # Read and preprocess
    try:
        image_bytes = await file.read()
        img_array = preprocess_image(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal memproses gambar: {str(e)}")

    # Inference
    try:
        # Reload model if it's not present (safeguard)
        if model is None and MODEL_PATH.exists():
            model = tf.keras.models.load_model(str(MODEL_PATH))
        
        raw_score = float(model.predict(img_array, verbose=0)[0][0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

    # Interpret result
    # raw_score > 0.5 → AI Generated, else → Real
    is_ai = raw_score > 0.5
    label = "AI Generated" if is_ai else "Real Image"
    confidence = raw_score if is_ai else (1.0 - raw_score)

    return JSONResponse({
        "label": label,
        "confidence": round(confidence, 4),
        "raw_score": round(raw_score, 4),
        "is_ai": is_ai,
    })
