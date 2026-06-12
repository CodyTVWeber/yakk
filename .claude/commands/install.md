---
description: Install Yakk, FFmpeg, and local voice services
allowed-tools: Bash(uvx:*), Bash(yakk:*), Bash(brew:*), Bash(uname:*), Bash(which:*)
---

# /yakk:install

Install Yakk and all dependencies needed for voice conversations.

## Quick Install (Non-Interactive)

For a fast, fully automated install on Apple Silicon:

```bash
# If yakk is already cloned locally:
uv tool install /path/to/yakk

# Or from PyPI (when a release is available):
uvx yakk-install --yes

yakk service install whisper
yakk service install kokoro
```

## What Gets Installed

| Component | Size | Purpose |
|-----------|------|---------|
| FFmpeg | ~50MB | Audio processing (via Homebrew) |
| Yakk CLI | ~10MB | Command-line tools |
| Whisper (base) | ~150MB | Speech-to-text |
| Kokoro | ~350MB | Text-to-speech |

## Implementation

1. **Check architecture:** `uname -m` (arm64 = Apple Silicon, recommended for local services)

2. **Check what's already installed:**
   ```bash
   which yakk  # Yakk CLI
   which ffmpeg     # Audio processing
   ```

3. **Install missing components:**
   ```bash
   # Full install (installs ffmpeg, yakk, and checks dependencies)
   uvx yakk-install --yes

   # Install local services
   yakk service install whisper
   yakk service install kokoro
   ```

4. **Verify services are running:**
   ```bash
   yakk service status whisper
   yakk service status kokoro
   ```

5. **Register MCP server with Claude Code:**
   ```bash
   claude mcp add yakk --scope user -- $(which yakk)
   ```
   This writes to `~/.claude.json` (the correct global config). Restart Claude Code after running.

   > **Note:** Adding `mcpServers` to `~/.claude/settings.json` does **not** work — use `claude mcp add` instead.

## Whisper Model Selection

For Apple Silicon Macs with 16GB+ RAM, the large-v2 model is recommended:

| Model | Download | RAM Usage | Accuracy |
|-------|----------|-----------|----------|
| base | ~150MB | ~300MB | Good (default) |
| small | ~460MB | ~1GB | Better |
| large-v2 | ~3GB | ~5GB | Best (recommended for 16GB+ RAM) |
| large-v3-turbo | ~1.5GB | ~3GB | Fast & accurate |

To install the recommended model:
```bash
yakk whisper install --model large-v2
```

## Prerequisites

This install process assumes:
- **UV** - Python package manager (install: `curl -LsSf https://astral.sh/uv/install.sh | sh`)
- **Homebrew** - macOS package manager (install: `brew.sh`)

The Yakk installer will install Homebrew if missing on macOS.

For complete documentation, load the `yakk` skill.
