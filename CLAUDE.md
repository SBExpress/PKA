# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PKA — Larry, an AI Chief of Staff CLI built with the Anthropic Python SDK.

## Structure

```
PKA/
├── larry.py           # Entry point — run with: python larry.py
├── requirements.txt   # anthropic, rich
├── larry/
│   ├── __init__.py
│   ├── agent.py       # Larry class — agentic loop with tool use
│   ├── tools.py       # Tool definitions + handlers
│   └── storage.py     # JSON file persistence (data/)
└── data/              # Auto-created: tasks.json, memory.json, employees.json
```

## Running

```
pip install -r requirements.txt
set ANTHROPIC_API_KEY=your_key_here
python larry.py
```

## Architecture

- Model: `claude-opus-4-7` with adaptive thinking and `effort: high`
- Tools: create/list/update/delete tasks, save/recall memory, hire_employee, web_search
- Persistence: JSON files in `data/`
- UI: Rich library (panels, markdown rendering, status spinner)
