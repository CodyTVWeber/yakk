# Yakk

> Natural voice conversations with Claude Code (and other MCP capable agents)

[![PyPI Downloads](https://static.pepy.tech/badge/yakk)](https://pepy.tech/project/yakk)
[![PyPI Downloads](https://static.pepy.tech/badge/yakk/month)](https://pepy.tech/project/yakk)
[![PyPI Downloads](https://static.pepy.tech/badge/yakk/week)](https://pepy.tech/project/yakk)

> [!WARNING]
> **Known Issue (2026-04-13):** Claude Code 2.1.105+ kills Yakk's MCP server when you press ESC to cancel a voice conversation. **Workaround:** Pin to Claude Code 2.1.104. See [discussion #349](https://github.com/mbailey/yakk/discussions/349) for details.

Yakk enables natural voice conversations with Claude Code. Voice isn't about replacing typing - it's about being available when typing isn't.

**Perfect for:**

- Walking to your next meeting
- Cooking while debugging
- Giving your eyes a break after hours of screen time
- Holding a coffee (or a dog)
- Any moment when your hands or eyes are busy

## See It In Action

[![Yakk Demo](https://img.youtube.com/vi/cYdwOD_-dQc/maxresdefault.jpg)](https://www.youtube.com/watch?v=cYdwOD_-dQc)

## Quick Start

**Requirements:** Computer with microphone and speakers

### Option 1: Claude Code Plugin (Recommended)

The fastest way for Claude Code users to get started:

```bash
# Add the Yakk marketplace
claude plugin marketplace add mbailey/yakk

# Install Yakk plugin
claude plugin install yakk@yakk

## Install dependencies (CLI, Local Voice Services)

/yakk:install

# Start talking!
/yakk:converse
```

### Option 2: Python installer package

Installs dependencies and the Yakk Python package.

```bash
# Install UV package manager (if needed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Run the installer (sets up dependencies and local voice services)
uvx yakk-install

# Add to Claude Code
claude mcp add --scope user yakk -- uvx --refresh yakk

# Optional: Add OpenAI API key as fallback for local services
export OPENAI_API_KEY=your-openai-key

# Start a conversation
claude converse
```

For manual setup, see the [Getting Started Guide](docs/tutorials/getting-started.md).

## Features

- **Natural conversations** - speak naturally, hear responses immediately
- **Works offline** - optional local voice services (Whisper STT, Kokoro TTS)
- **Low latency** - fast enough to feel like a real conversation
- **Smart silence detection** - stops recording when you stop speaking
- **Privacy options** - run entirely locally or use cloud services

## Compatibility

**Platforms:** Linux, macOS, Windows (WSL), NixOS
**Python:** 3.10-3.14

## Configuration

Yakk works out of the box. For customization:

```bash
# Set OpenAI API key (if using cloud services)
export OPENAI_API_KEY="your-key"

# Or configure via file
yakk config edit
```

See the [Configuration Guide](docs/guides/configuration.md) for all options.

## Permissions Setup (Optional)

To use Yakk without permission prompts, add to `~/.claude/settings.json`:

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

See the [Permissions Guide](docs/guides/permissions.md) for more options.

## Local Voice Services

For privacy or offline use, install local speech services:

- **[Whisper.cpp](docs/guides/whisper-setup.md)** - Local speech-to-text
- **[Kokoro](docs/guides/kokoro-setup.md)** - Local text-to-speech with multiple voices

These provide the same API as OpenAI, so Yakk switches seamlessly between them.

## Installation Details

<details>
<summary><strong>System Dependencies by Platform</strong></summary>

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install -y ffmpeg gcc libasound2-dev libasound2-plugins libportaudio2 portaudio19-dev pulseaudio pulseaudio-utils python3-dev
```

**WSL2 users**: The pulseaudio packages above are required for microphone access.

#### Fedora/RHEL

```bash
sudo dnf install alsa-lib-devel ffmpeg gcc portaudio portaudio-devel python3-devel
```

#### macOS

```bash
brew install ffmpeg node portaudio
```

#### NixOS

```bash
# Use development shell
nix develop github:mbailey/yakk

# Or install system-wide
nix profile install github:mbailey/yakk
```

</details>

<details>
<summary><strong>Alternative Installation Methods</strong></summary>

#### From source

```bash
git clone https://github.com/mbailey/yakk.git
cd yakk
uv tool install -e .
```

#### NixOS system-wide

```nix
# In /etc/nixos/configuration.nix
environment.systemPackages = [
  (builtins.getFlake "github:mbailey/yakk").packages.${pkgs.system}.default
];
```

</details>

## Troubleshooting


| Problem | Solution |
|---------|----------|
| No microphone access | Check terminal/app permissions. WSL2 needs pulseaudio packages. |
| UV not found | Run `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| OpenAI API error | Verify `OPENAI_API_KEY` is set correctly |
| No audio output | Check system audio settings and available devices |


### Save Audio for Debugging

```bash
export YAKK_SAVE_AUDIO=true
# Files saved to ~/.yakk/audio/YYYY/MM/
```

## Documentation

- [Getting Started](docs/tutorials/getting-started.md) - Full setup guide
- [Configuration](docs/guides/configuration.md) - All environment variables
- [Whisper Setup](docs/guides/whisper-setup.md) - Local speech-to-text
- [Kokoro Setup](docs/guides/kokoro-setup.md) - Local text-to-speech
- [Development Setup](docs/tutorials/development-setup.md) - Contributing guide

Full documentation: [yakk.readthedocs.io](https://yakk.readthedocs.io)

## Links

- **Website**: [getyakk.com](https://getyakk.com)
- **GitHub**: [github.com/mbailey/yakk](https://github.com/mbailey/yakk)
- **PyPI**: [pypi.org/project/yakk](https://pypi.org/project/yakk/)
- **YouTube**: [@getyakk](https://youtube.com/@getyakk)
- **Twitter/X**: [@getyakk](https://twitter.com/getyakk)
- **Newsletter**: [![Subscribe](https://img.shields.io/badge/Subscribe-Newsletter-orange?style=flat-square)](https://buttondown.com/yakk)

## License

MIT - A [Failmode](https://failmode.com) Project

---
mcp-name: com.failmode/yakk
