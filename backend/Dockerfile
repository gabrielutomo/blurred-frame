# Gunakan Python image yang ringan
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies yang dibutuhkan oleh OpenCV atau TensorFlow jika perlu
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements dan install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy seluruh kode backend
COPY . .

# Expose port yang digunakan Uvicorn
EXPOSE 8000

# Jalankan aplikasi menggunakan Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
