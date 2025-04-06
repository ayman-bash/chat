import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Timeline } from '../components/Timeline';
import { TextGenerateEffect } from '../components/ui/TextGenerateEffect';
import { MessageSquare, X, Send, Sparkles, Shield, Zap } from 'lucide-react';
import { getGeminiResponse } from '../services/gemini';
import BackgroundAudio from '../components/BackgroundAudio';
import { LinkPreview } from '../components/ui/link-preview'; // Import the LinkPreview component
import { CardStack } from '../components/ui/card-stack'; // Replace InfiniteMovingCards with CardStack
import { saveComment, getComments } from '../services/comments'; // Import the saveComment and getComments functions
import commentsData from '../data/comments.json'; // Re-add the import for fallback data

// Define a unified comment type that includes all possible fields
type Comment = {
  id: number;
  content: string;
  user?: string;
  name?: string;
  designation?: string;
  rating?: number;
};

const Home = () => {
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Array<{ content: string; isUser: boolean }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [username, setUsername] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false); // New state for animation
  const [showCommentForm, setShowCommentForm] = useState(true); // Toggle comment form visibility

  useEffect(() => {
    // Load comments from the backend API
    const fetchComments = async () => {
      try {
        const fetchedComments = await getComments();
        
        // Normalize the comment data structure
        const normalizedComments = fetchedComments.length > 0 
          ? fetchedComments.map((comment: any) => ({
              id: comment.id || Date.now(),
              content: comment.content,
              user: comment.user || comment.name || 'Anonymous',
              name: comment.name || comment.user || 'Anonymous',
              designation: comment.designation || 'User',
              rating: comment.rating || Math.floor(Math.random() * 3) + 3
            }))
          : commentsData.map((comment) => ({
              id: comment.id,
              content: comment.content,
              user: comment.name,
              name: comment.name,
              designation: comment.designation,
              rating: comment.rating
            }));
        
        setComments(normalizedComments);
      } catch (error) {
        console.error('Error fetching comments:', error);
        
        // Normalize fallback data
        const normalizedFallback = commentsData.map(comment => ({
          id: comment.id,
          content: comment.content,
          user: comment.name,
          name: comment.name,
          designation: comment.designation,
          rating: comment.rating
        }));
        
        setComments(normalizedFallback);
      }
    };

    fetchComments();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setMessages(prev => [...prev, { content: userMessage, isUser: true }]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await getGeminiResponse(userMessage, []);
      if (response) {
        setMessages(prev => [...prev, { content: response, isUser: false }]);
      }
    } catch (error) {
      console.error('Error getting Gemini response:', error);
      setMessages(prev => [...prev, { 
        content: "Désolé, je ne peux pas répondre pour le moment. Veuillez réessayer plus tard.", 
        isUser: false 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeatureDoubleClick = (index: number) => {
    setActiveFeature(index);
    // Reset the animation after it completes
    setTimeout(() => setActiveFeature(null), 1500);
  };

  const handleAddComment = async () => {
    if (newComment.trim() && username.trim()) {
      const newCommentObj = { 
        id: Date.now(), 
        content: newComment.trim(), 
        user: username.trim(),
        name: username.trim(),
        designation: 'User',
        rating: Math.floor(Math.random() * 3) + 3
      };
      
      setComments((prev) => [...prev, newCommentObj]);
      setNewComment('');
      setUsername('');
      setShowSuccessAnimation(true); // Trigger animation
      setShowCommentForm(false); // Hide comment form

      // Save the comment using the backend API
      try {
        await saveComment({
          content: newCommentObj.content,
          user: newCommentObj.user
        });
      } catch (error) {
        console.error('Error saving comment:', error);
      }

      setTimeout(() => setShowSuccessAnimation(false), 3000); // Hide animation after 3 seconds
    }
  };

  const commentHeading = showCommentForm
    ? 'Laissez un commentaire'
    : 'Nos chers commentaires utilisateurs';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section with Background Beams */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        
        {/* Animated Background Beams */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 animate-pulse" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
        </div>
        
        <motion.div className="relative z-10 text-center px-4" style={{ opacity }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <Sparkles className="w-16 h-16 mx-auto text-purple-500 animate-pulse" />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
            <TextGenerateEffect
              words="Bienvenue sur ChatFrar"
              className="text-white"
              duration={2}
              filter={true}
            />
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            La plateforme de chat nouvelle generation
          </p>
          <div className="flex gap-4 justify-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/login"
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
              >
                Se connecter
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/signup"
                className="px-8 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20"
              >
                S'inscrire
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Section with Spotlight Effect */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-900/10 to-black" />
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
            Fonctionnalités
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                onDoubleClick={() => handleFeatureDoubleClick(index)}
                className="group relative bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800 hover:border-purple-500/50 transition-all duration-300 cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Animation that appears on double-click */}
                <AnimatePresence>
                  {activeFeature === index && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ 
                        scale: [1, 1.2, 1], 
                        opacity: [0.7, 1, 0],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 1.2,
                        times: [0, 0.5, 1]
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-xl z-0 flex items-center justify-center"
                    >
                      <div className="text-white font-bold text-4xl opacity-50">
                        {index === 0 ? "⚡" : index === 1 ? "🔒" : "✨"}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="relative z-10">
                  <div className="text-purple-500 mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      

      {/* Timeline Section with Parallax Effect */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-900/10 to-black" />
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
            Notre Histoire
          </h2>
          <Timeline />
        </div>
      </section>

      {/* Comment Section */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-900/10 to-black" />
        <div className="max-w-6xl mx-auto relative z-10">
          <AnimatePresence>
            {showSuccessAnimation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5 }}
                className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-lg shadow-lg text-center z-20"
              >
                <h3 className="text-2xl font-bold">Merci pour votre commentaire !</h3>
                <p className="text-sm">Votre avis compte beaucoup pour nous.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
            {commentHeading}
          </h2>

          <div className="flex flex-col items-center gap-6">
            {showCommentForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
                className="w-full max-w-2xl"
              >
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Votre nom"
                  className="w-full p-3 mb-4 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-white/50"
                />
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Écrivez votre commentaire..."
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-white/50"
                  rows={4}
                />
                <button
                  onClick={handleAddComment}
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
                >
                  Ajouter un commentaire
                </button>
              </motion.div>
            )}

            {/* CardStack Comments Section */}
            <div className="flex justify-center mt-12 mb-4"> {/* Increased mt-8 to mt-12 */}
              {comments.length > 0 ? (
                <CardStack
                  items={comments.map((comment) => ({
                    id: comment.id,
                    name: comment.name || comment.user || 'Anonymous',
                    designation: comment.designation || 'User',
                    content: <p>{comment.content}</p>,
                    rating: comment.rating
                  }))}
                  offset={15}
                  scaleFactor={0.05}
                />
              ) : (
                <p className="text-gray-400">Aucun commentaire pour le moment.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      

      
      {/* AI Support Chat with Glassmorphism */}
      <div className="fixed bottom-6 right-6 z-50">
        {!showChat ? (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowChat(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-full shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-lg shadow-xl w-96 h-[500px] flex flex-col border border-white/20"
          >
            {/* Chat Header */}
            <div className="p-4 border-b border-white/20 flex items-center justify-between bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="font-semibold">Support AI</span>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="hover:bg-white/20 p-1 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 backdrop-blur-sm ${
                      message.isUser
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : 'bg-white/10 text-white border border-white/20'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-white rounded-lg p-3 border border-white/20">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input support Gemini agent */}
            <div className="p-4 border-t border-white/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Écrivez votre message..."
                  className="flex-1 p-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-white/50"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-2 rounded-lg hover:shadow-purple-500/25 transition-all duration-300"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer with Gradient Border */}
      <footer className="relative bg-black py-12">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-black" />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
                ChatFrar
              </h3>
              <p className="text-gray-400">
                La plateforme de chat nouvelle génération pour une communication efficace et sécurisée.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Liens Rapides</h4>
              <ul className="space-y-2">
                <li>
                  <LinkPreview 
                    url="https://chatversion-final-c10137aea-vensenzooos-projects.vercel.app/?_vercel_share=CTpOMSgFioBxRzRl5DpxgpnevTYuBhvx/" 
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                      Accueil
                    </Link>
                  </LinkPreview>
                </li>
                <li>
                  <LinkPreview 
                    url="https://chatversion-final-c10137aea-vensenzooos-projects.vercel.app/?_vercel_share=CTpOMSgFioBxRzRl5DpxgpnevTYuBhvx/login" 
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                      Connexion
                    </Link>
                  </LinkPreview>
                </li>
                <li>
                  <LinkPreview 
                    url="https://chatversion-final-c10137aea-vensenzooos-projects.vercel.app/?_vercel_share=CTpOMSgFioBxRzRl5DpxgpnevTYuBhvx/signup" 
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Link to="/signup" className="text-gray-400 hover:text-white transition-colors">
                      Inscription
                    </Link>
                  </LinkPreview>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Ressources</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      setShowChat(true); // Open Gemini support chat
                    }}
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Support
                  </a>
                </li>
                <li>
                  <LinkPreview 
                    url="https://developer.mozilla.org/fr/docs/Web"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Documentation
                  </LinkPreview>
                </li>
                <li>
                  <LinkPreview 
                    url="https://github.com/features/copilot" 
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    API
                  </LinkPreview>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Technologies</h4>
              <ul className="space-y-2">
                <li>
                  <LinkPreview 
                    url="https://react.dev" 
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    React
                  </LinkPreview>
                </li>
                <li>
                  <LinkPreview 
                    url="https://www.framer.com/motion/" 
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Framer Motion
                  </LinkPreview>
                </li>
                <li>
                  <LinkPreview 
                    url="https://supabase.com/" 
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Supabase
                  </LinkPreview>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-gray-400">
            <p>
              &copy; {new Date().getFullYear()} ChatFrar. Tous droits réservés.{' '}
              <button
               
                className="text-purple-500 hover:underline"
              >
                
              </button>
            </p>
          </div>
        </div>
      </footer> {/* Fix missing closing tag */}
      <BackgroundAudio />
      {/* Add a global style for smooth animations */}
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        
        * {
          animation-duration: 0.7s !important;
          transition-duration: 0.7s !important;
        }
      `}</style>
    </div>
  );
};

const features = [
  {
    icon: <Sparkles className="w-8 h-8" />,
    title: 'Chat en Temps Réel',
    description: 'Communiquez instantanément avec vos amis et collègues.',
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: 'Sécurité Maximale',
    description: 'Vos conversations sont protégées par un chiffrement de bout en bout.',
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: 'Interface Moderne',
    description: 'Une expérience utilisateur intuitive et agréable.',
  },
];

export default Home;