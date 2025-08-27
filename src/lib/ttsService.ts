import { preprocessTextForTTS, splitTextIntoChunks } from './captionGenerator';

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
}

export class TextToSpeechService {
  private static instance: TextToSpeechService;
  private voices: SpeechSynthesisVoice[] = [];
  private isVoicesLoaded = false;

  private constructor() {
    this.loadVoices();
  }

  public static getInstance(): TextToSpeechService {
    if (!TextToSpeechService.instance) {
      TextToSpeechService.instance = new TextToSpeechService();
    }
    return TextToSpeechService.instance;
  }

  private async loadVoices(): Promise<void> {
    return new Promise((resolve) => {
      const loadVoicesHandler = () => {
        this.voices = speechSynthesis.getVoices();
        this.isVoicesLoaded = true;
        resolve();
      };

      // Check if voices are already loaded
      if (speechSynthesis.getVoices().length > 0) {
        loadVoicesHandler();
      } else {
        // Wait for voices to be loaded
        speechSynthesis.onvoiceschanged = loadVoicesHandler;
        // Fallback timeout
        setTimeout(loadVoicesHandler, 1000);
      }
    });
  }

  public async getVoices(): Promise<SpeechSynthesisVoice[]> {
    if (!this.isVoicesLoaded) {
      await this.loadVoices();
    }
    return this.voices;
  }

  public async getBestVoice(): Promise<SpeechSynthesisVoice | null> {
    const voices = await this.getVoices();
    
    // Prefer English voices, then neural/premium voices
    const priorities = [
      (v: SpeechSynthesisVoice) => v.lang.includes('en-US') && v.name.includes('Neural'),
      (v: SpeechSynthesisVoice) => v.lang.includes('en-US') && v.name.includes('Premium'),
      (v: SpeechSynthesisVoice) => v.lang.includes('en-US'),
      (v: SpeechSynthesisVoice) => v.lang.includes('en'),
      (v: SpeechSynthesisVoice) => v.default,
    ];

    for (const priority of priorities) {
      const voice = voices.find(priority);
      if (voice) return voice;
    }

    return voices[0] || null;
  }

  public async generateSpeech(text: string, options: TTSOptions = {}): Promise<Blob> {
    const preprocessedText = preprocessTextForTTS(text);
    const chunks = splitTextIntoChunks(preprocessedText, 300); // Smaller chunks for better control
    
    const audioChunks: Blob[] = [];
    
    for (const chunk of chunks) {
      const audioBlob = await this.synthesizeChunk(chunk, options);
      audioChunks.push(audioBlob);
    }

    // Combine all audio chunks
    return new Blob(audioChunks, { type: 'audio/wav' });
  }

  private async synthesizeChunk(text: string, options: TTSOptions): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        // For web-based TTS, we'll use a different approach since we can't directly record SpeechSynthesis
        // This is a simplified version - in production, you'd want to use a proper TTS API
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate || 0.9;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;
        
        const voice = options.voice || await this.getBestVoice();
        if (voice) {
          utterance.voice = voice;
        }

        // Since we can't directly capture browser TTS audio, we'll create a simple audio buffer
        // In a real implementation, you'd use:
        // 1. A server-side TTS service (Azure Cognitive Services, Google Cloud TTS, etc.)
        // 2. ElevenLabs API for high-quality voices
        // 3. Or record the browser's speech synthesis (requires more complex setup)

        const duration = this.estimateChunkDuration(text);
        const audioBuffer = this.createSimpleAudioBuffer(duration);
        
        resolve(new Blob([audioBuffer], { type: 'audio/wav' }));

      } catch (error) {
        reject(error);
      }
    });
  }

  private estimateChunkDuration(text: string): number {
    // Rough estimation: average speaking rate is 150-160 WPM
    const words = text.split(' ').length;
    const wordsPerMinute = 150;
    return Math.max((words / wordsPerMinute) * 60, 1); // Minimum 1 second
  }

  private createSimpleAudioBuffer(duration: number): ArrayBuffer {
    // Create a simple WAV file buffer
    // This is a placeholder - in production, use actual TTS audio
    const sampleRate = 44100;
    const samples = duration * sampleRate;
    const buffer = new ArrayBuffer(44 + samples * 2); // WAV header + 16-bit samples
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);
    
    // Generate simple audio data (silence for now)
    for (let i = 0; i < samples; i++) {
      view.setInt16(44 + i * 2, 0, true);
    }
    
    return buffer;
  }

  // Method to integrate with ElevenLabs API (when you're ready to use it)
  public async generateSpeechWithElevenLabs(
    text: string, 
    voiceId: string = 'ErXwobaYiN019PkySvjV', // Default voice ID
    apiKey: string
  ): Promise<Blob> {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: preprocessTextForTTS(text),
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    return await response.blob();
  }
}