---
name: yakk-dj
description: Background music control for Yakk voice sessions using mpv
---

# Yakk DJ

Background music control during Yakk sessions via `yakk dj` commands.

## Default: Music For Programming

When asked to play music for coding/programming, **default to Music For Programming episode 49**:

```bash
yakk dj mfp play 49
```

This plays Julien Mier's mix with chapter navigation support. Use `yakk dj mfp list` to see all available episodes.

## Quick Reference

```bash
yakk dj play <file|url>     # Start playback
yakk dj stop                # Stop playback
yakk dj mfp play 49         # Play MFP episode (Julien Mier)
yakk dj status              # What's playing
yakk dj next / prev         # Chapter navigation
yakk dj volume [0-100]      # Get/set volume
yakk dj find <query>        # Search library
```

## Documentation

- [Commands](../../docs/reference/dj/commands.md) - Full command reference
- [Music For Programming](../../docs/reference/dj/mfp.md) - MFP episode integration
- [Chapter Files](../../docs/reference/dj/chapters.md) - FFmpeg chapter format
- [Installation](../../docs/reference/dj/installation.md) - Setup requirements
- [IPC Reference](../../docs/reference/dj/ipc.md) - Low-level mpv control

## Programmatic Access

```python
from yakk import DJController, MfpService, MusicLibrary
```

## Configuration

`~/.yakk/yakk.env`:
```bash
YAKK_DJ_VOLUME=50   # Default startup volume
```
