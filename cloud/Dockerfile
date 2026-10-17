FROM python:3.12-slim
WORKDIR /app
RUN pip install --no-cache-dir "pypdf==5.9.0"
COPY server.py /app/server.py
COPY manual_ingest.py /app/manual_ingest.py
EXPOSE 7860
CMD ["python", "-u", "/app/server.py"]
