// React is automatically imported by the JSX transform
import { Message, User } from '../types';
import { Avatar } from './Avatar';
import { formatDistanceToNow } from '../utils/date';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react'; // Removed unused Music import
import { useState, useEffect } from 'react';
import { editMessage, deleteMessage } from '../services/api';
import { ChatLinkPreview } from './ui/chat-link-preview';
import { YouTubeEmbed } from './ui/YoutubeEmbed';
import { findUrls, isPreviewCommand, extractYoutubeVideoId, isYoutubeUrl, isYoutubePreviewCommand } from '../utils/linkUtils';
import { AudioPlayer } from './ui/AudioPlayer';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessageProps {
  message: Message;
  sender: User;
  isOwnMessage: boolean;
  isGroupAdmin?: boolean;
  onMessageUpdate: () => void;
}

// Améliorer la liste des émojis animés avec plus de variantes pour une meilleure détection
const animatedEmojis = [
  { emoji: '💯', animationClass: 'animate-burst', text: 'HOT' },
  { emoji: '🔥', animationClass: 'animate-fire', text: 'HOT' },
  { emoji: '🚀', animationClass: 'animate-rocket', text: 'HOT' },
  { emoji: '✨', animationClass: 'animate-sparkle', text: 'HOT' },
  { emoji: '🎉', animationClass: 'animate-confetti', text: 'HOT' },
  // Ajouter plus d'émojis populaires
  { emoji: '👍', animationClass: 'animate-burst', text: 'COOL' },
  { emoji: '❤️', animationClass: 'animate-burst', text: 'LOVE' },
  { emoji: '😂', animationClass: 'animate-burst', text: 'LOL' },
  { emoji: '👏', animationClass: 'animate-burst', text: 'BRAVO' },
];

