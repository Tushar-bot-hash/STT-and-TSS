import { useCallback, useState, useEffect, useRef } from "react";
import { SendIcon } from "./icons/SendIcon";
import { useNowPlaying } from "react-nowplaying";
import TextInput from "./TextInput";

// Fallback implementations for unsupported browsers
const FallbackTTS = {
  speak: (options) => {
    alert(`Text-to-Speech: "${options.text}"\n\nNote: Using fallback - audio playback not available.`);
  },
  stop: () => {}
};

const FallbackSTT = {
  startRecognition: () => {
    alert("Speech-to-Text not supported in this browser. Try Chrome or Edge for full functionality.");
    throw new Error("STT not supported");
  },
  stopRecognition: () => {},
  onResult: () => {},
  onError: () => {}
};

const Controls = ({ callback }) => {
  const [mode, setMode] = useState('tts');
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [browserSupport, setBrowserSupport] = useState({
    hasTTS: false,
    hasSTT: false,
    isSupported: false
  });
  
  // TTS States
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);

  // STT States
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  
  const sttRef = useRef(null);
  const ttsRef = useRef(null);

  const { stop: stopAudio, play: playAudio } = useNowPlaying();

  // Check browser support only on client side
  useEffect(() => {
    const checkBrowserSupport = () => {
      // Ensure we're in a browser environment
      if (typeof window === 'undefined') {
        return { hasTTS: false, hasSTT: false, isSupported: false };
      }
      
      const hasTTS = 'speechSynthesis' in window;
      const hasSTT = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
      return { hasTTS, hasSTT, isSupported: hasTTS || hasSTT };
    };

    setBrowserSupport(checkBrowserSupport());
  }, []);

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      console.log("Microphone permission granted");
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  };

  // Initialize services with fallbacks
  useEffect(() => {
    const initializeServices = async () => {
      // Always check if browserSupport exists and has the property
      if (!browserSupport || !browserSupport.isSupported) {
        console.warn("Web Speech API not fully supported, using fallbacks");
        sttRef.current = FallbackSTT;
        ttsRef.current = FallbackTTS;
        return;
      }

      try {
        // Dynamic imports to avoid errors in unsupported browsers
        if (browserSupport.hasTTS) {
          const { TextToSpeech, speakText } = await import("../services/web-speech-tts");
          ttsRef.current = new TextToSpeech();
        } else {
          ttsRef.current = FallbackTTS;
        }

        if (browserSupport.hasSTT) {
          const { SpeechToText } = await import("../services/web-speech-stt");
          sttRef.current = new SpeechToText();
        } else {
          sttRef.current = FallbackSTT;
        }
        
        console.log("Speech services initialized successfully");
      } catch (error) {
        console.error("Failed to initialize speech services:", error);
        sttRef.current = FallbackSTT;
        ttsRef.current = FallbackTTS;
      }
    };

    // Only initialize if browserSupport is properly set
    if (browserSupport && browserSupport.isSupported) {
      initializeServices();
    } else {
      // Set fallbacks immediately if not supported
      sttRef.current = FallbackSTT;
      ttsRef.current = FallbackTTS;
    }

    return () => {
      if (sttRef.current && sttRef.current.stopRecognition) {
        sttRef.current.stopRecognition();
      }
      if (ttsRef.current && ttsRef.current.stop) {
        ttsRef.current.stop();
      }
    };
  }, [browserSupport]);

  // Load voices and languages
  useEffect(() => {
    const loadData = async () => {
      if (!browserSupport || !browserSupport.isSupported) {
        // Fallback data for unsupported browsers
        setVoices([{ value: "default", label: "Default Voice" }]);
        setLanguages([{ value: "en-US", label: "English (US)" }]);
        return;
      }

      try {
        if (browserSupport.hasTTS) {
          const { getAvailableVoices } = await import("../services/web-speech-tts");
          const availableVoices = await getAvailableVoices();
          setVoices(availableVoices);
          
          if (availableVoices.length > 0) {
            const defaultVoice = availableVoices.find(v => v.default) || availableVoices[0];
            setSelectedVoice(defaultVoice.value);
          }
        } else {
          setVoices([{ value: "default", label: "Default Voice" }]);
        }

        if (browserSupport.hasSTT) {
          const { getSupportedLanguages } = await import("../services/web-speech-stt");
          const availableLanguages = await getSupportedLanguages();
          setLanguages(availableLanguages);
        } else {
          setLanguages([{ value: "en-US", label: "English (US)" }]);
        }
      } catch (error) {
        console.error("Failed to load speech data:", error);
        // Fallback data
        setVoices([{ value: "default", label: "Default Voice" }]);
        setLanguages([{ value: "en-US", label: "English (US)" }]);
      }
    };
    
    if (browserSupport && browserSupport.isSupported) {
      loadData();
    }
  }, [browserSupport]);

  // TTS: Convert text to speech
  const handleTextToSpeech = useCallback(async () => {
    if (!text?.trim()) return;

    try {
      setIsLoading(true);
      stopAudio();

      if (!browserSupport || !browserSupport.hasTTS) {
        FallbackTTS.speak({ text: text.trim() });
        return;
      }

      const { speakText } = await import("../services/web-speech-tts");
      
      speakText({
        text: text.trim(),
        voice: selectedVoice,
        rate: rate,
        pitch: pitch,
        volume: volume,
        lang: selectedLanguage
      });

      console.log("TTS completed successfully");

    } catch (error) {
      console.error("Text-to-speech failed:", error);
      alert("Text-to-speech service unavailable.");
    } finally {
      setIsLoading(false);
    }
  }, [text, selectedVoice, rate, pitch, volume, selectedLanguage, browserSupport, stopAudio]);

  // STT: Start recording
  const startRecording = useCallback(async () => {
    if (!browserSupport || !browserSupport.hasSTT) {
      FallbackSTT.startRecognition();
      return;
    }

    try {
      // Request microphone permission first
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        alert('Microphone access is required for speech recognition. Please allow microphone access in your browser settings.');
        return;
      }

      if (!sttRef.current) {
        throw new Error("Speech recognition not initialized");
      }

      setIsRecording(true);
      setText(""); // Clear previous text

      // Set up real-time result handler
      sttRef.current.onResult((transcript, isFinal) => {
        console.log("STT Result:", { transcript, isFinal });
        
        if (isFinal && transcript) {
          setText(prev => {
            // Remove any interim results and add final transcript
            const cleanText = prev.replace(/\[.*?\]/g, '').trim();
            return cleanText + (cleanText ? ' ' : '') + transcript;
          });
        } else if (transcript) {
          // Show interim results in brackets
          setText(prev => {
            const withoutInterim = prev.replace(/\[.*?\]/g, '').trim();
            return withoutInterim + (withoutInterim ? ' ' : '') + `[${transcript}]`;
          });
        }
      });

      sttRef.current.onError((error) => {
        console.error("Speech recognition error:", error);
        if (error === 'not-allowed') {
          alert('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else if (error === 'no-speech') {
          // This is normal - no speech detected
          console.log('No speech detected');
          setText("No speech detected. Please try again.");
        } else if (error === 'audio-capture') {
          alert('No microphone found. Please check your microphone connection.');
        } else {
          alert(`Speech recognition error: ${error}`);
        }
        setIsRecording(false);
      });

      await sttRef.current.startRecognition({
        language: selectedLanguage,
        interimResults: true
      });

      console.log("STT recording started");

    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Speech recognition failed. Please try again.");
      setIsRecording(false);
    }
  }, [selectedLanguage, browserSupport]);

  // STT: Stop recording
  const stopRecording = useCallback(() => {
    if (sttRef.current && isRecording) {
      sttRef.current.stopRecognition();
      setIsRecording(false);
      // Remove interim results brackets when stopping
      setText(prev => prev.replace(/\[.*?\]/g, '').trim());
      console.log("STT recording stopped");
    }
  }, [isRecording]);

  const handleSubmit = useCallback(() => {
    if (mode === 'tts') {
      handleTextToSpeech();
    }
  }, [mode, handleTextToSpeech]);

  const handleModeChange = useCallback((newMode) => {
    if (newMode !== mode) {
      if (mode === 'stt' && isRecording) {
        stopRecording();
      }
      if (ttsRef.current?.stop) {
        ttsRef.current.stop();
      }
    }
    setMode(newMode);
  }, [mode, isRecording, stopRecording]);

  // Safe access to browserSupport properties
  const isSupported = browserSupport && browserSupport.isSupported;
  const hasTTS = browserSupport && browserSupport.hasTTS;
  const hasSTT = browserSupport && browserSupport.hasSTT;

  // Show loading state while checking browser support
  if (!isSupported && hasTTS === false && hasSTT === false) {
    return (
      <div className="relative space-y-6">
        <div className="flex justify-center">
          <div className="bg-gray-900 rounded-full p-1 flex">
            <button className="px-6 py-2 rounded-full text-gray-400 cursor-not-allowed">
              🔊 Text-to-Speech
            </button>
            <button className="px-6 py-2 rounded-full text-gray-400 cursor-not-allowed">
              🎤 Speech-to-Text
            </button>
          </div>
        </div>
        
        <div className="text-center p-8 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-gray-300 text-lg mb-2">Loading Speech Features...</div>
          <div className="text-gray-400 text-sm">
            Checking browser compatibility...
          </div>
        </div>
      </div>
    );
  }

  // Show browser support warning if neither TTS nor STT is supported
  if (!isSupported) {
    return (
      <div className="relative space-y-6">
        <div className="flex justify-center">
          <div className="bg-gray-900 rounded-full p-1 flex">
            <button className="px-6 py-2 rounded-full text-gray-400 cursor-not-allowed">
              🔊 Text-to-Speech
            </button>
            <button className="px-6 py-2 rounded-full text-gray-400 cursor-not-allowed">
              🎤 Speech-to-Text
            </button>
          </div>
        </div>
        
        <div className="text-center p-8 bg-yellow-900/50 rounded-lg border border-yellow-700">
          <div className="text-yellow-200 text-lg mb-2">⚠️ Browser Not Supported</div>
          <div className="text-yellow-300 text-sm mb-4">
            Web Speech API is not supported in this browser.
          </div>
          <div className="text-yellow-400 text-xs">
            Please use Chrome, Edge, or Safari for full speech functionality.
          </div>
        </div>

        <div className="flex bg-[#101014] rounded-full">
          <div className="flex-grow rounded-tl-[2rem] rounded-bl-[2rem] bg-gradient-to-l from-[#13EF93]/50 via-[#13EF93]/80 to-[#149AFB]/80 ps-0.5 py-0.5 inline">
            <div className="bg-[#101014] h-full rounded-tl-[2rem] rounded-bl-[2rem]">
              <TextInput
                value={text}
                onChange={setText}
                onSubmit={() => {}}
                placeholder="Speech features not available in this browser"
                disabled={true}
              />
            </div>
          </div>
          <div className="inline h-auto rounded-tr-[2rem] rounded-br-[2rem] bg-gradient-to-l to-[#13EF93]/50 from-[#149AFB]/80 pe-0.5 py-0.5">
            <button
              disabled={true}
              className="w-16 md:w-24 h-full py-2 md:py-4 px-2 rounded-tr-[2rem] rounded-br-[2rem] font-bold bg-[#101014] text-gray-500 cursor-not-allowed flex items-center justify-center"
            >
              <SendIcon className="w-5 md:w-6 opacity-50" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Mode Selection */}
      <div className="flex justify-center">
        <div className="bg-gray-900 rounded-full p-1 flex">
          <button
            onClick={() => handleModeChange('tts')}
            className={`px-6 py-2 rounded-full transition-all ${
              mode === 'tts' 
                ? 'bg-gradient-to-r from-[#13EF93] to-[#149AFB] text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🔊 Text-to-Speech
          </button>
          <button
            onClick={() => handleModeChange('stt')}
            className={`px-6 py-2 rounded-full transition-all ${
              mode === 'stt' 
                ? 'bg-gradient-to-r from-[#13EF93] to-[#149AFB] text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🎤 Speech-to-Text
          </button>
        </div>
      </div>

      {/* TTS Controls */}
      {mode === 'tts' && hasTTS && (
        <div className="flex flex-wrap gap-4 items-center justify-center p-4 bg-gray-900 rounded-lg">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-300">Voice</label>
            <select 
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="px-3 py-2 bg-gray-800 text-white rounded border border-gray-600 min-w-40"
            >
              {voices.map(voice => (
                <option key={voice.value} value={voice.value}>
                  {voice.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-300">Speed: {rate.toFixed(1)}</label>
            <input 
              type="range" 
              min="0.1" 
              max="10" 
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-24"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-300">Pitch: {pitch.toFixed(1)}</label>
            <input 
              type="range" 
              min="0" 
              max="2" 
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
              className="w-24"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-300">Volume: {volume.toFixed(1)}</label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-24"
            />
          </div>
        </div>
      )}

      {/* STT Controls */}
      {mode === 'stt' && hasSTT && (
        <div className="flex flex-wrap gap-4 items-center justify-center p-4 bg-gray-900 rounded-lg">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-300">Language</label>
            <select 
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-2 bg-gray-800 text-white rounded border border-gray-600"
            >
              {languages.map(lang => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Feature Not Available Warning */}
      {mode === 'tts' && !hasTTS && (
        <div className="text-center p-4 bg-yellow-900/50 rounded-lg border border-yellow-700">
          <div className="text-yellow-300 text-sm">
            Text-to-Speech not available in this browser. Try Chrome or Edge.
          </div>
        </div>
      )}

      {mode === 'stt' && !hasSTT && (
        <div className="text-center p-4 bg-yellow-900/50 rounded-lg border border-yellow-700">
          <div className="text-yellow-300 text-sm">
            Speech-to-Text not available in this browser. Try Chrome or Edge.
          </div>
        </div>
      )}

      {/* Main Input Area */}
      <div className="flex bg-[#101014] rounded-full">
        <div className="flex-grow rounded-tl-[2rem] rounded-bl-[2rem] bg-gradient-to-l from-[#13EF93]/50 via-[#13EF93]/80 to-[#149AFB]/80 ps-0.5 py-0.5 inline">
          <div className="bg-[#101014] h-full rounded-tl-[2rem] rounded-bl-[2rem]">
            <TextInput
              value={text}
              onChange={setText}
              onSubmit={handleSubmit}
              placeholder={
                mode === 'tts' 
                  ? "Enter text to convert to speech..." 
                  : isRecording 
                    ? "Listening... Speak now..." 
                    : "Click the microphone to start speaking..."
              }
              disabled={mode === 'stt' && isRecording}
            />
          </div>
        </div>

        <div className="inline h-auto rounded-tr-[2rem] rounded-br-[2rem] bg-gradient-to-l to-[#13EF93]/50 from-[#149AFB]/80 pe-0.5 py-0.5">
          <button
            type="button"
            onClick={mode === 'tts' ? handleSubmit : (isRecording ? stopRecording : startRecording)}
            disabled={
              isLoading || 
              (mode === 'tts' && !text?.trim()) ||
              (mode === 'tts' && !hasTTS) ||
              (mode === 'stt' && !hasSTT)
            }
            className={`w-16 md:w-24 h-full py-2 md:py-4 px-2 rounded-tr-[2rem] rounded-br-[2rem] font-bold bg-[#101014] text-light-900 text-sm sm:text-base flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
              isRecording ? 'animate-pulse bg-red-500' : ''
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : mode === 'tts' ? (
              <SendIcon className="w-5 md:w-6" />
            ) : isRecording ? (
              <div className="w-4 h-4 bg-white rounded-sm"></div> // Stop icon
            ) : (
              <div className="w-6 h-6 bg-white rounded-full"></div> // Mic icon
            )}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {mode === 'stt' && isRecording && (
        <div className="text-center">
          <span className="text-sm text-red-400 animate-pulse">
            🔴 Recording... Click to stop
          </span>
        </div>
      )}

      {/* Clean Footer */}
      <div className="text-center space-y-2">
        <div className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full inline-block">
          {mode === 'tts' ? '🔊 Web Speech API' : '🎤 Web Speech API'}
          {!hasTTS && mode === 'tts' && ' (Fallback Mode)'}
          {!hasSTT && mode === 'stt' && ' (Fallback Mode)'}
        </div>
        
        {/* Browser Support Info - Only show if there are limitations */}
        {(hasTTS && !hasSTT) || (!hasTTS && hasSTT) ? (
          <div className="text-xs text-gray-600">
            {!hasTTS && 'Text-to-Speech not supported • '}
            {!hasSTT && 'Speech-to-Text not supported'}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Controls;