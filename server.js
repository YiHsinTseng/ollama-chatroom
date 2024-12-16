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

// ollama stream data
const OLLAMA_API_CHAT_URL = `http://localhost:${OLLAMA_API_PORT}/api/chat`;

let ollamaIsReady = false;

async function verifyOllamaStatus(socket) {
  const OLLAMA_API_CHECK_URL = `http://localhost:${OLLAMA_API_PORT}/api/generate`;
  try {
    const requestBody = {
      model: 'kenneth85/llama-3-taiwan:latest',
    };
    const response = await axios.post(OLLAMA_API_CHECK_URL, requestBody);

    if (response.data) {
      // console.log(response.data);
      ollamaIsReady = true;
      socket.emit('ollamaIsReady', true);
    } else {
      ollamaIsReady = false;
      socket.emit('ollamaIsReady', false);
    }
  } catch (error) {
    // console.error('Error fetching data from Ollama API:', error);
    ollamaIsReady = false;
    socket.emit('ollamaIsReady', false);
  }
}

// ollama server 根據api 中使用者請求生成回應
async function streamOllamaResponse(socket, content) {
  try {
    const requestBody = {
      model: 'kenneth85/llama-3-taiwan:latest',
      stream: true,
      messages: [
        { role: 'user', content },
      ],
    };
    const response = await axios.post(OLLAMA_API_CHAT_URL, requestBody, {
      responseType: 'stream',
    });

    // 接收 ollama 回應
    response.data.on('data', (chunk) => {
      console.log('Received data chunk from Ollama API');
      socket.emit('ollama-stream', chunk.toString());
    });
  } catch (error) {
    // console.error('Error fetching data from Ollama API:', error);
    socket.emit('ollama-error', {
      type: 'error',
      message: 'Error fetching data from Ollama API',
    });
  }
}

// socketio (without record)
io.on('connection', (socket) => {
  // 確認使用者連線
  console.log('A user connected');

  // 確認LLM連線
  verifyOllamaStatus(socket);

  setInterval(() => {
    verifyOllamaStatus(socket);
  }, 60000);

  // 接收 User 訊息並發送給 ollama LLM server
  socket.on('message', (msg) => {
    console.log(`Message from client: ${msg}`);
    if (ollamaIsReady === true) {
      streamOllamaResponse(socket, msg);
    } else {
      socket.emit('ollama-error', { type: 'error', message: 'Error fetching data from Ollama API' });
    }
    io.emit('message', msg);
  });

  // 接收 ollama LLM server 生成的訊息給 User
  socket.on('request-stream', () => {
    console.log('Client requested Ollama data stream');
    streamOllamaResponse(socket);
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
