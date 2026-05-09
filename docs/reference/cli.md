# CLI Command Reference

Complete reference for all Yakk command-line interface commands.

## Global Options

```bash
yakk [OPTIONS] COMMAND [ARGS]...

Options:
  --version   Show the version and exit
  -h, --help  Show this message and exit
  --debug     Enable debug mode and show all warnings
```

## Core Commands

### yakk (default)
Start the MCP server (stdio transport)
```bash
yakk
```

### serve
Start the MCP server with HTTP transport for remote access

```bash
yakk serve [OPTIONS]

Options:
  --host TEXT                  Host to bind to (default: 127.0.0.1)
  -p, --port INTEGER           Port to bind to (default: 8765)
  --transport, -t [streamable-http|sse]
                               Transport protocol to use (default: streamable-http)
  --log-level [debug|info|warning|error]
                               Logging level (default: info)
  --allow-anthropic / --no-allow-anthropic
                               Allow Anthropic IP ranges (160.79.104.0/21)
  --allow-tailscale / --no-allow-tailscale
                               Allow Tailscale IP range (100.64.0.0/10)
  --allow-ip CIDR              Add custom CIDR to allowlist (repeatable)
  --allow-local / --no-allow-local
                               Allow localhost connections (default: true)
  --secret SECRET              Require secret path segment for access
  --token TOKEN                Require Bearer token authentication

Examples:
# Local development with streamable-http (default - localhost only)
yakk serve

# Explicitly specify streamable-http transport
yakk serve --transport streamable-http

# Use SSE transport (deprecated - for legacy compatibility)
yakk serve --transport sse

# Allow Anthropic's Agent.ai and Agent Cowork to connect
yakk serve --allow-anthropic

# Custom IP allowlist
yakk serve --allow-ip 192.168.1.0/24 --allow-ip 10.0.0.0/8

# Allow all devices on your Tailscale network
yakk serve --allow-tailscale

# Strict Anthropic-only mode (no localhost)
yakk serve --allow-anthropic --no-allow-local

# URL secret authentication (recommended for Agent.ai)
yakk serve --secret my-secret-uuid

# Bearer token authentication
yakk serve --token my-secret-token

# Defense in depth: combine IP allowlist + token
yakk serve --allow-anthropic --token my-secret-token

# SSE with secret path segment (deprecated)
yakk serve --transport sse --secret my-secret-uuid

# Enable debug logging for troubleshooting
yakk serve --log-level debug
```

#### Transport Options

The `--transport` option selects the HTTP transport protocol for the MCP server.

**Streamable HTTP (Recommended)**

The `streamable-http` transport is the modern, recommended transport for MCP servers:
- Uses `/mcp` as the base endpoint path
- Better performance and reliability
- Supports bidirectional streaming
- Recommended for all new deployments

Example: `yakk serve --transport streamable-http` creates endpoint at `http://127.0.0.1:8765/mcp`

**SSE (Deprecated)**

The `sse` (Server-Sent Events) transport is maintained for backward compatibility:
- Uses `/sse` as the base endpoint path
- One-way server-to-client streaming only
- Will show a deprecation warning when used
- Consider migrating to streamable-http

Example: `yakk serve --transport sse` creates endpoint at `http://127.0.0.1:8765/sse`

**Environment Variable**

You can also set the default transport via environment variable:
```bash
export YAKK_SERVE_TRANSPORT=streamable-http  # or 'sse'
yakk serve
```

The CLI option takes precedence over the environment variable.

#### Migrating from SSE to Streamable HTTP

If you are currently using SSE transport and want to migrate to streamable-http:

1. **Update your serve command**: Change `--transport sse` to `--transport streamable-http` (or remove it entirely since streamable-http is the default)

2. **Update your client endpoint**: Change the URL path from `/sse` to `/mcp`:
   - Before: `http://your-host:8765/sse`
   - After: `http://your-host:8765/mcp`

3. **If using secret paths**, the structure remains the same:
   - Before: `http://your-host:8765/sse/{secret}`
   - After: `http://your-host:8765/mcp/{secret}`

4. **Test your connection** before deploying to production

#### Security Options

**IP Allowlist**

The `--allow-anthropic` flag adds Anthropic's outbound IP ranges to the allowlist, enabling connections from Agent.ai and Agent Cowork. The `--allow-tailscale` flag adds the Tailscale CGNAT range (100.64.0.0/10), allowing any device on your Tailscale network to connect. Use `--allow-ip` to add custom CIDR ranges.

By default, localhost connections are allowed (`--allow-local`). Use `--no-allow-local` to disable this for strict remote-only access.

**Logging**

The `--log-level` option controls the verbosity of server logs. Available levels are `debug`, `info` (default), `warning`, and `error`. Use `--log-level debug` for troubleshooting connection issues.

**URL Secret Authentication**

The `--secret` option adds a secret path segment to the endpoint URL:
- Endpoint becomes `/{base_path}/{secret}` instead of `/{base_path}`
- Acts as a pre-shared key embedded in the URL
- Returns 404 (not 403) for incorrect paths to avoid revealing endpoint existence
- Ideal for Agent.ai which accepts any URL but doesn't support OAuth

Examples:
- Streamable HTTP: `yakk serve --secret abc123` creates endpoint at `/mcp/abc123`
- SSE: `yakk serve --transport sse --secret abc123` creates endpoint at `/sse/abc123`

**Bearer Token Authentication**

The `--token` option requires all requests to include a valid Authorization header:
```
Authorization: Bearer <token>
```

Returns 401 Unauthorized for missing or invalid tokens.

