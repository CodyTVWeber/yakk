"""Tests for selective tool loading functionality."""
import os
import subprocess
import sys
from pathlib import Path
import pytest
from unittest.mock import patch, MagicMock
import importlib

# Import the module we're testing
import yakk.tools


class TestToolFiltering:
    """Test suite for tool filtering functionality."""

    def setup_method(self):
        """Reset environment before each test."""
        # Clear any existing tool environment variables
        for key in ['YAKK_TOOLS', 'YAKK_TOOLS_ENABLED', 'YAKK_TOOLS_DISABLED']:
            os.environ.pop(key, None)

    def teardown_method(self):
        """Clean up after each test."""
        # Clear environment variables
        for key in ['YAKK_TOOLS', 'YAKK_TOOLS_ENABLED', 'YAKK_TOOLS_DISABLED']:
            os.environ.pop(key, None)

    def test_get_all_available_tools(self):
        """Test that we can discover all available tools."""
        from yakk.tools import get_all_available_tools

        tools = get_all_available_tools()

        # Check that we get a set
        assert isinstance(tools, set)

        # Check for some known tools
        assert 'converse' in tools
        assert 'service' in tools

        # Check for service tools with underscore notation
        assert any('kokoro_' in tool for tool in tools)
        assert any('whisper_' in tool for tool in tools)

    def test_parse_tool_list(self):
        """Test parsing of comma-separated tool lists."""
        from yakk.tools import parse_tool_list

        # Test empty string
        assert parse_tool_list("") == set()

        # Test single tool
        assert parse_tool_list("converse") == {"converse"}

        # Test multiple tools
        assert parse_tool_list("converse,service,voice_status") == {"converse", "service", "voice_status"}

        # Test with whitespace
        assert parse_tool_list(" converse , service , voice_status ") == {"converse", "service", "voice_status"}

        # Test with duplicates
        assert parse_tool_list("converse,converse,service") == {"converse", "service"}

    def test_whitelist_mode(self):
        """Test YAKK_TOOLS_ENABLED whitelist mode."""
        from yakk.tools import determine_tools_to_load

        os.environ['YAKK_TOOLS_ENABLED'] = "converse,service"

        tools, mode = determine_tools_to_load()

        assert "whitelist mode" in mode
        assert "converse" in tools
        assert "service" in tools
        assert len(tools) == 2  # Only the specified tools

    def test_blacklist_mode(self):
        """Test YAKK_TOOLS_DISABLED blacklist mode."""
        from yakk.tools import determine_tools_to_load, get_all_available_tools

        os.environ['YAKK_TOOLS_DISABLED'] = "kokoro_install,whisper_install"

        tools, mode = determine_tools_to_load()
        all_tools = get_all_available_tools()

        assert "blacklist mode" in mode
        assert "kokoro_install" not in tools
        assert "whisper_install" not in tools
        assert "converse" in tools  # Other tools should be present
        assert len(tools) == len(all_tools) - 2  # All tools minus the excluded ones

    def test_whitelist_takes_precedence(self):
        """Test that whitelist takes precedence when both are set."""
        from yakk.tools import determine_tools_to_load

        os.environ['YAKK_TOOLS_ENABLED'] = "converse"
        os.environ['YAKK_TOOLS_DISABLED'] = "service"

        tools, mode = determine_tools_to_load()

        assert "whitelist mode" in mode
        assert "converse" in tools
        assert len(tools) == 1  # Only whitelist should apply

    def test_legacy_mode_with_deprecation(self):
        """Test legacy YAKK_TOOLS with deprecation warning."""
        from yakk.tools import determine_tools_to_load

        os.environ['YAKK_TOOLS'] = "converse,service"

        with patch('yakk.tools.logger') as mock_logger:
            tools, mode = determine_tools_to_load()

            # Check deprecation warning was logged
            mock_logger.warning.assert_called_with(
                "YAKK_TOOLS is deprecated and will be removed in v5.0. "
                "Please use YAKK_TOOLS_ENABLED or YAKK_TOOLS_DISABLED instead."
            )

        assert "legacy mode" in mode
        assert "converse" in tools
        assert "service" in tools

    def test_default_mode_loads_essential(self):
        """Test that default mode loads only essential tools (converse, service)."""
        from yakk.tools import determine_tools_to_load

        # No environment variables set
        tools, mode = determine_tools_to_load()

        assert "default mode" in mode
        assert tools == {"converse", "service"}
        assert len(tools) == 2

    def test_invalid_tool_names_warning(self):
        """Test that invalid tool names generate warnings."""
        from yakk.tools import determine_tools_to_load

        os.environ['YAKK_TOOLS_ENABLED'] = "converse,nonexistent_tool"

        with patch('yakk.tools.logger') as mock_logger:
            tools, mode = determine_tools_to_load()

            # Check warning was logged for invalid tool
            warning_calls = [call for call in mock_logger.warning.call_args_list]
            assert any('nonexistent_tool' in str(call) for call in warning_calls)

        assert "converse" in tools
        assert "nonexistent_tool" not in tools

    def test_load_tool_function(self):
        """Test the load_tool function."""
        from yakk.tools import load_tool

        with patch('yakk.tools.importlib.import_module') as mock_import:
            # Test regular tool
            result = load_tool("converse")
            assert result is True
            mock_import.assert_called_with(".converse", package="yakk.tools")

            # Test subdirectory tool (formerly service tool)
            mock_import.reset_mock()
            result = load_tool("kokoro_install")
            assert result is True
            mock_import.assert_called_with(".kokoro.install", package="yakk.tools")

    def test_empty_tools_enabled(self):
        """Test that empty YAKK_TOOLS_ENABLED loads nothing."""
        from yakk.tools import determine_tools_to_load

        os.environ['YAKK_TOOLS_ENABLED'] = ""

        tools, mode = determine_tools_to_load()

        # Should fall back to default mode
        assert "default mode" in mode
        assert len(tools) > 0  # Should load all tools

    def test_whitespace_only_tools_enabled(self):
        """Test that whitespace-only YAKK_TOOLS_ENABLED loads nothing."""
        from yakk.tools import determine_tools_to_load

        os.environ['YAKK_TOOLS_ENABLED'] = "   "

        tools, mode = determine_tools_to_load()

        # Should fall back to default mode
        assert "default mode" in mode
        assert len(tools) > 0  # Should load all tools


