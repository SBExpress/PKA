import anthropic
from rich.console import Console
from .tools import TOOL_DEFINITIONS, execute_tool

console = Console()

HAIKU  = "claude-haiku-4-5"
SONNET = "claude-sonnet-4-6"
OPUS   = "claude-opus-4-7"

# Sonnet tier: moderate reasoning — explanations, summaries, light code, recommendations
_SONNET_TRIGGERS = frozenset({
    "explain", "how does", "why does", "understand",
    "summarize", "summary", "suggest", "recommend",
    "review", "compare", "evaluate", "assess",
    "draft", "write", "describe",
})

# Opus tier: heavy lifting — research, design, architecture, deep coding, planning
_OPUS_TRIGGERS = frozenset({
    "research", "search", "find", "look up",
    "design", "architect", "architecture",
    "analyze", "analysis",
    "implement", "build", "develop", "program",
    "debug", "fix", "refactor", "optimize",
    "plan", "strategy", "roadmap", "best approach", "best way",
    "think", "brainstorm",
})


def _select_model(user_message: str) -> str:
    msg = user_message.lower()
    if any(t in msg for t in _OPUS_TRIGGERS):
        return OPUS
    if any(t in msg for t in _SONNET_TRIGGERS):
        return SONNET
    return HAIKU


def _model_kwargs(model: str) -> dict:
    if model == OPUS:
        return {"max_tokens": 16000, "thinking": {"type": "adaptive"}, "output_config": {"effort": "high"}}
    if model == SONNET:
        return {"max_tokens": 8192, "thinking": {"type": "adaptive"}, "output_config": {"effort": "high"}}
    return {"max_tokens": 4096}  # Haiku: no thinking, no effort (unsupported)

SYSTEM_PROMPT = """You are Larry — an elite AI Chief of Staff and #1 helper. You are organized, sharp, and always thinking two steps ahead.

## Your Core Traits

**ORGANIZED**: At the start of every new conversation, you MUST call list_tasks (status="all") and recall_memory (query="", category="all") to brief yourself on current state before responding.

**SMART**: You have deep expertise in software engineering, UI/UX design, business strategy, and project management. You speak plainly and give concrete recommendations, not vague suggestions.

**PROACTIVE**: When the user mentions work to be done, you create tasks without being asked. When something is urgent, you flag it. You anticipate needs.

**MEMORY**: You use save_memory/recall_memory to build continuity across sessions. Save anything important: preferences, project context, key decisions, people, tech choices.

**TEAM BUILDER**: You can hire additional AI employees using the hire_employee tool — but only when the user explicitly directs you to. Each hire gets a name, role, specialties, and personality.

## How You Respond

- Be direct and concise. No fluff.
- Format responses clearly using markdown when helpful.
- When managing tasks, always show task IDs so the user can reference them.
- Prioritize ruthlessly: critical > high > medium > low.
- If you search the web, synthesize findings — don't just dump raw results.
- Always end with the single most important next action if one exists.
"""


class Larry:
    def __init__(self):
        self.client = anthropic.Anthropic()
        self.messages: list = []
        self._model = HAIKU
        self._system = [
            {
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ]

    def chat(self, user_message: str) -> str:
        self._model = _select_model(user_message)
        self.messages.append({"role": "user", "content": user_message})
        label = {"claude-opus-4-7": "Thinking...", "claude-sonnet-4-6": "Reasoning..."}.get(self._model, "Working...")
        with console.status(f"[dim]{label}[/dim]") as status:
            return self._run_loop(status)

    def _run_loop(self, status=None) -> str:
        while True:
            response = self.client.messages.create(
                model=self._model,
                system=self._system,
                tools=TOOL_DEFINITIONS,
                messages=self.messages,
                **_model_kwargs(self._model),
            )

            if response.stop_reason == "end_turn":
                text = next(
                    (b.text for b in response.content if hasattr(b, "text")), ""
                )
                self.messages.append({"role": "assistant", "content": response.content})
                return text

            elif response.stop_reason == "tool_use":
                self.messages.append({"role": "assistant", "content": response.content})
                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        if status:
                            status.update(f"[dim]⚙ {block.name}...[/dim]")
                        result = execute_tool(block.name, block.input)
                        tool_results.append(
                            {
                                "type": "tool_result",
                                "tool_use_id": block.id,
                                "content": str(result),
                            }
                        )
                self.messages.append({"role": "user", "content": tool_results})

            elif response.stop_reason == "pause_turn":
                # Server-side tool hit iteration limit — continue the loop
                self.messages.append({"role": "assistant", "content": response.content})

            else:
                # Unexpected stop reason — return whatever text we have
                text = next(
                    (b.text for b in response.content if hasattr(b, "text")), ""
                )
                self.messages.append({"role": "assistant", "content": response.content})
                return text
