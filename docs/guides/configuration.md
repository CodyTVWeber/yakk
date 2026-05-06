# Yakk Configuration Guide

Yakk provides flexible configuration through environment variables and configuration files, following standard precedence rules while maintaining sensible defaults.

*Note: The Python package is called `yakk` but the preferred command is `yakk`.*

## Quick Start

Yakk works out of the box with minimal configuration:

### With Cloud Voice Services
```bash
# Just need an OpenAI API key
export OPENAI_API_KEY="your-api-key"
```

### With Local Voice Services
```bash
# Install local services
yakk service install kokoro
yakk service install whisper

# Enable auto-start at boot/login
yakk service enable kokoro
yakk service enable whisper

# Yakk auto-detects them!
```

### Hybrid Setup (Recommended)
```bash
# Use local services with cloud fallback
export OPENAI_API_KEY="your-api-key"  # Fallback
# Local services auto-detected when running
```

## Configuration System

### Configuration Precedence

Yakk follows standard configuration precedence (highest to lowest):

1. **Command line flags** - Always win
2. **Environment variables** - Override config files
3. **Project config** - `./yakk.env` in current directory
4. **User config** - `~/.yakk/yakk.env`
5. **Auto-discovered services** - Running local services
6. **Built-in defaults** - Sensible fallbacks

### Configuration Files

Yakk automatically creates `~/.yakk/yakk.env` on first run with basic settings. This file uses shell export format:

```bash
# ~/.yakk/yakk.env example
export OPENAI_API_KEY="sk-..."
export YAKK_VOICES="af_sky,nova"
export YAKK_DEBUG=false
```

### MCP Configuration

When used as an MCP server, add to your Claude or other MCP client configuration:

```json
{
  "mcpServers": {
    "yakk": {
      "command": "uvx",
      "args": ["--refresh", "yakk"],
      "env": {
        "OPENAI_API_KEY": "your-key-here"
      }
    }
  }
}
```

## Configuration Reference

### API Keys and Authentication

```bash
# OpenAI API Key (for cloud TTS/STT)
OPENAI_API_KEY=sk-...

# LiveKit credentials (for room-based voice)
LIVEKIT_API_KEY=devkey          # Default for local dev
LIVEKIT_API_SECRET=secret        # Default for local dev
```

### Voice Services

#### Text-to-Speech (TTS)

```bash
# TTS Service URLs (comma-separated, tried in order)
YAKK_TTS_BASE_URLS=http://127.0.0.1:8880/v1,https://api.openai.com/v1

# Voice preferences (comma-separated)
# OpenAI: alloy, echo, fable, onyx, nova, shimmer
# Kokoro: af_sky, af_sarah, am_adam, bf_emma, etc.
YAKK_VOICES=af_sky,nova,alloy

# TTS Models (comma-separated)
# OpenAI: tts-1, tts-1-hd, gpt-4o-mini-tts
YAKK_TTS_MODELS=tts-1-hd,tts-1

# Default TTS voice and model
YAKK_TTS_VOICE=nova
YAKK_TTS_MODEL=tts-1-hd

# Speech speed (0.25 to 4.0)
YAKK_TTS_SPEED=1.0
```

#### Speech-to-Text (STT)

```bash
# STT Service URLs
YAKK_STT_BASE_URLS=http://127.0.0.1:2022/v1,https://api.openai.com/v1

# Whisper configuration
YAKK_WHISPER_MODEL=large-v2    # Model size
YAKK_WHISPER_LANGUAGE=auto     # Language detection
YAKK_WHISPER_PORT=2022         # Server port
```

### Audio Configuration

```bash
# Audio formats
YAKK_AUDIO_FORMAT=pcm          # Global default
YAKK_TTS_AUDIO_FORMAT=pcm      # TTS-specific
YAKK_STT_AUDIO_FORMAT=mp3      # STT-specific

# Supported formats: pcm, opus, mp3, wav, flac, aac

# Quality settings
YAKK_OPUS_BITRATE=32000        # Opus bitrate (bps)
YAKK_MP3_BITRATE=64k           # MP3 bitrate
YAKK_AAC_BITRATE=64k           # AAC bitrate
YAKK_SAMPLE_RATE=24000         # Sample rate (Hz)
```

### Audio Feedback

```bash
# Chimes when recording starts/stops
YAKK_AUDIO_FEEDBACK=true
YAKK_FEEDBACK_STYLE=whisper    # or "shout"

# Silence around chimes (for Bluetooth)
YAKK_CHIME_PRE_DELAY=1.0   # Seconds before
YAKK_CHIME_POST_DELAY=0.5  # Seconds after
```

### Voice Activity Detection

```bash
# VAD Aggressiveness (0-3)
# 0: Least aggressive (captures more)
# 3: Most aggressive (filters more)
YAKK_VAD_AGGRESSIVENESS=3

# Silence detection
YAKK_SILENCE_THRESHOLD=3.0     # Seconds of silence
YAKK_MIN_RECORDING_TIME=0.5    # Minimum recording
YAKK_MAX_RECORDING_TIME=120.0  # Maximum recording
```

