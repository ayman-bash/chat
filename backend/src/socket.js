export function setupSocket(io) {
  const games = {}; // Stocker les états des jeux par chatId

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Récupérer l'ID utilisateur depuis auth
    const userId = socket.handshake.auth.userId;
    console.log('User ID connected:', userId);

    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      console.log(`User ${socket.id} left room ${roomId}`);
    });

    socket.on('send_message', (messageData) => {
      const roomId = messageData.groupId || `dm_${messageData.senderId}_${messageData.receiverId}`;
      io.to(roomId).emit('receive_message', messageData); // Vérifiez que 'receive_message' est bien émis
    });

    // Gérer l'événement de frappe
    socket.on('typing', (data) => {
      const { chatId, userId, username } = data;
      console.log(`User ${username} (${userId}) is typing in chat ${chatId}`);
      
      // S'assurer que toutes les données nécessaires sont présentes
      if (!chatId || !userId) {
        console.error('Missing data in typing event:', data);
        return;
      }
      
      // Rediffuser l'événement à tous les autres utilisateurs dans la même conversation
      socket.to(chatId).emit('user_typing', {
        chatId,
        userId,
        username
      });
    });

    // Gérer l'événement d'arrêt de frappe
    socket.on('stop_typing', (data) => {
      const { chatId, userId, username } = data;
      console.log(`User ${username} (${userId}) stopped typing in chat ${chatId}`);
      
      // S'assurer que toutes les données nécessaires sont présentes
      if (!chatId || !userId) {
        console.error('Missing data in stop_typing event:', data);
        return;
      }
      
      // Rediffuser l'événement à tous les autres utilisateurs dans la même conversation
      socket.to(chatId).emit('user_stop_typing', {
        chatId,
        userId,
        username
      });
    });

    // Lancer une partie de Tic-Tac-Toe
    socket.on('start_game', ({ chatId }) => {
      console.log(`Start game request received for chat ${chatId} from user ${userId}`);
      
      // Initialiser ou réinitialiser l'état du jeu
      games[chatId] = {
        board: Array(9).fill(null), // Grille vide
        currentPlayer: 'X', // Le joueur X commence
        winner: null,
        players: {},         // Map pour suivre les joueurs
        firstPlayerId: null, // Premier joueur (X)
        secondPlayerId: null, // Second joueur (O)
        waitingForPlayer: true, // Le jeu est en attente d'un second joueur
        startTime: Date.now() // Heure de début pour gérer le timeout
      };
      
      // Si c'est une demande pour une nouvelle partie, enregistrer le premier joueur
      if (!games[chatId].firstPlayerId) {
        games[chatId].firstPlayerId = userId;
        games[chatId].players[userId] = 'X';
      }
      
      // Envoyer une invitation à l'autre joueur
      const username = socket.handshake.auth.username || userId;
      
      // Envoyer l'invitation aux autres utilisateurs dans cette salle
      socket.to(chatId).emit('game_invitation', {
        chatId: chatId,
        userId: userId,
        username: username
      });
      
      // Informer tous les utilisateurs dans cette salle (incluant l'émetteur) du nouveau jeu
      console.log(`Emitting game_update to room ${chatId}`);
      io.to(chatId).emit('game_update', games[chatId]);
      console.log(`Game state emitted for chat ${chatId}:`, games[chatId]);
      
      // Configurer un timeout pour fermer le jeu si personne ne rejoint
      setTimeout(() => {
        // Vérifier si le jeu existe toujours et est toujours en attente d'un second joueur
        if (games[chatId] && games[chatId].waitingForPlayer && !games[chatId].secondPlayerId) {
          console.log(`Game timeout for chat ${chatId} - no second player joined`);
          // Informer le premier joueur que personne n'a rejoint
          io.to(chatId).emit('game_timeout', {
            message: "Aucun joueur n'a rejoint la partie. Le jeu va se terminer."
          });
          // Supprimer le jeu après 3 secondes
          setTimeout(() => {
            delete games[chatId];
            io.to(chatId).emit('game_update', null);
          }, 3000);
        }
      }, 60000); // 60 secondes d'attente
    });

    // Gérer un coup joué
    socket.on('play_move', ({ chatId, index }) => {
      const game = games[chatId];
      if (!game) {
        console.log(`No game found for chat ${chatId}`);
        return;
      }
      
      console.log(`Play move request for chat ${chatId}, index ${index} from user ${userId}`);
      
      // Assigner O au second joueur la première fois qu'il joue
      if (!game.secondPlayerId && userId !== game.firstPlayerId) {
        game.secondPlayerId = userId;
        game.players[userId] = 'O';
        game.waitingForPlayer = false; // Le joueur a rejoint, le jeu n'est plus en attente
        console.log(`Second player assigned: ${userId} as O`);
      }
      
      // Si le joueur n'est pas encore assigné et qu'il n'est pas le premier joueur, 
      // c'est probablement un observateur, ne pas l'autoriser à jouer
      if (!game.players[userId]) {
        console.log(`Player ${userId} not assigned to game. Ignoring move.`);
        return;
      }
      
      // Vérifier si c'est le tour du joueur actuel
      const playerSymbol = game.players[userId];
      if (playerSymbol !== game.currentPlayer) {
        console.log(`Not ${userId}'s turn. Current player is ${game.currentPlayer}`);
        return;
      }
      
      // Vérifier si la case est libre et si le jeu n'est pas terminé
      if (!game.winner && game.board[index] === null) {
        game.board[index] = game.currentPlayer;
        game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
        game.winner = checkWinner(game.board);
        
        // Émettre la mise à jour vers tous les clients
        io.to(chatId).emit('game_update', game);
        console.log(`Game updated for chat ${chatId}:`, game);
      }
    });

    // Gérer la fermeture du jeu
    socket.on('close_game', ({ chatId }) => {
      console.log(`Game closed in room ${chatId} by user ${userId}`);
      // Envoyer un message à tous les utilisateurs qu'un utilisateur a quitté le jeu
      io.to(chatId).emit('game_player_left', { username: userId });
      
      // Supprimer l'état du jeu pour cette salle après un délai
      setTimeout(() => {
        if (games[chatId]) {
          delete games[chatId];
          // Informer tous les clients dans cette salle que le jeu est terminé
          io.to(chatId).emit('game_update', null);
        }
      }, 3000); // Délai de 3 secondes avant de fermer complètement le jeu
    });

    // Ajouter un écouteur pour le refus d'invitation
    socket.on('decline_game', ({ chatId }) => {
      console.log(`Game invitation declined in chat ${chatId} by user ${userId}`);
      
      // Retrouver le nom d'utilisateur
      const username = socket.handshake.auth.username || userId;
      
      // Envoyer un message aux autres utilisateurs de la salle
      socket.to(chatId).emit('game_invitation_declined', {
        username,
        chatId
      });
      
      // Supprimer l'état du jeu si existant
      if (games[chatId]) {
        console.log(`Removing game state for chat ${chatId} due to invitation decline`);
        delete games[chatId];
        io.to(chatId).emit('game_update', null);
      }
    });

    // Vérifier le gagnant
    function checkWinner(board) {
      const winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Lignes
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Colonnes
        [0, 4, 8], [2, 4, 6],           // Diagonales
      ];
      for (const [a, b, c] of winningCombinations) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          return board[a]; // Retourne 'X' ou 'O'
        }
      }
      return board.every(cell => cell) ? 'Draw' : null; // Match nul ou pas de gagnant
    }

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
}