import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';

function Room() {
  const { roomCode } = useParams();
  const userId = localStorage.getItem('userId');
  
  useEffect(() => {
    // Fetch messages and other room details using roomCode and userId
  }, [roomCode, userId]);

  return (
    <div>
      <h1>You are in room {roomCode}</h1>
      {/* Chat interface here */}
    </div>
  );
}

export default Room;