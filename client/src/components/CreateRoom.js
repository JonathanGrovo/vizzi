import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CreateRoom() {
  const navigate = useNavigate();
  const [maxUsers, setMaxUsers] = useState(10);
  const [initiallyMuted, setInitiallyMuted] = useState(false);
  const [username, setUsername] = useState('gamer');

  const setUsernameInSession = async () => {
    try {
      const response = await axios.post('/api/sessions/username', { username });
      return response.data; // Proceed if successful
    } catch (error) {
      throw error; // Rethrow error to be handled by the caller
    }
  };

  // when user clicks to create room
  const handleCreateRoom = async () => {
    try {
      // First, set the username in the session
      await setUsernameInSession();

      // Then, create the room
      const response = await axios.post('/api/rooms/create', {
        maxUsers,
        initiallyMuted
      });

      const data = response.data;

      if (data.roomCode) {
        navigate(`/room/${data.roomCode}`);
      } else {
        console.error("Room code not returned");
      }
    } catch (error) {
      console.error("Error creating room or setting username:", error);
    }
  };

  const handleGoToJoinRoom = () => {
    navigate('/join');
  };

  return (
    <div>
      {/* Input for username */}
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username"
      />
      {/* Add input fields for maxUsers and initiallyMuted here if needed */}
      <button onClick={handleCreateRoom}>Create Room</button>
      <button onClick={handleGoToJoinRoom}>Go to Join Room</button>
    </div>
  );
}

export default CreateRoom;


