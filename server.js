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

// TODO 上線確認有時候有延遲
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

let currentRequest; // 保存當前請求流的取消源

async function streamOllamaResponse(socket, content) {
  try {
    // 透過axios canceltoken 中途截斷回應或提供新請求截斷回應(不會用到flag 變數)
    // 如果已有請求存在，先取消舊的請求
    if (currentRequest) {
      // 停止當前請求流
      currentRequest.cancel('Request aborted by new incoming request'); // 取消舊的請求
      // 中斷stream 透過額外事件來區隔責任
      socket.emit('ollama-stream-end', { stop: true }); // TODO 思考要怎樣的格式或訊息，這裡傳的是JSON，但ollama傳的是字串(chunk.toString())
      console.log('Old request aborted');
    }

    const requestBody = {
      model: 'kenneth85/llama-3-taiwan:latest',
      stream: true,
      messages: [
        { role: 'user', content },
      ],
    };

    // 創建新的取消源
    currentRequest = axios.CancelToken.source();

    // 發送新請求，並使用取消信號
    const response = await axios.post(OLLAMA_API_CHAT_URL, requestBody, {
      responseType: 'stream',
      cancelToken: currentRequest.token, // 為請求設置取消信號
    });

    // 接收 Ollama LLM server 生成的訊息並發送給用戶
    response.data.on('data', (chunk) => { // ArrayBuffer
      // console.log('Received data chunk from Ollama API');
      console.log(chunk.toString());
      socket.emit('ollama-stream', chunk.toString()); // TODO 考慮是否要轉成JSON物件
    });
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request canceled', error.message);
    } else {
      console.error('Error fetching data from Ollama API:', error);
      socket.emit('ollama-error', {
        type: 'error',
        message: 'Error fetching data from Ollama API',
      });
    }
  }
}

// socketio (without record)
io.on('connection', (socket) => {
  // 確認使用者連線
  console.log('A user connected');

  // 確認LLM連線
  verifyOllamaStatus(socket);

  // TODO 思考間隔或更好的方案
  setInterval(() => {
    verifyOllamaStatus(socket);
  }, 10000);

  // 接收 User 訊息並發送給 ollama LLM server
  socket.on('message', (msg) => {
    console.log(`Message from client: ${msg}`);
    if (ollamaIsReady) {
      streamOllamaResponse(socket, msg);
    } else {
      socket.emit('ollama-error', {
        type: 'error',
        message: 'Error fetching data from Ollama API',
      });
    }
    io.emit('message', msg);
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
