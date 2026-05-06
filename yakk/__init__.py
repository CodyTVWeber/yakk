"""
yakk - Voice interaction capabilities for Model Context Protocol (MCP) servers

This package provides MCP servers for voice interactions through multiple transports:
- Local microphone recording and playback
- LiveKit room-based voice communication
- Configurable local STT/TTS services (Kokoro + Whisper)
"""

from .version import __version__

__all__ = [
    "__version__",
]