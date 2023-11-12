import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CreateRoom() {
  const navigate = useNavigate();
  const [maxUsers, setMaxUsers] = useState(10);
  const [initiallyMuted, setInitiallyMuted] = useState(false);

  // when user clicks to create room
  const handleCreateRoom = async () => {
    try {
      const response = await axios.post('/api/rooms/create', {
        maxUsers,
        initiallyMuted
      });

      const data = response.data;

      if (data.roomId) {
        navigate(`/room/${data.roomId}`);
      } else {
        console.error("Room code not returned");
      }
    } catch (error) {
      console.error("Error creating room or setting username:", error);
    }
  };

  return (
    <div>
      {/* Add input fields for maxUsers and initiallyMuted here if needed */}
      <button onClick={handleCreateRoom}>Create Room</button>
    </div>
  );
}

export default CreateRoom;


