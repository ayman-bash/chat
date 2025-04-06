import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import commentsRouter from './routes/comments.js'; // Add .js extension for ES modules

// Initialize express app
const app = express();
const httpServer = createServer(app);

// Configure CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://chatfrar.vercel.app'] 
    : ['http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Parse JSON request body
app.use(express.json());

// API Routes
app.use('/api/comments', commentsRouter);

// Basic health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Start the server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Socket.IO initialization (if you're using it)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://chatfrar.vercel.app'] 
      : ['http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Export for potential use in other server files
export { app, httpServer, io };
