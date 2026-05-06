# Environment Variables Reference

Complete reference of all environment variables used by Yakk.

## Variable Precedence

Environment variables are processed in this order (highest to lowest priority):
1. Command-line environment (`OPENAI_API_KEY=xxx yakk`)
2. MCP host configuration
3. Shell environment variables
4. Project `.yakk.env` file
5. User `~/.yakk/yakk.env` file
6. Built-in defaults

## Core Configuration

### API Keys

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `OPENAI_API_KEY` | OpenAI API key for cloud TTS/STT | None | `sk-proj-...` |

## Voice Services

### Text-to-Speech (TTS)

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `YAKK_TTS_BASE_URLS` | Comma-separated TTS service URLs | `http://127.0.0.1:8880/v1,https://api.openai.com/v1` | `http://localhost:8880/v1` |
| `YAKK_VOICES` | Comma-separated voice preferences | `af_sky,alloy` | `nova,shimmer` |
| `YAKK_TTS_VOICE` | Default TTS voice | First from VOICES | `nova` |
| `YAKK_TTS_MODELS` | Comma-separated TTS models | `tts-1-hd,tts-1` | `gpt-4o-mini-tts,tts-1` |
| `YAKK_TTS_MODEL` | Default TTS model | First from MODELS | `tts-1-hd` |
| `YAKK_TTS_SPEED` | Speech speed (0.25-4.0) | `1.0` | `1.5` |

### Speech-to-Text (STT)

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `YAKK_STT_BASE_URLS` | Comma-separated STT service URLs | `https://api.openai.com/v1` | `http://localhost:2022/v1` |
| `YAKK_STT_MODEL` | STT model | `whisper-1` | `whisper-1` |
| `YAKK_STT_PROMPT` | Vocabulary biasing for Whisper (names, terms) | None | `tmux, Tali, kubectl` |

### Whisper Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `YAKK_WHISPER_MODEL` | Whisper model size | `large-v2` | `base.en` |
| `YAKK_WHISPER_LANGUAGE` | Language code or 'auto' | `auto` | `en` |
| `YAKK_WHISPER_PORT` | Whisper server port | `2022` | `2023` |
| `YAKK_WHISPER_MODEL_PATH` | Path to Whisper models | `~/.yakk/models/whisper` | `/models/whisper` |

### Kokoro Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `YAKK_KOKORO_PORT` | Kokoro server port | `8880` | `8881` |
| `YAKK_KOKORO_MODELS_DIR` | Kokoro models directory | `~/Models/kokoro` | `/models/kokoro` |
| `YAKK_KOKORO_CACHE_DIR` | Kokoro cache directory | `~/.yakk/cache/kokoro` | `/cache/kokoro` |
| `YAKK_KOKORO_DEFAULT_VOICE` | Default Kokoro voice | `af_sky` | `am_adam` |

## Soundfonts

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `YAKK_SOUNDFONTS_ENABLED` | Enable/disable soundfont playback | `true` | `false` |
| `YAKK_HOOK_DEBUG` | Enable debug output from hook receiver | unset | `1` |

`YAKK_SOUNDFONTS_ENABLED` can be set in `~/.yakk/yakk.env` or the shell environment. The sentinel file (`~/.yakk/soundfonts-disabled`, managed by `yakk soundfonts on/off`) takes priority when present.

See the [Soundfonts Guide](../guides/soundfonts.md) for details.

## Audio Configuration

### Audio Formats

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `YAKK_AUDIO_FORMAT` | Global audio format | `pcm` | `mp3` |
| `YAKK_TTS_AUDIO_FORMAT` | TTS-specific format | `pcm` | `opus` |
| `YAKK_STT_AUDIO_FORMAT` | STT-specific format | `mp3` | `wav` |

Supported formats: `pcm`, `opus`, `mp3`, `wav`, `flac`, `aac`

### Audio Quality

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `YAKK_SAMPLE_RATE` | Sample rate in Hz | `24000` | `48000` |
| `YAKK_OPUS_BITRATE` | Opus bitrate in bps | `32000` | `64000` |
| `YAKK_MP3_BITRATE` | MP3 bitrate | `64k` | `128k` |
| `YAKK_AAC_BITRATE` | AAC bitrate | `64k` | `96k` |

### Audio Feedback

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `YAKK_AUDIO_FEEDBACK` | Enable recording chimes | `true` | `false` |
| `YAKK_FEEDBACK_STYLE` | Chime style | `whisper` | `shout` |
| `YAKK_CHIME_PRE_DELAY` | Silence before chime (seconds) | `0.1` | `1.0` |
| `YAKK_CHIME_POST_DELAY` | Silence after chime (seconds) | `0.2` | `0.5` |

