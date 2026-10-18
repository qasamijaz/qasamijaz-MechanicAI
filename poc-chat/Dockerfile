FROM python:3.12-slim
WORKDIR /app
COPY poc-chat/server.py /app/server.py
COPY poc-chat/index.html /app/index.html
ENV PYTHONDONTWRITEBYTECODE=1
EXPOSE 8766
CMD ["python", "-u", "/app/server.py"]
