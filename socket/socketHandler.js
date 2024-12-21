const { verifyOllamaStatus, streamOllamaResponse } = require('../services/ollamaService');

let ollamaIsReady = false;

function setupSocketIo(io) {
  io.on('connection', (socket) => {
  // 確認使用者連線
    console.log('A user connected');

    // 確認LLM連線
    ollamaIsReady = verifyOllamaStatus(socket);

    // TODO 思考間隔或更好的方案
    ollamaIsReady = setInterval(() => {
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
}

module.exports = setupSocketIo;
