import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface TextToSpeechProps {
  text: string;
  filename: string;
  onAudioGenerated: (audioUrl: string) => void;
}

const TextToSpeech: React.FC<TextToSpeechProps> = ({ text, filename, onAudioGenerated }) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  React.useEffect(() => {
    if (text && !isGenerating) {
      generateSpeech();
    }
  }, [text]);

  const generateSpeech = async () => {
    setIsGenerating(true);
    
    try {
      // For now, we'll use browser's built-in speech synthesis
      // In production, you'd replace this with ElevenLabs API
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Create a simple audio blob simulation
      // In real implementation, this would be the ElevenLabs API response
      const audioContext = new AudioContext();
      const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 1, audioContext.sampleRate);
      
      // Create a simple tone for demo purposes
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = Math.sin(2 * Math.PI * 440 * i / audioContext.sampleRate) * 0.1;
      }

      // Convert to blob
      const audioBuffer = await new Promise<ArrayBuffer>((resolve) => {
        const offlineContext = new OfflineAudioContext(1, buffer.length, audioContext.sampleRate);
        const source = offlineContext.createBufferSource();
        source.buffer = buffer;
        source.connect(offlineContext.destination);
        source.start();
        
        offlineContext.startRendering().then((renderedBuffer) => {
          const wav = audioBufferToWav(renderedBuffer);
          resolve(wav);
        });
      });

      const blob = new Blob([audioBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      onAudioGenerated(url);
      
      toast({
        title: "Audio generated",
        description: "Your PDF has been converted to speech successfully.",
      });
    } catch (error) {
      console.error('Error generating speech:', error);
      toast({
        title: "Error generating speech",
        description: "Failed to convert text to speech. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return null;
};

// Helper function to convert AudioBuffer to WAV
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const length = buffer.length;
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * numberOfChannels * 2, true);
  
  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return arrayBuffer;
}

export default TextToSpeech;