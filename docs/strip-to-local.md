# Strip Plan: Local-Only Yakk

**Goal:** Aggressively remove all external/cloud infrastructure and reduce Yakk to the best
possible local two-way voice conversation tool. No API keys. No remote serve. No cloud
fallback. No connect features.

---

## Guiding Principles

1. **If it only exists to support remote/cloud use, delete it entirely** — don't stub or
   comment out.
2. **The `openai` Python library stays** — it is used purely as a local HTTP client with
   `api_key="dummy-key-for-local"` and `base_url=localhost`. It talks to Whisper and Kokoro,
   not the internet.
3. **Simplify booleans that are now always true** — `is_local_provider()` always returns
   `True` now; `PREFER_LOCAL` is always `True`. Replace conditionals with their always-taken
   branch and delete the dead code.
4. **Don't break working features** — local service management, audio, DJ, exchanges, hooks,
   clone (local profiles), diagnostics, CLI completions all stay.

---

## Inventory: What Gets Removed

### 1. Remote HTTP/SSE Serve Feature

The `serve` command starts an HTTP/SSE server so remote MCP clients (Claude Cowork, mcp-remote,
other machines) can connect to Yakk over the network. Entirely unnecessary for local use.

**Files:**

| File | Lines | Action |
|------|-------|--------|
| `yakk/serve_middleware.py` | all 473 lines | **Delete entire file** |
| `yakk/cli.py` | ~2188–2430 | Delete `serve` command function + all its decorators |
| `yakk/cli.py` | 24–30 | Delete `SERVE_*` imports from config |
| `yakk/cli.py` | 685 | Delete mention of port 8765 in service status table |

**Classes/functions disappearing with `serve_middleware.py`:**
- `ANTHROPIC_CIDRS` — Anthropic IP allowlist
- `TAILSCALE_CIDRS` — Tailscale CGNAT range
- `LOCAL_CIDRS` — (used only by serve; not needed without it)
- `get_client_ip()` — X-Forwarded-For header extraction
- `ip_in_cidrs()` — CIDR membership check
- `AccessLogMiddleware` — HTTP access logging
- `IPAllowlistMiddleware` — IP-based access control
- `SecretPathMiddleware` — Secret path authentication
- `TokenAuthMiddleware` — Bearer token authentication

**Dependencies unlocked for removal (used only by serve):**
- `starlette` (used by serve_middleware for `Request`, `Response`, ASGI types)
- `uvicorn` (runtime serve dependency — check if listed anywhere)

---

### 2. Connect Command

The `connect` command is already stubbed to error out in local-only mode. Remove the stub
entirely rather than leaving a dead command.

| File | Lines | Action |
|------|-------|--------|
| `yakk/cli.py` | ~2539–2546 | Delete `connect` group and its stub function |

---

### 3. SERVE_* Config Variables

These only exist to configure the serve command. With serve gone, delete them everywhere.

**In `yakk/config.py`:**

| Variable | Config key | Lines (approx) |
|----------|-----------|----------------|
| `SERVE_HOST` | `YAKK_SERVE_HOST` | ~362, 1341 |
| `SERVE_PORT` | `YAKK_SERVE_PORT` | ~365, 1344 |
| `SERVE_TRANSPORT` | `YAKK_SERVE_TRANSPORT` | ~368, 1365 |
| `SERVE_ALLOW_LOCAL` | `YAKK_SERVE_ALLOW_LOCAL` | ~371, 1347 |
| `SERVE_ALLOW_ANTHROPIC` | `YAKK_SERVE_ALLOW_ANTHROPIC` | ~374, 1350 |
| `SERVE_ALLOW_TAILSCALE` | `YAKK_SERVE_ALLOW_TAILSCALE` | ~377, 1353 |
| `SERVE_ALLOWED_IPS` | `YAKK_SERVE_ALLOWED_IPS` | ~380, 1356 |
| `SERVE_SECRET` | `YAKK_SERVE_SECRET` | ~383, 1359 |
| `SERVE_TOKEN` | `YAKK_SERVE_TOKEN` | ~386, 1362 |

