FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.11-slim
WORKDIR /app
RUN addgroup --gid 1001 python && \
    adduser  --uid 1001 --no-create-home --disabled-password --gecos "" --ingroup python python
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin/uvicorn /usr/local/bin/uvicorn
COPY --chown=python:python src/ ./src/
USER python
EXPOSE 3005
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:3005/health')"
CMD ["uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "3005"]
