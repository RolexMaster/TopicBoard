const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { setupWSConnection } = require('y-websocket/bin/utils');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API routes for XML management
app.get('/api/applications', (req, res) => {
  // TODO: Implement application list retrieval
  res.json({ applications: [] });
});

app.post('/api/applications', (req, res) => {
  // TODO: Implement application creation
  res.json({ success: true });
});

// WebSocket server for Yjs collaboration
const wss = new WebSocket.Server({ 
  port: 1234,
  perMessageDeflate: {
    zlibDeflateOptions: {
      threshold: 1024,
      concurrencyLimit: 10,
    },
    threshold: 1024,
  }
});

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection for Yjs');
  setupWSConnection(ws, req);
});

// Socket.IO for additional real-time features
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : true,
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('user-joined', (data) => {
    socket.broadcast.emit('user-joined', {
      userId: socket.id,
      ...data
    });
  });
  
  socket.on('cursor-position', (data) => {
    socket.broadcast.emit('cursor-position', {
      userId: socket.id,
      ...data
    });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    socket.broadcast.emit('user-left', { userId: socket.id });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Yjs WebSocket server running on port 1234`);
});

module.exports = { app, server, io };