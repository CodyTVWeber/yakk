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
    setIsProcessing(true);
    try {
      // Create chat context
      const chatMessages = messages.map(m => ({
        role: m.role,
        content: m.text
      }));
      chatMessages.push({ role: 'user', content: userText });

      // Get AI response
      const aiResponse = await mlManager.chat(chatMessages);
      setMessages(prev => [...prev, { role: 'assistant', text: aiResponse }]);

      // If in voice mode, speak the response
      if (isVoiceMode) {
        setLoadingStatus('Generating speech...');
        initAudioContext();
        const audioData = await mlManager.speak(aiResponse);
        if (audioData && audioContextRef.current) {
          const buffer = audioContextRef.current.createBuffer(1, audioData.length, 24000);
          buffer.getChannelData(0).set(audioData);
          const source = audioContextRef.current.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContextRef.current.destination);
          source.start();
        }
        setLoadingStatus('');
      }
    } catch (err) {
      console.error(err);
      setLoadingStatus('Error processing chat');
      setTimeout(() => setLoadingStatus(''), 3000);
    } finally {
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

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        setLoadingStatus('Transcribing audio...');
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const arrayBuffer = await audioBlob.arrayBuffer();
          // We need a context to decode the audio
          initAudioContext();
          const audioContext = audioContextRef.current;
          if (!audioContext) throw new Error("AudioContext not initialized");
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const audioData = audioBuffer.getChannelData(0); // Float32Array

          const text = await mlManager.transcribeAudio(audioData);
          if (text.trim()) {
            setMessages(prev => [...prev, { role: 'user', text }]);
            processChat(text);
          } else {
            setLoadingStatus('No speech detected');
            setTimeout(() => setLoadingStatus(''), 2000);
            setIsProcessing(false);
          }
        } catch (err) {
          console.error("Transcription error:", err);
          setLoadingStatus('Transcription failed');
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      setLoadingStatus('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
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