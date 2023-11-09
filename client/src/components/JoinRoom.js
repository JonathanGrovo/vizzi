import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function JoinRoom() {
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [step, setStep] = useState(1); // Step 1 for room code, Step 2 for username
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Step 1: Validate the room code
  const validateRoomCode = async () => {
    try {
      const response = await axios.post('/api/rooms/validate', { roomCode });
      const data = response.data;

      if (data.valid && !data.full) {
        setStep(2); // Move to step 2 to ask for username
      } else {
        // Handle errors like invalid room or room being full
        setMessage(data.error || 'Room is full.');
      }
    } catch (error) {
      setMessage('Error validating room code. Please try again.');
    }
  };

  // Step 2: Set the username in the session and join the room
  const joinRoom = async () => {
    try {
      await axios.post('/api/sessions/username', { username });
      const response = await axios.post('/api/rooms/join', { roomCode, name: username });
      const data = response.data;

      if (data.error) {
        setMessage(data.error);
      } else {
        navigate(`/room/${roomCode}`); // Redirect to the room
      }
    } catch (error) {
      setMessage('Failed to join room. Please try again');
    }
  };

  // Conditional rendering based on the step
  return (
    <div>
      <h1>{step === 1 ? 'Enter Room Code' : 'Enter Username'}</h1>
      {step === 1 ? (
        <div>
          <input 
            type="text"
            placeholder="Enter room code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <button onClick={validateRoomCode}>Next</button>
        </div>
      ) : (
        <div>
          <input 
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      )}
      {message && <p>{message}</p>}
    </div>
  );
}

export default JoinRoom;
