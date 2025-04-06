import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Volume2, VolumeX, X, Pause, Maximize2 } from "lucide-react";

interface YouTubeEmbedProps {
  videoId: string;
}

export const YouTubeEmbed = ({ videoId }: YouTubeEmbedProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoTitle, setVideoTitle] = useState("YouTube Video");
  const playerRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [volume, setVolume] = useState(1); // Volume state
  const [isClosing, setIsClosing] = useState(false);
  
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&enablejsapi=1&origin=${window.location.origin}&modestbranding=1&rel=0`;
  
  // Fetch video 
  useEffect(() => {
    fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
      .then(res => res.json())
      .then(data => {
        if (data.title) {
          setVideoTitle(data.title);
        }
      })
      .catch(err => console.error('Error fetching video title:', err));
  }, [videoId]);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    try {
      const iframe = playerRef.current;
      if (!iframe || !iframe.contentWindow) return;
      
      // Send pause command to YouTube iframe
      iframe.contentWindow.postMessage(JSON.stringify({ 
        event: 'command',
        func: 'pauseVideo' 
      }), '*');
      
      setIsPlaying(false);
    } catch (err) {
      console.error('Error pausing video:', err);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    try {
      const iframe = playerRef.current;
      if (!iframe || !iframe.contentWindow) return;
      
      iframe.contentWindow.postMessage(JSON.stringify({ 
        event: 'command',
        func: isMuted ? 'unMute' : 'mute'
      }), '*');
    } catch (err) {
      console.error('Error toggling mute:', err);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    try {
      const iframe = playerRef.current;
      if (!iframe || !iframe.contentWindow) return;
      
      iframe.contentWindow.postMessage(JSON.stringify({ 
        event: 'command',
        func: 'setVolume',
        args: [newVolume * 100] 
      }), '*');
    } catch (err) {
      console.error('Error setting volume:', err);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    // Après l'animation de fermeture, réellement fermer la vidéo
    setTimeout(() => {
      setIsPlaying(false);
      setIsClosing(false);
    }, 600); // Durée légèrement plus longue que l'animation
  };

  return (
    <>
      {!isPlaying ? (
        // Thumbnail view
        <div 
          ref={containerRef}
          className={`w-full rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 transition-all duration-300 relative max-w-[370px]`}
        >
          <div className="relative w-full">
            <div className="relative group cursor-pointer" onClick={handlePlay}>
              <motion.img
                src={thumbnailUrl}
                alt={videoTitle}
                className="w-full h-auto rounded-t-lg object-cover"
                style={{ aspectRatio: "16/9" }}
                onLoad={() => setIsLoaded(true)}
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoaded ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/80 transition-all duration-300" />
              
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoaded ? 1 : 0 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="bg-red-600 text-white p-4 rounded-full shadow-xl flex items-center justify-center group-hover:bg-red-700 transition-colors duration-300">
                  <Play className="w-6 h-6" fill="white" />
                </div>
              </motion.div>
              
              <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                <div className="text-white text-sm font-medium line-clamp-1 max-w-[75%]">
                  {videoTitle}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-white dark:bg-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
              <img 
                src="https://www.youtube.com/s/desktop/7c155e84/img/favicon_144x144.png" 
                alt="YouTube" 
                className="w-4 h-4"
              />
              <span className="line-clamp-1 max-w-[220px]">{videoTitle}</span>
            </div>
          </div>
        </div>
      ) : (
        // Playing video view with enhanced smoke animation on exit
        <AnimatePresence mode="wait">
          <motion.div
            key="video-container"
            className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Semi-transparent overlay */}
            <motion.div 
              className="absolute inset-0 bg-black/70 pointer-events-auto"
              onClick={handleClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            
            <AnimatePresence mode="wait">
              {!isClosing ? (
                <motion.div
                  key="video-player"
                  className={`absolute bg-black shadow-lg rounded-lg overflow-hidden pointer-events-auto ${
                    isExpanded ? 'w-5/6 h-5/6 max-w-4xl' : 'w-72 h-52 sm:w-80 sm:h-60'
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    x: position.x,
                    y: position.y,
                    transition: { duration: 0.3 }
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  drag
                  dragMomentum={false}
                  dragConstraints={{ left: -500, right: 500, top: -300, bottom: 300 }}
                  onDragEnd={(_, info) => {
                    setPosition({
                      x: position.x + info.offset.x,
                      y: position.y + info.offset.y
                    });
                  }}
                >
                  {/* YouTube iframe */}
                  <iframe
                    ref={playerRef}
                    src={embedUrl}
                    title={videoTitle}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                  
                  {/* Video title - drag handle */}
                  <div 
                    className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/90 to-transparent text-white text-xs truncate cursor-move"
                  >
                    {videoTitle}
                  </div>
                  
                  {/* Custom video controls */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between bg-gradient-to-t from-black/90 to-transparent hover:opacity-100 transition-opacity duration-200">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={toggleMute} 
                        className="bg-black/40 p-1.5 rounded-full text-white hover:bg-black/60 transition-colors"
                      >
                        {isMuted ? 
                          <VolumeX className="w-3.5 h-3.5" /> : 
                          <Volume2 className="w-3.5 h-3.5" />
                        }
                      </button>
                      
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                        style={{
                          backgroundImage: 'linear-gradient(to right, white, white)',
                          backgroundSize: `${volume * 100}% 100%`,
                          backgroundRepeat: 'no-repeat'
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={handlePause} 
                        className="bg-black/40 p-1.5 rounded-full text-white hover:bg-black/60 transition-colors"
                      >
                        <Pause className="w-3.5 h-3.5" />
                      </button>
                      
                      <button 
                        onClick={toggleExpand} 
                        className="bg-black/40 p-1.5 rounded-full text-white hover:bg-black/60 transition-colors"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      
                      <button 
                        onClick={handleClose}
                        className="bg-black/40 p-1.5 rounded-full text-white hover:bg-black/60 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                // Enhanced smoke effect animation when closing
                <motion.div
                  key="smoke-effect"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="relative"
                >
                  <div className="relative">
                    {/* Image that dissipates like smoke */}
                    <motion.div 
                      className={`relative bg-black rounded-lg overflow-hidden ${
                        isExpanded ? 'w-[500px] h-[300px]' : 'w-72 h-52 sm:w-80 sm:h-60'
                      }`}
                      initial={{ filter: 'blur(0px)' }}
                      animate={{ filter: 'blur(8px)' }}
                      transition={{ duration: 0.5 }}
                    >
                      <img 
                        src={thumbnailUrl}
                        alt={videoTitle}
                        className="w-full h-full object-cover opacity-60"
                      />
                    </motion.div>
                    
                    {/* Dense smoke particles */}
                    {Array.from({ length: 60 }).map((_, index) => {
                      const randomX = Math.random() * 300 - 150;
                      const randomY = Math.random() * -250;
                      const randomDelay = Math.random() * 0.5;
                      const randomSize = 10 + Math.random() * 40;
                      const randomOpacity = 0.3 + Math.random() * 0.5;
                      const randomRotation = Math.random() * 360;
                      const randomBlur = Math.random() * 10;
                      
                      return (
                        <motion.div
                          key={index}
                          className="absolute top-1/2 left-1/2 rounded-full bg-white/10"
                          style={{
                            backdropFilter: "blur(8px)",
                            filter: `blur(${randomBlur}px)`,
                          }}
                          initial={{ 
                            x: 0, 
                            y: 0, 
                            opacity: randomOpacity, 
                            scale: 1,
                            width: randomSize,
                            height: randomSize,
                            rotate: 0,
                          }}
                          animate={{ 
                            x: randomX, 
                            y: randomY, 
                            opacity: 0,
                            scale: 2 + Math.random() * 3,
                            width: randomSize * 2,
                            height: randomSize * 2,
                            rotate: randomRotation,
                          }}
                          transition={{ 
                            duration: 0.5 + Math.random() * 0.5,
                            delay: randomDelay,
                            ease: "easeOut" 
                          }}
                        />
                      );
                    })}
                    
                    {/* Focused light glow that disperses */}
                    <motion.div 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-white/10"
                      style={{
                        boxShadow: "0 0 80px 40px rgba(255, 255, 255, 0.2)",
                        filter: "blur(8px)",
                      }}
                      initial={{ 
                        opacity: 0.7, 
                        scale: 1
                      }}
                      animate={{ 
                        opacity: 0, 
                        scale: 3
                      }}
                      transition={{ duration: 0.7 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
};
