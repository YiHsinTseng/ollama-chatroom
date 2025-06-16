# Ollama Chatroom

一個結合 React 前端與 Node.js 後端，透過 Ollama 容器進行 AI 對話的聊天室專案。

## Feature
1. Ollama Server 連線狀態偵測
2. 新問題中斷 Ollama 對話生成

## Tech Stack
1. FE: React
2. BE: Node.js(Express)
3. Docker: Ollama
4. Socket.IO

##  啟動流程

### 啟動 Ollama Server 容器
```shell
cd Docker
docker-compose up -d
```

### 建立最新前端版本（React）
```shell
cd ../client/                                                                          
npm run build   
```

### 回到專案根目錄啟動後端

若尚未安裝 nodemon，可先執行：
```shell
npm install -g nodemon
```

爾後回到專案目錄

```shell
cd ..
nodemon server.js
```

### 開啟瀏覽器查看前端介面
http://localhost:4000


## Todo
1. 聊天內容保留
2. AI Agent(with n8n/node red)
3. 優化 Ollama 即時生成回應速度
4. 優化前端接受對話呈現體驗
