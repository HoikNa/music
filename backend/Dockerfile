FROM public.ecr.aws/lambda/python:3.12

RUN dnf install -y libsndfile ffmpeg && dnf clean all

WORKDIR ${LAMBDA_TASK_ROOT}

COPY requirements.txt .
RUN pip install -r requirements.txt --no-cache-dir

COPY app/ app/
COPY handler.py .

CMD ["handler.handler"]