## Voice Activity Detection

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `YAKK_VAD_AGGRESSIVENESS` | VAD level (0-3) | `3` | `3` |
| `YAKK_DISABLE_VAD` | Disable VAD | `false` | `true` |
| `YAKK_DISABLE_SILENCE_DETECTION` | Disable silence detection | `false` | `true` |
| `YAKK_SILENCE_THRESHOLD` | Silence duration (seconds) | `3.0` | `5.0` |
| `YAKK_MIN_RECORDING_TIME` | Minimum recording (seconds) | `0.5` | `1.0` |
| `YAKK_MAX_RECORDING_TIME` | Maximum recording (seconds) | `120.0` | `60.0` |

## File Storage

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `YAKK_DATA_DIR` | Data directory | `~/.yakk` | `/data/yakk` |
| `YAKK_LOG_DIR` | Log directory | `~/.yakk/logs` | `/var/log/yakk` |
| `YAKK_CACHE_DIR` | Cache directory | `~/.yakk/cache` | `/tmp/yakk` |
| `YAKK_SAVE_ALL` | Save all audio files | `false` | `true` |
| `YAKK_SAVE_RECORDINGS` | Save input recordings | `false` | `true` |
| `YAKK_SAVE_TTS` | Save TTS output | `false` | `true` |

## Logging and Debugging

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `YAKK_DEBUG` | Enable debug mode | `false` | `true` |
| `YAKK_LOG_LEVEL` | Log level | `info` | `debug` |
| `YAKK_EVENT_LOG` | Enable event logging | `false` | `true` |
| `YAKK_CONVERSATION_LOG` | Log conversations | `false` | `true` |
| `YAKK_SKIP_TTS` | Skip TTS for testing | `false` | `true` |

Log levels: `debug`, `info`, `warning`, `error`, `critical`

## Advanced Features

### Emotional TTS

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `YAKK_ALLOW_EMOTIONS` | Enable emotional TTS | `false` | `true` |
| `YAKK_EMOTION_AUTO_UPGRADE` | Auto-upgrade to emotional model | `false` | `true` |

### Service Preferences

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `YAKK_PREFER_LOCAL` | Prefer local services | `true` | `false` |
| `YAKK_AUTO_START_SERVICES` | Auto-start local services | `false` | `true` |

### Serve Command

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `YAKK_SERVE_TRANSPORT` | MCP transport protocol (`streamable-http` or `sse`) | `sse` | `streamable-http` |
| `YAKK_SERVE_ALLOW_LOCAL` | Allow localhost connections | `true` | `false` |
| `YAKK_SERVE_ALLOW_ANTHROPIC` | Allow Anthropic IP ranges | `false` | `true` |
| `YAKK_SERVE_ALLOW_TAILSCALE` | Allow Tailscale IP range (100.64.0.0/10) | `false` | `true` |
| `YAKK_SERVE_ALLOWED_IPS` | Custom CIDR allowlist (comma-separated) | None | `192.168.1.0/24,10.0.0.0/8` |
| `YAKK_SERVE_SECRET` | URL path secret segment | None | `my-secret-uuid` |
| `YAKK_SERVE_TOKEN` | Bearer token for authentication | None | `my-secret-token` |

## Legacy Variables

These variables from older versions are still supported:

| Old Variable | New Variable | Notes |
|--------------|--------------|-------|
| `YAKK_DEBUG` | `YAKK_DEBUG` | Deprecated |
| `YAKK_SAVE_AUDIO` | `YAKK_SAVE_ALL` | Deprecated |
| `TTS_BASE_URL` | `YAKK_TTS_BASE_URLS` | Still supported |
| `STT_BASE_URL` | `YAKK_STT_BASE_URLS` | Still supported |
| `TTS_VOICE` | `YAKK_TTS_VOICE` | Still supported |
| `TTS_MODEL` | `YAKK_TTS_MODEL` | Still supported |

## Configuration Files

### User Configuration
Create `~/.yakk/yakk.env`:
```bash
export OPENAI_API_KEY="sk-..."
export YAKK_VOICES="nova,shimmer"
export YAKK_DEBUG=false
```

### Project Configuration
Create `.yakk.env` in project root:
```bash
export YAKK_VOICES="onyx"
export YAKK_TTS_SPEED=0.9
```

## MCP Host Configuration

When used as an MCP server, environment variables can be set in the host configuration:

```json
{
  "mcpServers": {
    "yakk": {
      "command": "uvx",
      "args": ["yakk"],
      "env": {
        "OPENAI_API_KEY": "sk-...",
        "YAKK_DEBUG": "true"
      }
    }
  }
}
```

## Debugging Environment

To see all active environment variables:
```bash
yakk config show --env
```

To test with specific variables:
```bash
YAKK_DEBUG=true YAKK_LOG_LEVEL=debug yakk converse
```
