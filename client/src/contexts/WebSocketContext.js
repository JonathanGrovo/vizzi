import React, { createContext, useRef } from 'react';
import io from 'socket.io-client';

export const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const SOCKET_SERVER_URL = 'http://localhost:5000';

  const connectWebSocket = (roomId, username) => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_SERVER_URL, {
        withCredentials: true,
        query: { roomId, username },
      });
      socketRef.current.emit('join room', roomId, username);
    }
  };

  const disconnectWebSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  return (
    <WebSocketContext.Provider value={{ connectWebSocket, disconnectWebSocket }}>
      {children}
    </WebSocketContext.Provider>
  );
};