Also remove the comment block in the generated `yakk.env` template (~lines 362–390 in config.py)
that documents all these `YAKK_SERVE_*` env vars.

**Also remove from:**
- `yakk/cli.py` import block (lines 24–30): `SERVE_ALLOW_LOCAL`, `SERVE_ALLOW_ANTHROPIC`,
  `SERVE_ALLOW_TAILSCALE`, `SERVE_ALLOWED_IPS`, `SERVE_SECRET`, `SERVE_TOKEN`, `SERVE_TRANSPORT`

---

### 4. PREFER_LOCAL and ALWAYS_TRY_LOCAL Flags

These flags exist to choose between local vs cloud providers. With cloud gone, both are always
`True`. Replace their usage with the always-taken value and delete the variables.

**In `yakk/config.py`:**
- Line ~161–165: Delete the comment block for `YAKK_PREFER_LOCAL` / `YAKK_ALWAYS_TRY_LOCAL`
- Line ~521: Delete `PREFER_LOCAL = os.getenv(...)` 
- Line ~524: Delete `ALWAYS_TRY_LOCAL = os.getenv(...)`

**Remove imports and usage from:**

| File | Usage | Resolution |
|------|-------|------------|
| `yakk/shared.py:18` | imports `PREFER_LOCAL` | Remove import |
| `yakk/tools/converse.py:38` | imports `PREFER_LOCAL` | Remove import (verify it's unused in logic) |
| `yakk/tools/devices.py:101,108` | imports + displays `PREFER_LOCAL` | Remove import and status line |
| `yakk/tools/devices.py:354` | exports `YAKK_PREFER_LOCAL` in env dump | Remove |
| `yakk/resources/configuration.py:12,74,264,355` | imports, displays, documents `PREFER_LOCAL` and `ALWAYS_TRY_LOCAL` | Remove all four sites |
| `yakk/tools/configuration_management.py:312–313` | lists both as config keys | Remove entries |

---

### 5. `is_local_provider()` Conditionals

`is_local_provider(url)` returns `True` for localhost URLs, `False` for remote. It's used
to set `max_retries`: `0` for local, `2` for remote. Since all endpoints are now always
local, every call returns `True` and `max_retries` is always `0`.

**Replace:** `max_retries = 0 if is_local_provider(url) else 2` → `max_retries = 0`

**Files with this pattern:**

| File | Occurrences |
|------|-------------|
| `yakk/providers.py` | lines ~59, 98, 125, 147, 189, 208 (6×) |
| `yakk/core.py` | lines ~142, 143 (2×) |
| `yakk/simple_failover.py` | lines ~237, 247 (2×) |

After removing all call sites, check if `is_local_provider` is still referenced anywhere.
If not, delete the function from `yakk/provider_discovery.py` and remove the import
from `providers.py`, `core.py`, and `simple_failover.py`.

---

### 6. OpenAI API Key — Documentation and Manifests

There are no actual `OPENAI_API_KEY` usages in Python source (all clients use
`"dummy-key-for-local"`). But several documentation and config files still reference it.

| File | Lines | Action |
|------|-------|--------|
| `server.json` | ~22–33 | Delete entire `OPENAI_API_KEY` env var entry block |
| `server.json` | ~43–47 | Delete `YAKK_PREFER_LOCAL` env var entry block |
| `yakk/config.py` | ~145–150 | Delete `YAKK_TTS_BASE_URLS` comment that mentions OpenAI |
| `README.md` | ~64, 78, 90–91, 192 | Remove all OpenAI API key references |
| `CONTRIBUTING.md` | ~38 | Remove `export OPENAI_API_KEY=your-key-here` |

---

### 7. Remote Clone Server URL

Voice clone profiles support a `CLONE_BASE_URL` pointing to a remote TTS server. Remove
this — clone only uses local Kokoro.

| File | Lines | Action |
|------|-------|--------|
| `yakk/config.py` | ~216–222 | Delete remote clone URL config block |
| `yakk/config.py` | ~224 comment | Delete `# YAKK_CLONE_BASE_URL=http://ms2:8890/v1` |
| `yakk/tools/clone/profiles.py` | ~26 | Delete `DEFAULT_CLONE_BASE_URL = "http://ms2:8890/v1"` |

---

### 8. `websockets` Dependency

The `websockets` package is listed in core dependencies with the comment
`# Required for yakk connect command`. Since connect is gone, remove it.

| File | Line | Action |
|------|------|--------|
| `pyproject.toml` | ~41 | Delete `"websockets>=12.0",` |

The `livekit` optional dependency group is already optional and has no source in the repo. Leave
it as an optional extra or remove the group — low priority.

---

### 9. pyproject.toml Keywords

The `keywords` field in `pyproject.toml` (line ~15) includes `"livekit"`. Remove it.

---

### 10. .claude/skills and Commands Documentation

| File | Section/Lines | Action |
|------|--------------|--------|
| `.claude/skills/yakk/SKILL.md` | "Sharing Voice Services Over Tailscale" section | Delete entire section |
| `.claude/skills/yakk/SKILL.md` | "Related Skills" → Yakk Connect line | Delete |
| `.claude/skills/yakk/SKILL.md` | app.yakk.dev CORS line in DJ section | Delete |
| `.claude/skills/yakk/SKILL.md` | "Use with Yakk Connect" subsection | Delete |
| `.claude/skills/yakk/SKILL.md` | Service table row: `yakk \| 8765 \| HTTP/SSE server` | Delete |
| `.claude/skills/yakk/SKILL.md` | CLI cheat sheet `serve` examples | Delete |

---

### 11. CLAUDE.md Project Overview

| Lines | Action |
|-------|--------|
| ~137: `yakk-dev` | Delete "Cloudflare Workers backend for yakk.dev" suite entry |
| ~139: `yakk-ios` | Delete iOS app suite entry |
| ~140: `yakk-macos` | Delete macOS app suite entry |
| ~141: `yakk-meta` | Delete meta repo suite entry |
| ~145: `skills/yakk-connect/SKILL.md` | Delete "Remote voice via mobile/web clients" See Also entry |

---

### 12. marketplace.json

| Lines | Action |
|-------|--------|
| `"email": "hello@yakk.dev"` | Replace with personal email or remove |
| `"email": "mike@yakk.dev"` | Replace with personal email (2 occurrences) |
| `description` line mentioning "remote agents via mobile, web and CLI" | Update to local-only description |

---

## What Stays (Do Not Touch)

| Component | Reason |
|-----------|--------|
| `openai` Python library | Local HTTP client for Whisper/Kokoro OpenAI-compat API |
| `httpx` | General HTTP — used for health checks and downloads |
| `aiohttp` | Used by Whisper/Kokoro service installers |
| `yakk/core.py` | Core TTS/STT logic — keep, just simplify max_retries |
| `yakk/providers.py` | Provider selection — keep, just simplify max_retries |
| `yakk/provider_discovery.py` | Health checking — keep, remove `is_local_provider` if unused |
| `yakk/simple_failover.py` | STT failover logic — keep, simplify max_retries |
| `yakk/tools/converse.py` | Core voice loop — keep |
| `yakk/tools/service.py` | Whisper/Kokoro service management — keep |
| `yakk/tools/clone/` | Local voice cloning — keep, remove remote URL only |
| `yakk/dj/` | Local background music — keep entirely |
| `yakk/cli_commands/claude.py` | Claude Code hooks management — keep |
| `yakk/cli_commands/exchanges.py` | Conversation log viewer — keep |
| `yakk/cli_commands/soundfonts.py` | Soundfont toggle — keep |
| `yakk/cli_commands/status.py` | Status command — keep |
| `yakk/cli_commands/transcribe.py` | Local transcription — keep |
| `yakk/tools/whisper/` | Whisper management — keep |
| `yakk/tools/kokoro/` | Kokoro management — keep |
| `yakk/tools/mlx_audio/` | MLX audio (local Apple Silicon TTS) — keep |
| All hook data files | Claude Code integration — keep |
| `yakk/conch.py` | Turn-taking for multi-agent voice — keep |

---

## Execution Order

Ordered to avoid broken imports mid-way through the work.

### Phase 1 — Delete the serve infrastructure (eliminates the largest blob)
1. Delete `yakk/serve_middleware.py` entirely
2. In `yakk/cli.py`:
   a. Remove `SERVE_*` imports from the import block (lines 24–30)
   b. Delete the entire `serve` command function and all its `@click` decorators
   c. Delete the `connect` command stub
   d. Remove the port 8765 row from the service status table (~line 685)

### Phase 2 — Clean up config
3. In `yakk/config.py`:
   a. Delete the `SERVE_*` comment block (~lines 362–390)
   b. Delete all `SERVE_*` variable assignments (~lines 1341–1365)
   c. Delete `YAKK_PREFER_LOCAL` and `YAKK_ALWAYS_TRY_LOCAL` comment block (~lines 161–166)
   d. Delete `PREFER_LOCAL` and `ALWAYS_TRY_LOCAL` variable assignments (~lines 521–524)
   e. Delete remote clone URL config block (~lines 216–224)

### Phase 3 — Remove PREFER_LOCAL / ALWAYS_TRY_LOCAL usage
4. `yakk/shared.py` — remove `PREFER_LOCAL` from import
5. `yakk/tools/converse.py` — remove `PREFER_LOCAL` from import
6. `yakk/tools/devices.py` — remove import + status display line + env export line
7. `yakk/resources/configuration.py` — remove all four sites (import, display, docs, export)
8. `yakk/tools/configuration_management.py` — remove two config key entries

### Phase 4 — Simplify `is_local_provider()` conditionals
9. In `yakk/providers.py`, `yakk/core.py`, `yakk/simple_failover.py`:
   - Replace every `max_retries = 0 if is_local_provider(...) else 2` with `max_retries = 0`
   - Remove `is_local_provider` import from each file
10. Verify `is_local_provider` has no remaining callers, then delete the function from
    `yakk/provider_discovery.py`

### Phase 5 — Manifests and pyproject
11. `server.json` — delete `OPENAI_API_KEY` entry block, delete `YAKK_PREFER_LOCAL` entry block
12. `pyproject.toml` — delete `websockets` dep, remove `livekit` from keywords
13. `yakk/tools/clone/profiles.py` — delete `DEFAULT_CLONE_BASE_URL`

### Phase 6 — Skills, docs, and root files
14. `.claude/skills/yakk/SKILL.md` — remove Tailscale section, yakk Connect references,
    app.yakk.dev, serve port from services table
15. `CLAUDE.md` — remove suite entries and yakk-connect skill reference
16. `README.md` — remove all OpenAI API key references and "cloud services" mentions
17. `CONTRIBUTING.md` — remove `OPENAI_API_KEY` from dev setup instructions
18. `.claude-plugin/marketplace.json` — update description, replace yakk.dev emails

---

## Verification

Run these after each phase to catch broken imports early.

```bash
# After every phase: fast import check
uv run python -c "import yakk; print('ok')"

# After Phase 1: serve command must be gone
uv run yakk --help  # must NOT show 'serve' or 'connect'

# After Phase 3: PREFER_LOCAL must not appear in any source
grep -r "PREFER_LOCAL\|ALWAYS_TRY_LOCAL" yakk/ --include="*.py"

# After Phase 4: no more is_local_provider in providers/core/failover
grep -r "is_local_provider" yakk/providers.py yakk/core.py yakk/simple_failover.py

# After Phase 5: no OPENAI_API_KEY in manifests
grep -r "OPENAI_API_KEY" server.json pyproject.toml

# Full suite after all phases
make test
uv run yakk status
uv run yakk converse "test"
```

---

## Out of Scope

- **Replacing `openai` library with `httpx`** — valid future refactor, not blocking; the
  library works fine as a local HTTP adapter
- **Stripping test files** — tests reference `https://api.openai.com/v1` as mock URLs;
  update them after the source changes are stable
- **`docs/` directory** — lots of cloud references in archived docs; leave for a separate
  doc-only cleanup pass
- **`livekit` optional extra in pyproject.toml** — already optional, no source code depends
  on it; low-priority to remove
