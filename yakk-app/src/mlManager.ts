import { CreateMLCEngine, MLCEngine, hasModelInCache } from '@mlc-ai/web-llm';
import type { AppConfig } from '@mlc-ai/web-llm';
import { pipeline, env } from '@huggingface/transformers';
// @ts-ignore
import { KokoroTTS } from 'kokoro-js';

// Configure transformers.js to not use local models since it's running in browser
env.allowLocalModels = false;
// Since we are now using Cache API directly for checks, we can try re-enabling this 
// if the earlier NetworkError was solved by the Capacitor allowNavigation update.
// However, for maximum reliability in this task, we'll keep it disabled if the user's
// environment has strict COOP/COEP or CORS issues that Cache.add() can't handle.
// Actually, let's re-enable it but wrap in a way that it can fail gracefully.
env.useBrowserCache = true; 

class MLManager {
  private engine: MLCEngine | null = null;
  private transcriber: any = null;
  private tts: any = null;

  private gemmaModelId = 'gemma-4-E2B-it-q4f16_1-MLC';
  private whisperModelId = 'Xenova/whisper-tiny.en';
  private kokoroModelId = 'onnx-community/Kokoro-82M-v1.0-ONNX';

  private gemmaAppConfig: AppConfig = {
    model_list: [
      {
        model: "https://huggingface.co/welcoma/gemma-4-E2B-it-q4f16_1-MLC",
        model_id: 'gemma-4-E2B-it-q4f16_1-MLC',
        model_lib: "https://huggingface.co/welcoma/gemma-4-E2B-it-q4f16_1-MLC/resolve/main/libs/gemma-4-E2B-it-q4f16_1-MLC-webgpu.wasm",
        overrides: {
          sliding_window_size: -1
        }
      }
    ],
    cacheBackend: "indexeddb"
  };

  async checkCacheStatus() {
    const status = {
      gemma: false,
      whisper: false,
      kokoro: false
    };

    try {
      // Check Gemma (Web-LLM)
      status.gemma = await hasModelInCache(this.gemmaModelId, this.gemmaAppConfig);

      // Check Transformers.js models
      // We check for a key file in the transformers-cache
      const cache = await caches.open('transformers-cache');

      const whisperUrl = `https://huggingface.co/${this.whisperModelId}/resolve/main/config.json`;
      const whisperMatch = await cache.match(whisperUrl);
      status.whisper = !!whisperMatch;

      const kokoroUrl = `https://huggingface.co/${this.kokoroModelId}/resolve/main/config.json`;
      const kokoroMatch = await cache.match(kokoroUrl);
      status.kokoro = !!kokoroMatch;
    } catch (e) {
      console.warn("Cache check failed:", e);
    }

    return status;
  }

  async initGemma(onProgress: (text: string) => void) {
    if (this.engine) return;

    const isCached = await hasModelInCache(this.gemmaModelId, this.gemmaAppConfig);
    if (isCached) {
      onProgress("Gemma found in cache, loading...");
    } else {
      onProgress("Initializing Gemma 4 E2B model (downloading)...");
    }

    // Create the engine
    this.engine = await CreateMLCEngine(
      this.gemmaModelId,
      {
        initProgressCallback: (progress) => {
          onProgress(`Loading Gemma: ${Math.round(progress.progress * 100)}%`);
        },
        appConfig: this.gemmaAppConfig
      }
    );
    onProgress("Gemma initialized successfully.");
  }


  async initWhisper(onProgress: (text: string) => void) {
    if (this.transcriber) return;
    
    // Check cache for logging
    const cache = await caches.open('transformers-cache');
    const isCached = await cache.match(`https://huggingface.co/${this.whisperModelId}/resolve/main/config.json`);
    
    if (isCached) {
      onProgress("Whisper found in cache, loading...");
    } else {
      onProgress("Initializing Whisper STT model (downloading)...");
    }

    // Initialize the whisper model via transformers.js
    this.transcriber = await pipeline('automatic-speech-recognition', this.whisperModelId, {
      dtype: 'fp32',
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
    
    // Check cache for logging
    const cache = await caches.open('transformers-cache');
    const isCached = await cache.match(`https://huggingface.co/${this.kokoroModelId}/resolve/main/config.json`);
    
    if (isCached) {
      onProgress("Kokoro found in cache, loading...");
    } else {
      onProgress("Initializing Kokoro TTS model (downloading)...");
    }

    // Initialize kokoro-js
    try {
      this.tts = await KokoroTTS.from_pretrained(this.kokoroModelId, {
        dtype: 'fp32'
      });
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