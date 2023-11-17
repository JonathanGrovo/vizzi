import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function JoinRoom() {
  const { roomId } = useParams();
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      const validateAndJoinRoom = async () => {
        try {
          // Check if user is already in a different room
          const activeRoomResponse = await axios.get('/api/sessions/active-room');
          const activeRoom = activeRoomResponse.data.activeRoom;
          if (activeRoom && activeRoom !== roomId) {
            setMessage(`You are already in a different room. Do you want to leave that room and join this one?`);
            // Here you can implement a dialog or a confirmation prompt
            return;
          }

          // Proceed with joining the room
          const validationResponse = await axios.post(`/api/rooms/join/${roomId}`);
          if (validationResponse.data.error) {
            setMessage(validationResponse.data.error);
          } else {
            navigate(`/room/${roomId}`);
          }
        } catch (error) {
          setMessage('Error joining room. Please try again.');
        }
      };

      validateAndJoinRoom();
    }
  }, [roomId, navigate]);

  return (
    <div>
      <h1>Join Room</h1>
      {message && <p>{message}</p>}
    </div>
  );
}

export default JoinRoom;
