import React, { useEffect } from 'react';

function Room({ roomId, userId }) {
  useEffect(() => {
    // Fetch messages and other room details using roomId and userId
  }, [roomId, userId]);

  return (
    <div>
      <h1>You are in room {roomId}</h1>
      {/* Chat interface here */}
    </div>
  );
}

export default Room;