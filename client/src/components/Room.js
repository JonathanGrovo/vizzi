// components/Room.js
import React from 'react';
import { useSocket } from '../hooks/useSocket';
import { useParams } from 'react-router-dom';

const Room = () => {
  // establish WebSocket connection when component mounts
  let { roomCode } = useParams();
  useSocket(roomCode);

  return (
    <div>
      <h1>You are in room {roomCode}</h1>
    </div>
  );
};

export default Room;