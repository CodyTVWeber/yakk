# Yakk Master Action Plan (Model-Agnostic Refactor)

This plan tracks the transformation of Yakk into a model-agnostic audible feedback and voice system.

## Phase 1: CLI & Configuration Abstraction
- **[TICKET-YAK-001] Implement Agent Configuration Registry:**
  - **Task:** Abstract agent-specific settings (paths, hook names, JSON structures) into a registry.
  - **Status:** Todo
- **[TICKET-YAK-002] Add Gemini CLI Support:**
  - **Task:** Implement `yakk gemini hooks` by utilizing the new configuration registry.
  - **Status:** Todo
- **[TICKET-YAK-003] Standardize Hook Event Mapping:**
  - **Task:** Create a mapping layer that translates internal Yakk events to agent-specific hook names (e.g., Yakk 'tool_start' -> Claude 'PreToolUse' / Gemini 'BeforeTool').
  - **Status:** Todo

## Phase 2: Documentation & Tutorials
- **[TICKET-YAK-101] Model-Agnostic Documentation Update:**
  - **Task:** Update README.md and guides to move away from Claude-only terminology.
  - **Status:** Todo
- **[TICKET-YAK-102] Gemini Setup Guide:**
  - **Task:** Create a specific tutorial for setting up Yakk with Gemini CLI.
  - **Status:** Todo

## Phase 3: Technical Debt & Standardization
- **[TICKET-YAK-201] Multi-Agent Hook Receiver:**
  - **Task:** Ensure `yakk-hook-receiver` correctly identifies which agent is calling it for better logging and debugging.
  - **Status:** Todo
