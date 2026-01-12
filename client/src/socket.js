import { io } from 'socket.io-client';

// Connect to Socket.io server
const socket = io(window.location.origin, {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Connected to server:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err);
});

export default socket;

