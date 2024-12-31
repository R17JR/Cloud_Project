# Flask API Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install required libraries
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Flask app
COPY app.py .

# Expose Flask app port
EXPOSE 8200

CMD ["python", "app.py"]