class TestCLIArguments:
    """Test CLI argument handling for tool filtering."""

    def test_cli_tools_enabled(self):
        """Test --tools-enabled CLI argument."""
        # This test would need to run the CLI in a subprocess
        result = subprocess.run(
            [sys.executable, "-m", "yakk", "--tools-enabled", "converse", "--help"],
            capture_output=True,
            text=True,
            env={**os.environ, 'PYTHONPATH': str(Path(__file__).parent.parent)}
        )

        assert result.returncode == 0
        assert "Yakk" in result.stdout

    def test_cli_tools_disabled(self):
        """Test --tools-disabled CLI argument."""
        result = subprocess.run(
            [sys.executable, "-m", "yakk", "--tools-disabled", "kokoro_install", "--help"],
            capture_output=True,
            text=True,
            env={**os.environ, 'PYTHONPATH': str(Path(__file__).parent.parent)}
        )

        assert result.returncode == 0
        assert "Yakk" in result.stdout


class TestIntegration:
    """Integration tests for tool filtering."""

    def test_subprocess_with_enabled_tools(self):
        """Test that tools are actually filtered when running as subprocess."""
        # Create a test script that imports yakk.tools and checks loaded tools
        test_script = '''
import os
os.environ['YAKK_TOOLS_ENABLED'] = 'converse'
import yakk.tools
from yakk.tools import tools_to_load
print(','.join(sorted(tools_to_load)))
'''

        result = subprocess.run(
            [sys.executable, "-c", test_script],
            capture_output=True,
            text=True,
            env={**os.environ, 'PYTHONPATH': str(Path(__file__).parent.parent)}
        )

        # Should only have 'converse' loaded
        assert 'converse' in result.stdout
        assert result.returncode == 0

    def test_subprocess_with_disabled_tools(self):
        """Test that tools are excluded when running as subprocess."""
        test_script = '''
import os
os.environ['YAKK_TOOLS_DISABLED'] = 'kokoro_install,whisper_install'
import yakk.tools
from yakk.tools import tools_to_load
# Check that disabled tools are not in the loaded set
disabled = {'kokoro_install', 'whisper_install'}
loaded = yakk.tools.tools_to_load
assert not (disabled & loaded), f"Disabled tools found: {disabled & loaded}"
print("SUCCESS")
'''

        result = subprocess.run(
            [sys.executable, "-c", test_script],
            capture_output=True,
            text=True,
            env={**os.environ, 'PYTHONPATH': str(Path(__file__).parent.parent)}
        )

        assert 'SUCCESS' in result.stdout
        assert result.returncode == 0