### Multi-Agent Voice

When running multiple voice agents (e.g. separate Claude Code sessions in
different tmux panes), the "conch" mechanism serialises speech so only one
agent talks at a time, and `YAKK_AUTO_FOCUS_PANE` can visually follow
the speaker.

```bash
# Auto-focus tmux pane when an agent starts speaking (default: false)
# Switches tmux focus to the speaking agent's pane *after* conch acquisition,
# so agents waiting on the conch never steal focus. Respects the focus-hold
# sentinel written by show-me (~/.yakk/focus-hold) so a shown file is
# not yanked away. Silent no-op outside tmux.
YAKK_AUTO_FOCUS_PANE=false

# Override the default focus-hold duration if the sentinel file has no
# explicit value (default: 30 seconds)
YAKK_FOCUS_HOLD_SECONDS=30

# Conch coordination (serialises speech across agents)
YAKK_CONCH_ENABLED=true
YAKK_CONCH_TIMEOUT=60           # Seconds to wait for the conch
YAKK_CONCH_CHECK_INTERVAL=0.5   # Polling interval
YAKK_CONCH_LOCK_EXPIRY=300      # Stale-lock expiry (0 disables)
```

### LiveKit Configuration

```bash
# Server settings
LIVEKIT_URL=ws://127.0.0.1:7880
LIVEKIT_PORT=7880

# Room settings
YAKK_LIVEKIT_ROOM_PREFIX=yakk
YAKK_LIVEKIT_AUTO_CREATE=true
```

### HTTP Server Configuration

When running Yakk as a remote HTTP service:

```bash
# Server settings
YAKK_SERVE_HOST=127.0.0.1      # Bind address (0.0.0.0 for all interfaces)
YAKK_SERVE_PORT=8765           # Port number
YAKK_SERVE_TRANSPORT=streamable-http  # Transport: streamable-http or sse

# Security: Network access control
YAKK_SERVE_ALLOW_LOCAL=true    # Allow localhost connections
YAKK_SERVE_ALLOW_ANTHROPIC=false  # Allow Anthropic IP ranges
YAKK_SERVE_ALLOW_TAILSCALE=false  # Allow Tailscale IP ranges
YAKK_SERVE_ALLOWED_IPS=        # Custom CIDR ranges (comma-separated)

# Security: Authentication
YAKK_SERVE_SECRET=             # File path containing shared secret
YAKK_SERVE_TOKEN=              # Bearer token for authentication

# Logging
YAKK_SERVE_LOG_LEVEL=info      # Log level: debug, info, warning, error
```

**Quick Start:**
```bash
# Start Yakk HTTP server
yakk service start yakk

# Enable auto-start at boot/login
yakk service enable yakk

# Check status
yakk service status yakk
```

### Local Service Paths

```bash
# Kokoro TTS
YAKK_KOKORO_PORT=8880
YAKK_KOKORO_MODELS_DIR=~/Models/kokoro
YAKK_KOKORO_CACHE_DIR=~/.yakk/cache/kokoro

# Service directories
YAKK_DATA_DIR=~/.yakk
YAKK_LOG_DIR=~/.yakk/logs
YAKK_CACHE_DIR=~/.yakk/cache
```

### Debugging and Logging

```bash
# Debug mode (verbose logging, saves all files)
YAKK_DEBUG=true

# Logging levels
YAKK_LOG_LEVEL=info           # debug, info, warning, error
YAKK_SAVE_ALL=false           # Save all audio files
YAKK_SAVE_RECORDINGS=false    # Save input recordings
YAKK_SAVE_TTS=false           # Save TTS output

# Event logging
YAKK_EVENT_LOG=false          # Log all events
YAKK_CONVERSATION_LOG=false   # Log conversations
```

### Development Settings

```bash
# Skip TTS for faster development
YAKK_SKIP_TTS=false

# Disable specific features
YAKK_DISABLE_SILENCE_DETECTION=false
YAKK_DISABLE_VAD=false
```

## Voice Preferences System

Yakk supports project-specific voice preferences. Create a `.yakk.env` file in your project root:

```bash
# Project-specific voices for a game
export YAKK_VOICES="onyx,fable"
export YAKK_TTS_SPEED=0.9
```

This allows different projects to have different voice settings without changing global configuration.

## Service Auto-Discovery

Yakk automatically discovers running local services:

1. **Whisper STT**: Checks `http://127.0.0.1:2022/v1`
2. **Kokoro TTS**: Checks `http://127.0.0.1:8880/v1`
3. **LiveKit**: Checks `ws://127.0.0.1:7880`

No configuration needed when services run on default ports!

## Configuration Philosophy

Yakk balances MCP compliance with user convenience:

