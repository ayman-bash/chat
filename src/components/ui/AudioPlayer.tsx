import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Play, Pause } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  isOwnMessage?: boolean;
}

export const AudioPlayer = ({ src, isOwnMessage = false }: AudioPlayerProps) => {
  // Use refs for values that shouldn't trigger re-renders
  const audioRef = useRef<HTMLAudioElement>(null);
  const previousSrcRef = useRef<string>(src);
  
  // State that affects rendering
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  // Remove unused isLoaded state and use loading state instead
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Use useMemo to prevent recalculation of derived values
  const formattedCurrentTime = useMemo(() => formatTime(currentTime), [currentTime]);
  const formattedDuration = useMemo(() => formatTime(duration), [duration]);
  
  // Log only when the source changes, not on every render
  useEffect(() => {
    if (previousSrcRef.current !== src) {
      console.log('AudioPlayer source changed:', src);
      previousSrcRef.current = src;
      
      // Reset states when source changes
      setIsPlaying(false);
      setError(false);
      setLoading(true);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [src]);

  // Audio event handlers with useCallback to prevent recreation on each render
  const handleLoadedData = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    console.log('Audio loaded successfully, duration:', audio.duration);
    setDuration(audio.duration);
    setLoading(false);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
  }, []);

  const handleAudioEnd = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleError = useCallback((e: Event) => {
    console.error("Error loading audio:", src, e);
    setError(true);
    setLoading(false);
  }, [src]);

  // Set up event listeners only once or when source changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Add event listeners
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleAudioEnd);
    audio.addEventListener('error', handleError);

    // Cleanup function
    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleAudioEnd);
      audio.removeEventListener('error', handleError);
    };
  }, [src, handleLoadedData, handleTimeUpdate, handleAudioEnd, handleError]);

  // Memoized toggle play function
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => {
        console.error("Error playing audio:", err);
        setError(true);
      });
    }
    setIsPlaying(prev => !prev);
  }, [isPlaying]);

  // Memoized slider change handler
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const value = parseFloat(e.target.value);
    audio.currentTime = value;
    setCurrentTime(value);
  }, []);

  // If there's an error loading the audio
  if (error) {
    return (
      <div className={`flex items-center p-3 rounded-lg ${
        isOwnMessage ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'
      }`}>
        <div className="flex flex-col">
          <p className="text-sm">Unable to load audio message</p>
          <a 
            href={src} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`text-xs ${isOwnMessage ? 'text-indigo-200' : 'text-indigo-500'} underline`}
          >
            Open in new window
          </a>
        </div>
      </div>
    );
  }

  // If the audio is still loading
  if (loading) {
    return (
      <div className={`flex p-3 rounded-lg items-center space-x-3 ${
        isOwnMessage ? 'bg-indigo-600' : 'bg-white dark:bg-gray-800'
      }`}>
        <div className={`animate-pulse h-10 w-10 rounded-full ${
          isOwnMessage ? 'bg-indigo-700' : 'bg-indigo-100 dark:bg-gray-700'
        }`}></div>
        <div className="flex-1 space-y-2">
          <div className={`animate-pulse h-2 rounded ${
            isOwnMessage ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-600'
          }`}></div>
          <div className="flex justify-between">
            <div className={`animate-pulse h-2 w-8 rounded ${
              isOwnMessage ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-600'
            }`}></div>
            <div className={`animate-pulse h-2 w-8 rounded ${
              isOwnMessage ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-600'
            }`}></div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate progress percentage for the slider background
  const progressPercentage = useMemo(() => {
    return duration > 0 ? (currentTime / duration) * 100 : 0;
  }, [currentTime, duration]);

  // Memoize the gradient style for the slider to prevent recalculation
  const sliderStyle = useMemo(() => ({
    backgroundSize: `${progressPercentage}% 100%`,
    backgroundRepeat: 'no-repeat',
    backgroundImage: isOwnMessage
      ? 'linear-gradient(to right, rgba(255,255,255,0.7), rgba(255,255,255,0.7))'
      : 'linear-gradient(to right, rgb(99 102 241), rgb(99 102 241))'
  }), [progressPercentage, isOwnMessage]);

  return (
    <div className={`flex flex-col w-full max-w-[300px] rounded-xl overflow-hidden ${
      isOwnMessage ? 'bg-indigo-600' : 'bg-white dark:bg-gray-800'
    } shadow-md`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <div className="p-3 flex items-center gap-3">
        <button 
          onClick={togglePlay}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isOwnMessage 
              ? 'bg-indigo-700 hover:bg-indigo-800' 
              : 'bg-indigo-100 dark:bg-gray-700 hover:bg-indigo-200 dark:hover:bg-gray-600'
          } transition-colors`}
        >
          {isPlaying ? (
            <Pause className={`w-5 h-5 ${isOwnMessage ? 'text-white' : 'text-indigo-600 dark:text-white'}`} />
          ) : (
            <Play className={`w-5 h-5 ${isOwnMessage ? 'text-white' : 'text-indigo-600 dark:text-white'}`} />
          )}
        </button>
        
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSliderChange}
              className={`w-full h-1.5 rounded-full appearance-none bg-gradient-to-r ${
                isOwnMessage
                  ? 'from-indigo-300/30 to-indigo-300/30'
                  : 'from-gray-200 to-gray-200 dark:from-gray-600 dark:to-gray-600'
              } cursor-pointer`}
              style={sliderStyle}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className={isOwnMessage ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}>
              {formattedCurrentTime}
            </span>
            <span className={isOwnMessage ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}>
              {formattedDuration}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function (moved outside component to prevent recreation)
function formatTime(time: number) {
  if (isNaN(time)) return "0:00";
  
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
