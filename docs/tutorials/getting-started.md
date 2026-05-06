# Getting Started with Yakk

Yakk brings voice conversations to AI coding assistants. It works as both an MCP server for Claude Code and as a standalone CLI tool.

## What is Yakk?

Yakk provides:

- **MCP Server**: Adds voice tools to Claude Code - no installation needed
- **CLI Tool**: Use Yakk's tools directly from your terminal
- **Local Services**: Optional privacy-focused speech processing

## Quick Start: Using with Claude Code

The fastest way to get started is using Yakk with Claude Code.

### Installation

Install UV package manager (if not already installed), then run the Yakk installer:

```bash
# Install UV package manager (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install Yakk and configure services
uvx yakk-install

# Add to Claude Code MCP
claude mcp add --scope user yakk -- uvx --refresh yakk
```

The installer will:

- Install missing system dependencies (FFmpeg, PortAudio, etc.)
- Set up your environment for Yakk
- Offer to install local voice services (Whisper STT and Kokoro TTS)

**Alternative UV installation methods:**
- **macOS**: `brew install uv`
- **With pip**: `pip install uv`

Learn more: [UV Installation Guide](https://docs.astral.sh/uv/getting-started/installation/)

### 2. Configure Your API Key

Set your OpenAI API key as an environment variable:

```bash
export OPENAI_API_KEY="sk-your-api-key-here"
```

Or add it to your shell configuration file (`~/.bashrc`, `~/.zshrc`, etc.)

### 3. Verify Installation

```bash
# Check that Yakk is connected
claude mcp list
```

You should see `yakk` in the list of connected servers.

### 4. Configure Permissions (Optional)

By default, Claude Code prompts for permission each time Yakk tools are used. To enable automatic approval, add to `~/.claude/settings.json`:

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

This allows voice conversations and service management without prompts. For more permission options, see the [Permissions Guide](../guides/permissions.md).

### 5. Start Using Voice

In Claude Code, simply type:
```
converse
```

Speak when you hear the chime, and Claude will respond with voice!

## Alternative: Using as a CLI Tool

If you want to use Yakk from the command line:

### Installation

```bash
# Install with pip
uv tool install yakk

# Or install from source in editable mode
git clone https://github.com/mbailey/yakk
cd yakk
uv tool install -e .
```

### Basic Usage

```bash
# Set your API key
export OPENAI_API_KEY="sk-your-api-key-here"

# Start a voice conversation
yakk converse
```

## Setting Up Local Services (Optional)

For complete privacy, you can run voice services locally instead of using OpenAI.

### Quick Setup

```bash
# Install local services
yakk service install whisper   # Speech-to-text
yakk service install kokoro    # Text-to-speech

# Start services
yakk service start whisper
yakk service start kokoro

# Check status of all services
yakk service status
```

Yakk will automatically detect and use these local services when available.

### Enable Auto-Start (Recommended)

To have services start automatically at login:

```bash
# Enable services to start at boot/login
yakk service enable whisper
yakk service enable kokoro
```

On macOS, this creates launchd agents. On Linux, it creates systemd user services.

### Download Sizes and Requirements

| Service | Download Size | Disk Space | First Start Time |
|---------|---------------|------------|------------------|
| Whisper (tiny) | ~75MB | ~150MB | 30 seconds |
| Whisper (base) | ~150MB | ~300MB | 1-2 minutes |
| Whisper (small) | ~460MB | ~1GB | 2-3 minutes |
| Kokoro TTS | ~350MB | ~700MB | 2-3 minutes |

**Recommended**: Whisper base + Kokoro = ~500MB download, ~1GB disk space.

### Waiting for Services

After installation, services download models on first start. Wait for them to be ready:

```bash
# Wait for Whisper (port 2022)
while ! nc -z localhost 2022 2>/dev/null; do sleep 2; done
echo "Whisper ready"

# Wait for Kokoro (port 8880)
while ! nc -z localhost 8880 2>/dev/null; do sleep 2; done
echo "Kokoro ready"
```

Learn more: [Whisper Setup Guide](../guides/whisper-setup.md) | [Kokoro Setup Guide](../guides/kokoro-setup.md)

## Configuration

Yakk works out of the box with sensible defaults. To customize:

### Select Your Voice

```bash
# OpenAI voices
export YAKK_VOICES="nova,shimmer"

# Or Kokoro voices (if using local TTS)
export YAKK_VOICES="af_sky,am_adam"
```

Available OpenAI voices: alloy, echo, fable, onyx, nova, shimmer

### Project-Specific Settings

Create `.yakk.env` in your project:

```bash
export YAKK_VOICES="af_nova,nova"
export YAKK_TTS_SPEED=1.2
```

Learn more: [Configuration Guide](../guides/configuration.md)

## Troubleshooting

### Voice Not Working in Claude?

1. **Check MCP connection**:
   ```bash
   claude mcp list
   ```
   
2. **Verify OPENAI_API_KEY** is set in your MCP configuration

3. Add to your MCP config:
   ```json
   "env": {
     "OPENAI_API_KEY": "sk-...",
   }
   ```

### No Audio Input?

```bash
# List audio devices
yakk diag devices

# Test TTS and STT
yakk converse
```

### Service Issues?

```bash
# Check service status
yakk service status           # All services
yakk service status whisper   # Specific service

# View logs
yakk service logs whisper -n 50
yakk service logs kokoro -n 50

# Check if service is responding
yakk service health whisper
yakk service health kokoro
```

## Running Yakk as a Service (Advanced)

For remote access or persistent operation, run Yakk as a background service:

```bash
# Start the Yakk HTTP server
yakk service start yakk

# Enable auto-start at boot/login
yakk service enable yakk

# Check all services
yakk service status
```

The HTTP server enables remote access from other machines on your network or via secure tunnels.

For security best practices when running remotely, see the [Configuration Guide](../guides/configuration.md#http-server-security).

## Next Steps

- **[Configuration Guide](../guides/configuration.md)** - Customize Yakk
- **[Development Setup](development-setup.md)** - Contribute to Yakk
- **[Service Guides](../guides/)** - Set up Whisper, Kokoro, or LiveKit
- **[CLI Reference](../reference/cli.md)** - All available commands

## Getting Help

- **GitHub Issues**: [github.com/mbailey/yakk/issues](https://github.com/mbailey/yakk/issues)
- **Discord**: Join our community for support

Welcome to voice-enabled AI coding! 🎙️
