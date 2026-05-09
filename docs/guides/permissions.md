# Agent CLI Permissions Guide

Configure Agent CLI to use Yakk without constant permission prompts.

## Quick Setup (30 seconds)

Add this to `~/.agent/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "mcp__yakk__converse",
      "mcp__yakk__service"
    ]
  }
}
```

That's it! Voice conversations and service management now work without prompts.

## What These Permissions Allow

| Permission | What It Does |
|------------|--------------|
| `mcp__yakk__converse` | Voice conversations (speak and listen) |
| `mcp__yakk__service` | Start/stop Whisper and Kokoro services |

## Permission Levels

Choose the level that fits your needs:

### Level 1: Voice Only

Just voice conversations, nothing else:

```json
{
  "permissions": {
    "allow": [
      "mcp__yakk__converse"
    ]
  }
}
```

### Level 2: Voice + Service (Recommended)

Voice conversations plus service management:

```json
{
  "permissions": {
    "allow": [
      "mcp__yakk__converse",
      "mcp__yakk__service"
    ]
  }
}
```

### Level 3: All Yakk Tools

Everything except installation (for power users):

```json
{
  "permissions": {
    "allow": [
      "mcp__yakk__*"
    ],
    "deny": [
      "mcp__yakk__whisper_install",
      "mcp__yakk__whisper_uninstall",
      "mcp__yakk__kokoro_install",
      "mcp__yakk__kokoro_uninstall"
    ]
  }
}
```

## How to Apply Permissions

### Option 1: Edit Settings File

1. Open `~/.agent/settings.json` in your editor
2. Add the permissions block
3. Save and restart Agent CLI

```bash
# Create or edit the file
nano ~/.agent/settings.json
```

### Option 2: Use Agent CLI UI

1. In Agent CLI, type `/permissions`
2. Add `mcp__yakk__converse` to the allow list
3. Add `mcp__yakk__service` to the allow list

### Option 3: Command Line

```bash
# Create settings file with Yakk permissions
mkdir -p ~/.agent
cat > ~/.agent/settings.json << 'EOF'
{
  "permissions": {
    "allow": [
      "mcp__yakk__converse",
      "mcp__yakk__service"
    ]
  }
}
EOF
```

## Troubleshooting

### Still Getting Permission Prompts?

1. **Check file location**: Settings must be in `~/.agent/settings.json`
2. **Check JSON syntax**: Use a JSON validator if unsure
3. **Restart Agent CLI**: Changes require restart to take effect
4. **Check tool names**: Must match exactly (case-sensitive)

### Verify Your Settings

```bash
cat ~/.agent/settings.json
```

Should show your permissions block.

### Common Mistakes

❌ Wrong:
```json
{
  "allowedTools": ["mcp__yakk__converse"]
}
```

✅ Correct:
```json
{
  "permissions": {
    "allow": ["mcp__yakk__converse"]
  }
}
```

## Removing Permissions

To go back to prompting for everything:

```json
{
  "permissions": {
    "allow": []
  }
}
```

Or delete the permissions block entirely.

## Security Notes

### What Yakk Tools Can Do

| Tool | Capabilities |
|------|--------------|
| `converse` | Records audio from microphone, plays audio through speakers |
| `service` | Starts/stops background processes for Whisper and Kokoro |

### What Requires Manual Approval

These tools always prompt (not included in recommendations):

- `whisper_install` / `whisper_uninstall` - Downloads and compiles software
- `kokoro_install` / `kokoro_uninstall` - Downloads and installs Python packages
- `whisper_model_install` - Downloads large model files (100MB-3GB)

### Privacy

- Audio is processed locally by Whisper (speech-to-text)
- No audio is sent to external servers unless you configure OpenAI as a provider
- See [Privacy documentation](../reference/privacy.md) for details

## Project vs Global Settings

| File | Scope | Use Case |
|------|-------|----------|
| `~/.agent/settings.json` | All projects | Personal defaults |
| `.agent/settings.json` | This project | Team settings (commit to git) |
| `.agent/settings.local.json` | This project | Personal overrides (gitignored) |

Settings merge: global → project → local (local wins).

## See Also

- [Getting Started](../tutorials/getting-started.md) - Installation guide
- [Configuration](configuration.md) - Yakk settings
- [Troubleshooting](../reference/troubleshooting.md) - Common issues