- **Host configuration is authoritative** - Environment variables always win
- **Reasonable defaults** - Works without any configuration
- **Progressive disclosure** - Simple configs for basic use, advanced options available
- **File-based convenience** - Edit familiar config files instead of multiple host configs

## Common Configurations

### Privacy-Focused Local Setup
```bash
# No cloud services, everything local
export YAKK_TTS_BASE_URLS=http://127.0.0.1:8880/v1
export YAKK_STT_BASE_URLS=http://127.0.0.1:2022/v1
export YAKK_VOICES=af_sky
```

### High-Quality Cloud Setup
```bash
# Best quality with OpenAI
export OPENAI_API_KEY=sk-...
export YAKK_TTS_MODEL=tts-1-hd
export YAKK_VOICES=nova,alloy
```

## Troubleshooting Configuration

### Check Active Configuration
```bash
# List all configuration keys
yakk config list

# Get specific settings
yakk config get YAKK_TTS_VOICE
yakk config get OPENAI_API_KEY
```

### Configuration Not Working?

1. **Check precedence**: Environment variables override files
2. **Verify syntax**: Use `export VAR=value` format in files
3. **Check permissions**: Ensure config files are readable
4. **Test services**: Verify local services are running
5. **Enable debug**: Set `YAKK_DEBUG=true` for details

### Reset Configuration
```bash
# Backup and recreate default config
mv ~/.yakk/yakk.env ~/.yakk/yakk.env.backup
# Edit the configuration file to reset
yakk config edit
```

## Claude Code Permissions

When using Yakk with Claude Code, you can configure automatic tool approval to skip permission prompts.

### Quick Setup

Add to `.claude/settings.local.json` in your project:

```json
{
  "permissions": {
    "allow": [
      "mcp__yakk__converse"
    ]
  }
}
```

To also allow service management (start/stop/status):

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

### Settings File Locations

| File | Scope | Git |
|------|-------|-----|
| `~/.claude/settings.json` | All projects | N/A |
| `.claude/settings.json` | Project (shared) | Commit |
| `.claude/settings.local.json` | Project (personal) | Ignore |

### Allowing All Yakk Tools

To allow all tools from the Yakk server:

```json
{
  "permissions": {
    "allow": ["mcp__yakk"]
  }
}
```

> **Note**: Wildcards like `mcp__yakk__*` are not supported. Use `mcp__yakk` without a tool suffix.

### Useful Commands

- `/permissions` - View and manage tool permission rules

See the [Claude Code Settings documentation](https://code.claude.com/docs/en/settings) for more details.

## Security Considerations

### General Security

- **Never commit API keys** to version control
- **Use environment variables** for sensitive data in production
- **Restrict file permissions**: `chmod 600 ~/.yakk/yakk.env`
- **Rotate keys regularly** if exposed
- **Use local services** for sensitive audio data

### HTTP Server Security

When running Yakk as an HTTP service for remote access, follow these best practices:

#### 1. Bind to Localhost by Default

The safest configuration binds only to localhost:

```bash
YAKK_SERVE_HOST=127.0.0.1
```

This prevents network access entirely. Use a secure tunnel (Tailscale, Cloudflare Tunnel) for remote access.

#### 2. Use Network Access Controls

When exposing to a network, restrict access:

```bash
# Allow only Tailscale connections (100.64.0.0/10)
YAKK_SERVE_ALLOW_TAILSCALE=true
YAKK_SERVE_HOST=0.0.0.0

# Or allow specific IP ranges
YAKK_SERVE_ALLOWED_IPS=192.168.1.0/24,10.0.0.0/8
```

#### 3. Enable Authentication for Remote Access

Use bearer token authentication when exposing beyond localhost:

```bash
# Generate a secure token
openssl rand -hex 32 > ~/.yakk/serve.token

# Configure Yakk to use it
YAKK_SERVE_TOKEN=$(cat ~/.yakk/serve.token)
```

Clients must include `Authorization: Bearer <token>` in requests.

#### 4. Use Secure Tunnels for Internet Access

For internet access, use a secure tunnel instead of direct exposure:

- **Tailscale**: Zero-config VPN for secure remote access
- **Cloudflare Tunnel**: Secure tunnel without opening ports
- **ngrok**: Quick tunnels for testing (not recommended for production)

#### 5. Monitor Service Logs

Regularly check logs for unauthorized access attempts:

```bash
# View service logs
yakk service logs yakk -n 100

# On macOS, also check:
log show --predicate 'process == "yakk"' --last 1h
```

#### Security Mode Summary

| Access Level | Host | Security |
|--------------|------|----------|
| Localhost only | `127.0.0.1` | No auth needed |
| Local network | `0.0.0.0` + ALLOWED_IPS | Token recommended |
| Tailscale | `0.0.0.0` + ALLOW_TAILSCALE | Token recommended |
| Internet | Use secure tunnel | Token required |
