const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

const server = http.createServer(app);

// Socket.io with default path (subdomain, no path prefix needed)
const io = new Server(server, {
  cors: { origin: '*' }
});

// Game state
let players = {}; // { socketId: { name, progress, color, avatar } }
let isRacing = false;
let hostSocketId = null;

// Available mermaid avatars
const AVATARS = ['🧜‍♀️', '🧜‍♂️', '🐠', '🐬', '🦀', '🐙', '🦑', '🐚', '🌊', '🐋'];

// Generate a random pastel color
const getRandomColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 60%)`;
};

// Get random avatar
const getRandomAvatar = () => {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Host registers
  socket.on('register_host', () => {
    hostSocketId = socket.id;
    console.log('Host registered:', socket.id);
    socket.emit('host_registered');
    socket.emit('update_players', players);
  });

  // Guest joins game
  socket.on('join_game', (name) => {
    if (!name || name.trim() === '') return;
    
    players[socket.id] = {
      id: socket.id,
      name: name.trim().substring(0, 20),
      progress: 0,
      color: getRandomColor(),
      avatar: getRandomAvatar(),
      ready: true
    };
    
    console.log(`Player joined: ${name}`);
    io.emit('update_players', players);
    socket.emit('joined_successfully', players[socket.id]);
  });

  // Guest shakes phone
  socket.on('shake', (intensity) => {
    if (!isRacing || !players[socket.id]) return;

    // Intensity is normalized value, add to progress
    const progressIncrement = Math.min(intensity * 0.5, 2); // Cap at 2% per shake
    players[socket.id].progress += progressIncrement;

    // Check for winner
    if (players[socket.id].progress >= 100) {
      players[socket.id].progress = 100;
      isRacing = false;
      
      const winner = players[socket.id];
      console.log(`Winner: ${winner.name}!`);
      io.emit('game_over', winner);
    }

    io.emit('update_players', players);
  });

  // Admin/Host starts race
  socket.on('start_race', () => {
    if (Object.keys(players).length === 0) {
      socket.emit('error_message', 'Нужен хотя бы один игрок!');
      return;
    }

    isRacing = true;
    
    // Reset all progress
    Object.keys(players).forEach(id => {
      players[id].progress = 0;
    });

    console.log('Race started!');
    io.emit('race_started');
    io.emit('update_players', players);
  });

  // Reset game
  socket.on('reset_game', () => {
    isRacing = false;
    Object.keys(players).forEach(id => {
      players[id].progress = 0;
    });
    io.emit('game_reset');
    io.emit('update_players', players);
  });

  // Player disconnects
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (players[socket.id]) {
      delete players[socket.id];
      io.emit('update_players', players);
    }

    if (socket.id === hostSocketId) {
      hostSocketId = null;
    }
  });
});

// Serve static files from React build (now at root since using subdomain)
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Handle SPA routing - serve index.html for all routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path === '/health') return next();
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', players: Object.keys(players).length, isRacing });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🧜‍♀️ Mermaid Race server running on port ${PORT}`);
});

