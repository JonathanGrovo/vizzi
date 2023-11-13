// hooks/useSocket.js
import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:5000';

export const useSocket = (roomCode) => {
    const socketRef = useRef(null);

    useEffect(() => {
        // initialize socket connection
        socketRef.current = io('http://localhost:5000', {
            withCredentials: true,
        });

        // emit the join room event
        if (roomCode) {
            socketRef.current.emit('join room', roomCode);
        }

        // return cleanup function
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [roomCode]);

    return socketRef.current; // return the socket instance
}