"""
Credential store — stubbed out for local-only mode.

Cloud credentials (voicemode.dev / Auth0) are not needed for local services.
"""


class CredentialStore:
    def save(self, data): pass
    def load(self): return None
    def clear(self): return False


def get_credential_store() -> CredentialStore:
    return CredentialStore()
