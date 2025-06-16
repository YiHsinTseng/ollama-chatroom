import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './style.css';

const socket = io();
const WaitingDefaultText = '...等待回覆中...';

const Message = ({ text, role }) => (
  <div className={`message ${role}`}>{text}</div>
);

export default function ChatApp() {
  const [status, setStatus] = useState('disconnected');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const activeMessageRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on('ollamaIsReady',handleIsReady);
    socket.on('ollama-stream', handleStreamMessage);
    socket.on('ollama-stream-end', handleStreamEnd);
    socket.on('ollama-error', handleErrorMessage);

    return () => {
      socket.off('ollamaIsReady',handleIsReady);
      socket.off('ollama-stream', handleStreamMessage);
      socket.off('ollama-stream-end', handleStreamEnd);
      socket.off('ollama-error', handleErrorMessage);
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit('message', input);
    addMessage(input, 'user-message');
    createActiveMessage();
    setInput('');
    scrollToBottom();
  };

  const addMessage = (text, role) => {
    setMessages((prev) => [...prev, { text, role }]);
  };

  const createActiveMessage = (defaultText = WaitingDefaultText, role = 'system-message') => {
    if (!activeMessageRef.current) {
      const newMsg = { text: defaultText, role };
      activeMessageRef.current = newMsg;
      setMessages((prev) => [...prev, newMsg]);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const updateActiveMessageText = (textFragment) => {
    if (!activeMessageRef.current) return;
    // 更新內容
    activeMessageRef.current.text += textFragment;
    // 觸發 UI 重渲染
    setMessages((prev) => [...prev]);
  };

  const handleIsReady = (isReady) => {
    setStatus(isReady ? 'connected' : 'disconnected');
  };

  const handleStreamMessage = (data) => {
    let messageContent = '';
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      messageContent = parsed.message.content;

      createActiveMessage();

      if (activeMessageRef.current.text === WaitingDefaultText) {
        activeMessageRef.current.text = '';
      }

     updateActiveMessageText(messageContent);

      if (parsed.done) {
        updateActiveMessageText('(by ollama)');
        activeMessageRef.current = null;
      }
    } catch (err) {
      console.error('Stream JSON parse error', err);
      return;
    }

    scrollToBottom();
  };

  const handleStreamEnd = () => {
    if (activeMessageRef.current) {
      updateActiveMessageText('(...終止)');
      activeMessageRef.current = null;
      scrollToBottom();
      createActiveMessage();//確保有WaitingDefaultText
    }
  };

  const handleErrorMessage = (data) => {
    const messageContent = data.message || 'Error occurred';
    createActiveMessage('', 'error-message');
    if (activeMessageRef.current.text === WaitingDefaultText) {
      activeMessageRef.current.text = '';
    }
    updateActiveMessageText(messageContent);
    activeMessageRef.current = null;
  };


  return (
    <div className="chatroom-container">
      <div className="title-container">
        <h1>Socket.IO Example</h1>
        <div
          id="statusDot"
          style={{ backgroundColor: status === 'connected' ? 'green' : 'red' }}
        />
      </div>
      <div id="messages">
        {messages.map((msg, index) => (
          <Message key={index} text={msg.text} role={msg.role} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div id="inputContainer">
        <input
          id="messageInput"
          type="text"
          placeholder="Type a message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isComposing) {
              sendMessage();
            }
          }}
        />
        <button id="sendButton" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}
