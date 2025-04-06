import { createClient } from '@supabase/supabase-js';
import { Message } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function signUp(email: string, password: string, username: string) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Failed to create user');

  // Create user profile
  const { error: profileError } = await supabase.from('users').upsert([{
      id: authData.user?.id,
      username,
      email,
      avatar: `https://api.dicebear.com/7.x/avatars/svg?seed=${encodeURIComponent(username)}`,
    }]);

  if (profileError) throw profileError;

  return authData;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    if (error.message === 'Invalid login credentials') {
      throw new Error('Invalid email or password');
    }
    throw error;
  }
  
  return data;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;

  if (!data) {
    // Create profile if it doesn't exist
    const { data: newProfile, error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        username: user.user_metadata.username || user.email?.split('@')[0],
        avatar: `https://api.dicebear.com/7.x/avatars/svg?seed=${encodeURIComponent(user.email || '')}`
      })
      .select()
      .single();
    
    if (error) throw error;
    return newProfile;
  }
  
  return data;
}

export async function getRecentChats() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .rpc('get_recent_chats', { user_id: user.id });
  
  if (error) throw error;
  return data || [];
}

export async function getUnreadCounts() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('unread_messages')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw error;
  return data;
}

export async function resetUnreadCount(senderId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .rpc('reset_unread_count', {
      p_user_id: user.id,
      p_sender_id: senderId
    });

  if (error) throw error;
}

export async function searchUsers(query: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('username', `%${query}%`)
    .limit(10);

  if (error) throw error;
  return data;
}

