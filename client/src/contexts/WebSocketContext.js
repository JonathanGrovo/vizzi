import React, { createContext, useRef, useEffect } from 'react';
import io from 'socket.io-client';

export const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const SOCKET_SERVER_URL = 'http://localhost:5000';

  // function to establish websocket connection
  const connectWebSocket = (roomId, username, callbacks) => {
    // Close any existing connection
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // wait for a short period before establishing a new connection
    setTimeout(() => {
      // Establish a new connection
      socketRef.current = io(SOCKET_SERVER_URL, {
        withCredentials: true,
        query: { roomId, username: username || 'Loading...' },
      });

      // set up event listeners from callbacks
      if (callbacks) {
        Object.entries(callbacks).forEach(([event, callback]) => {
          socketRef.current.on(event, callback);
        });
      }

      socketRef.current.emit('join room', roomId, username || 'Loading...');
      console.log('connectWebSocket hit, user joining:', roomId, username || 'Loading...');
    }, 500); // wait 500 milliseconds
  };

  // function to disconnect websocket
  const disconnectWebSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const onUserJoined = (callback) => socketRef.current?.on('user joined', callback);
  const onRoomDeleted = (callback) => socketRef.current?.on('room deleted', callback);
  const onThisKicked = (callback) => socketRef.current?.on('this kicked', callback);
  const onOtherKicked = (callback) => socketRef.current?.on('other kicked', callback);
  const onUsernameUpdated = (callback) => socketRef.current?.on('username updated', callback);
  const onUpdateUserSocket = (callback) => socketRef.current?.on('update user socket', callback);
  const onUserLeft = (callback) => socketRef.current?.on('user left', callback);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ connectWebSocket, 
    disconnectWebSocket, onUserJoined, onRoomDeleted, 
    onThisKicked, onOtherKicked, onUsernameUpdated, 
    onUpdateUserSocket, onUserLeft }}>
      {children}
    </WebSocketContext.Provider>
  );
};
