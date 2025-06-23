const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

const rooms = {};
const players = {};

app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', (ws) => {
  console.log('Nouvelle connexion WebSocket');
  
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    handleMessage(ws, data);
  });

  ws.on('close', () => {
    console.log('Connexion fermée');
    removePlayer(ws);
  });
});

function handleMessage(ws, data) {
  switch (data.type) {
    case 'create-room':
      createRoom(ws, data.playerName);
      break;
    case 'join-room':
      joinRoom(ws, data.roomCode, data.playerName);
      break;
    case 'offer':
    case 'answer':
    case 'ice-candidate':
      forwardMessage(data);
      break;
    case 'player-action':
      broadcastPlayerAction(data);
      break;
    case 'game-state':
      broadcastGameState(data);
      break;
  }
}

function createRoom(ws, playerName) {
  const roomCode = generateRoomCode();
  rooms[roomCode] = {
    host: ws,
    guest: null,
    players: {}
  };
  
  players[ws] = {
    roomCode,
    playerName,
    role: 'host'
  };
  
  rooms[roomCode].players.host = {
    ws,
    name: playerName,
    ready: false
  };
  
  ws.send(JSON.stringify({
    type: 'room-created',
    roomCode
  }));
  
  console.log(`Salle créée: ${roomCode} par ${playerName}`);
}

function joinRoom(ws, roomCode, playerName) {
  if (!rooms[roomCode]) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Salle introuvable'
    }));
    return;
  }
  
  if (rooms[roomCode].guest) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Salle pleine'
    }));
    return;
  }
  
  rooms[roomCode].guest = ws;
  players[ws] = {
    roomCode,
    playerName,
    role: 'guest'
  };
  
  rooms[roomCode].players.guest = {
    ws,
    name: playerName,
    ready: false
  };
  
  ws.send(JSON.stringify({
    type: 'joined-room',
    roomCode,
    opponentName: rooms[roomCode].players.host.name
  }));
  
  rooms[roomCode].host.send(JSON.stringify({
    type: 'player-joined',
    opponentName: playerName
  }));
  
  console.log(`${playerName} a rejoint la salle ${roomCode}`);
}

function forwardMessage(data) {
  const room = rooms[data.roomCode];
  if (!room) return;
  
  const target = data.recipient === 'host' ? room.host : room.guest;
  if (target) {
    target.send(JSON.stringify(data));
  }
}

function broadcastPlayerAction(data) {
  const room = rooms[data.roomCode];
  if (!room) return;
  
  const target = data.recipient === 'host' ? room.host : room.guest;
  if (target) {
    target.send(JSON.stringify(data));
  }
}

function broadcastGameState(data) {
  const room = rooms[data.roomCode];
  if (!room) return;
  
  const target = data.recipient === 'host' ? room.host : room.guest;
  if (target) {
    target.send(JSON.stringify(data));
  }
}

function removePlayer(ws) {
  const player = players[ws];
  if (!player) return;
  
  const { roomCode, role } = player;
  const room = rooms[roomCode];
  if (!room) return;
  
  const opponent = role === 'host' ? room.guest : room.host;
  if (opponent) {
    opponent.send(JSON.stringify({
      type: 'player-disconnected'
    }));
  }
  
  delete rooms[roomCode];
  delete players[ws];
  
  console.log(`Joueur ${role} déconnecté de la salle ${roomCode}`);
}

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});