# Service Management Commands

Yakk now includes built-in service management commands for Kokoro and Whisper services.

## Usage

### Backward Compatibility

The default behavior is preserved:
```bash
yakk              # Starts MCP server (existing behavior)
```

### Service Management

New subcommands allow direct service control without starting the MCP server:

#### Kokoro TTS Service
```bash
yakk kokoro status           # Show service status and resource usage
yakk kokoro start            # Start Kokoro service
yakk kokoro stop             # Stop Kokoro service  
yakk kokoro restart          # Restart Kokoro service
yakk kokoro enable           # Enable service at boot/login
yakk kokoro disable          # Disable service from boot/login
yakk kokoro logs             # View service logs (default: 50 lines)
yakk kokoro logs --lines 100 # View last 100 log lines
yakk kokoro health           # Check health endpoint
yakk kokoro update-service-files # Update service files to latest
```

#### Whisper STT Service
```bash
yakk whisper status          # Show service status and resource usage
yakk whisper start           # Start Whisper service
yakk whisper stop            # Stop Whisper service
yakk whisper restart         # Restart Whisper service  
yakk whisper enable          # Enable service at boot/login
yakk whisper disable         # Disable service from boot/login
yakk whisper logs            # View service logs (default: 50 lines)
yakk whisper logs --lines 100 # View last 100 log lines
yakk whisper health          # Check health endpoint
yakk whisper update-service-files # Update service files to latest
```

## Examples

### Quick Status Check
```bash
$ yakk kokoro status
✅ Kokoro is running
   PID: 12345
   Port: 8880
   CPU: 0.1%
   Memory: 8.9 MB
   Uptime: 2h 15m 30s
   Service files: v1.1.1 (latest)
```

### Starting Services
```bash
$ yakk whisper start
✅ Whisper started successfully (PID: 54321)

$ yakk kokoro start  
✅ Kokoro started
```

### Health Checks
```bash
$ yakk kokoro health
✅ Kokoro is responding
   Status: healthy
   Uptime: 2h 15m 30s

$ yakk whisper health
❌ Whisper not responding on port 2022
```

### Service Management
```bash
$ yakk kokoro enable
✅ Kokoro service enabled. It will start automatically at login.
Plist: /Users/user/Library/LaunchAgents/com.yakk.kokoro.plist

$ yakk whisper disable
✅ Whisper service disabled and removed
```

### Viewing Logs
```bash
$ yakk kokoro logs --lines 20
=== Last 20 log entries for kokoro ===
[2025-08-11 15:30:42] Starting Kokoro FastAPI server...
[2025-08-11 15:30:43] Server listening on 0.0.0.0:8880
...
```

## Cross-Platform Support

Commands work on both macOS and Linux:
- **macOS**: Uses launchctl for service management
- **Linux**: Uses systemctl for service management  
- **Fallback**: Direct process control when service managers not available


## Benefits

1. **No shell setup required** - Commands work immediately after installing yakk
2. **Consistent interface** - Same commands on all platforms
3. **Better help text** - Built-in help with `--help`
4. **Standardized options** - Consistent flags like `--lines`
5. **No MCP overhead** - Service commands don't start the MCP server
6. **Future-proof** - Easy to add new service management features
