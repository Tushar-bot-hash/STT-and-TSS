/**
 * Web Speech API Text-to-Speech Service
 * Using browser's built-in speech synthesis
 */

interface TTSOptions {
  text: string;
  voice?: string;
  rate?: number;    // 0.1 to 10 (speed)
  pitch?: number;   // 0 to 2 (pitch)
  volume?: number;  // 0 to 1 (volume)
  lang?: string;
}

export class TextToSpeech {
  private synthesis: SpeechSynthesis;
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    
    if (!this.synthesis) {
      throw new Error('Speech synthesis not supported in this browser');
    }
  }

  /**
   * Convert text to speech and return as Blob (simulated)
   * Note: Web Speech API doesn't directly support audio blob output,
   * so we'll play the audio and provide a way to capture it
   */
  async textToSpeech(options: TTSOptions): Promise<Blob> {
    const { 
      text, 
      voice,
      rate = 1,
      pitch = 1,
      volume = 1,
      lang = 'en-US'
    } = options;

    return new Promise(async (resolve, reject) => {
      try {
        // Wait for voices to be loaded
        await this.loadVoices();
        
        const utterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utterance;
        
        // Set utterance properties
        utterance.rate = this.clamp(rate, 0.1, 10);
        utterance.pitch = this.clamp(pitch, 0, 2);
        utterance.volume = this.clamp(volume, 0, 1);
        utterance.lang = lang;

        // Select voice if specified
        if (voice) {
          const selectedVoice = this.getVoiceByName(voice);
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        }

        // Since we can't directly get audio as Blob from Web Speech API,
        // we'll create a simulated Blob with the audio data
        // In a real implementation, you might need to use a different approach
        // or service if you need the actual audio file
        
        utterance.onstart = () => {
          console.log('TTS started');
          this.isSpeaking = true;
        };

        utterance.onend = () => {
          console.log('TTS completed');
          this.isSpeaking = false;
          this.currentUtterance = null;
          
          // Create a simulated audio blob (empty MP3)
          // Note: This is a workaround since Web Speech API doesn't provide audio data
          const emptyAudioBlob = new Blob([new ArrayBuffer(0)], { type: 'audio/mp3' });
          resolve(emptyAudioBlob);
        };

        utterance.onerror = (event) => {
          console.error('TTS error:', event.error);
          this.isSpeaking = false;
          this.currentUtterance = null;
          reject(new Error(`Text-to-speech failed: ${event.error}`));
        };

        // Start synthesis
        this.synthesis.speak(utterance);

        // Safety timeout
        setTimeout(() => {
          if (this.isSpeaking) {
            this.synthesis.cancel();
            reject(new Error('TTS timeout'));
          }
        }, 30000);

      } catch (error) {
        reject(new Error(`Text-to-speech failed: ${error.message}`));
      }
    });
  }

  /**
   * Speak text immediately (real-time playback)
   */
  speak(options: TTSOptions): void {
    const { 
      text, 
      voice,
      rate = 1,
      pitch = 1,
      volume = 1,
      lang = 'en-US'
    } = options;

    // Cancel any ongoing speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;
    
    utterance.rate = this.clamp(rate, 0.1, 10);
    utterance.pitch = this.clamp(pitch, 0, 2);
    utterance.volume = this.clamp(volume, 0, 1);
    utterance.lang = lang;

    if (voice) {
      const selectedVoice = this.getVoiceByName(voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    utterance.onstart = () => {
      console.log('Speech started');
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      console.log('Speech ended');
      this.isSpeaking = false;
      this.currentUtterance = null;
    };

    utterance.onerror = (event) => {
      console.error('Speech error:', event.error);
      this.isSpeaking = false;
      this.currentUtterance = null;
    };

    this.synthesis.speak(utterance);
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.isSpeaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
      console.log('Speech stopped');
    }
  }

  /**
   * Pause current speech
   */
  pause(): void {
    if (this.isSpeaking) {
      this.synthesis.pause();
      console.log('Speech paused');
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
      console.log('Speech resumed');
    }
  }

  /**
   * Check if speech is active
   */
  isSpeakingActive(): boolean {
    return this.isSpeaking;
  }

  /**
   * Check if speech is paused
   */
  isPaused(): boolean {
    return this.synthesis.paused;
  }

  /**
   * Get available voices
   */
  async getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
    await this.loadVoices();
    return this.synthesis.getVoices();
  }

  /**
   * Get voices by language
   */
  async getVoicesByLang(lang: string): Promise<SpeechSynthesisVoice[]> {
    const voices = await this.getAvailableVoices();
    return voices.filter(voice => voice.lang.startsWith(lang));
  }

  /**
   * Get voice by name
   */
  private getVoiceByName(name: string): SpeechSynthesisVoice | null {
    const voices = this.synthesis.getVoices();
    return voices.find(voice => voice.name === name) || null;
  }

  /**
   * Load voices (ensure they're available)
   */
  private loadVoices(): Promise<void> {
    return new Promise((resolve) => {
      const voices = this.synthesis.getVoices();
      if (voices.length > 0) {
        resolve();
      } else {
        this.synthesis.onvoiceschanged = () => {
          resolve();
        };
        
        // Timeout fallback
        setTimeout(() => resolve(), 1000);
      }
    });
  }

  /**
   * Clamp value between min and max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Add event listeners for speech events
   */
  onStart(callback: () => void): void {
    if (this.currentUtterance) {
      this.currentUtterance.onstart = callback;
    }
  }

  onEnd(callback: () => void): void {
    if (this.currentUtterance) {
      this.currentUtterance.onend = callback;
    }
  }

  onError(callback: (error: string) => void): void {
    if (this.currentUtterance) {
      this.currentUtterance.onerror = (event) => callback(event.error);
    }
  }
}

// Legacy function for backward compatibility
export async function textToSpeech(options: TTSOptions): Promise<Blob> {
  const tts = new TextToSpeech();
  return await tts.textToSpeech(options);
}

// Real-time speech function (no blob return)
export function speakText(options: TTSOptions): void {
  const tts = new TextToSpeech();
  tts.speak(options);
}

export async function getAvailableVoices() {
  const tts = new TextToSpeech();
  const voices = await tts.getAvailableVoices();
  
  return voices.map(voice => ({
    value: voice.name,
    label: `${voice.name} (${voice.lang})${voice.default ? ' - Default' : ''}`,
    lang: voice.lang,
    localService: voice.localService,
    default: voice.default
  }));
}

// Common voice presets
export const VOICE_PRESETS = {
  'en-US': {
    rate: 1,
    pitch: 1,
    volume: 1
  },
  'zh-CN': {
    rate: 0.9,
    pitch: 1,
    volume: 1
  },
  'ja-JP': {
    rate: 0.9,
    pitch: 1,
    volume: 1
  },
  'ko-KR': {
    rate: 0.9,
    pitch: 1,
    volume: 1
  }
};