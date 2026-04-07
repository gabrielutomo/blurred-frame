"""
CNN Model Training Script for AI Image Detector
Dataset: CIFAKE - Real and AI-Generated Synthetic Images
Source: https://www.kaggle.com/datasets/birdy654/cifake-real-and-ai-generated-synthetic-images

Cara menjalankan:
1. Pastikan kaggle.json sudah ada di C:/Users/<username>/.kaggle/kaggle.json
2. pip install -r requirements.txt
3. python train_model.py
"""

import os
import sys
import numpy as np
import zipfile
import shutil
from pathlib import Path
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
from PIL import Image

# ─── Config ───────────────────────────────────────────────────────────────────
IMG_SIZE = (32, 32)
BATCH_SIZE = 128
EPOCHS = 30
DATASET_DIR = Path("dataset")
MODEL_DIR = Path("model")
MODEL_PATH = MODEL_DIR / "cnn_model.h5"
DATASET_ZIP = "cifake-real-and-ai-generated-synthetic-images.zip"

# ─── Download Dataset ──────────────────────────────────────────────────────────
def download_dataset():
    """Download CIFAKE dataset from Kaggle."""
    if DATASET_DIR.exists() and any(DATASET_DIR.iterdir()):
        print("[INFO] Dataset sudah ada, skip download.")
        return

    print("[INFO] Mendownload dataset CIFAKE dari Kaggle...")
    try:
        import kaggle
        kaggle.api.authenticate()
        kaggle.api.dataset_download_files(
            "birdy654/cifake-real-and-ai-generated-synthetic-images",
            path=".",
            unzip=False
        )
        print("[INFO] Download selesai. Mengekstrak...")
        with zipfile.ZipFile(DATASET_ZIP, "r") as z:
            z.extractall(DATASET_DIR)
        os.remove(DATASET_ZIP)
        print("[INFO] Ekstrak selesai.")
    except Exception as e:
        print(f"[ERROR] Gagal download dari Kaggle: {e}")
        print("[HINT] Pastikan file kaggle.json ada di ~/.kaggle/kaggle.json")
        print("[HINT] Atau download manual dan ekstrak ke folder 'dataset/'")
        sys.exit(1)


# ─── Load Images ──────────────────────────────────────────────────────────────
def load_images_from_folder(folder: Path, label: int, max_samples: int = 50000):
    """Load images from a folder and return arrays."""
    images = []
    labels = []
    count = 0
    for img_path in folder.glob("*"):
        if img_path.suffix.lower() not in [".jpg", ".jpeg", ".png", ".webp"]:
            continue
        try:
            img = Image.open(img_path).convert("RGB").resize(IMG_SIZE)
            images.append(np.array(img, dtype=np.float32) / 255.0)
            labels.append(label)
            count += 1
            if count >= max_samples:
                break
        except Exception:
            continue
    return images, labels


def load_dataset():
    """Load REAL and FAKE images from dataset directory."""
    print("[INFO] Memuat dataset...")

    # Try common folder structures from CIFAKE
    possible_structures = [
        # Structure 1: dataset/train/REAL, dataset/train/FAKE
        (DATASET_DIR / "train" / "REAL", DATASET_DIR / "train" / "FAKE"),
        # Structure 2: dataset/REAL, dataset/FAKE
        (DATASET_DIR / "REAL", DATASET_DIR / "FAKE"),
        # Structure 3: dataset/real, dataset/fake (lowercase)
        (DATASET_DIR / "real", DATASET_DIR / "fake"),
    ]

    real_dir, fake_dir = None, None
    for r, f in possible_structures:
        if r.exists() and f.exists():
            real_dir, fake_dir = r, f
            break

    if real_dir is None:
        # Search recursively
        real_dirs = list(DATASET_DIR.rglob("REAL")) + list(DATASET_DIR.rglob("real"))
        fake_dirs = list(DATASET_DIR.rglob("FAKE")) + list(DATASET_DIR.rglob("fake"))
        if real_dirs and fake_dirs:
            real_dir, fake_dir = real_dirs[0], fake_dirs[0]
        else:
            print(f"[ERROR] Tidak bisa menemukan folder REAL/FAKE di {DATASET_DIR}")
            print(f"[INFO] Struktur folder yang ada:")
            for p in DATASET_DIR.rglob("*"):
                if p.is_dir():
                    print(f"  {p}")
            sys.exit(1)

    print(f"[INFO] Real images: {real_dir}")
    print(f"[INFO] Fake images: {fake_dir}")

    # Load: label 0 = REAL, label 1 = AI/FAKE
    real_imgs, real_labels = load_images_from_folder(real_dir, label=0, max_samples=50000)
    fake_imgs, fake_labels = load_images_from_folder(fake_dir, label=1, max_samples=50000)

    print(f"[INFO] Loaded {len(real_imgs)} real images, {len(fake_imgs)} AI images")

    X = np.array(real_imgs + fake_imgs, dtype=np.float32)
    y = np.array(real_labels + fake_labels, dtype=np.float32)

    # Shuffle
    idx = np.random.permutation(len(X))
    return X[idx], y[idx]


