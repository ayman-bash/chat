import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, KeyRound, CornerDownLeft, HelpCircle, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { validateSecurityAnswers, resetPassword, supabase } from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // États pour le processus de récupération de mot de passe
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStep, setRecoveryStep] = useState(1);
  const [securityQuestion1, setSecurityQuestion1] = useState('');
  const [securityAnswer1, setSecurityAnswer1] = useState('');
  const [securityQuestion2, setSecurityQuestion2] = useState('');
  const [securityAnswer2, setSecurityAnswer2] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const handleForgotPassword = async () => {
    if (!recoveryEmail) {
      setAlert({ type: 'error', message: 'Veuillez entrer votre email' });
      return;
    }

    setIsLoading(true);
    try {
      // Normalize the email to lowercase for consistent matching
      const normalizedEmail = recoveryEmail.trim().toLowerCase();

      // Log the email being searched for debugging purposes
      console.log(`Searching for user with email: ${normalizedEmail}`);

      // Query the users table for the email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, security_question1, security_question2, email')
        .eq('email', normalizedEmail) // Use exact match for email
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user from Supabase:', userError);
        throw new Error("Erreur lors de la recherche de l'utilisateur");
      }

      if (!userData) {
        console.warn(`No user found with email: ${normalizedEmail}`);
        throw new Error("Aucun compte trouvé avec cet email. Vérifiez que vous utilisez l'adresse correcte ou inscrivez-vous.");
      }

      // Log the user data for debugging
      console.log('User found:', userData);

      // Set security questions and email for the next step
      setSecurityQuestion1(userData.security_question1 || '');
      setSecurityQuestion2(userData.security_question2 || '');
      setRecoveryEmail(userData.email); // Ensure the email is stored correctly

      // Validate that security questions are configured
      if (!userData.security_question1 || !userData.security_question2) {
        throw new Error("Cet utilisateur n'a pas configuré ses questions de sécurité. Veuillez contacter l'assistance.");
      }

      // Proceed to the next step
      setRecoveryStep(2);
      setAlert(null);
    } catch (error: any) {
      // Log the error message and stack trace for debugging
      console.error('Erreur récupération:', error.message, error.stack);

      // Provide a user-friendly error message
      setAlert({ type: 'error', message: error.message || "Erreur lors de la récupération des informations." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitSecurityAnswers = async () => {
    if (!securityAnswer1 || !securityAnswer2) {
      setAlert({ type: 'error', message: 'Veuillez répondre aux deux questions de sécurité' });
      return;
    }

    setIsLoading(true);
    try {
      const isValid = await validateSecurityAnswers(recoveryEmail, securityAnswer1, securityAnswer2);
      
      if (!isValid) {
        throw new Error("Les réponses fournies ne correspondent pas à nos enregistrements.");
      }
      
      // Passer à l'étape de création d'un nouveau mot de passe
      setRecoveryStep(3);
      setAlert(null);
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || "Erreur lors de la vérification des réponses." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setAlert({ type: 'error', message: 'Veuillez remplir tous les champs' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setAlert({ type: 'error', message: 'Les mots de passe ne correspondent pas' });
      return;
    }

    if (newPassword.length < 8) {
      setAlert({ type: 'error', message: 'Le mot de passe doit contenir au moins 8 caractères' });
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(recoveryEmail, newPassword);
      
      // Réinitialiser les champs et afficher un message de succès
      setAlert({ type: 'success', message: 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter avec votre nouveau mot de passe.' });
      
      // Retourner à l'écran de connexion après 3 secondes
      setTimeout(() => {
        setShowForgotPassword(false);
        setRecoveryStep(1);
        setRecoveryEmail('');
        setSecurityQuestion1('');
        setSecurityQuestion2('');
        setSecurityAnswer1('');
        setSecurityAnswer2('');
        setNewPassword('');
        setConfirmPassword('');
      }, 3000);
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || "Erreur lors de la réinitialisation du mot de passe." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      navigate('/chat');
    } catch (error: any) {
      console.error('Error signing in:', error);
      setAlert({ type: 'error', message: error.message || 'Échec de la connexion.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-gray-800/60 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-gray-700">
        {!showForgotPassword ? (
          // Formulaire de connexion normal
          <>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white">Connexion</h2>
              <p className="mt-2 text-gray-400">
                Entrez vos informations pour accéder à votre compte
              </p>
            </div>

            <AnimatePresence mode="wait">
              {alert && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`p-4 mb-6 rounded-lg flex items-center gap-3 ${
                    alert.type === "error"
                      ? "bg-red-500/10 text-red-400 border border-red-500/10"
                      : "bg-green-500/10 text-green-400 border border-green-500/10"
                  }`}
                >
                  {alert.type === "error" ? (
                    <X size={18} className="shrink-0" />
                  ) : (
                    <Check size={18} className="shrink-0" />
                  )}
                  <p className="text-sm">{alert.message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 w-full p-3 bg-gray-700/50 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 w-full p-3 bg-gray-700/50 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg shadow-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-r-2 border-white"></div>
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <span>Se connecter</span>
                )}
              </motion.button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-400 hover:text-blue-300 focus:outline-none"
                >
                  Mot de passe oublié ?
                </button>
                <Link to="/signup" className="text-sm text-blue-400 hover:text-blue-300">
                  Créer un compte
                </Link>
              </div>
            </form>
          </>
        ) : (
          // Interface de récupération de mot de passe
          <>
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setRecoveryStep(1);
                  setAlert(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <CornerDownLeft size={20} />
              </button>
              <h2 className="text-2xl font-bold text-white">Récupération de compte</h2>
            </div>

            <AnimatePresence mode="wait">
              {alert && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`p-4 mb-6 rounded-lg flex items-center gap-3 ${
                    alert.type === "error"
                      ? "bg-red-500/10 text-red-400 border border-red-500/10"
                      : "bg-green-500/10 text-green-400 border border-green-500/10"
                  }`}
                >
                  {alert.type === "error" ? (
                    <X size={18} className="shrink-0" />
                  ) : (
                    <Check size={18} className="shrink-0" />
                  )}
                  <p className="text-sm">{alert.message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Barre de progression */}
            <div className="relative mb-8">
              <div className="flex justify-between mb-1">
                <span className={`text-xs ${recoveryStep >= 1 ? 'text-blue-400' : 'text-gray-500'}`}>Email</span>
                <span className={`text-xs ${recoveryStep >= 2 ? 'text-blue-400' : 'text-gray-500'}`}>Vérification</span>
                <span className={`text-xs ${recoveryStep >= 3 ? 'text-blue-400' : 'text-gray-500'}`}>Nouveau mot de passe</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(recoveryStep / 3) * 100}%` }}
                ></div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {recoveryStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="recoveryEmail" className="block text-sm font-medium text-gray-300 mb-1">
                        Votre adresse email
                      </label>
                      <div className="relative">
                        <input
                          id="recoveryEmail"
                          type="email"
                          required
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          className="pl-10 w-full p-3 bg-gray-700/50 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                      <div className="flex items-start gap-3">
                        <HelpCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-300">
                          Entrez l'adresse email associée à votre compte. Nous vous demanderons ensuite de répondre à vos questions de sécurité.
                        </p>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleForgotPassword}
                      disabled={isLoading || !recoveryEmail}
                      className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg shadow-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-r-2 border-white"></div>
                          <span>Vérification...</span>
                        </>
                      ) : (
                        <span>Continuer</span>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {recoveryStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Question de sécurité #1
                      </label>
                      <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600 text-white mb-2">
                        {securityQuestion1}
                      </div>
                      <input
                        type="text"
                        value={securityAnswer1}
                        onChange={(e) => setSecurityAnswer1(e.target.value)}
                        placeholder="Votre réponse"
                        className="w-full p-3 bg-gray-700/50 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Question de sécurité #2
                      </label>
                      <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600 text-white mb-2">
                        {securityQuestion2}
                      </div>
                      <input
                        type="text"
                        value={securityAnswer2}
                        onChange={(e) => setSecurityAnswer2(e.target.value)}
                        placeholder="Votre réponse"
                        className="w-full p-3 bg-gray-700/50 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                      <div className="flex items-start gap-3">
                        <KeyRound className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-300">
                          Répondez aux questions que vous avez configurées lors de la création de votre compte.
                          Les réponses sont sensibles à la casse.
                        </p>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmitSecurityAnswers}
                      disabled={isLoading || !securityAnswer1 || !securityAnswer2}
                      className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg shadow-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-r-2 border-white"></div>
                          <span>Vérification...</span>
                        </>
                      ) : (
                        <span>Vérifier mes réponses</span>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {recoveryStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">
                        Nouveau mot de passe
                      </label>
                      <div className="relative">
                        <input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pl-10 w-full p-3 bg-gray-700/50 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <button
                          type="button"
                          onClick={toggleNewPasswordVisibility}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        >
                          {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                        Confirmez le mot de passe
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          type={showNewPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10 w-full p-3 bg-gray-700/50 rounded-lg border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleResetPassword}
                      disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                      className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg shadow-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-r-2 border-white"></div>
                          <span>Réinitialisation...</span>
                        </>
                      ) : (
                        <span>Réinitialiser mon mot de passe</span>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;