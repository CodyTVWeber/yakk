import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Settings, Download } from 'lucide-react';
import { mlManager } from './mlManager';
import './App.css';

type Message = { role: 'user' | 'assistant', text: string };

function App() {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // Model state
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Audio state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<number | null>(null);

  // Refs for closures
  const isVoiceModeRef = useRef(isVoiceMode);
  const messagesRef = useRef(messages);

  useEffect(() => {
    isVoiceModeRef.current = isVoiceMode;
  }, [isVoiceMode]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Check cache on mount
  useEffect(() => {
    const checkCache = async () => {
      const status = await mlManager.checkCacheStatus();
      const cached = [];
      if (status.gemma) cached.push('Gemma');
      if (status.whisper) cached.push('Whisper');
      if (status.kokoro) cached.push('Kokoro');
      
      if (cached.length > 0) {
        setLoadingStatus(`Found in cache: ${cached.join(', ')}`);
        setTimeout(() => setLoadingStatus(''), 5000);
      }
    };
    checkCache();
  }, []);

  const initAudioContext = () => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });
    }
    // Web Audio API requires user gesture to resume playback
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const loadModels = async () => {
    try {
      setLoadingStatus('Initializing models...');
      await mlManager.initGemma(setLoadingStatus);
      await mlManager.initWhisper(setLoadingStatus);
      await mlManager.initKokoro(setLoadingStatus);
      setModelsLoaded(true);
      setLoadingStatus('All models loaded successfully!');
      setTimeout(() => setLoadingStatus(''), 3000);
    } catch (err: any) {
      console.error('Model loading error:', err);
      setLoadingStatus(`Error: ${err.message || 'Failed to load models'}. Please check your connection and try again.`);
    }
  };

  const processChat = async (userText: string) => {
    if (!userText.trim()) return; // Prevent empty user messages

    console.log("[App] processChat started with text:", userText);
    setIsProcessing(true);
    try {
      // Create chat context using the latest messages from ref
      const chatMessages = messagesRef.current.map(m => ({
        role: m.role,
        content: m.text
      }));
      chatMessages.push({ role: 'user', content: userText });
      console.log("[App] Chat context constructed:", chatMessages);

      // Get AI response
      console.log("[App] Calling mlManager.chat...");
      const aiResponse = await mlManager.chat(chatMessages);
      console.log("[App] AI Response received:", aiResponse);
      setMessages(prev => [...prev, { role: 'assistant', text: aiResponse }]);

      // If in voice mode, speak the response
      if (isVoiceModeRef.current) {
        if (!aiResponse.trim()) {
           console.log("[App] AI response is empty, skipping TTS and restarting recording.");
           if (isVoiceModeRef.current) startRecording();
           setIsProcessing(false);
           return;
        }

        console.log("[App] Voice mode active, synthesizing speech...");
        setLoadingStatus('Generating speech...');
        initAudioContext();
        const audioData = await mlManager.speak(aiResponse);
        if (audioData && audioContextRef.current) {
          console.log("[App] Speech synthesis successful, playing audio...");
          const buffer = audioContextRef.current.createBuffer(1, audioData.length, 24000);
          buffer.getChannelData(0).set(audioData);
          const source = audioContextRef.current.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContextRef.current.destination);
          
          source.onended = () => {
            console.log("[App] Audio playback ended, restarting recording...");
            if (isVoiceModeRef.current) {
              startRecording();
            }
          };
          
          source.start();
        } else {
          console.warn("[App] Speech synthesis failed or no audio context. Restarting recording...");
          if (isVoiceModeRef.current) {
             startRecording();
          }
        }
        setLoadingStatus('');
      }
    } catch (err) {
      console.error("[App] Error in processChat:", err);
      setLoadingStatus('Error processing chat');
      setTimeout(() => setLoadingStatus(''), 3000);
      if (isVoiceModeRef.current) {
        console.log("[App] Restarting recording after error...");
        startRecording();
      }
    } finally {
      console.log("[App] processChat finished");
      setIsProcessing(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !modelsLoaded || isProcessing) return;
    const text = inputText;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInputText('');
    processChat(text);
  };

  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
    if (isRecording) {
      stopRecording();
    }
  };

  const startRecording = async () => {
    if (!modelsLoaded) return;
    initAudioContext();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // VAD setup
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sourceNode = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.minDecibels = -60;
      analyser.smoothingTimeConstant = 0.8;
      sourceNode.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let silenceStart = Date.now();
      let hasSpoken = false;

      let lastLogTime = Date.now();

      const checkSilence = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
        
        analyser.getByteFrequencyData(dataArray);
        let peak = 0;
        for (let i = 0; i < dataArray.length; i++) {
          if (dataArray[i] > peak) peak = dataArray[i];
        }
        
        const now = Date.now();
        // Log peak volume every second so we don't spam the console too much, but enough to see what VAD sees
        if (now - lastLogTime > 1000) {
           console.log(`[VAD] Peak volume: ${peak}, hasSpoken: ${hasSpoken}`);
           lastLogTime = now;
        }

        if (peak > 40) { // Voice detected
          if (!hasSpoken) console.log("[VAD] Voice detected! Waiting for silence...");
          hasSpoken = true;
          silenceStart = Date.now();
        } else if (hasSpoken) {
          if (now - silenceStart > 2500) { // 2.5s of silence after speaking
            console.log("[VAD] 2.5s of silence detected, stopping recording...");
            stopRecording();
            return;
          }
        }
        analyserRef.current = requestAnimationFrame(checkSilence);
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("[App] mediaRecorder.onstop triggered");
        setIsProcessing(true);
        setLoadingStatus('Transcribing audio...');
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log("[App] Audio blob size:", audioBlob.size);
          const arrayBuffer = await audioBlob.arrayBuffer();
          initAudioContext();
          const audioContext = audioContextRef.current;
          if (!audioContext) throw new Error("AudioContext not initialized");
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const audioData = audioBuffer.getChannelData(0);

          console.log("[App] Calling transcribeAudio...");
          const text = await mlManager.transcribeAudio(audioData);
          console.log("[App] Transcribed text:", text);
          if (text.trim()) {
            setMessages(prev => [...prev, { role: 'user', text }]);
            processChat(text);
          } else {
            console.log("[App] No speech detected in transcribed text.");
            setLoadingStatus('No speech detected');
            setTimeout(() => setLoadingStatus(''), 2000);
            setIsProcessing(false);
            if (isVoiceModeRef.current) {
               console.log("[App] Restarting recording after empty transcription...");
               startRecording();
            }
          }
        } catch (err) {
          console.error("[App] Transcription error in onstop:", err);
          setLoadingStatus('Transcription failed');
          setIsProcessing(false);
          if (isVoiceModeRef.current) {
             console.log("[App] Restarting recording after transcription error...");
             startRecording();
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      checkSilence();
    } catch (err) {
      console.error("Microphone access denied:", err);
      setLoadingStatus('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (analyserRef.current) {
      cancelAnimationFrame(analyserRef.current);
      analyserRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Settings className="mr-2 text-blue-600" size={24} />
          Yakk Assistant
        </h1>
        <div className="flex items-center space-x-4">
          {!modelsLoaded && (
            <button
              onClick={loadModels}
              className="flex items-center text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
            >
              <Download size={16} className="mr-1" /> Load Models
            </button>
          )}

          <div className="flex items-center space-x-3">
            <label htmlFor="voice-mode-toggle" className="text-sm font-medium text-gray-700 cursor-pointer">
              Voice Mode
            </label>
            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
              <input
                type="checkbox"
                name="toggle"
                id="voice-mode-toggle"
                role="switch"
                checked={isVoiceMode}
                onChange={toggleVoiceMode}
                disabled={!modelsLoaded}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer disabled:opacity-50"
                style={{
                  right: isVoiceMode ? '0' : '1.5rem',
                  borderColor: isVoiceMode ? '#3b82f6' : '#d1d5db',
                  transition: 'all 0.3s'
                }}
              />
              <label
                htmlFor="voice-mode-toggle"
                className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: isVoiceMode ? '#3b82f6' : '#d1d5db',
                  transition: 'all 0.3s'
                }}
              ></label>
            </div>
          </div>
        </div>
      </header>

      {loadingStatus && (
        <div className="bg-blue-600 text-white text-sm text-center py-2 px-4 shadow-inner" data-testid="loading-status">
          {loadingStatus}
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-6 flex flex-col space-y-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md">
              <h2 className="text-xl font-bold text-gray-700 mb-2">Welcome to Yakk</h2>
              <p className="mb-4 text-sm">A 100% local, private AI assistant. Turn on Voice Mode to chat natively!</p>
              {!modelsLoaded ? (
                <button
                  onClick={loadModels}
                  className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors w-full flex items-center justify-center"
                >
                  <Download size={18} className="mr-2" /> Download & Load Models (~2.5GB)
                </button>
              ) : (
                <p className="text-green-600 font-medium bg-green-50 px-4 py-2 rounded-full inline-block">Models loaded and ready!</p>
              )}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm md:text-base ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="max-w-[75%] rounded-2xl px-5 py-3 bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none">
              <div className="flex space-x-1.5 items-center h-5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center bg-gray-100 rounded-full pr-2 focus-within:ring-2 ring-blue-500 transition-all">
          <input
            type="text"
            placeholder={!modelsLoaded ? "Load models to start chatting..." : (isVoiceMode ? "Voice mode active - use microphone..." : "Type your message...")}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-transparent px-6 py-4 focus:outline-none text-gray-700 disabled:opacity-50"
            disabled={isVoiceMode || !modelsLoaded || isProcessing}
          />
          {isVoiceMode ? (
            <button
              onClick={toggleRecording}
              disabled={!modelsLoaded || isProcessing}
              className={`p-3 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 ${
                isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              aria-label={isRecording ? "Stop Recording" : "Start Recording"}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          ) : (
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || !modelsLoaded || isProcessing}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:bg-gray-400"
              aria-label="Send Message"
            >
              <Send size={20} />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;