# ─── Build CNN Model ──────────────────────────────────────────────────────────
def build_model(input_shape=(64, 64, 3)):
    """Build CNN architecture for binary classification."""
    model = keras.Sequential([
        # Block 1 - Low level features
        layers.Conv2D(32, (3, 3), padding="same", activation="relu", input_shape=input_shape),
        layers.BatchNormalization(),
        layers.Conv2D(64, (3, 3), padding="same", activation="relu"),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.2),

        # Block 2 - Mid level features
        layers.Conv2D(128, (3, 3), padding="same", activation="relu"),
        layers.BatchNormalization(),
        layers.Conv2D(128, (3, 3), padding="same", activation="relu"),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.3),

        # Block 3 - High level features
        layers.Conv2D(256, (3, 3), padding="same", activation="relu"),
        layers.BatchNormalization(),
        layers.Conv2D(256, (3, 3), padding="same", activation="relu"),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.4),

        # Block 4 - Deep abstractions
        layers.Conv2D(512, (3, 3), padding="same", activation="relu"),
        layers.BatchNormalization(),
        layers.GlobalAveragePooling2D(),

        # Classifier
        layers.Dense(512, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        layers.Dense(1, activation="sigmoid"),
    ])

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=3e-4),
        loss="binary_crossentropy",
        metrics=["accuracy"]
    )
    return model


# ─── Train ────────────────────────────────────────────────────────────────────
def train():
    MODEL_DIR.mkdir(exist_ok=True)

    # Download dataset if needed
    download_dataset()

    # Load data
    X, y = load_dataset()
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    print(f"[INFO] Train: {len(X_train)}, Val: {len(X_val)}")

    # Build model
    model = build_model(input_shape=(*IMG_SIZE, 3))
    model.summary()

    # Data augmentation (ringan untuk stabilitas awal)
    data_augmentation = keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomTranslation(0.1, 0.1),
        layers.RandomZoom(0.1),
    ])

    # Augment training data
    train_ds = tf.data.Dataset.from_tensor_slices((X_train, y_train))
    train_ds = (train_ds
                .shuffle(1000)
                .batch(BATCH_SIZE)
                .map(lambda x, y: (data_augmentation(x, training=True), y))
                .prefetch(tf.data.AUTOTUNE))

    val_ds = tf.data.Dataset.from_tensor_slices((X_val, y_val))
    val_ds = val_ds.batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)

    # Callbacks
    callbacks = [
        EarlyStopping(monitor="val_accuracy", patience=5, restore_best_weights=True, verbose=1),
        ModelCheckpoint(str(MODEL_PATH), save_best_only=True, monitor="val_accuracy", verbose=1),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3, verbose=1),
    ]

    # Train
    print("[INFO] Mulai training...")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS,
        callbacks=callbacks,
    )

    # Plot training history
    plt.figure(figsize=(12, 4))
    plt.subplot(1, 2, 1)
    plt.plot(history.history["accuracy"], label="Train Acc")
    plt.plot(history.history["val_accuracy"], label="Val Acc")
    plt.title("Accuracy")
    plt.legend()

    plt.subplot(1, 2, 2)
    plt.plot(history.history["loss"], label="Train Loss")
    plt.plot(history.history["val_loss"], label="Val Loss")
    plt.title("Loss")
    plt.legend()

    plt.tight_layout()
    plt.savefig(MODEL_DIR / "training_history.png")
    print(f"[INFO] Training history disimpan ke {MODEL_DIR / 'training_history.png'}")

    # Final evaluation
    val_loss, val_acc = model.evaluate(val_ds, verbose=0)
    print(f"\n[RESULT] Validation Accuracy: {val_acc:.4f} ({val_acc*100:.2f}%)")
    print(f"[RESULT] Model disimpan ke: {MODEL_PATH}")


if __name__ == "__main__":
    # Set random seeds for reproducibility
    np.random.seed(42)
    tf.random.set_seed(42)
    train()
