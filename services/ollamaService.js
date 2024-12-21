const axios = require('axios');
const { OLLAMA_API_PORT } = require('../config');

// ollama stream data
const OLLAMA_API_CHAT_URL = `http://localhost:${OLLAMA_API_PORT}/api/chat`;

// TODO 上線確認有時候有延遲

async function verifyOllamaStatus(socket) {
  const OLLAMA_API_CHECK_URL = `http://localhost:${OLLAMA_API_PORT}/api/generate`;
  try {
    const requestBody = {
      model: 'kenneth85/llama-3-taiwan:latest',
    };
    const response = await axios.post(OLLAMA_API_CHECK_URL, requestBody);

    if (response.data) {
      // console.log(response.data);
      socket.emit('ollamaIsReady', true);
      return true;
    }
    socket.emit('ollamaIsReady', false);
    return false;
  } catch (error) {
    // console.error('Error fetching data from Ollama API:', error);
    socket.emit('ollamaIsReady', false);
    return false;
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

module.exports = { verifyOllamaStatus, streamOllamaResponse };