export async function createGroup(name: string, memberIds: string[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Remove duplicates and creator from memberIds
  const uniqueMembers = Array.from(new Set(memberIds)).filter(id => id !== user.id);
  
  // Start a transaction using RPC
  const { data: group, error: groupError } = await supabase
    .rpc('create_group', {
      group_name: name,
      creator_id: user.id,
      member_ids: [user.id, ...uniqueMembers]
    });
  
  if (groupError) throw groupError;
  return group;
}

export async function getGroups() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      members:group_members!inner(
        user:users!inner(*)
      )`
    )
    .eq('group_members.user_id', user.id);

  if (error) throw error;
  return data || [];
}

export async function addGroupMember(groupId: string, memberId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .rpc('add_group_member', {
      group_id: groupId,
      member_id: memberId,
      admin_id: user.id
    });

  if (error) throw error;
  return data;
}

export async function removeGroupMember(groupId: string, memberId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .rpc('remove_group_member', {
      group_id: groupId,
      member_id: memberId,
      admin_id: user.id
    });

  if (error) throw error;
  return data;
}

export async function promoteToAdmin(groupId: string, memberId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .rpc('promote_to_admin', {
      group_id: groupId,
      member_id: memberId,
      admin_id: user.id
    });

  if (error) throw error;
  return data;
}

export async function banGroupMember(groupId: string, memberId: string, reason?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .rpc('ban_group_member', {
      group_id: groupId,
      member_id: memberId,
      admin_id: user.id,
      ban_reason: reason
    });

  if (error) throw error;
  return data;
}

export async function unbanGroupMember(groupId: string, memberId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .rpc('unban_group_member', {
      group_id: groupId,
      member_id: memberId,
      admin_id: user.id
    });

  if (error) throw error;
  return data;
}

export async function getBannedMembers(groupId: string) {
  const { data, error } = await supabase
    .from('group_bans')
    .select(`
      *,
      user:users!user_id(*),
      banned_by:users!banned_by(*)
    `)
    .eq('group_id', groupId);

  if (error) throw error;
  return data;
}

export async function uploadFile(file: File): Promise<string> {
  try {
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);

    // Get backend URL from environment variable with fallback
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    console.log(`🔼 Attempting to upload file to: ${backendUrl}/api/upload`);
    console.log(`📦 File details: ${file.name}, type: ${file.type}, size: ${file.size / 1024}KB`);

    // Use the backend API to upload the file with timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 sec timeout

    try {
      const response = await fetch(`${backendUrl}/api/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error during file upload:', errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ File uploaded successfully:', data);
      return data.fileUrl;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('❌ File upload timed out after 30 seconds');
        throw new Error('Upload request timed out. Please try again.');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    
    // Fallback options with enhanced logging
    console.log('🔄 Trying alternative upload methods...');
    
    // For audio files, use object URL as temporary fallback
    if (file.type.startsWith('audio/')) {
      const objectUrl = URL.createObjectURL(file);
      console.log('✅ Created temporary object URL for audio:', objectUrl);
      console.warn('⚠️ This is a temporary URL and will not persist after page reload');
      return objectUrl;
    }
    
    // For other files, try Supabase storage
    try {
      console.log('🔄 Attempting fallback upload to Supabase...');
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `uploads/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('media-files')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL of the uploaded file
      const { data: urlData } = supabase.storage
        .from('media-files')
        .getPublicUrl(filePath);
      
      if (urlData?.publicUrl) {
        console.log('Fallback upload successful:', urlData.publicUrl);
        return urlData.publicUrl;
      }
      throw new Error('Failed to get public URL from Supabase');
    } catch (fallbackError) {
      console.error('❌ Both primary and fallback upload methods failed');
      throw error;
    }
  }
}

export async function sendMessage(
  content: string,
  image: File | null,
  receiverId?: string,
  groupId?: string
): Promise<Message | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let imageUrl = null;
    
    if (image) {
      console.log(`Preparing to upload: ${image.name}, type: ${image.type}, size: ${image.size}`);
      try {
        // For audio files, use the backend upload endpoint directly
        if (image.type.startsWith('audio/')) {
          console.log('Uploading audio file to backend');
          imageUrl = await uploadFile(image);
          console.log('Audio upload successful, URL:', imageUrl);
        } else {
          // For other files, use Supabase storage
          console.log('Uploading non-audio file to Supabase');
          imageUrl = await uploadFile(image);
        }
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
        
        // For audio files, create a temporary URL for previewing
        if (image.type.startsWith('audio/')) {
          imageUrl = URL.createObjectURL(image);
          console.log('Created temporary URL for audio preview:', imageUrl);
        }
      }
    }

    // Ensure we're getting the proper user info before inserting
    const { error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      throw userError;
    }

    // Extra debug information before inserting message
    console.log('Inserting message with data:', {
      content,
      sender_id: user.id,
      receiver_id: receiverId,
      group_id: groupId,
      image: imageUrl
    });

    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          content,
          sender_id: user.id,
          receiver_id: receiverId,
          group_id: groupId,
          image: imageUrl
        }
      ])
      .select('*, sender:users!sender_id(*), receiver:users!receiver_id(*)')
      .single();

    if (error) {
      console.error('Supabase error when inserting message:', error);
      throw error;
    }
    
    console.log('Message inserted successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export async function editMessage(messageId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .rpc('edit_message', {
      message_id: messageId,
      new_content: content,
      user_id: user.id
    });

  if (error) throw error;
  return data;
}

export async function deleteMessage(messageId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .rpc('delete_message', {
      message_id: messageId,
      user_id: user.id
    });

  if (error) throw error;
  return data;
}

export async function validateSecurityAnswers(
  email: string, 
  securityAnswer1: string, 
  securityAnswer2: string
): Promise<boolean> {
  try {
    // Vérifier d'abord si la fonction RPC existe
    const { error: checkError } = await supabase.rpc('validate_security_answers', {
      user_email: email,
      answer1: 'test',
      answer2: 'test'
    });
    
    // Si la fonction n'existe pas, faire une vérification manuelle
    if (checkError && (checkError.code === 'PGRST301' || checkError.message.includes('does not exist'))) {
      // Fallback: vérifier manuellement les réponses
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('security_answer1, security_answer2')
        .eq('email', email)
        .single();
      
      if (userError) {
        if (userError.code === 'PGRST204' && userError.message.includes('security_answer')) {
          throw new Error("La récupération de compte n'est pas encore disponible. Veuillez contacter l'administrateur.");
        }
        throw userError;
      }
      
      return userData.security_answer1 === securityAnswer1 && 
             userData.security_answer2 === securityAnswer2;
    }
    
    // Utiliser la fonction RPC si elle existe
    const { data, error } = await supabase.rpc('validate_security_answers', {
      user_email: email,
      answer1: securityAnswer1,
      answer2: securityAnswer2
    });

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error validating security answers:', error);
    throw new Error('Impossible de vérifier vos réponses. Veuillez réessayer.');
  }
}

export async function resetPassword(email: string, newPassword: string): Promise<void> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    
    // Ensuite, nous devons mettre à jour le mot de passe dans la base de données
    // Cette logique varie selon votre implémentation réelle
    const { error: updateError } = await supabase
      .rpc('reset_user_password', {
        user_email: email,
        new_password: newPassword
      });
    
    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw new Error('Impossible de réinitialiser votre mot de passe. Veuillez réessayer.');
  }
}

/**
 * Updates the security questions for a user.
 * @param userId - The ID of the user.
 * @param question1 - The first security question.
 * @param answer1 - The answer to the first security question.
 * @param question2 - The second security question.
 * @param answer2 - The answer to the second security question.
 */
export async function updateSecurityQuestions(
  userId: string,
  question1: string,
  answer1: string,
  question2: string,
  answer2: string
) {
  const { data, error } = await supabase
    .from('users')
    .update({
      security_question1: question1,
      security_answer1: answer1,
      security_question2: question2,
      security_answer2: answer2,
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating security questions:', error);
    throw new Error("Erreur lors de la mise à jour des questions de sécurité.");
  }

  return data;
}