export function ChatMessage({ 
  message, 
  sender, 
  isOwnMessage, 
  isGroupAdmin,
  onMessageUpdate 
}: ChatMessageProps) {
  // Ensure message and sender are valid before rendering
  if (!message || !message.content || !sender || !sender.id) {
    return null; // Do not render anything if data is incomplete
  }

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showEmojiAnimation, setShowEmojiAnimation] = useState(null as string | null);
  const [animationKey, setAnimationKey] = useState(0); // Ajouter un état pour forcer la réanimation

  // Check for preview command
  const { isPreview, url: previewCommandUrl } = isPreviewCommand(message.content);
  
  // Check for YouTube preview command
  const { isYoutubePreview, url: youtubePreviewUrl } = isYoutubePreviewCommand(message.content);
  
  // Extract URLs from message content (for regular messages)
  const urls = !isPreview && !isYoutubePreview ? findUrls(message.content) : [];
  const hasUrl = urls.length > 0 || isPreview || isYoutubePreview;
  
  // Check if any URL is a YouTube URL
  const youtubeUrl = youtubePreviewUrl || 
                     urls.find(url => isYoutubeUrl(url)) || 
                     (isPreview && previewCommandUrl && isYoutubeUrl(previewCommandUrl) 
                       ? previewCommandUrl 
                       : null);
  
  // Extract YouTube video ID if present
  const youtubeVideoId = youtubeUrl ? extractYoutubeVideoId(youtubeUrl) : null;

  const handleEdit = async () => {
    try {
      await editMessage(message.id, editContent);
      setIsEditing(false);
      onMessageUpdate();
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await deleteMessage(message.id);
      onMessageUpdate();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Améliorer la détection et le déclenchement des animations d'emoji
  useEffect(() => {
    // Réinitialiser l'animation à chaque nouveau message ou changement de contenu
    setShowEmojiAnimation(null);
    
    // Vérifier si le message contient un emoji animable
    const emojiContent = message.content || '';
    const foundEmoji = animatedEmojis.find(item => emojiContent.includes(item.emoji));

    if (foundEmoji) {
      console.log(`Emoji trouvé dans le message: ${foundEmoji.emoji}`);
      
      // Incrémenter la clé d'animation pour forcer le rendu
      setAnimationKey(prev => prev + 1);
      
      // Déclencher l'animation
      setShowEmojiAnimation(foundEmoji.emoji);
      
      // Réinitialiser après la fin de l'animation
      const timer = setTimeout(() => {
        setShowEmojiAnimation(null);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [message.id, message.content]); // Dépendre de l'ID du message et de son contenu

  if (message.is_deleted) {
    return (
      <div className="text-sm text-gray-400 italic">
        This message has been deleted
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      <Avatar user={sender} size="sm" />
      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : ''} max-w-[70%]`}>
        <div className="relative group">
          {(isOwnMessage || isGroupAdmin) && (
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-black/10"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          )}
          
          {showMenu && (
            <div className="absolute top-8 right-0 bg-white rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
              {isOwnMessage && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 w-full text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
              {(isOwnMessage || isGroupAdmin) && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 w-full text-sm text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          )}

          {isEditing ? (
            <div className="flex items-end gap-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="input resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  className="btn btn-primary"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // Only show message content if it's not a preview command, not a YouTube preview command,
            // and not just a YouTube URL, and not just an audio message
            !isPreview && !isYoutubePreview && 
            (!youtubeVideoId || message.content.replace(youtubeUrl || '', '').trim() !== '') &&
            (!message.image || !isAudioFile(message.image) || message.content.trim() !== '') && (
              <div className={`chat-bubble ${
                isOwnMessage ? 'chat-bubble-own' : 'chat-bubble-other'
              }`}>
                {message.content}
                {message.edited_at && (
                  <span className="text-xs opacity-70"> (edited)</span>
                )}
              </div>
            )
          )}
        </div>
        
        {/* YouTube Embed - show for both regular YouTube links and @yt command */}
        {youtubeVideoId && !isEditing && (
          <div className="mt-2">
            <YouTubeEmbed videoId={youtubeVideoId} />
          </div>
        )}
        
        {/* Regular URL Preview (only show if not a YouTube URL) */}
        {hasUrl && !youtubeVideoId && !isEditing && (
          <ChatLinkPreview url={isPreview ? previewCommandUrl! : urls[0]} />
        )}
        
        {message.image && isImageFile(message.image) && (
          <div className="mt-2 rounded-xl overflow-hidden">
            <img
              src={message.image.startsWith('http') 
                ? message.image 
                : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/media-files/${message.image}`
              }
              alt="Message attachment" 
              className="max-w-full h-auto max-h-[300px] object-contain shadow-md"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}
        
        {/* Discord-style Audio Player */}
        {message.image && isAudioFile(message.image) && (
          <div className="mt-2">
            <AudioPlayer 
              src={message.image.startsWith('http') || message.image.startsWith('blob:')
                ? message.image 
                : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/uploads/${message.image}`
              } 
              isOwnMessage={isOwnMessage} 
            />
          </div>
        )}
        
        <span className="text-xs text-gray-500 mt-2">
          {message.created_at ? formatDistanceToNow(new Date(message.created_at)) : ''}
        </span>
      </div>
      {/* Animation d'emoji améliorée */}
      <AnimatePresence mode="wait">
        {showEmojiAnimation && (
          <motion.div
            key={`emoji-animation-${animationKey}`} // Utiliser la clé dynamique
            className="absolute inset-0 pointer-events-none flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative grid grid-cols-5 gap-4">
              {animatedEmojis.map((item, index) => {
                if (item.emoji === showEmojiAnimation) {
                  return (
                    <motion.div
                      key={`${item.emoji}-${index}-${animationKey}`} // Utiliser la clé dynamique
                      className="relative flex flex-col items-center justify-center pointer-events-none"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <motion.span
                        className={`text-6xl ${item.animationClass}`}
                        style={{ zIndex: 50 }}
                      >
                        {item.emoji}
                      </motion.span>
                      {item.text && (
                        <motion.span
                          className="absolute top-[-1rem] left-1/2 -translate-x-1/2 text-2xl font-bold text-red-500 animate-pulse"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                        >
                          {item.text}
                        </motion.span>
                      )}
                    </motion.div>
                  );
                }
                return null;
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Improve file type detection
function isImageFile(filename: string): boolean {
  if (!filename) return false;
  
  // Check if it's a URL that directly ends with an image extension
  if (filename.startsWith('http')) {
    const urlParts = filename.split('?')[0].split('.');
    const ext = urlParts[urlParts.length - 1].toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  }
  
  // Otherwise check the file extension
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
}

function isAudioFile(filename: string): boolean {
  if (!filename) return false;
  
  // Check if it's a URL that directly ends with an audio extension
  if (filename.startsWith('http')) {
    const urlParts = filename.split('?')[0].split('.');
    const ext = urlParts[urlParts.length - 1].toLowerCase();
    return ['mp3', 'wav', 'ogg', 'm4a', 'webm'].includes(ext);
  }
  
  // For blob URLs created by audio recording
  if (filename.startsWith('blob:')) {
    return true;
  }
  
  // Otherwise check the file extension
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['mp3', 'wav', 'ogg', 'm4a', 'webm'].includes(ext || '');
}