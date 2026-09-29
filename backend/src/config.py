import os
from pathlib import Path


DATABASE_PATH = Path(os.getenv("AGENT_DB_PATH", "./data/agent.sqlite3"))
DEFAULT_MODEL = "gpt-4.1-mini"
