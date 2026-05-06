---
name: yakk
description: Voice interaction for Claude Code. Use when users mention yakk, speak, talk, converse, voice status, or voice troubleshooting.
---

## First-Time Setup

If Yakk isn't working or MCP fails to connect, run:

```
/yakk:install
```

After install, reconnect MCP: `/mcp` → select yakk → "Reconnect" (or restart Claude Code).

---

# Yakk

Natural voice conversations with Claude Code using speech-to-text (STT) and text-to-speech (TTS).

**Note:** The Python package is `yakk` (hyphen), but the CLI command is `yakk` (no hyphen).

## When to Use MCP vs CLI

| Task | Use | Why |
|------|-----|-----|
| Voice conversations | MCP `yakk:converse` | Faster - server already running |
| Service start/stop | MCP `yakk:service` | Works within Claude Code |
| Installation | CLI `yakk-install` | One-time setup |
| Configuration | CLI `yakk config` | Edit settings directly |
| Diagnostics | CLI `yakk diag` | Administrative tasks |

## Usage

Use the `converse` MCP tool to speak to users and hear their responses:

```python
# Speak and listen for response (most common usage)
yakk:converse("Hello! What would you like to work on?")

# Speak without waiting (for narration while working)
yakk:converse("Searching the codebase now...", wait_for_response=False)
```

For most conversations, just pass your message - defaults handle everything else.
Use default converse tool parameters unless there's a good reason not to. Timing parameters (`listen_duration_max`, `listen_duration_min`) use smart defaults with silence detection - don't override unless the user requests it or you see a clear need. Defaults are configurable by the user via `~/.yakk/yakk.env`.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `message` | required | Text to speak |
| `wait_for_response` | true | Listen after speaking |
| `voice` | auto | TTS voice |

For all parameters, see [Converse Parameters](../../docs/reference/converse-parameters.md).

## Best Practices

1. **Narrate without waiting** - Use `wait_for_response=False` when announcing actions
2. **One question at a time** - Don't bundle multiple questions in yakk
3. **Check status first** - Verify services are running before starting conversations
4. **Let Yakk auto-select** - Don't hardcode providers unless user has preference
5. **First run is slow** - Model downloads happen on first start (2-5 min), then instant

## Parallel Tool Calls (Zero Dead Air)

When performing actions during a voice conversation, use parallel tool calls to eliminate dead air. Send the voice message and the action in the **same turn** so they execute concurrently.

### Pattern: Speak + Act in Parallel

```python
# FAST: One turn — voice and action fire simultaneously
# Turn 1: speak (fire-and-forget) + do the work (all parallel)
yakk:converse("Checking that now.", wait_for_response=False)
bash("git status")
Agent(prompt="Research X", run_in_background=True)

# Turn 2: speak the results (with listening)
yakk:converse("Here's what I found: ...", wait_for_response=True)
```

```python
# SLOW: Two turns — unnecessary sequential delay
# Turn 1: speak
yakk:converse("Checking that now.", wait_for_response=False)
# Turn 2: do the work
bash("git status")
# Turn 3: speak results
yakk:converse("Here's what I found: ...", wait_for_response=True)
```

### When to Use Parallel vs Sequential

| Scenario | Approach | Why |
|----------|----------|-----|
| Announce + do work | **Parallel** | No dependency between speech and action |
| Announce + spawn agent | **Parallel** | Agent runs in background anyway |
| Check result then report | **Sequential** | Need result before speaking |
| Listen for response | **Sequential** | `wait_for_response=True` blocks until user finishes |

### Key Rules

- **All tool types can be parallel**: MCP, Bash, Agent, Read — mix freely in one turn
- **Wall-clock time = longest call**, not the sum of all calls
- **Use `wait_for_response=False`** for the speak call when combining with other tools
- **Great for demos**: Audience hears continuous speech with no awkward silences

## Handling Pauses and Wait Requests

When the user asks you to wait or give them time:

**Short pauses (up to 60 seconds):** If the user says something ending with "wait" (e.g., "hang on", "give me a sec", "wait"), Yakk automatically pauses for 60 seconds then resumes listening. This is built-in.

**Longer pauses (2+ minutes):** Use `bash sleep N` where N is seconds. For example, if the user says "give me 5 minutes":
```bash
sleep 300  # Wait 5 minutes
```
Then call converse again when the wait is over:
```python
yakk:converse("Five minutes is up. Ready when you are.")
```

**Configuration:** The short pause duration is configurable via `YAKK_WAIT_DURATION` (default: 60 seconds).

## STT Recovery - Manual Transcription

