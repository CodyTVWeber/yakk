"""CLI commands for soundfonts toggle.

Provides `yakk soundfonts on/off/status` commands
for enabling/disabling soundfont playback during Claude Code sessions.

Two mechanisms control soundfonts:
1. Sentinel file (~/.yakk/soundfonts-disabled) — quick toggle / circuit breaker
2. Env var (YAKK_SOUNDFONTS_ENABLED) — persistent config in yakk.env

The sentinel file overrides everything when present. When absent,
the env var decides. Default (neither set) is enabled.
"""

import os
from pathlib import Path

import click


SENTINEL_FILE = Path.home() / '.yakk' / 'soundfonts-disabled'
YAKK_ENV_FILE = Path.home() / '.yakk' / 'yakk.env'


def _get_env_var_state() -> tuple:
    """Check YAKK_SOUNDFONTS_ENABLED from config file and env.

    Returns:
        (enabled: bool | None, source: str | None)
        source is 'file' (yakk.env), 'env' (shell only), or None (not set)
    """
    # Check yakk.env file first — more actionable source
    file_val = None
    if YAKK_ENV_FILE.exists():
        for line in YAKK_ENV_FILE.read_text().splitlines():
            stripped = line.strip()
            if stripped.startswith('#'):
                continue
            if stripped.startswith('YAKK_SOUNDFONTS_ENABLED='):
                val = stripped.split('=', 1)[1].strip().strip('"').strip("'")
                file_val = val.lower() in ('true', '1', 'yes', 'on')
                break

    # Check shell environment
    env_val = os.environ.get('YAKK_SOUNDFONTS_ENABLED')

    if file_val is not None:
        # File value exists — report it as the source
        return file_val, 'file'

    if env_val is not None:
        # Only in shell env (not from our file) — less common
        return env_val.lower() in ('true', '1', 'yes', 'on'), 'env'

    # Not set anywhere — default is true
    return None, None


def _hooks_installed() -> bool:
    """Check if any Yakk hooks are installed in Claude Code settings."""
    import json as _json
    settings_file = Path.home() / '.claude' / 'settings.json'
    if not settings_file.exists():
        return False
    try:
        settings = _json.loads(settings_file.read_text())
        hooks = settings.get('hooks', {})
        for event_entries in hooks.values():
            for entry in event_entries:
                # Yakk hooks reference yakk-hook-receiver
                cmd = entry.get('command', '') if isinstance(entry, dict) else ''
                if 'yakk' in cmd.lower():
                    return True
        return False
    except Exception:
        return False


def _update_env_file(enabled: bool) -> None:
    """Update YAKK_SOUNDFONTS_ENABLED in ~/.yakk/yakk.env.

    Also syncs os.environ so the current process sees the new value
    (yakk's config.py loads yakk.env into os.environ at startup,
    which can leave stale values if we only update the file).
    """
    value = 'true' if enabled else 'false'
    os.environ['YAKK_SOUNDFONTS_ENABLED'] = value
    env_file = YAKK_ENV_FILE

    if not env_file.exists():
        env_file.parent.mkdir(parents=True, exist_ok=True)
        env_file.write_text(f'YAKK_SOUNDFONTS_ENABLED={value}\n')
        return

    lines = env_file.read_text().splitlines()
    found = False
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('#'):
            continue
        if stripped.startswith('YAKK_SOUNDFONTS_ENABLED='):
            lines[i] = f'YAKK_SOUNDFONTS_ENABLED={value}'
            found = True
            break

    if not found:
        lines.append(f'YAKK_SOUNDFONTS_ENABLED={value}')

    env_file.write_text('\n'.join(lines) + '\n')


def _warn_env_var_conflict() -> None:
    """Print warning if env var will block soundfonts."""
    enabled, source = _get_env_var_state()
    if enabled is False:
        click.echo()
        click.echo("WARNING: YAKK_SOUNDFONTS_ENABLED=false", err=False)
        if source == 'file':
            click.echo(f"  Set in: {YAKK_ENV_FILE}")
        elif source == 'env':
            click.echo("  Set in: shell environment")
        click.echo("  Soundfonts will NOT play until this is changed.")
        click.echo("  Fix with: yakk soundfonts on --config")
        if source == 'file':
            click.echo(f"  Or edit:  {YAKK_ENV_FILE}")


@click.group(name='soundfonts')
@click.help_option('-h', '--help', help='Show this message and exit')
def soundfonts():
    """Toggle soundfont playback for Claude Code hooks.

    Soundfonts provide audio feedback during Claude Code sessions.
    They require Claude Code hooks to be installed first:

        yakk claude hooks add

    Quick toggle (session-scoped):
        yakk soundfonts off        # Disable immediately
        yakk soundfonts on         # Re-enable

    Persistent config change:
        yakk soundfonts on --config   # Enable + update yakk.env
        yakk soundfonts off --config  # Disable + update yakk.env
    """
    pass


@soundfonts.command('on')
@click.option('--config', is_flag=True,
              help='Also update YAKK_SOUNDFONTS_ENABLED in yakk.env')
