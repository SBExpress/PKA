import json
from pathlib import Path
from datetime import datetime
from uuid import uuid4

DATA_DIR = Path(__file__).parent.parent / "data"
TASKS_FILE = DATA_DIR / "tasks.json"
MEMORY_FILE = DATA_DIR / "memory.json"
EMPLOYEES_FILE = DATA_DIR / "employees.json"


def _ensure():
    DATA_DIR.mkdir(exist_ok=True)
    for f, default in [
        (TASKS_FILE, {"tasks": []}),
        (MEMORY_FILE, {"entries": []}),
        (EMPLOYEES_FILE, {"employees": []}),
    ]:
        if not f.exists():
            f.write_text(json.dumps(default, indent=2))


def load_tasks() -> dict:
    _ensure()
    return json.loads(TASKS_FILE.read_text())


def save_tasks(data: dict):
    _ensure()
    TASKS_FILE.write_text(json.dumps(data, indent=2))


def load_memory() -> dict:
    _ensure()
    return json.loads(MEMORY_FILE.read_text())


def save_memory_data(data: dict):
    _ensure()
    MEMORY_FILE.write_text(json.dumps(data, indent=2))


def load_employees() -> dict:
    _ensure()
    return json.loads(EMPLOYEES_FILE.read_text())


def save_employees(data: dict):
    _ensure()
    EMPLOYEES_FILE.write_text(json.dumps(data, indent=2))


def new_id() -> str:
    return uuid4().hex[:8]


def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"
