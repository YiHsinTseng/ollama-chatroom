const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 服務器端處理連接
io.on('connection', (socket) => {
  console.log('A user connected');

  // 接收來自客戶端的消息
  socket.on('message', (msg) => {
    console.log(`Message from client: ${msg}`);

    // 發送訊息給所有連接的客戶端
    io.emit('message', msg);
  });

  // 斷開連接
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// 設定靜態檔案目錄
app.use(express.static('public'));

// 啟動伺服器
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
