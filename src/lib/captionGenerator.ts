export interface CaptionSegment {
    start: number;
    end: number;
    text: string;
  }
  
  /**
   * Generates caption segments from text with timing information
   * @param text The full text to be converted to captions
   * @param totalDuration Total duration of the audio in seconds
   * @param wordsPerSegment Number of words per caption segment (default: 8)
   * @returns Array of caption segments with timing
   */
  export function generateCaptions(
    text: string, 
    totalDuration: number, 
    wordsPerSegment: number = 8
  ): CaptionSegment[] {
    // Clean and split the text into words
    const words = text
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(word => word.length > 0);
  
    if (words.length === 0) return [];
  
    const segments: CaptionSegment[] = [];
    const totalWords = words.length;
    
    // Calculate timing per word
    const timePerWord = totalDuration / totalWords;
    
    // Group words into segments
    for (let i = 0; i < words.length; i += wordsPerSegment) {
      const segmentWords = words.slice(i, i + wordsPerSegment);
      const startTime = i * timePerWord;
      const endTime = Math.min((i + segmentWords.length) * timePerWord, totalDuration);
      
      segments.push({
        start: startTime,
        end: endTime,
        text: segmentWords.join(' ')
      });
    }
  
    return segments;
  }
  
  /**
   * Estimates audio duration based on text length and reading speed
   * @param text The text to analyze
   * @param wordsPerMinute Average reading speed (default: 150 WPM)
   * @returns Estimated duration in seconds
   */
  export function estimateAudioDuration(text: string, wordsPerMinute: number = 150): number {
    const words = text.split(' ').filter(word => word.trim().length > 0);
    const minutes = words.length / wordsPerMinute;
    return Math.max(minutes * 60, 10); // Minimum 10 seconds
  }
  
  /**
   * Preprocesses PDF text for better TTS pronunciation
   * @param text Raw text from PDF
   * @returns Cleaned text optimized for speech synthesis
   */
  export function preprocessTextForTTS(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Add pauses for periods
      .replace(/\./g, '. ')
      // Add pauses for commas
      .replace(/,/g, ', ')
      // Handle abbreviations (add periods if missing)
      .replace(/\b([A-Z]{2,})\b/g, (match) => {
        return match.split('').join('.') + '.';
      })
      // Remove page numbers and headers/footers (basic patterns)
      .replace(/^Page \d+.*$/gm, '')
      .replace(/^\d+\s*$/gm, '')
      // Clean up any double spaces
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Splits long text into manageable chunks for TTS processing
   * @param text The text to split
   * @param maxChunkLength Maximum characters per chunk (default: 500)
   * @returns Array of text chunks
   */
  export function splitTextIntoChunks(text: string, maxChunkLength: number = 500): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';
  
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (trimmedSentence.length === 0) continue;
  
      // If adding this sentence would exceed the limit, start a new chunk
      if (currentChunk.length + trimmedSentence.length > maxChunkLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmedSentence + '.';
      } else {
        currentChunk += (currentChunk.length > 0 ? ' ' : '') + trimmedSentence + '.';
      }
    }
  
    // Add the last chunk if it has content
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
  
    return chunks.length > 0 ? chunks : [text]; // Fallback to original text if no chunks created
  }