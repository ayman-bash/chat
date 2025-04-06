-- Ajouter les colonnes de questions de sécurité à la table users
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS security_question1 TEXT,
  ADD COLUMN IF NOT EXISTS security_answer1 TEXT,
  ADD COLUMN IF NOT EXISTS security_question2 TEXT,
  ADD COLUMN IF NOT EXISTS security_answer2 TEXT;

-- Ensure the columns exist and allow NULL values if necessary
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS security_question1 TEXT,
  ADD COLUMN IF NOT EXISTS security_answer1 TEXT,
  ADD COLUMN IF NOT EXISTS security_question2 TEXT,
  ADD COLUMN IF NOT EXISTS security_answer2 TEXT;

-- Vérifier si la politique existe avant de la créer
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Users can update their own security questions'
  ) THEN
    CREATE POLICY "Users can update their own security questions" ON public.users
      FOR UPDATE 
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Fonction pour valider les réponses aux questions de sécurité
CREATE OR REPLACE FUNCTION validate_security_answers(
  user_email TEXT,
  answer1 TEXT,
  answer2 TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Récupérer l'utilisateur
  SELECT * INTO user_record FROM users WHERE email = user_email;
  
  -- Vérifier si l'utilisateur existe
  IF user_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier si les réponses sont correctes
  IF user_record.security_answer1 = answer1 AND user_record.security_answer2 = answer2 THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajouter la fonction RPC pour trouver un utilisateur par email de manière insensible à la casse
CREATE OR REPLACE FUNCTION find_user_by_email(user_email TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  security_question1 TEXT,
  security_question2 TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.security_question1, u.security_question2
  FROM users u
  WHERE LOWER(u.email) = LOWER(user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Assurez-vous que les politiques de sécurité permettent cette fonction
GRANT EXECUTE ON FUNCTION find_user_by_email TO authenticated, anon;
