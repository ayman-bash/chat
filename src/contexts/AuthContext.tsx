import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const { id, email, user_metadata } = session.user;
        setUser({
          id,
          email: email || '',
          username: user_metadata?.username || '',
          avatar: `https://api.dicebear.com/7.x/avatars/svg?seed=${encodeURIComponent(user_metadata?.username || email || '')}`
        });
      }
      setLoading(false);
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const { id, email, user_metadata } = session.user;
        setUser({
          id,
          email: email || '',
          username: user_metadata?.username || '',
          avatar: `https://api.dicebear.com/7.x/avatars/svg?seed=${encodeURIComponent(user_metadata?.username || email || '')}`
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      console.error("Error during sign-in:", err);
      throw err;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user is logged in');
    
    try {
      // Mettre à jour les métadonnées d'authentification si username est modifié
      if (updates.username) {
        const { error: authError } = await supabase.auth.updateUser({
          data: { username: updates.username }
        });
        
        if (authError) throw authError;
      }
      
      // Séparer les champs de sécurité des autres champs pour éviter les erreurs de schéma
      const securityFields = ['security_question1', 'security_answer1', 'security_question2', 'security_answer2'];
      const baseUpdates: Partial<User> = { ...updates };
      const securityUpdates: Partial<User> = {};
      
      // Extraire les champs de sécurité dans un objet séparé
      securityFields.forEach(field => {
        if (field in baseUpdates) {
          // Type-safe way to access and assign properties
          const value = baseUpdates[field as keyof User];
          if (value !== undefined) {
            securityUpdates[field as keyof User] = value;
            delete baseUpdates[field as keyof User];
          }
        }
      });
      
      // Mettre à jour d'abord les champs de base
      const { error: baseError } = await supabase
        .from('users')
        .update(baseUpdates)
        .eq('id', user.id);
      
      if (baseError) throw baseError;
      
      // Essayer de mettre à jour les champs de sécurité séparément
      if (Object.keys(securityUpdates).length > 0) {
        try {
          const { error: securityError } = await supabase
            .from('users')
            .update(securityUpdates)
            .eq('id', user.id);
          
          if (securityError) {
            console.warn('Impossible de mettre à jour les champs de sécurité:', securityError);
            // Ne pas échouer complètement si seuls les champs de sécurité posent problème
          }
        } catch (securityErr) {
          console.warn('Exception lors de la mise à jour des champs de sécurité:', securityErr);
        }
      }
      
      // Mettre à jour l'état local uniquement après succès des requêtes
      setUser(prev => prev ? { ...prev, ...baseUpdates, ...securityUpdates } : null);
      
      // Récupérer à nouveau les données utilisateur pour s'assurer de la cohérence
      const { data: refreshedUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (fetchError) {
        console.warn('Could not refresh user data after update:', fetchError);
      } else if (refreshedUser) {
        // Utiliser les données rafraîchies pour l'état local
        setUser(current => ({
          ...current!,
          ...refreshedUser
        }));
      }
      
      console.log('User updated successfully:', baseUpdates);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}