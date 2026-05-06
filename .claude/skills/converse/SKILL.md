---
name: converse
description: Start an ongoing voice conversation
argument-hint: [message]
---

# /yakk:converse

Start an ongoing voice conversation with the user using the `yakk:converse` MCP tool.

## Implementation

Use the `yakk:converse` tool with the user's message. All parameters have sensible defaults.

## If MCP Connection Fails

If the MCP server isn't connected or the tool isn't available:

1. **Run the install command:**

   ```
   /yakk:install
   ```

   This installs Yakk CLI, FFmpeg, and local voice services.

2. **Or install manually via CLI:**

   ```bash
   uvx yakk-install --yes
   yakk whisper service install
   yakk kokoro install
   ```

3. **Check service status:**

   ```bash
   yakk whisper service status
   yakk kokoro status
   ```

4. **Reconnect MCP server after install:**
   Run `/mcp`, select yakk, click "Reconnect" (or restart Claude Code)

For complete documentation, load the `yakk` skill.
