const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// config
const config = require('./config');
const setupSocketIo = require('./socket/socketHandler');

const { PORT, ENV } = config;

// init
const app = express();

const server = http.createServer(app);
const io = socketIo(server);

// socketio (without record)
setupSocketIo(io);

// front-end
app.use(express.static('public'));

// server
if (ENV === 'development') {
  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
} else {
  server.listen(PORT);
}
