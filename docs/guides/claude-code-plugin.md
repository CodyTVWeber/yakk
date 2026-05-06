# Claude Code Plugin

Yakk provides an official plugin for Claude Code that enables voice conversations directly within the CLI.

## What the Plugin Provides

The Yakk plugin includes:

- **MCP Server** - Full voice capabilities via the `yakk-mcp` server
- **Slash Commands** - Quick access to common operations
- **Skill File** - Documentation and usage patterns for Claude
- **Hooks** - Sound feedback during tool execution

## Installation

### From the Plugin Marketplace

The plugin is published to the Claude Code plugin marketplace:

```bash
# Add the marketplace
claude plugin marketplace add https://github.com/mbailey/claude-plugins

# Install the plugin
claude plugin install yakk@mbailey
```

## Prerequisites

The plugin requires Yakk services to be installed and running. After installing the plugin, use the install command:

```bash
/yakk:install
```

This runs the Yakk installer which sets up:

- **Whisper.cpp** - Local speech-to-text
- **Kokoro** - Local text-to-speech
- **FFmpeg** - Audio processing (via Homebrew on macOS)

Or install Yakk directly using uv:

```bash
uv tool install yakk
yakk whisper service install
yakk kokoro install
```

## Slash Commands

| Command | Description |
|---------|-------------|
| `/yakk:install` | Install Yakk and dependencies |
| `/yakk:converse` | Start a voice conversation |
| `/yakk:status` | Check service status |
| `/yakk:start` | Start voice services |
| `/yakk:stop` | Stop voice services |

### Starting a Conversation

```bash
# Start with a greeting
/yakk:converse Hello, how can I help you today?

# Just start listening
/yakk:converse
```

### Checking Status

```bash
/yakk:status
```

Shows whether Whisper (STT) and Kokoro (TTS) services are running and healthy.

## MCP Tools

Once installed, Claude has access to these MCP tools:

- `mcp__yakk__converse` - Speak and listen for responses
- `mcp__yakk__service` - Manage voice services

### Converse Tool Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `message` | (required) | Text for Claude to speak |
| `wait_for_response` | true | Listen for user response after speaking |
| `listen_duration_max` | 120 | Maximum recording time (seconds) |
| `voice` | auto | TTS voice name |
| `vad_aggressiveness` | 3 | Voice detection strictness (0-3) |

## Hooks and Soundfonts

The plugin includes a hook receiver that plays sounds during tool execution:

- Sounds play when tools start and complete
- Provides audio feedback during long operations
- Uses configurable soundfonts
- Toggle with `yakk soundfonts on/off`

Hooks are automatically configured when the plugin is installed.

See the [Soundfonts Guide](soundfonts.md) for customization, sound lookup order, and troubleshooting.

## Troubleshooting

### Services Not Starting

Check individual service status:

```bash
yakk whisper service status
yakk kokoro service status
```

View logs:

```bash
yakk whisper service logs
yakk kokoro service logs
```

### No Audio Output

1. Ensure your system audio is working
2. Check that Kokoro service is running
3. Verify FFmpeg is installed: `which ffmpeg`

### Speech Not Recognized

1. Ensure Whisper service is running
2. Check microphone permissions for Terminal/Claude Code
3. Try speaking more clearly or adjusting VAD aggressiveness

## Configuration

Yakk respects configuration from `~/.yakk/yakk.env`:

```bash
# Default TTS voice
YAKK_TTS_VOICE=nova

# Whisper model (base, small, medium, large)
YAKK_WHISPER_MODEL=base

# Override thread count for Whisper
YAKK_WHISPER_THREADS=4
```

Edit configuration:

```bash
yakk config edit
```

## Resources

- [GitHub Repository](https://github.com/mbailey/yakk)
- [Plugin Source](https://github.com/mbailey/yakk)

## Development

For local development, add the plugin from your local clone:

```bash
# Add plugin from local path
claude plugin marketplace add /path/to/yakk

# Install the plugin
claude plugin install yakk@mbailey
```
