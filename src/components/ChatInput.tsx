import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, Smile, Mic, HelpCircle, StopCircle, Gamepad } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { emitTyping } from '../services/socket';
import { MemoryGame } from './MemoryGame'; // Import the MemoryGame component

interface ChatInputProps {
  onSendMessage: (content: string, image?: File | null) => void;
  onTyping: () => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  selectedChat: any;
  user: any;
  onStartGame?: () => void; // Nouvelle prop pour démarrer le jeu
}

export function ChatInput({ onSendMessage, onTyping, textareaRef: externalRef, selectedChat, user, onStartGame }: ChatInputProps) {
  // State variables
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [showMemoryGame, setShowMemoryGame] = useState(false); // New state for Memory Game popup
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaReference = externalRef || internalTextareaRef;
  const formRef = useRef<HTMLFormElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaReference.current) {
      textareaReference.current.style.height = 'auto';
      textareaReference.current.style.height = `${Math.min(textareaReference.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendMessage('', file);
    }
  };

  // Modified insertCommand function to use @yt prefix for YouTube
  const insertCommand = (command: string) => {
    if (command === 'youtube') {
      setMessage('@yt '); // Use @yt prefix instead of a sample URL
    } else if (command === 'game') {
      setMessage('@game '); // Add @game command
    } else {
      setMessage(command + ' ');
    }
    
    setShowHelpMenu(false);
    if (textareaReference.current) {
      textareaReference.current.focus();
    }
  };

  // Modified Help Command Detection - check immediately on input change
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);
    
    // Déclencher l'événement de frappe à chaque changement
    // L'optimisation debounce est gérée dans emitTyping
    if (onTyping) {
      onTyping();
    }
    
    // Emit typing event to socket server if we have a selected chat
    if (selectedChat && user) {
      emitTyping(selectedChat.id, user.id);
    }
    
    // Check for help command
    if (newValue.trim() === '/help') {
      console.log('Help command detected!');
      setShowHelpMenu(true);
    } else {
      setShowHelpMenu(false);
    }
  };

  // Prevent form submission when typing /help
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && message.trim() === '/help') {
      e.preventDefault();
    }
  };

  // Start audio recording
  const startRecording = async () => {
    try {
      // Reset previous recording data
      setRecordingTime(0);
      audioChunksRef.current = [];
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Create audio blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // Create audio URL for playback
        const audioURL = URL.createObjectURL(audioBlob);
        setAudioURL(audioURL);
        
        // Stop all tracks in the stream to release the microphone
        stream.getTracks().forEach(track => track.stop());
        
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check your browser permissions.');
    }
  };

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Cancel recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Clear recording data
    setIsRecording(false);
    setAudioBlob(null);
    setAudioURL(null);
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Send recorded audio
  const sendRecordedAudio = () => {
    if (audioBlob) {
      try {
        // Convert blob to file
        const file = new File([audioBlob], `audio_${Date.now()}.webm`, { 
          type: 'audio/webm' 
        });
        
        // Show loading indicator or feedback
        // You could add a state variable for this
        console.log('Sending audio recording...');
        
        // Send the audio file
        onSendMessage('', file);
        
        // Reset recording state
        setAudioBlob(null);
        setAudioURL(null);
      } catch (error) {
        console.error('Error sending audio:', error);
        alert('Failed to send audio recording. Please try again.');
      }
    }
  };

  // Format recording time (MM:SS)
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      // Stop recording if in progress
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      // Clear any URLs to prevent memory leaks
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [audioURL]);

  const handleRecordingButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Cette fonction a été intégrée directement dans handleSubmit et n'est plus nécessaire

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // Detect the @game command
      if (message.trim() === '@game') {
        if (onStartGame) {
          onStartGame(); // Trigger the game start process
        }
        setMessage(''); // Clear the input field
        return;
      }

      // Detect the @solo command
      if (message.trim() === '@solo') {
        setShowMemoryGame(true); // Open the Memory Game popup
        setMessage(''); // Clear the input field
        return;
      }

      // Handle other messages
      onSendMessage(message.trim());
      setMessage('');
      if (textareaReference.current) {
        textareaReference.current.style.height = 'auto';
      }
    }
  }, [message, onSendMessage, onStartGame, textareaReference]);

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="w-full relative">
        <motion.div 
          className="relative rounded-xl p-3"
          initial={false}
          animate={{
            background: isFocused 
              ? 'linear-gradient(45deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))'
              : 'linear-gradient(45deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.8))',
            borderColor: isFocused ? 'rgba(99, 102, 241, 0.5)' : 'rgba(30, 41, 59, 0.5)',
            boxShadow: isFocused 
              ? '0 0 20px rgba(99, 102, 241, 0.2), 0 0 40px rgba(168, 85, 247, 0.1)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Effet de bordure animée */}
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            <motion.div
              className="absolute inset-0"
              animate={{
                background: isFocused
                  ? 'linear-gradient(45deg, #6366f1, #a855f7, #6366f1)'
                  : 'linear-gradient(45deg, #1e293b, #0f172a)',
              }}
              transition={{ duration: 0.3 }}
            />
            <div className="absolute inset-[1px] rounded-[11px] bg-slate-950/90" />
          </div>

          {/* Contenu */}
          <div className="relative">
            {/* Barre d'outils supérieure */}
            <div className="flex items-center gap-2 px-2 mb-2">
              <motion.button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <Paperclip className="w-5 h-5 text-slate-400" />
              </motion.button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*"
              />
              <motion.button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <Smile className="w-5 h-5 text-slate-400" />
              </motion.button>
              <motion.button
                type="button"
                onClick={handleRecordingButtonClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-lg transition-colors ${
                  isRecording 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                    : 'hover:bg-white/5 text-slate-400'
                }`}
              >
                {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </motion.button>
              <div className="text-xs text-slate-400 ml-auto">
                Type <span className="text-indigo-400 font-mono">/help</span> for commands
              </div>
            </div>

            {/* Zone de texte avec animation */}
            <div className="relative flex items-end">
              <textarea
                ref={textareaReference}
                value={message}
                onChange={handleMessageChange} // S'assurer que cette fonction est appelée
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Écrivez votre message..."
                className="w-full bg-transparent border-none focus:outline-none resize-none text-slate-100 placeholder-slate-500 p-2 min-h-[40px] max-h-[120px] pr-12 font-medium text-base leading-relaxed"
                // Remove rows if it is not required
                // rows={1}
              />
              <motion.div
                initial={false}
                animate={{
                  scale: message.trim() ? 1 : 0.8,
                  opacity: message.trim() ? 1 : 0.5,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute right-2 bottom-2"
              >
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className={`p-2.5 rounded-lg transition-all ${
                    message.trim()
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </motion.div>
            </div>

            {/* Indicateur d'enregistrement */}
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2 border border-red-500/20"
                >
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  Enregistrement...
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Audio Recording Controls */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3 border border-red-500/20 shadow-lg backdrop-blur-sm"
            >
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              <span className="font-medium">{formatTime(recordingTime)}</span>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={cancelRecording}
                  className="px-3 py-1 bg-gray-800/50 hover:bg-gray-800/70 rounded-md text-xs text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={stopRecording}
                  className="px-3 py-1 bg-red-500/70 hover:bg-red-500/90 rounded-md text-xs text-white transition-colors"
                >
                  Stop
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audio Preview Controls */}
        <AnimatePresence>
          {audioURL && !isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-24 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-lg px-4 py-3 rounded-lg flex items-center gap-3 border border-white/20 shadow-lg w-[90%] max-w-md"
            >
              <audio src={audioURL || undefined} controls className="w-full h-8" />
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    setAudioBlob(null);
                    setAudioURL(null);
                  }}
                  className="px-3 py-1 bg-gray-800/50 hover:bg-gray-800/70 rounded-md text-xs text-white transition-colors"
                >
                  Discard
                </button>
                <button 
                  type="button"
                  onClick={sendRecordedAudio}
                  className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md text-xs text-white transition-colors"
                >
                  Send
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sélecteur d'emoji avec animation */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-0 mb-2 bg-slate-950/95 rounded-lg border border-slate-800/50 p-4 shadow-xl"
            >
              <div className="grid grid-cols-8 gap-2">
                {['😊', '😂', '❤️', '👍', '🎉', '🌟', '💫', '✨', '😍', '😎', '🔥', '🤩', 
      '😭', '😡', '😅', '😉', '🙌', '💖', '👀', '💪', '👏', '😢', '😜', '🤯', 
      '🥳', '😇', '💔', '😤', '👋', '😏', '🤔', '🤗', '😈', '🎶', '💀', '🤡', 
      '💩', '🤑', '🤬', '😵', '😋', '🥰', '🤨', '😶', '😴', '💤', '😒', '🤷', 
      '🥺', '🤦', '🤝', '💯', '🚀', '🎯', '🫶', '🖤', '🧡', '💛', '💚', '💙', 
      '💜', '🤎', '🤍', '🙈', '🙉', '🙊'].map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setMessage(prev => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors text-2xl"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help Menu - Improved positioning and z-index */}
        <AnimatePresence>
          {showHelpMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-900/90 to-purple-900/90 backdrop-blur-md rounded-lg border border-indigo-500/20 p-4 shadow-xl max-w-md w-[90%] z-50"
            >
              <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-indigo-500/20">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-indigo-400" />
                  <h3 className="font-semibold text-white">Available Commands</h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowHelpMenu(false)}
                  className="text-gray-300 hover:text-white"
                >
                  &times;
                </button>
              </div>
              <div className="space-y-3">
                <div 
                  className="p-2 rounded hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => insertCommand('@prev')}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                      @
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-white">@prev &lt;URL&gt;</p>
                      <p className="text-xs text-gray-300">Show only link preview without text</p>
                    </div>
                  </div>
                </div>

                <div 
                  className="p-2 rounded hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => insertCommand('@gemini')}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                      @
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-white">@gemini &lt;message&gt;</p>
                      <p className="text-xs text-gray-300">Ask the AI assistant for help</p>
                    </div>
                  </div>
                </div>

                <div 
                  className="p-2 rounded hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => insertCommand('youtube')}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                      YT
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-white">@yt &lt;YouTube URL&gt;</p>
                      <p className="text-xs text-gray-300">Share YouTube links to play videos directly in chat</p>
                    </div>
                  </div>
                </div>

                {/* Nouvelle commande pour jouer au Tic Tac Toe */}
                <div 
                  className="p-2 rounded hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => insertCommand('game')}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                      <Gamepad className="w-5 h-5" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-white">@game</p>
                      <p className="text-xs text-gray-300">Start a Tic Tac Toe game (disponible uniquement en messages privés)</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Memory Game Popup */}
      {showMemoryGame && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 relative w-[90%] max-w-2xl h-[90%]">
            <button
              onClick={() => setShowMemoryGame(false)} // Close the popup
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
            <MemoryGame onClose={() => setShowMemoryGame(false)} />
          </div>
        </div>
      )}
    </>
  );
}