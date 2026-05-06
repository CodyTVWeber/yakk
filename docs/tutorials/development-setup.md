# Development Setup


*Note: These docs need review.*

This guide covers setting up Yakk for development, including building from source, configuring your IDE, and contributing to the project.

## Prerequisites

- Python 3.10 or higher
- Git
- UV package manager (recommended) or pip
- Node.js 18+ (for frontend development)

## Setting Up UV

UV is a fast Python package manager written in Rust. It's the recommended tool for Yakk development:

```bash
# Install UV
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or using pip
pip install uv
```

## Cloning the Repository

**For contributors:** Fork the repo first at https://github.com/mbailey/yakk, then clone your fork:

```bash
# Clone your fork (replace YOUR-USERNAME)
git clone https://github.com/YOUR-USERNAME/yakk
cd yakk

# Install in development mode
uv tool install -e .
```

## Development Workflow

### Running from Source

### Building the Package

```bash
# Build the package
uv build

# This creates:
# dist/yakk-X.Y.Z-py3-none-any.whl
# dist/yakk-X.Y.Z.tar.gz

# Test the built package
uvx --from dist/yakk-*.whl yakk
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=yakk

# Run specific test file
pytest tests/test_converse.py

# Run with verbose output
pytest -v
```

### Using Local Services

For development without API keys:

```bash
# Or manually
yakk whisper install
yakk kokoro install

# Or manually
yakk whisper start
yakk kokoro start
```

## Project Structure

```
yakk/
├── yakk/           # Main package
│   ├── __init__.py
│   ├── server.py         # MCP server
│   ├── cli.py           # CLI commands
│   ├── config.py        # Configuration
│   ├── tools/           # MCP tools
│   │   ├── converse.py
│   │   └── services/    # Service installers
│   ├── providers.py     # Service providers
│   ├── frontend/        # Next.js frontend
│   └── templates/       # Service templates
├── tests/               # Test suite
├── docs/               # Documentation
├── scripts/            # Development scripts
├── Makefile           # Development tasks
└── pyproject.toml     # Project configuration
```

## Common Development Tasks

### Adding a New Tool

1. Create tool file in `yakk/tools/`
2. Implement tool class with MCP decorators
3. Add tests in `tests/tools/`
4. Update documentation

### Modifying Configuration

1. Update `yakk/config.py`
2. Add environment variable to docs
3. Update tests for new config
4. Add to example `.env` files

### Updating Dependencies

```bash
# Add a new dependency
uv add requests

# Add development dependency
uv add --dev pytest-mock

# Update all dependencies
uv sync
```

## Debugging

### Enable Debug Mode

```bash
export YAKK_DEBUG=true
export YAKK_LOG_LEVEL=debug
```

### Debug Output Locations

- Logs: `~/.yakk/logs/`
- Audio files: `~/.yakk/debug/`
- Event logs: `~/.yakk/events.log`

### Common Debug Commands

```bash
# Check service status
yakk whisper status
yakk kokoro status
```

## Testing

### Unit Tests

```bash
# Run all unit tests
pytest tests/unit/

# Run with markers
pytest -m "not integration"
```

### Integration Tests

```bash
# Run integration tests
pytest tests/integration/

# Run specific service tests
pytest tests/integration/test_whisper.py
```

### Manual Testing

```bash
# Test voice conversation
yakk converse --debug

# Test with different providers
YAKK_TTS_BASE_URLS=http://localhost:8880/v1 yakk converse
```

## Contributing

### Code Style

We use Black for formatting and Ruff for linting:

```bash
# Format code
black yakk tests

# Run linter
ruff check yakk tests

# Fix linting issues
ruff check --fix yakk tests
```

### Pre-commit Hooks

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

### Commit Messages

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Tests
- `refactor:` Code refactoring
- `chore:` Maintenance

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Run test suite
5. Submit pull request

## Makefile Commands

```bash
# Development
make dev           # Install in dev mode
make test         # Run tests
make lint         # Run linters
make format       # Format code

# Building
make build        # Build package
make clean        # Clean build artifacts

# Services
make install-services  # Install local services
make start-services   # Start local services
make stop-services    # Stop local services

# Documentation
make docs         # Build documentation
make docs-serve   # Serve docs locally
```

## Troubleshooting Development Issues

### Import Errors

```bash
uv pip install -e .
```

### Service Connection Issues

```bash
# Check if ports are in use
lsof -i :8880  # Kokoro
lsof -i :2022  # Whisper
lsof -i :7880  # LiveKit

# Kill stuck processes
pkill -f kokoro
pkill -f whisper
```

## Additional Resources

- [Yakk Architecture](../concepts/architecture.md)
- [CLI Reference](../reference/cli.md)
- [Tool Loading Architecture](../reference/tool-loading-architecture.md)
- [Environment Variables](../reference/environment.md)
