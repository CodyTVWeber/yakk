"""
Auth module — stubbed out for local-only mode.

This fork strips cloud authentication (voicemode.dev / Auth0).
Local services (Kokoro TTS, Whisper STT) do not require authentication.
"""


class AuthError(Exception):
    """Authentication error."""
    pass


class Credentials:
    """Stub credentials class."""
    pass


def login(*args, **kwargs):
    raise AuthError("Cloud authentication is disabled in local-only mode.")


def load_credentials(*args, **kwargs):
    return None


def clear_credentials(*args, **kwargs):
    return False


def get_valid_credentials(*args, **kwargs):
    return None


def format_expiry(*args, **kwargs):
    return "n/a"
