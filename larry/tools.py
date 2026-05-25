from .storage import (
    load_tasks, save_tasks,
    load_memory, save_memory_data,
    load_employees, save_employees,
    new_id, now_iso,
)

PRIORITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}

TOOL_DEFINITIONS = [
    {
        "name": "create_task",
        "description": "Create a new task and add it to the task list.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Short task title"},
                "priority": {
                    "type": "string",
                    "enum": ["critical", "high", "medium", "low"],
                    "description": "Task priority level",
                },
                "description": {"type": "string", "description": "Detailed task description"},
                "due_date": {"type": "string", "description": "Due date in YYYY-MM-DD format (optional)"},
                "tags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Tags for categorization (optional)",
                },
            },
            "required": ["title", "priority"],
        },
    },
    {
        "name": "list_tasks",
        "description": "List tasks, optionally filtered by status and/or priority.",
        "input_schema": {
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "enum": ["pending", "in_progress", "done", "all"],
                    "description": "Filter by status. Defaults to 'pending'.",
                },
                "priority": {
                    "type": "string",
                    "enum": ["critical", "high", "medium", "low", "all"],
                    "description": "Filter by priority. Defaults to 'all'.",
                },
            },
        },
    },
    {
        "name": "update_task",
        "description": "Update fields on an existing task by its ID.",
        "input_schema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "The 8-character task ID"},
                "title": {"type": "string"},
                "priority": {"type": "string", "enum": ["critical", "high", "medium", "low"]},
                "description": {"type": "string"},
                "status": {"type": "string", "enum": ["pending", "in_progress", "done"]},
                "due_date": {"type": "string"},
                "tags": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["task_id"],
        },
    },
    {
        "name": "delete_task",
        "description": "Permanently delete a task by its ID.",
        "input_schema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "The 8-character task ID"},
            },
            "required": ["task_id"],
        },
    },
    {
        "name": "save_memory",
        "description": "Save or update a memory entry for long-term recall across sessions.",
        "input_schema": {
            "type": "object",
            "properties": {
                "key": {"type": "string", "description": "Unique key for this memory (e.g. 'user_preferred_stack')"},
                "value": {"type": "string", "description": "The information to remember"},
                "category": {
                    "type": "string",
                    "enum": ["preference", "project", "person", "fact", "other"],
                    "description": "Category for organization",
                },
            },
            "required": ["key", "value", "category"],
        },
    },
    {
        "name": "recall_memory",
        "description": "Search memory entries by keyword or category.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search term to look for in keys and values"},
                "category": {
                    "type": "string",
                    "enum": ["preference", "project", "person", "fact", "other", "all"],
                    "description": "Filter by category. Defaults to 'all'.",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "hire_employee",
        "description": "Hire a new AI employee with a specific role and specialties. Only use when explicitly directed by the user.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Employee name"},
                "role": {"type": "string", "description": "Job title / role"},
                "specialties": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of skill areas",
                },
                "personality": {"type": "string", "description": "Brief personality description"},
            },
            "required": ["name", "role", "specialties", "personality"],
        },
    },
    {
        "type": "web_search_20260209",
        "name": "web_search",
    },
]


def execute_tool(name: str, input_data: dict) -> str:
    handlers = {
        "create_task": _create_task,
        "list_tasks": _list_tasks,
        "update_task": _update_task,
        "delete_task": _delete_task,
        "save_memory": _save_memory,
        "recall_memory": _recall_memory,
        "hire_employee": _hire_employee,
    }
    if name not in handlers:
        return f"Unknown tool: {name}"
    try:
        return handlers[name](**input_data)
    except Exception as e:
        return f"Tool error ({name}): {e}"


def _create_task(title: str, priority: str, description: str = "", due_date: str = None, tags: list = None) -> str:
    data = load_tasks()
    task = {
        "id": new_id(),
        "title": title,
        "priority": priority,
        "description": description,
        "status": "pending",
        "due_date": due_date,
        "tags": tags or [],
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    data["tasks"].append(task)
    save_tasks(data)
    return f"Created task [{task['id']}]: {title} ({priority})"


def _list_tasks(status: str = "pending", priority: str = "all") -> str:
    data = load_tasks()
    tasks = data["tasks"]
    if status != "all":
        tasks = [t for t in tasks if t.get("status") == status]
    if priority != "all":
        tasks = [t for t in tasks if t.get("priority") == priority]
    tasks = sorted(tasks, key=lambda t: PRIORITY_ORDER.get(t.get("priority", "low"), 99))
    if not tasks:
        return "No tasks found."
    lines = []
    for t in tasks:
        due = f" | due: {t['due_date']}" if t.get("due_date") else ""
        tags = f" [{', '.join(t['tags'])}]" if t.get("tags") else ""
        lines.append(f"[{t['id']}] [{t['priority'].upper()}] {t['title']} ({t['status']}){due}{tags}")
        if t.get("description"):
            lines.append(f"     {t['description']}")
    return "\n".join(lines)


def _update_task(task_id: str, **kwargs) -> str:
    data = load_tasks()
    for task in data["tasks"]:
        if task["id"] == task_id:
            for k, v in kwargs.items():
                if v is not None:
                    task[k] = v
            task["updated_at"] = now_iso()
            save_tasks(data)
            return f"Updated task [{task_id}]"
    return f"Task [{task_id}] not found."


def _delete_task(task_id: str) -> str:
    data = load_tasks()
    original_count = len(data["tasks"])
    data["tasks"] = [t for t in data["tasks"] if t["id"] != task_id]
    if len(data["tasks"]) == original_count:
        return f"Task [{task_id}] not found."
    save_tasks(data)
    return f"Deleted task [{task_id}]"


def _save_memory(key: str, value: str, category: str) -> str:
    data = load_memory()
    for entry in data["entries"]:
        if entry["key"] == key:
            entry["value"] = value
            entry["category"] = category
            entry["updated_at"] = now_iso()
            save_memory_data(data)
            return f"Updated memory: {key}"
    data["entries"].append({
        "key": key,
        "value": value,
        "category": category,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    })
    save_memory_data(data)
    return f"Saved memory: {key}"


def _recall_memory(query: str, category: str = "all") -> str:
    data = load_memory()
    entries = data["entries"]
    if category != "all":
        entries = [e for e in entries if e.get("category") == category]
    q = query.lower()
    matches = [e for e in entries if q in e["key"].lower() or q in e["value"].lower()]
    if not matches:
        return "No matching memories found."
    lines = []
    for e in matches:
        lines.append(f"[{e['category']}] {e['key']}: {e['value']}")
    return "\n".join(lines)


def _hire_employee(name: str, role: str, specialties: list, personality: str) -> str:
    data = load_employees()
    employee = {
        "id": new_id(),
        "name": name,
        "role": role,
        "specialties": specialties,
        "personality": personality,
        "hired_at": now_iso(),
        "status": "active",
    }
    data["employees"].append(employee)
    save_employees(data)
    return f"Hired {name} as {role} [ID: {employee['id']}]. Specialties: {', '.join(specialties)}."
