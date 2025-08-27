import React, { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface CaptionSegment {
  start: number;
  end: number;
  text: string;
}

interface VideoPlayerWithCaptionsProps {
  backgroundVideoUrl: string;
  audioUrl: string;
  captions: CaptionSegment[];
  onReset?: () => void;
}

const VideoPlayerWithCaptions: React.FC<VideoPlayerWithCaptionsProps> = ({
  backgroundVideoUrl,
  audioUrl,
  captions,
  onReset
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentCaption, setCurrentCaption] = useState<string>('');

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;

    if (!video || !audio) return;

    const updateTime = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      
      // Update video time to match audio
      if (Math.abs(video.currentTime - time) > 0.5) {
        video.currentTime = time;
      }

      // Update current caption
      const caption = captions.find(cap => time >= cap.start && time <= cap.end);
      setCurrentCaption(caption ? caption.text : '');
    };

    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      video.pause();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [captions]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    const audio = audioRef.current;

    if (!video || !audio) return;

    if (isPlaying) {
      video.pause();
      audio.pause();
    } else {
      video.play();
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    const audio = audioRef.current;
    
    if (audio) {
      audio.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm mx-auto space-y-4">
        {/* Video Container - 9:16 aspect ratio */}
        <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden relative">
          {/* Background Video */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            loop
            muted
            playsInline
          >
            <source src={backgroundVideoUrl} type="video/mp4" />
          </video>

          {/* Audio Element */}
          <audio ref={audioRef} src={audioUrl} />

          {/* Captions Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="bg-black bg-opacity-80 rounded-lg p-3 min-h-[60px] flex items-center justify-center">
              <p className="text-white text-center text-sm leading-relaxed font-medium">
                {currentCaption || 'Captions will appear here...'}
              </p>
            </div>
          </div>

          {/* Play/Pause Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlayPause}
              className="bg-black bg-opacity-50 rounded-full p-4 text-white hover:bg-opacity-70 transition-all"
            >
              {isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </button>
          </div>
        </div>

        {/* Controls */}
        <Card className="p-4">
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="p-1">
                {isMuted ? (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Reset Button */}
            {onReset && (
              <Button onClick={onReset} variant="outline" className="w-full">
                Create Another Video
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VideoPlayerWithCaptions;