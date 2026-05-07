FROM python:3.12-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg libsndfile1 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /var/task

COPY requirements.txt .
RUN pip install awslambdaric --no-cache-dir && \
    pip install -r requirements.txt --no-cache-dir

COPY app/ app/
COPY handler.py .

ENTRYPOINT ["/usr/local/bin/python", "-m", "awslambdaric"]
CMD ["handler.handler"]
