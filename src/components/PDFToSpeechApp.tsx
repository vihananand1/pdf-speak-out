import React, { useState } from 'react';
import PDFUploader from './PDFUploader';
import AudioPlayer from './AudioPlayer';
import TextToSpeech from './TextToSpeech';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PDFToSpeechApp: React.FC = () => {
  const [extractedText, setExtractedText] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileProcessed = (text: string, fileName: string) => {
    setExtractedText(text);
    setFilename(fileName);
    setIsProcessing(true);
  };

  const handleAudioGenerated = (url: string) => {
    setAudioUrl(url);
    setIsProcessing(false);
  };

  const handleReset = () => {
    setExtractedText('');
    setFilename('');
    setAudioUrl('');
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">PDF to Speech</h1>
          <p className="text-muted-foreground">
            Upload a PDF and convert it to audio
          </p>
        </div>

        {!audioUrl ? (
          <>
            <PDFUploader 
              onFileProcessed={handleFileProcessed}
              isProcessing={isProcessing}
            />
            
            {extractedText && (
              <TextToSpeech
                text={extractedText}
                filename={filename}
                onAudioGenerated={handleAudioGenerated}
              />
            )}
          </>
        ) : (
          <div className="space-y-4">
            <AudioPlayer audioUrl={audioUrl} filename={filename} />
            
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Upload Another PDF
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFToSpeechApp;