import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateRoom({ userId }) {
  const navigate = useNavigate();
  const [maxUsers, setMaxUsers] = useState(10); // Replace with desired default or input
  const [initiallyMuted, setInitiallyMuted] = useState(false); // Replace with desired default or input
  
  // when user clicks to create room
  const handleCreateRoom = async () => {
    try {
      const response = await fetch('/api/rooms/create', { // Replace with your server URL and route
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          maxUsers,
          initiallyMuted
        }),
      });
      
      const data = await response.json();
      
      if (data.roomCode) {
        // Navigate to the new room
        navigate(`/room/${data.roomCode}`);
      } else {
        console.error("Room code not returned");
      }
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  const handleGoToJoinRoom = () => {
    navigate('/join'); // Navigate to Join Room page
  };

  return (
    <div>
      {/* Add input fields for maxUsers and initiallyMuted here if needed */}
      <button onClick={handleCreateRoom}>Create Room</button>
      <button onClick={handleGoToJoinRoom}>Go to Join Room</button>
    </div>
  );
}

export default CreateRoom;


