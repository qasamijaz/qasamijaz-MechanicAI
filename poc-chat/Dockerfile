FROM caddy:2 AS caddy
FROM python:3.12-slim
COPY --from=caddy /usr/bin/caddy /usr/bin/caddy
WORKDIR /app
COPY poc-chat/server.py /app/server.py
COPY poc-chat/docs_engine.py /app/docs_engine.py
COPY poc-chat/index.html /app/index.html
COPY poc-chat/Caddyfile /app/Caddyfile
COPY poc-chat/start.sh /app/start.sh
ENV PYTHONDONTWRITEBYTECODE=1
EXPOSE 8766
CMD ["/bin/sh", "/app/start.sh"]
