import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { User } from '../types';
import { Save, Eye, EyeOff, LogOut, ChevronDown, InfoIcon } from 'lucide-react';
import { updateSecurityQuestions } from '../services/api'; // Ensure this import exists

const Profile = () => {
  const { user, signOut, updateUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Define isLoading state
  
  // Nouvelles états pour les questions de sécurité
  const [securityQuestion1, setSecurityQuestion1] = useState(user?.security_question1 || '');
  const [securityAnswer1, setSecurityAnswer1] = useState('');
  const [securityQuestion2, setSecurityQuestion2] = useState(user?.security_question2 || '');
  const [securityAnswer2, setSecurityAnswer2] = useState('');
  const [showSecuritySection, setShowSecuritySection] = useState(false);

  // Liste de questions de sécurité prédéfinies
  const securityQuestions = [
    "Quel est le nom de votre premier animal de compagnie ?",
    "Dans quelle ville êtes-vous né(e) ?",
    "Quel est le nom de jeune fille de votre mère ?",
    "Quelle était votre matière préférée à l'école ?",
    "Quel est le prénom de votre meilleur(e) ami(e) d'enfance ?",
    "Quelle est votre équipe sportive favorite ?",
    "Quel était le modèle de votre première voiture ?",
    "Quel est votre film préféré ?",
    "Quel est votre plat préféré ?",
    "Quelle est votre destination de voyage préférée ?"
  ];

  useEffect(() => {
    // Sync state with user prop changes
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setSecurityQuestion1(user.security_question1 || '');
      setSecurityQuestion2(user.security_question2 || '');
    }
  }, [user]);

  // Check if user has made changes
  useEffect(() => {
    if (user) {
      setIsDirty(
        username !== user.username ||
        email !== user.email ||
        password.length > 0 ||
        securityQuestion1 !== user.security_question1 ||
        securityQuestion2 !== user.security_question2 ||
        securityAnswer1.length > 0 ||
        securityAnswer2.length > 0
      );
    }
  }, [username, email, password, user, securityQuestion1, securityQuestion2, securityAnswer1, securityAnswer2]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSave = async () => {
    if (!updateUser || !isDirty) return;

    setIsSaving(true);
    try {
      const updates: Partial<User> = {};
      
      // Only include fields that have changed
      if (username !== user?.username) updates.username = username;
      if (email !== user?.email) updates.email = email;
      
      // Vérifier si les colonnes de sécurité existent et sont différentes
      try {
        // Include security questions if they've changed
        if (securityQuestion1 !== user?.security_question1) {
          updates.security_question1 = securityQuestion1;
        }
        
        if (securityQuestion2 !== user?.security_question2) {
          updates.security_question2 = securityQuestion2;
        }
        
        // Only include answers if they've been modified
        if (securityAnswer1) {
          updates.security_answer1 = securityAnswer1;
        }
        
        if (securityAnswer2) {
          updates.security_answer2 = securityAnswer2;
        }
      } catch (securityError) {
        // Les colonnes de sécurité n'existent peut-être pas encore
        console.warn('Impossible de mettre à jour les questions de sécurité:', securityError);
        setAlert({ 
          type: 'warning', 
          message: 'Veuillez contacter l\'administrateur pour activer la récupération de compte'
        });
      }
      
      await updateUser(updates);
      
      // Clear sensitive fields after successful update
      setPassword('');
      setSecurityAnswer1('');
      setSecurityAnswer2('');
      setIsDirty(false);
      setAlert({ type: 'success', message: 'Profil mis à jour avec succès !' });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      // Handle schema error specifically
      if (error.code === 'PGRST204' && error.message.includes('security_answer')) {
        setAlert({ 
          type: 'error', 
          message: 'Les questions de sécurité ne sont pas encore disponibles. Mise à jour du profil de base uniquement.' 
        });
      } else {
        setAlert({ type: 'error', message: error.message || 'Échec de la mise à jour du profil.' });
      }
    } finally {
      setIsSaving(false);
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleSaveSecurityQuestions = async () => {
    if (!securityQuestion1 || !securityAnswer1 || !securityQuestion2 || !securityAnswer2) {
      setAlert({ type: 'error', message: 'Veuillez remplir toutes les questions de sécurité et leurs réponses.' });
      return;
    }

    if (!user) {
      setAlert({ type: 'error', message: "Utilisateur non connecté." });
      return;
    }

    setIsLoading(true);
    try {
      await updateSecurityQuestions(
        user.id, // Ensure user.id exists
        securityQuestion1,
        securityAnswer1,
        securityQuestion2,
        securityAnswer2
      );

      setAlert({ type: 'success', message: 'Questions de sécurité mises à jour avec succès.' });
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || "Erreur lors de la mise à jour des questions de sécurité." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="w-full max-w-lg bg-gray-800/80 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-gray-700">
        <h2 className="text-3xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          Mon Profil
        </h2>

        {/* Alert Section */}
        {alert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-4 p-4 rounded-lg text-center ${
              alert.type === 'success'
                ? 'bg-green-500/10 text-green-400 border border-green-400'
                : alert.type === 'error'
                ? 'bg-red-500/10 text-red-400 border border-red-400'
                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-400'
            }`}
          >
            {alert.message}
          </motion.div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-gray-300 mb-1">
              Nom d'utilisateur
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-gray-700/50 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-700/50 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-gray-300 mb-1">
              Mot de passe (laisser vide pour ne pas modifier)
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-gray-700/50 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          {/* Bouton pour basculer l'affichage des questions de sécurité */}
          <div>
            <button
              onClick={() => setShowSecuritySection(!showSecuritySection)}
              className="w-full p-3 bg-gray-700/50 rounded-lg border border-gray-600 text-white focus:outline-none hover:bg-gray-700 transition-colors flex items-center justify-between"
            >
              <span>Questions de sécurité (récupération de compte)</span>
              <ChevronDown 
                className={`w-5 h-5 transition-transform ${showSecuritySection ? 'rotate-180' : ''}`} 
              />
            </button>
          </div>
          
          {/* Section des questions de sécurité - visible uniquement si showSecuritySection est vrai */}
          {showSecuritySection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 mt-2 pt-4 border-t border-gray-700"
            >
              <div>
                <label htmlFor="securityQuestion1" className="block text-gray-300 mb-1">
                  Question de sécurité #1
                </label>
                <select
                  id="securityQuestion1"
                  value={securityQuestion1}
                  onChange={(e) => setSecurityQuestion1(e.target.value)}
                  className="w-full p-3 bg-gray-700/50 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Sélectionner une question</option>
                  {securityQuestions.map((question, index) => (
                    <option key={`q1-${index}`} value={question}>
                      {question}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="securityAnswer1" className="block text-gray-300 mb-1">
                  Réponse #1 {user?.security_answer1 ? "(déjà définie)" : ""}
                </label>
                <input
                  id="securityAnswer1"
                  type="text"
                  value={securityAnswer1}
                  onChange={(e) => setSecurityAnswer1(e.target.value)}
                  placeholder={user?.security_answer1 ? "Laisser vide pour conserver la réponse actuelle" : ""}
                  className="w-full p-3 bg-gray-700/50 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label htmlFor="securityQuestion2" className="block text-gray-300 mb-1">
                  Question de sécurité #2
                </label>
                <select
                  id="securityQuestion2"
                  value={securityQuestion2}
                  onChange={(e) => setSecurityQuestion2(e.target.value)}
                  className="w-full p-3 bg-gray-700/50 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Sélectionner une question</option>
                  {securityQuestions.map((question, index) => (
                    <option key={`q2-${index}`} value={question}>
                      {question}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="securityAnswer2" className="block text-gray-300 mb-1">
                  Réponse #2 {user?.security_answer2 ? "(déjà définie)" : ""}
                </label>
                <input
                  id="securityAnswer2"
                  type="text"
                  value={securityAnswer2}
                  onChange={(e) => setSecurityAnswer2(e.target.value)}
                  placeholder={user?.security_answer2 ? "Laisser vide pour conserver la réponse actuelle" : ""}
                  className="w-full p-3 bg-gray-700/50 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div className="p-3 bg-indigo-900/30 rounded-lg">
                <p className="text-sm text-indigo-200">
                  <InfoIcon className="w-4 h-4 inline-block mr-1" />
                  Ces questions vous permettront de récupérer votre compte en cas d'oubli de mot de passe.
                  Assurez-vous de choisir des réponses dont vous vous souviendrez.
                </p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveSecurityQuestions}
                disabled={isLoading}
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200"
              >
                <Save size={18} />
                {isLoading ? 'Enregistrement...' : 'Enregistrer les questions de sécurité'}
              </motion.button>
            </motion.div>
          )}
        </div>
        
        <div className="mt-6 flex justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg ${
              isDirty
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            } transition-all duration-200`}
          >
            <Save size={18} />
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/chat')}
            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-200"
          >
            Retour
          </motion.button>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200"
        >
          <LogOut size={18} />
          Déconnexion
        </motion.button>
      </div>
    </div>
  );
};

export default Profile;
