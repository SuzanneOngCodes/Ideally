# Cloud Run: Express ingress and supervised internal FastAPI.
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
COPY --from=ghcr.io/astral-sh/uv:0.10.0 /uv /usr/local/bin/uv
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
# tsx is required at runtime to execute server.ts; install from the lockfile.
RUN npm ci
COPY backend/pyproject.toml backend/uv.lock ./backend/
RUN cd backend && UV_PYTHON_DOWNLOADS=never uv sync --frozen --no-dev --python /usr/bin/python3
COPY backend/src ./backend/src
COPY --from=builder /app/dist ./dist
COPY server.ts ./server.ts
COPY src/types ./src/types
COPY scripts/start-cloud-run.py ./scripts/start-cloud-run.py
ENV NODE_ENV=production PORT=8080 PYTHON_BACKEND_URL=http://127.0.0.1:8000
# Override DATABASE_URL with PostgreSQL for durable sessions.
ENV DATABASE_URL=sqlite:////tmp/ideally.db
EXPOSE 8080
CMD ["python3", "scripts/start-cloud-run.py"]