def soundfonts_on(config):
    """Enable soundfont playback.

    Removes the quick-toggle sentinel file. Use --config to also
    update ~/.yakk/yakk.env for persistent enablement.
    """
    had_sentinel = SENTINEL_FILE.exists()

    if had_sentinel:
        SENTINEL_FILE.unlink()

    if config:
        env_enabled, _ = _get_env_var_state()
        config_changed = env_enabled is not True  # None (unset) or False
        if config_changed:
            _update_env_file(True)

        if had_sentinel and config_changed:
            click.echo("Soundfonts enabled.")
            click.echo("  Removed sentinel file.")
            click.echo(f"  Updated {YAKK_ENV_FILE}: YAKK_SOUNDFONTS_ENABLED=true")
        elif had_sentinel:
            click.echo("Soundfonts enabled.")
            click.echo("  Removed sentinel file.")
        elif config_changed:
            click.echo("Soundfonts enabled.")
            click.echo(f"  Updated {YAKK_ENV_FILE}: YAKK_SOUNDFONTS_ENABLED=true")
        else:
            click.echo("Soundfonts are already enabled.")
            return

        # No need to warn about shell env — yakk's config.py loads
        # yakk.env into os.environ at startup, and _update_env_file
        # now syncs os.environ too.
    elif had_sentinel:
        click.echo("Soundfonts enabled.")
        _warn_env_var_conflict()
    else:
        env_enabled, _ = _get_env_var_state()
        if env_enabled is False:
            click.echo("Soundfonts are already enabled (no quick toggle active).")
            _warn_env_var_conflict()
        else:
            click.echo("Soundfonts are already enabled.")


@soundfonts.command('off')
@click.option('--config', is_flag=True,
              help='Also update YAKK_SOUNDFONTS_ENABLED in yakk.env')
def soundfonts_off(config):
    """Disable soundfont playback.

    Creates a sentinel file that the hook receiver checks
    before playing any sounds. Use --config to also update
    ~/.yakk/yakk.env for persistent disablement.
    """
    had_sentinel = SENTINEL_FILE.exists()

    if not had_sentinel:
        SENTINEL_FILE.parent.mkdir(parents=True, exist_ok=True)
        SENTINEL_FILE.touch()

    if config:
        env_enabled, _ = _get_env_var_state()
        config_changed = env_enabled is not False  # None (unset) or True
        if config_changed:
            _update_env_file(False)

        if had_sentinel and config_changed:
            click.echo("Soundfonts disabled.")
            click.echo(f"  Updated {YAKK_ENV_FILE}: YAKK_SOUNDFONTS_ENABLED=false")
        elif had_sentinel:
            click.echo("Soundfonts are already disabled.")
        elif config_changed:
            click.echo("Soundfonts disabled.")
            click.echo(f"  Updated {YAKK_ENV_FILE}: YAKK_SOUNDFONTS_ENABLED=false")
        else:
            click.echo("Soundfonts are already disabled.")
    elif had_sentinel:
        click.echo("Soundfonts are already disabled.")
    else:
        click.echo("Soundfonts disabled (this session).")
        click.echo("  Re-enable with: yakk soundfonts on")


@soundfonts.command('status')
def soundfonts_status():
    """Show whether soundfonts are enabled or disabled.

    Checks both the quick-toggle sentinel file and the
    YAKK_SOUNDFONTS_ENABLED configuration.
    """
    sentinel_exists = SENTINEL_FILE.exists()
    env_enabled, env_source = _get_env_var_state()

    if sentinel_exists and env_enabled is False:
        # Both disabled
        click.echo("Soundfonts: disabled (quick toggle + config)")
        click.echo(f"  Sentinel file: {SENTINEL_FILE}")
        if env_source == 'file':
            click.echo(f"  YAKK_SOUNDFONTS_ENABLED=false in {YAKK_ENV_FILE}")
        else:
            click.echo("  YAKK_SOUNDFONTS_ENABLED=false in shell environment")
        click.echo("  Both must be resolved to enable soundfonts.")
    elif sentinel_exists:
        # Quick toggle only
        click.echo("Soundfonts: disabled (quick toggle)")
        click.echo(f"  Sentinel file: {SENTINEL_FILE}")
        click.echo("  Re-enable with: yakk soundfonts on")
    elif env_enabled is False:
        # Config only
        click.echo("Soundfonts: disabled (by config)")
        if env_source == 'file':
            click.echo(f"  YAKK_SOUNDFONTS_ENABLED=false in {YAKK_ENV_FILE}")
        else:
            click.echo("  YAKK_SOUNDFONTS_ENABLED=false in shell environment")
        click.echo("  Enable with: yakk soundfonts on --config")
        if env_source == 'file':
            click.echo(f"  Or edit:     {YAKK_ENV_FILE}")
    else:
        # Enabled
        click.echo("Soundfonts: enabled")

    # Show hooks status — only nag if not installed
    click.echo()
    if _hooks_installed():
        click.echo("Hooks: installed")
    else:
        click.echo("Hooks: not installed")
        click.echo("  Soundfonts require Claude Code hooks:")
        click.echo("  yakk claude hooks add")
