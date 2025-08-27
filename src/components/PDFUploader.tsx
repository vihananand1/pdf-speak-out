import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PDFUploaderProps {
  onFileProcessed: (text: string, filename: string) => void;
  isProcessing: boolean;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({ onFileProcessed, isProcessing }) => {
  const { toast } = useToast();
  const [isDragActive, setIsDragActive] = useState(false);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Dynamic import to avoid issues with pdf-parse
      const pdfParse = (await import('pdf-parse')).default;
      
      const data = await pdfParse(arrayBuffer);
      return data.text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    try {
      const text = await extractTextFromPDF(file);
      if (!text.trim()) {
        toast({
          title: "Empty PDF",
          description: "The PDF appears to be empty or contains no readable text.",
          variant: "destructive",
        });
        return;
      }
      onFileProcessed(text, file.name);
    } catch (error) {
      toast({
        title: "Error processing PDF",
        description: "Failed to extract text from the PDF file.",
        variant: "destructive",
      });
    }
  }, [onFileProcessed, toast]);

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onDrop([files[0]]);
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
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onDrop(files);
    }
  };

  return (
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
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input 
          id="file-input"
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
              {isProcessing ? 'Processing PDF...' : 'Upload PDF'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isProcessing 
                ? 'Extracting text and converting to speech'
                : 'Drop your PDF here or click to browse'
              }
            </p>
          </div>
          
          {!isProcessing && (
            <Button variant="outline" disabled={isProcessing}>
              Choose File
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PDFUploader;