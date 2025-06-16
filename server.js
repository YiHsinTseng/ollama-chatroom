const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

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

// // front-end
// app.use(express.static('public'));

// Serve React build files
app.use(express.static(path.join(__dirname, 'client', 'dist')));
// 所有未知路徑都返回 React index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// server
if (ENV === 'development') {
  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
} else {
  server.listen(PORT);
}
