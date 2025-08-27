import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import VideoPlayerWithCaptions from './VideoPlayerWithCaptions';
import { TextToSpeechService } from '../lib/ttsService';
import { generateCaptions, estimateAudioDuration, type CaptionSegment } from '../lib/captionGenerator';
import { extractTextFromPDF } from '../lib/pdfExtractor';

const PDFToSpeechApp: React.FC = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoData, setVideoData] = useState<{
    audioUrl: string;
    captions: CaptionSegment[];
  } | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Background video URL - you can change this to your desired video
  const BACKGROUND_VIDEO_URL = '/background-video.mp4'; // Place your video in the public folder

  const generateSpeechAndCaptions = async (text: string): Promise<{ audioUrl: string; captions: CaptionSegment[] }> => {
    const ttsService = TextToSpeechService.getInstance();
    
    // Generate speech audio
    const audioBlob = await ttsService.generateSpeech(text, {
      rate: 0.9,
      pitch: 1.0,
      volume: 1.0
    });
    
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Estimate duration and generate captions
    const estimatedDuration = estimateAudioDuration(text);
    const captions = generateCaptions(text, estimatedDuration, 6); // 6 words per caption segment
    
    return { audioUrl, captions };
  };

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Extract text from PDF using the new extraction method
      const text = await extractTextFromPDF(file);
      
      if (!text.trim()) {
        toast({
          title: "Empty PDF",
          description: "The PDF appears to be empty or contains no readable text.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Step 2: Generate speech audio and captions
      const { audioUrl, captions } = await generateSpeechAndCaptions(text);

      setVideoData({ audioUrl, captions });
      
      toast({
        title: "Video created successfully!",
        description: "Your PDF has been converted to a captioned video.",
      });

    } catch (error) {
      console.error('Error processing PDF:', error);
      const errorMessage = error instanceof Error ? error.message : "There was an error creating your video. Please try again.";
      toast({
        title: "Processing failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const resetApp = () => {
    setVideoData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (videoData) {
    return (
      <VideoPlayerWithCaptions
        backgroundVideoUrl={BACKGROUND_VIDEO_URL}
        audioUrl={videoData.audioUrl}
        captions={videoData.captions}
        onReset={resetApp}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all duration-200
            ${isDragActive 
              ? 'border-primary bg-upload-hover' 
              : 'border-upload-border hover:border-primary hover:bg-upload-hover'
            }
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
        >
          <input 
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            className="hidden"
            disabled={isProcessing}
          />
          
          <div className="flex flex-col items-center gap-4">
            {isProcessing ? (
              <Loader2 className="h-12 w-12 text-loading animate-spin" />
            ) : (
              <div className="relative">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <FileText className="h-6 w-6 text-primary absolute -bottom-1 -right-1 bg-background rounded" />
              </div>
            )}
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">
                {isProcessing ? 'Creating Video...' : 'Add PDF'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isProcessing 
                  ? 'Converting your PDF to a captioned video'
                  : 'Drop your PDF here or click to browse'
                }
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PDFToSpeechApp;