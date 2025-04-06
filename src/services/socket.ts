import { io, Socket } from 'socket.io-client';
import { Message } from '../types';

// Exporter l'instance socket pour y accéder depuis d'autres fichiers
export let socket: Socket | null = null;

/**
 * Initializes the Socket.IO connection.
 * @param userId - The user ID for authentication.
 */
export function initializeSocket(userId: string) {
  if (socket) {
    // Si un socket existe déjà, pas besoin d'en créer un nouveau
    return socket;
  }

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  const username = localStorage.getItem('username') || 'User';
  
  socket = io(backendUrl, {
    auth: { 
      userId, 
      username // Ajouter le nom d'utilisateur aux informations d'authentification
    },
    transports: ['websocket', 'polling'],
  });
  
  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
  });
  
  return socket;
}

/**
 * Disconnects the Socket.IO connection.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Joins a chat room.
 * @param chatId - The chat ID to join.
 */
export function joinChat(chatId: string) {
  if (!socket) return;
  console.log(`Joining chat room: ${chatId}`);
  socket.emit('join_room', chatId);
}

/**
 * Leaves a chat room.
 * @param chatId - The chat ID to leave.
 */
export function leaveChat(chatId: string) {
  if (!socket) return;
  console.log(`Leaving chat room: ${chatId}`);
  socket.emit('leave_room', chatId);
}

/**
 * Sends a chat message through the WebSocket.
 * @param message - The message to send.
 */
export function sendChatMessage(message: Partial<Message>) {
  if (!socket) return;
  socket.emit('send_message', message);
}

/**
 * Sets up the callback for new messages through WebSocket.
 * @param callback - The callback function to be called when a new message is received.
 */
export function onNewMessage(callback: (message: Message) => void) {
  if (!socket) return;
  socket.on('receive_message', callback);
}

/**
 * Emits a typing event.
 * @param chatId - The chat ID where typing is happening.
 * @param userId - The ID of the user who is typing.
 */
export function emitTyping(chatId: string, userId: string) {
  if (!socket) return;
  
  const username = localStorage.getItem('username') || 'User';
  
  socket.emit('typing', {
    chatId,
    userId,
    username
  });
}

/**
 * Emits a stop typing event.
 * @param chatId - The chat ID where typing stopped.
 * @param userId - The ID of the user who stopped typing.
 */
export function stopTyping(chatId: string, userId: string) {
  if (!socket) return;
  
  const username = localStorage.getItem('username') || 'User';
  
  socket.emit('stop_typing', {
    chatId,
    userId,
    username
  });
}

/**
 * Sets up the callback for user typing events.
 * @param callback - The callback function to be called when a user starts typing.
 */
export function onUserTyping(callback: (data: { chatId: string; userId: string; username: string }) => void) {
  if (!socket) return;
  socket.on('user_typing', callback);
}

/**
 * Sets up the callback for user stop typing events.
 * @param callback - The callback function to be called when a user stops typing.
 */
export function onUserStopTyping(callback: (data: { chatId: string; userId: string; username: string }) => void) {
  if (!socket) return;
  socket.on('user_stop_typing', callback);
}

/**
 * Sets up the callback for user online events.
 * @param callback - The callback function to be called when a user comes online.
 */
export function onUserOnline(callback: (userId: string) => void) {
  if (!socket) return;
  socket.on('user_online', callback);
}

/**
 * Sets up the callback for user offline events.
 * @param callback - The callback function to be called when a user goes offline.
 */
export function onUserOffline(callback: (userId: string) => void) {
  if (!socket) return;
  socket.on('user_offline', callback);
}

/**
 * Closes the game session.
 * @param chatId - The chat ID where the game is being played.
 */
export function closeGame(chatId: string) {
  if (!socket) return;
  console.log(`Closing game in chat room: ${chatId}`);
  socket.emit('close_game', { chatId });
}

/**
 * Starts a new Tic Tac Toe game in the specified chat.
 * @param chatId - The chat ID where the game should be played.
 */
export function startGame(chatId: string) {
  if (!socket) {
    console.error("Socket not initialized, can't start game");
    return;
  }
  console.log(`Starting a new game in chat room: ${chatId}`);
  socket.emit('start_game', { chatId });
}

/**
 * Sets up a callback for when a player leaves the game.
 * @param callback - Function to call when a player leaves
 */
export function onPlayerLeftGame(callback: (data: { username: string }) => void) {
  if (!socket) return;
  socket.on('game_player_left', callback);
}

/**
 * Sets up the callback for game invitation events.
 * @param callback - The callback function to be called when a game invitation is received.
 */
export function onGameInvitation(callback: (data: { chatId: string; inviterId: string; inviteeId: string | null }) => void) {
  if (!socket) return;
  socket.on('game_invitation', callback);
}

/**
 * Sets up a callback for game timeout events.
 * @param callback - Function to call when a game times out
 */
export function onGameTimeout(callback: (data: { message: string }) => void) {
  if (!socket) return;
  socket.on('game_timeout', callback);
}

/**
 * Sets up the callback for when a game invitation is declined.
 * @param callback - Function to call when a game invitation is declined
 */
export function onGameInvitationDeclined(callback: (data: { username: string, chatId: string }) => void) {
  if (!socket) return;
  socket.on('game_invitation_declined', callback);
}

/**
 * Sends a game invitation to the specified chat.
 * @param chatId - The chat ID where the game invitation is sent.
 * @param inviterId - The ID of the user sending the invitation.
 * @param inviteeId - The ID of the user being invited (null for group chats).
 */
export function sendGameInvitation(chatId: string, inviterId: string, inviteeId: string | null) {
  if (!socket) {
    console.error("Socket not initialized, can't send game invitation");
    return;
  }
  console.log(`Sending game invitation from ${inviterId} to ${inviteeId || 'group'} in chat ${chatId}`);
  socket.emit('game_invitation', {
    chatId,
    inviterId,
    inviteeId,
  });
}

/**
 * Sets up a callback for when a game invitation is accepted.
 * @param callback - Function to call when a game invitation is accepted.
 */
export function onGameInvitationAccepted(callback: (data: { chatId: string; username: string }) => void) {
  if (!socket) return;
  socket.on('game_invitation_accepted', callback);
}

/**
 * Sets up a callback for when a game invitation times out.
 * @param callback - Function to call when a game invitation times out.
 */
export function onGameInvitationTimeout(callback: (data: { chatId: string }) => void) {
  if (!socket) return;
  socket.on('game_timeout', callback);
}