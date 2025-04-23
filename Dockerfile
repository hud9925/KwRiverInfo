# Dockerfile
FROM python:3.10-slim

# set workdir
WORKDIR /app

# install system deps (if any)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

# copy & install python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy rest of code
COPY . .

# tell Flask which app to run
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# listen on the port Vercel sets
ENV PORT=${PORT:-5000}

# launch via Gunicorn
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:${PORT}"]
