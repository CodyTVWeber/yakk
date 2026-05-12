import { CreateMLCEngine, MLCEngine } from '@mlc-ai/web-llm';
import type { AppConfig } from '@mlc-ai/web-llm';
import { pipeline, env } from '@huggingface/transformers';
// @ts-ignore
import { KokoroTTS } from 'kokoro-js';

// Configure transformers.js to not use local models since it's running in browser
env.allowLocalModels = false;

class MLManager {
  private engine: MLCEngine | null = null;
  private transcriber: any = null;
  private tts: any = null;

  async initGemma(onProgress: (text: string) => void) {
    if (this.engine) return;
    onProgress("Initializing Gemma 4 E2B model...");

    const repo = "https://huggingface.co/welcoma/gemma-4-E2B-it-q4f16_1-MLC";
    const selectedModel = 'gemma-4-E2B-it-q4f16_1-MLC';

    const appConfig: AppConfig = {
      model_list: [
        {
          model: repo,
          model_id: selectedModel,
          model_lib: `${repo}/resolve/main/libs/gemma-4-E2B-it-q4f16_1-MLC-webgpu.wasm`,
        }
      ]
    };

    // Create the engine
    this.engine = await CreateMLCEngine(
      selectedModel,
      {
        initProgressCallback: (progress) => {
          onProgress(`Loading Gemma: ${Math.round(progress.progress * 100)}%`);
        },
        appConfig: appConfig
      }
    );
    onProgress("Gemma initialized successfully.");
  }

  async initWhisper(onProgress: (text: string) => void) {
    if (this.transcriber) return;
    onProgress("Initializing Whisper STT model...");
    // Initialize the whisper model via transformers.js
    this.transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
      progress_callback: (progress: any) => {
        if (progress.status === 'progress') {
          onProgress(`Loading Whisper: ${Math.round(progress.progress)}%`);
        }
      }
    });
    onProgress("Whisper initialized successfully.");
  }

  async initKokoro(onProgress: (text: string) => void) {
    if (this.tts) return;
    onProgress("Initializing Kokoro TTS model...");
    // Initialize kokoro-js
    try {
      this.tts = await KokoroTTS.from_pretrained("Xenova/kokoro-v0_19");
      onProgress("Kokoro initialized successfully.");
    } catch (error) {
      console.error("Kokoro init error:", error);
      onProgress("Failed to init Kokoro. Check console.");
      throw error;
    }
  }

  async transcribeAudio(audioData: Float32Array): Promise<string> {
    if (!this.transcriber) throw new Error("Whisper not initialized");
    const result = await this.transcriber(audioData);
    return result.text;
  }

  async chat(messages: {role: 'user' | 'assistant' | 'system', content: string}[]): Promise<string> {
    if (!this.engine) throw new Error("Gemma not initialized");
    const reply = await this.engine.chat.completions.create({
      messages,
      temperature: 0.7,
      max_tokens: 512,
    });
    return reply.choices[0].message.content || "";
  }

  async speak(text: string): Promise<Float32Array | null> {
    if (!this.tts) throw new Error("Kokoro not initialized");
    try {
      // Basic synthesis. Options may depend on kokoro-js version
      const audio = await this.tts.synthesize(text, { voice: 'af_heart' });
      return audio;
    } catch (error) {
      console.error("TTS synthesis error:", error);
      return null;
    }
  }
}

export const mlManager = new MLManager();