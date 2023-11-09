// hooks/useSocket.js
import { useEffect } from 'react';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:5000';

export const useSocket = (roomCode) => {
    useEffect(() => { // upon room component render
        const socket = io(SOCKET_SERVER_URL, {
            withCredentials: true,
        });

        if (roomCode) {
            socket.emit('join room', roomCode);
        } else {
            console.log('no roomcode passed');
        }

        // clean up on unmount
        return () => {
            socket.emit('leave room', roomCode);
            socket.disconnect();
        };
    }, [roomCode]);
};