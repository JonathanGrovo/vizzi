// hooks/useSocket.js
import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:5000';

export const useSocket = (roomCode, username) => {
    const socketRef = useRef(null);

    useEffect(() => {
        if (roomCode && username) {
            socketRef.current = io(SOCKET_SERVER_URL, {
                withCredentials: true,
                query: {roomId: roomCode, username },
            });

            // set up event listeners 
        }

        // initialize socket connection
        socketRef.current = io(SOCKET_SERVER_URL, {
            withCredentials: true,
        });

        console.log(roomCode, username);

        // emit the join room event only if parameters provided
        if (roomCode && username) {
            console.log('thisbeinghit 1');
            socketRef.current.emit('join room', roomCode, username);
        }

        // return cleanup function
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [roomCode, username]);

    return socketRef.current; // return the socket instance
}