If Whisper STT fails but the audio was recorded successfully, you can manually transcribe the saved audio file:

```bash
# Transcribe the most recent recording
whisper-cli ~/.yakk/audio/latest-STT.wav

# Or check if file exists first (safe for inclusion in automation)
if [ -f ~/.yakk/audio/latest-STT.wav ]; then
  whisper-cli ~/.yakk/audio/latest-STT.wav
fi
```

**Requirements:**
- Audio saving must be enabled via one of:
  - `YAKK_SAVE_AUDIO=true` in `~/.yakk/yakk.env`
  - `YAKK_SAVE_ALL=true` (saves all audio and transcriptions)
  - `YAKK_DEBUG=true` (enables debug mode with audio saving)

**How it works:**
- Yakk saves all STT recordings to `~/.yakk/audio/` with timestamps
- The `latest-STT.wav` symlink always points to the most recent recording
- If the STT API fails, the recording is still saved for manual recovery
- This lets you recover the user's speech without asking them to repeat

**When to use:**
- STT service timeout or connection failure
- Transcription returned empty but user definitely spoke
- Need to verify what was actually said vs. what was transcribed

See also: [Troubleshooting - No Speech Detected](../../docs/troubleshooting/index.md#1-no-speech-detected)

## Check Status

```bash
yakk service status          # All services
yakk service status whisper  # Specific service
```

Shows service status including running state, ports, and health.

## Installation

```bash
# Install Yakk CLI and configure services
uvx yakk-install --yes

# Install local services (Apple Silicon recommended)
yakk service install whisper
yakk service install kokoro
```

See [Getting Started](../../docs/tutorials/getting-started.md) for detailed steps.

## Service Management

```python
# Start/stop services
yakk:service("whisper", "start")
yakk:service("kokoro", "start")

# View logs for troubleshooting
yakk:service("whisper", "logs", lines=50)
```

| Service | Port | Purpose |
|---------|------|---------|
| whisper | 2022 | Speech-to-text |
| kokoro | 8880 | Text-to-speech |
| yakk | 8765 | HTTP/SSE server |

**Actions:** status, start, stop, restart, logs, enable, disable

## Configuration

```bash
yakk config list                           # Show all settings
yakk config set YAKK_TTS_VOICE nova   # Set default voice
yakk config edit                           # Edit config file
```

Config file: `~/.yakk/yakk.env`

See [Configuration Guide](../../docs/guides/configuration.md) for all options.

## DJ Mode

Background music during Yakk sessions with track-level control.

```bash
# Core playback
yakk dj play /path/to/music.mp3  # Play a file or URL
yakk dj status                    # What's playing
yakk dj pause                     # Pause playback
yakk dj resume                    # Resume playback
yakk dj stop                      # Stop playback

# Navigation and volume
yakk dj next                      # Skip to next chapter
yakk dj prev                      # Go to previous chapter
yakk dj volume 30                 # Set volume to 30%

# Music For Programming
yakk dj mfp list                  # List available episodes
yakk dj mfp play 49               # Play episode 49
yakk dj mfp sync                  # Convert CUE files to chapters

# Music library
yakk dj find "daft punk"          # Search library
yakk dj library scan              # Index ~/Audio/music
yakk dj library stats             # Show library info

# Play history and favorites
yakk dj history                   # Show recent plays
yakk dj favorite                  # Toggle favorite on current track
```

**Configuration:** Set `YAKK_DJ_VOLUME` in `~/.yakk/yakk.env` to customize startup volume (default: 50%).

## CLI Cheat Sheet

```bash
# Service management
yakk service status            # All services
yakk service start whisper     # Start a service
yakk service logs kokoro       # View logs

# Diagnostics
yakk deps                      # Check dependencies
yakk diag info                 # System info
yakk diag devices              # Audio devices

# DJ Mode
yakk dj play <file|url>        # Start playback
yakk dj status                 # What's playing
yakk dj next/prev              # Navigate chapters
yakk dj stop                   # Stop playback
yakk dj mfp play 49            # Music For Programming
```

## Voice Handoff Between Agents

Transfer voice conversations between Claude Code agents for multi-agent workflows.

**Use cases:**
- Personal assistant routing to project-specific foremen
- Foremen delegating to workers for focused tasks
- Returning control when work is complete

### Quick Reference

```python
# 1. Announce the transfer
yakk:converse("Transferring you to a project agent.", wait_for_response=False)

# 2. Spawn with voice instructions (mechanism depends on your setup)
spawn_agent(path="/path", prompt="Load yakk skill, use converse to greet user")

# 3. Go quiet - let new agent take over
```

**Hand-back:**
```python
yakk:converse("Transferring you back to the assistant.", wait_for_response=False)
# Stop conversing, exit or go idle
```

### Key Principles

1. **Announce transfers**: Always tell the user before transferring
2. **One speaker**: Only one agent should use converse at a time
3. **Distinct voices**: Different voices make handoffs audible
4. **Provide context**: Tell receiving agent why user is being transferred

### Auto-focus tmux pane on speak (opt-in)

When you run multiple voice agents in separate tmux panes, set
`YAKK_AUTO_FOCUS_PANE=true` to make tmux follow the speaker. Focus
switches **after conch acquisition**, so agents waiting on the conch never
steal focus -- only the agent about to speak does. It also respects the
`~/.yakk/focus-hold` sentinel written by the show-me plugin, so a
file you just opened stays on screen for its hold window.

```bash
# ~/.yakk/yakk.env
YAKK_AUTO_FOCUS_PANE=true
```

Off by default. Silent no-op outside tmux.

### Detailed Documentation

See [Call Routing](../../../docs/guides/agents/call-routing/) for comprehensive guides:
- [Handoff Pattern](../../../docs/guides/agents/call-routing/handoff.md) - Complete hand-off and hand-back process
- [Voice Proxy](../../../docs/guides/agents/call-routing/proxy.md) - Relay pattern for agents without voice
- [Call Routing Overview](../../../docs/guides/agents/call-routing/README.md) - All routing patterns

## Sharing Voice Services Over Tailscale

Expose local Whisper (STT) and Kokoro (TTS) to other devices on your Tailnet via HTTPS.

### Why

- Browsers require HTTPS for microphone access (e.g., Yakk Connect web app)
- Tailscale serve provides automatic HTTPS with valid Let's Encrypt certificates for `*.ts.net` domains
- Enables using your powerful local machine's GPU from any device on your Tailnet

### Setup

```bash
# Expose TTS (Kokoro on port 8880)
tailscale serve --bg --set-path /v1/audio/speech http://localhost:8880/v1/audio/speech

# Expose STT (Whisper on port 2022)
tailscale serve --bg --set-path /v1/audio/transcriptions http://localhost:2022/v1/audio/transcriptions

# Verify configuration
tailscale serve status

# Reset all serve config
tailscale serve reset
```

### Endpoints

After setup, endpoints are available at:
- **TTS:** `https://<hostname>.<tailnet>.ts.net/v1/audio/speech`
- **STT:** `https://<hostname>.<tailnet>.ts.net/v1/audio/transcriptions`

### Important Notes

- **Path mapping**: Tailscale strips the incoming path before forwarding, so you MUST include the full path in the target URL
- **Same-machine testing**: Traffic doesn't route through Tailscale locally — test from another Tailnet device
- **Multiple paths**: You can configure different paths to different backends on the same or different machines
- **CORS**: Kokoro has CORS configured to allow `https://app.yakk.dev` origins

### Use with Yakk Connect

In the Yakk Connect web app settings (app.yakk.dev/settings), set:
- **TTS Endpoint**: `https://<hostname>.<tailnet>.ts.net`
- **STT Endpoint**: `https://<hostname>.<tailnet>.ts.net`

## Soundfonts

Audio feedback tones that play during Claude Code tool use. Toggle with `yakk soundfonts on/off`. See [Soundfonts Guide](../../docs/guides/soundfonts.md).

## Documentation Index

| Topic | Link |
|-------|------|
| Converse Parameters | [All Parameters](../../docs/reference/converse-parameters.md) |
| Installation | [Getting Started](../../docs/tutorials/getting-started.md) |
| Configuration | [Configuration Guide](../../docs/guides/configuration.md) |
| Claude Code Plugin | [Plugin Guide](../../docs/guides/claude-code-plugin.md) |
| Whisper STT | [Whisper Setup](../../docs/guides/whisper-setup.md) |
| Kokoro TTS | [Kokoro Setup](../../docs/guides/kokoro-setup.md) |
| Pronunciation | [Pronunciation Guide](../../docs/guides/pronunciation.md) |
| Troubleshooting | [Troubleshooting](../../docs/troubleshooting/index.md) |
| Soundfonts | [Soundfonts Guide](../../docs/guides/soundfonts.md) |
| CLI Reference | [CLI Docs](../../docs/reference/cli.md) |
| DJ Mode | [Background Music](docs/dj-mode/README.md) |

## Related Skills

- **[Yakk Connect](../yakk-connect/SKILL.md)** - Remote voice via mobile/web clients (no local STT/TTS needed)
