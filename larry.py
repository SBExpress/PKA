import os
import sys
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from rich.prompt import Prompt
from larry.agent import Larry

console = Console()


def check_api_key():
    if not os.environ.get("ANTHROPIC_API_KEY"):
        console.print(
            "[bold red]Error:[/bold red] ANTHROPIC_API_KEY environment variable is not set.\n"
            "Set it with: [bold]set ANTHROPIC_API_KEY=your_key_here[/bold] (Windows)\n"
            "             [bold]export ANTHROPIC_API_KEY=your_key_here[/bold] (Linux/Mac)"
        )
        sys.exit(1)


def show_banner():
    console.print(
        Panel(
            "[bold cyan]Larry[/bold cyan] — Your AI Chief of Staff\n"
            "[dim]Type your message and press Enter. Type [bold]exit[/bold] or [bold]quit[/bold] to leave.[/dim]",
            border_style="cyan",
            padding=(0, 2),
        )
    )


def main():
    check_api_key()
    show_banner()

    larry = Larry()

    # Opening briefing
    console.print("[dim]Briefing Larry on current state...[/dim]")
    briefing = larry.chat(
        "Start of session. Brief me on outstanding tasks and any relevant context from memory. "
        "Be concise — just the essentials."
    )
    console.print(Panel(Markdown(briefing), border_style="dim", title="[dim]Larry[/dim]", title_align="left"))

    while True:
        try:
            user_input = Prompt.ask("\n[bold cyan]You[/bold cyan]").strip()
        except (KeyboardInterrupt, EOFError):
            console.print("\n[dim]Goodbye.[/dim]")
            break

        if not user_input:
            continue

        if user_input.lower() in ("exit", "quit", "bye"):
            console.print("[dim]Goodbye.[/dim]")
            break

        response = larry.chat(user_input)
        if response:
            console.print(
                Panel(
                    Markdown(response),
                    border_style="dim",
                    title="[dim]Larry[/dim]",
                    title_align="left",
                )
            )


if __name__ == "__main__":
    main()
