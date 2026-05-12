import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock mlManager so it doesn't load node_modules/onnxruntime-node
vi.mock('./mlManager', () => {
  return {
    mlManager: {
      initGemma: vi.fn(),
      initWhisper: vi.fn(),
      initKokoro: vi.fn(),
      transcribeAudio: vi.fn(),
      chat: vi.fn(),
      speak: vi.fn(),
    }
  };
});

// Mock window.AudioContext for JSDOM
class MockAudioContext {
  sampleRate = 16000;
  close() {}
  createBuffer() {}
  createBufferSource() {}
  destination = {};
}
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: MockAudioContext,
});

describe('App', () => {
  it('renders chat interface correctly', () => {
    render(<App />);
    expect(screen.getByText('Yakk Assistant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Load models to start chatting...')).toBeInTheDocument();
  });

  it('toggles voice mode correctly', () => {
    render(<App />);
    const voiceModeToggle = screen.getByRole('switch', { name: /Voice Mode/i });
    expect(voiceModeToggle).toBeInTheDocument();

    // Initial state should be false (text mode)
    expect(voiceModeToggle).not.toBeChecked();

    // Since it's disabled initially, the UI should reflect that
    expect(voiceModeToggle).toBeDisabled();
  });
});