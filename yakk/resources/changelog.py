"""CHANGELOG resource for Yakk."""

from pathlib import Path
from yakk.server import mcp


@mcp.resource("changelog://yakk")
def changelog_resource() -> str:
    """Yakk changelog and release history."""
    # Try to find CHANGELOG.md in various locations
    possible_paths = [
        # When running from source
        Path(__file__).parent.parent.parent / "CHANGELOG.md",
        # When installed, might be in package data
        Path(__file__).parent.parent / "CHANGELOG.md",
        # Fallback to current directory
        Path("CHANGELOG.md"),
    ]
    
    for path in possible_paths:
        if path.exists():
            try:
                return path.read_text()
            except Exception as e:
                return f"Error reading CHANGELOG.md from {path}: {str(e)}"
    
    return """CHANGELOG.md not found in package.

For the latest changelog, please visit:
https://github.com/mbailey/yakk/blob/master/CHANGELOG.md"""