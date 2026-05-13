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

  private gemmaModelId = 'gemma-2b-it-q4f16_1-MLC';
  private whisperModelId = 'Xenova/whisper-tiny.en';
  private kokoroModelId = 'onnx-community/Kokoro-82M-v1.0-ONNX';

  async checkCacheStatus() {
    const status = {
      gemma: false,
      whisper: false,
      kokoro: false
    };

    try {
      // Check Gemma (Web-LLM) using the default config
      status.gemma = await hasModelInCache(this.gemmaModelId);

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

    const isCached = await hasModelInCache(this.gemmaModelId);
    if (isCached) {
      onProgress("Gemma found in cache, loading...");
    } else {
      onProgress("Initializing Gemma 2B model (downloading)...");
    }

    // Create the engine using the pre-built model list
    this.engine = await CreateMLCEngine(
      this.gemmaModelId,
      {
        initProgressCallback: (progress) => {
          onProgress(`Loading Gemma: ${Math.round(progress.progress * 100)}%`);
        }
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
      device: 'webgpu',
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
        dtype: 'fp32',
        device: 'webgpu'
      });
      onProgress("Kokoro initialized successfully.");
    } catch (error) {
      console.error("Kokoro init error:", error);
      onProgress("Failed to init Kokoro. Check console.");
      throw error;
    }
  }

  async transcribeAudio(audioData: Float32Array): Promise<string> {
    console.log("[MLManager] transcribeAudio called with audioData length:", audioData.length);
    if (!this.transcriber) {
      console.error("[MLManager] Whisper not initialized");
      throw new Error("Whisper not initialized");
    }
    try {
      const result = await this.transcriber(audioData);
      console.log("[MLManager] STT Result:", result);
      return result.text;
    } catch (e) {
      console.error("[MLManager] transcribeAudio error:", e);
      throw e;
    }
  }

  async chat(messages: {role: 'user' | 'assistant' | 'system', content: string}[]): Promise<string> {
    console.log("[MLManager] chat called with messages:", JSON.stringify(messages, null, 2));
    if (!this.engine) {
      console.error("[MLManager] Gemma not initialized");
      throw new Error("Gemma not initialized");
    }
    try {
      // Gemma models often struggle with explicit 'system' roles. 
      // It is safer to prepend instructions to the first user message.
      const systemInstruction = "Instructions: You are a helpful, concise AI voice assistant. Speak conversationally. Keep answers very brief. Do not use markdown or emojis.\n\n";
      
      // Filter out any empty assistant messages to prevent context poisoning
      const sanitizedMessages = messages.filter(m => m.content.trim() !== '');
      
      const fullMessages = [...sanitizedMessages];
      if (fullMessages.length > 0 && fullMessages[0].role === 'user') {
         fullMessages[0] = { ...fullMessages[0], content: systemInstruction + fullMessages[0].content };
      }
      
      console.log("[MLManager] Sending to LLM:", JSON.stringify(fullMessages, null, 2));
      
      const reply = await this.engine.chat.completions.create({
        messages: fullMessages,
        temperature: 0.5,
        repetition_penalty: 1.0, // Removing repetition penalty as it often causes gibberish in quantized models
        max_tokens: 512,
      });
      console.log("[MLManager] LLM Reply:", reply);
      
      let responseText = reply.choices[0].message.content || "";
      if (responseText.trim() === '') {
        console.warn("[MLManager] LLM returned empty string. Using fallback.");
        responseText = "I'm sorry, I didn't quite catch how to respond to that.";
      }
      return responseText;
    } catch (err) {
      console.error("[MLManager] LLM Chat Error:", err);
      throw err;
    }
  }

  async speak(text: string): Promise<Float32Array | null> {
    console.log("[MLManager] speak called with text:", text);
    if (!this.tts) {
      console.error("[MLManager] Kokoro not initialized");
      throw new Error("Kokoro not initialized");
    }
    try {
      const result = await this.tts.generate(text, { voice: 'af_heart' });
      console.log("[MLManager] TTS Result keys:", Object.keys(result));
      if (result && result.audio) {
         console.log("[MLManager] TTS audio length:", result.audio.length);
      }
      // The result is an object containing 'audio' which is the Float32Array (or array of them)
      return result.audio;
    } catch (error) {
      console.error("[MLManager] TTS synthesis error:", error);
      return null;
    }
  }
}

export const mlManager = new MLManager();