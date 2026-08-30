# ============================================================
# FOCUSGUARD AI — AI / MACHINE LEARNING WORKER DOCKERFILE
# Model Training, Synthetic Data Generation & Evaluation
# ============================================================
FROM python:3.11-slim

WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY ai/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy AI modules and datasets
COPY ai/ ./ai/
COPY data/ ./data/

# Default command runs model training pipeline
CMD ["python", "ai/train_model.py"]
