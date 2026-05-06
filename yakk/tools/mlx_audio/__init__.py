"""mlx-audio service tools.

Unified Whisper STT + Kokoro TTS + Qwen3-TTS clone-voice service for
Apple Silicon. Uses ``uv tool install mlx-audio`` -- no service-local
venv -- and applies the bundled ``mlx_audio_server.patch`` so the
upstream server.py is yakk-client-usable out of the box.
"""

from yakk.tools.mlx_audio.install import mlx_audio_install
from yakk.tools.mlx_audio.status import mlx_audio_status
from yakk.tools.mlx_audio.uninstall import mlx_audio_uninstall

__all__ = [
    "mlx_audio_install",
    "mlx_audio_status",
    "mlx_audio_uninstall",
]
