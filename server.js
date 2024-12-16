const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');

// config
require('dotenv').config();

const { PORT, OLLAMA_API_PORT } = process.env;
const ENV = process.env.NODE_ENV || 'development';

// init
const app = express();

const server = http.createServer(app);
const io = socketIo(server);

// TODO 預發API 確保 ollama 已成功載入程式（需要60s）並在前端提示

// ollama stream data
const OLLAMA_API_URL = `http://localhost:${OLLAMA_API_PORT}/api/chat`; // Replace with actual API URL

async function streamOllamaData(socket, content) {
  try {
    const requestBody = {
      model: 'kenneth85/llama-3-taiwan:latest',
      stream: true,
      messages: [
        { role: 'user', content },
      ],
    };
    const response = await axios.post(OLLAMA_API_URL, requestBody, {
      responseType: 'stream',
    });
    response.data.on('data', (chunk) => {
      console.log('Received data chunk from Ollama API');
      socket.emit('ollama-stream', chunk.toString());
    });
  } catch (error) {
    console.error('Error fetching data from Ollama API:', error);
    socket.emit('ollama-stream', 'Error fetching data from Ollama API');
  }
}

// socketio (without record)
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('message', (msg) => {
    console.log(`Message from client: ${msg}`);
    streamOllamaData(socket, msg);
    io.emit('message', msg);
  });

  socket.on('request-stream', () => {
    console.log('Client requested Ollama data stream');
    streamOllamaData(socket);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

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
