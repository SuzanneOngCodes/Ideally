FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    AGENT_DB_PATH=/data/agent.sqlite3

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY src ./src

RUN mkdir -p /data

EXPOSE 8000
VOLUME ["/data"]

CMD [".venv/bin/uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