### converse
Have a voice conversation directly from the command line
```bash
yakk converse [OPTIONS]

Options:
  --voice TEXT          Override TTS voice
  --model TEXT          Override TTS model
  --debug               Enable debug mode
  --skip-tts            Text-only output
  --timeout INTEGER     Recording timeout in seconds
```

### transcribe
Transcribe audio with optional word-level timestamps

```bash
yakk transcribe [OPTIONS]

Options:
  --timestamps     Include word-level timestamps
  --output TEXT    Output file path (default: stdout)
  --format TEXT    Output format: text, json, vtt, srt

Examples:
echo "Hello" | yakk transcribe
yakk transcribe < audio.wav
yakk transcribe --timestamps < recording.wav
```

## Diagnostic Commands

### diag
Diagnostic tools for yakk

```bash
yakk diag [OPTIONS] COMMAND [ARGS]...

Commands:
  devices       List available audio input and output devices
  info          Show yakk installation information
  registry      Show voice provider registry with all discovered endpoints
```

## Service Management

### whisper
Manage Whisper STT service

```bash
# Installation and setup
yakk whisper install [--model MODEL]
yakk whisper uninstall

# Service control
yakk whisper start
yakk whisper stop
yakk whisper restart
yakk whisper status

# Service management
yakk whisper enable    # Start at boot
yakk whisper disable   # Don't start at boot

# Model management
yakk whisper models                    # List available models
yakk whisper model active             # Show active model
yakk whisper model active MODEL       # Set active model
yakk whisper model install MODEL      # Install specific model
yakk whisper model remove MODEL       # Remove model

# Logs and debugging
yakk whisper logs [--follow]
```

Available models:
- tiny, tiny.en (39 MB)
- base, base.en (142 MB)
- small, small.en (466 MB)
- medium, medium.en (1.5 GB)
- large-v1, large-v2, large-v3 (2.9-3.1 GB)
- large-v3-turbo (1.6 GB)

### kokoro
Manage Kokoro TTS service

```bash
# Installation and setup
yakk kokoro install
yakk kokoro uninstall

# Service control
yakk kokoro start
yakk kokoro stop
yakk kokoro restart
yakk kokoro status

# Service management
yakk kokoro enable
yakk kokoro disable

# Information
yakk kokoro voices     # List available voices
yakk kokoro logs [--follow]
```

### livekit
Manage LiveKit RTC service

```bash
# Installation and setup
yakk livekit install
yakk livekit uninstall [--remove-all-data]

# Service control
yakk livekit start
yakk livekit stop
yakk livekit restart
yakk livekit status

# Service management
yakk livekit enable
yakk livekit disable

# Configuration
yakk livekit update    # Update service files
yakk livekit logs [--follow]
```


## Soundfonts

### soundfonts
Toggle soundfont playback for Agent CLI hooks

```bash
# Quick toggle (session-scoped)
yakk soundfonts off          # Disable immediately
yakk soundfonts on           # Re-enable

# Persistent config change
yakk soundfonts on --config  # Enable + update yakk.env
yakk soundfonts off --config # Disable + update yakk.env

# Check current state
yakk soundfonts status       # Shows sentinel file + env var state
```

The `off` command creates a sentinel file (`~/.yakk/soundfonts-disabled`) that the hook receiver checks before playing sounds. The `--config` flag also updates `YAKK_SOUNDFONTS_ENABLED` in `~/.yakk/yakk.env`.

## Agent CLI Integration

### agent hooks
Manage Agent CLI hook integration

```bash
# Install hooks
yakk agent hooks add

# Remove hooks
yakk agent hooks remove

# List installed hooks
yakk agent hooks list
```

Hooks connect Agent CLI's tool events to Yakk's soundfont system. The `add` command registers the hook receiver script with Agent CLI's settings.

## Configuration Commands

### config
Manage yakk configuration

```bash
# Show current configuration
yakk config show

# Initialize default config
yakk config init

# Test configuration
yakk config test

# Edit configuration
yakk config edit
```

## Conversation Management

### exchanges
Manage and view conversation exchange logs

```bash
# View recent exchanges
yakk exchanges

# View specific exchange
yakk exchanges show EXCHANGE_ID

# Clear exchange logs
yakk exchanges clear
```

## Utility Commands

### completions
Generate or install shell completion scripts

```bash
# Install completions for your shell
yakk completions install

# Generate completion script for specific shell
yakk completions bash
yakk completions zsh
yakk completions fish
```

## Environment Variables

Commands respect environment variables for configuration:

```bash
# Use specific API key
OPENAI_API_KEY=sk-... yakk converse

# Enable debug mode
YAKK_DEBUG=true yakk

# Use local services
YAKK_TTS_BASE_URLS=http://localhost:8880/v1 yakk converse
```

## Exit Codes

- 0: Success
- 1: General error
- 2: Command line syntax error
- 3: Service not running
- 4: Service already running
- 5: Permission denied
- 127: Command not found

## Examples

### Basic Usage
```bash
# Start MCP server
yakk

# Have a conversation
yakk converse

# Transcribe audio file
yakk transcribe < recording.wav
```

### Service Setup
```bash
# Full local setup
yakk whisper install
yakk kokoro install
yakk whisper enable
yakk kokoro enable
```

### Development
```bash
# Debug mode with all saves
YAKK_DEBUG=true YAKK_SAVE_ALL=true yakk converse

# Test local changes
uvx --from . yakk

# Check diagnostics
yakk diag info
```

### Troubleshooting
```bash
# Check what's running
yakk whisper status
yakk kokoro status

# View logs
yakk whisper logs --follow
yakk kokoro logs --follow

# Check registry and providers
yakk diag registry

# Restart services
yakk whisper restart
yakk kokoro restart
```