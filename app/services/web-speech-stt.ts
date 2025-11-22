/**
 * Web Speech API Speech-to-Text Service
 * Fixed Chrome compatibility
 */

interface STTOptions {
  audio?: Blob;
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export class SpeechToText {
  private recognition: any;
  private isRecording = false;

  constructor() {
    // Chrome uses webkitSpeechRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported in this browser');
    }
    
    this.recognition = new SpeechRecognition();
    this.setupRecognition();
  }

  private setupRecognition(): void {
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    // Chrome-specific settings
    this.recognition.continuous = false;
    this.recognition.interimResults = true; // Enable interim results for better UX
  }

  /**
   * Convert audio blob to speech recognition
   */
  async speechToText(options: STTOptions = {}): Promise<string> {
    const { 
      audio, 
      language = 'en-US', 
      continuous = false, 
      interimResults = true 
    } = options;

    return new Promise(async (resolve, reject) => {
      try {
        this.recognition.continuous = continuous;
        this.recognition.interimResults = interimResults;
        this.recognition.lang = language;

        let finalTranscript = '';
        let hasResult = false;

        this.recognition.onstart = () => {
          console.log('Speech recognition started');
          this.isRecording = true;
        };

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
              console.log('Final result:', transcript);
            } else {
              interimTranscript += transcript;
              console.log('Interim result:', transcript);
            }
          }

          hasResult = true;
          
          // If not continuous, stop after first final result
          if (!continuous && finalTranscript) {
            this.recognition.stop();
          }
        };

        this.recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          this.isRecording = false;
          
          if (event.error === 'no-speech') {
            resolve('No speech detected');
          } else if (event.error === 'audio-capture') {
            reject(new Error('No microphone found. Please check your microphone settings.'));
          } else if (event.error === 'not-allowed') {
            reject(new Error('Microphone permission denied. Please allow microphone access.'));
          } else {
            reject(new Error(`Speech recognition error: ${event.error}`));
          }
        };

        this.recognition.onend = () => {
          console.log('Speech recognition ended');
          this.isRecording = false;
          
          if (hasResult) {
            resolve(finalTranscript || 'No speech detected');
          } else {
            resolve('No speech detected');
          }
        };

        // If audio blob is provided, we need to play it and capture through microphone
        if (audio) {
          await this.processAudioBlob(audio, this.recognition);
        } else {
          // Start live microphone recognition
          this.recognition.start();
        }

        // Auto-stop after 30 seconds for safety
        setTimeout(() => {
          if (this.isRecording) {
            this.recognition.stop();
            resolve(finalTranscript || 'Recognition timeout');
          }
        }, 30000);

      } catch (error) {
        reject(new Error(`Speech recognition failed: ${error.message}`));
      }
    });
  }

  /**
   * Start continuous speech recognition
   */
  async startRecognition(options: STTOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const { 
          language = 'en-US', 
          interimResults = true,
          continuous = true
        } = options;

        this.recognition.continuous = continuous;
        this.recognition.interimResults = interimResults;
        this.recognition.lang = language;

        this.recognition.onstart = () => {
          console.log('Continuous speech recognition started');
          this.isRecording = true;
          resolve();
        };

        this.recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          this.isRecording = false;
          
          if (event.error === 'not-allowed') {
            reject(new Error('Microphone permission denied. Please allow microphone access in your browser settings.'));
          } else if (event.error === 'audio-capture') {
            reject(new Error('No microphone found. Please check your microphone connection.'));
          } else {
            reject(new Error(`Speech recognition error: ${event.error}`));
          }
        };

        this.recognition.start();

      } catch (error) {
        reject(new Error(`Failed to start recognition: ${error.message}`));
      }
    });
  }

  /**
   * Stop ongoing speech recognition
   */
  stopRecognition(): void {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
      this.isRecording = false;
      console.log('Speech recognition stopped');
    }
  }

  /**
   * Check if recognition is active
   */
  isRecordingActive(): boolean {
    return this.isRecording;
  }

  /**
   * Add event listeners for real-time results
   */
  onResult(callback: (transcript: string, isFinal: boolean) => void): void {
    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript = transcript;
        }
      }

      if (finalTranscript) {
        callback(finalTranscript.trim(), true);
      }
      if (interimTranscript) {
        callback(interimTranscript, false);
      }
    };
  }

  /**
   * Add error event listener
   */
  onError(callback: (error: string) => void): void {
    this.recognition.onerror = (event: any) => {
      callback(event.error);
    };
  }

  /**
   * Process audio blob by playing it and capturing through microphone
   */
  private async processAudioBlob(audio: Blob, recognition: any): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const audioElement = new Audio();
        audioElement.src = URL.createObjectURL(audio);
        
        audioElement.onplay = () => {
          console.log('Audio playback started, starting recognition...');
          recognition.start();
        };

        audioElement.onended = () => {
          console.log('Audio playback ended');
          setTimeout(() => {
            if (this.isRecording) {
              recognition.stop();
            }
            resolve();
          }, 1000);
        };

        audioElement.onerror = () => {
          reject(new Error('Failed to play audio'));
        };

        audioElement.play().catch(reject);

      } catch (error) {
        reject(error);
      }
    });
  }
}

// Legacy function for backward compatibility
export async function speechToText(options: STTOptions = {}): Promise<string> {
  const stt = new SpeechToText();
  return await stt.speechToText(options);
}

export function getSupportedLanguages() {
  // Chrome typically supports these languages
  return [
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'es-ES', label: 'Spanish' },
    { value: 'fr-FR', label: 'French' },
    { value: 'de-DE', label: 'German' },
    { value: 'it-IT', label: 'Italian' },
    { value: 'pt-BR', label: 'Portuguese' },
    { value: 'ru-RU', label: 'Russian' },
    { value: 'ja-JP', label: 'Japanese' },
    { value: 'ko-KR', label: 'Korean' },
    { value: 'zh-CN', label: 'Chinese (Simplified)' },
    { value: 'zh-TW', label: 'Chinese (Traditional)' },
  ];
}

// Check if STT is supported
export function isSTTSupported(): boolean {
  return !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
}

// Request microphone permission
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
}