"""
setup_kaggle.py — Script interaktif untuk setup Kaggle API dan download dataset CIFAKE

Cara menjalankan:
    python setup_kaggle.py

Script ini akan:
1. Memandu kamu membuat kaggle.json (API token)
2. Menyimpan token ke lokasi yang benar
3. Mendownload dataset CIFAKE otomatis
"""

import os
import sys
import json
import zipfile
import shutil
from pathlib import Path

KAGGLE_DIR = Path.home() / ".kaggle"
KAGGLE_JSON = KAGGLE_DIR / "kaggle.json"
DATASET_DIR = Path(__file__).parent / "dataset"
DATASET_SLUG = "birdy654/cifake-real-and-ai-generated-synthetic-images"
DATASET_ZIP = "cifake-real-and-ai-generated-synthetic-images.zip"


def banner():
    print("\n" + "=" * 60)
    print("  🔑  Kaggle Setup & Dataset Downloader")
    print("  Dataset: CIFAKE (Real vs AI-Generated Images)")
    print("=" * 60 + "\n")


def check_existing_token():
    if KAGGLE_JSON.exists():
        print(f"✅ kaggle.json sudah ada di: {KAGGLE_JSON}")
        with open(KAGGLE_JSON) as f:
            data = json.load(f)
        print(f"   Username: {data.get('username', '?')}")
        ans = input("\nGunakan token yang sudah ada? (y/n): ").strip().lower()
        return ans == "y"
    return False


def setup_token():
    print("📋 Langkah-langkah mendapatkan Kaggle API Token:\n")
    print("  1. Buka browser dan login ke: https://www.kaggle.com")
    print("  2. Klik foto profil kamu (pojok kanan atas)")
    print("  3. Pilih 'Settings'")
    print("  4. Scroll ke bagian 'API'")
    print("  5. Klik tombol 'Create New Token'")
    print("  6. File 'kaggle.json' akan otomatis terdownload\n")

    input("Tekan Enter setelah kamu mendownload kaggle.json... ")

    # Ask where they saved it
    print("\nSekarang masukkan isi dari kaggle.json kamu.")
    print("(Buka file kaggle.json dengan Notepad, copy semua isinya)\n")

    while True:
        print('Format: {"username":"namakamu","key":"xxxxx"}')
        raw = input("Paste isi kaggle.json di sini: ").strip()
        try:
            data = json.loads(raw)
            if "username" not in data or "key" not in data:
                print("❌ Format salah. Harus ada 'username' dan 'key'.")
                continue
            break
        except json.JSONDecodeError:
            print("❌ Bukan JSON yang valid. Coba lagi.\n")

    # Save
    KAGGLE_DIR.mkdir(parents=True, exist_ok=True)
    with open(KAGGLE_JSON, "w") as f:
        json.dump(data, f)

    # Set permissions (important on Unix, harmless on Windows)
    try:
        KAGGLE_JSON.chmod(0o600)
    except Exception:
        pass

    print(f"\n✅ Token disimpan ke: {KAGGLE_JSON}")
    print(f"   Username: {data['username']}\n")


def check_dataset_exists():
    if DATASET_DIR.exists() and any(DATASET_DIR.iterdir()):
        print(f"✅ Dataset sudah ada di: {DATASET_DIR}")
        ans = input("Download ulang? (y/n): ").strip().lower()
        return ans != "y"
    return False


def download_dataset():
    print("\n📥 Mendownload dataset CIFAKE dari Kaggle...")
    print("   (Ukuran: ~1.3 GB — bisa makan waktu beberapa menit)\n")

    try:
        import kaggle
        kaggle.api.authenticate()
        print("✅ Autentikasi Kaggle berhasil!\n")

        DATASET_DIR.mkdir(parents=True, exist_ok=True)

        kaggle.api.dataset_download_files(
            DATASET_SLUG,
            path=str(Path(__file__).parent),
            unzip=False,
            quiet=False,
        )

        zip_path = Path(__file__).parent / DATASET_ZIP
        if zip_path.exists():
            print(f"\n📦 Mengekstrak {DATASET_ZIP}...")
            with zipfile.ZipFile(zip_path, "r") as z:
                z.extractall(DATASET_DIR)
            zip_path.unlink()
            print(f"✅ Dataset diekstrak ke: {DATASET_DIR}")
        else:
            # Maybe it was already extracted
            print("✅ Dataset sudah diekstrak.")

    except Exception as e:
        print(f"\n❌ Gagal download: {e}")
        print("\n💡 Alternatif — Download Manual:")
        print("   1. Buka: https://www.kaggle.com/datasets/birdy654/cifake-real-and-ai-generated-synthetic-images")
        print("   2. Klik tombol 'Download' (pojok kanan atas)")
        print(f"   3. Ekstrak ZIP ke folder: {DATASET_DIR}")
        print("   4. Pastikan ada subfolder REAL/ dan FAKE/ di dalamnya")
        sys.exit(1)


def verify_dataset():
    print("\n🔍 Memverifikasi struktur dataset...")
    found = False
    for pattern in ["REAL", "FAKE", "real", "fake"]:
        matches = list(DATASET_DIR.rglob(pattern))
        if matches:
            found = True
            print(f"   ✅ Folder '{pattern}' ditemukan: {matches[0]}")

    if not found:
        print("   ⚠️  Folder REAL/FAKE tidak ditemukan.")
        print(f"   Cek isi folder: {DATASET_DIR}")
    else:
        # Count images
        real_dirs = list(DATASET_DIR.rglob("REAL")) + list(DATASET_DIR.rglob("real"))
        fake_dirs = list(DATASET_DIR.rglob("FAKE")) + list(DATASET_DIR.rglob("fake"))
        if real_dirs:
            real_count = len(list(real_dirs[0].glob("*")))
            print(f"   📊 Real images: {real_count:,}")
        if fake_dirs:
            fake_count = len(list(fake_dirs[0].glob("*")))
            print(f"   📊 AI images:   {fake_count:,}")


def main():
    banner()

    # Step 1: Token setup
    if not check_existing_token():
        setup_token()

    # Step 2: Dataset
    if not check_dataset_exists():
        download_dataset()

    # Step 3: Verify
    verify_dataset()

    print("\n" + "=" * 60)
    print("🎉 Setup selesai! Sekarang jalankan:")
    print("   python train_model.py")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
