import React from 'react';
import { useNavigate } from 'react-router-dom'; // allowed us to change routes

function LandingPage({ onAction }) {
    const navigate = useNavigate(); // using the useNavigate hook

    const handleJoinRoomClick = () => {
      onAction("join"); // Make sure onAction is being called correctly
      navigate('/join'); // navigate to the join room page
    };
  
    const handleCreateRoomClick = () => {
      onAction("create");
      navigate('/create'); // navigate to the create room page
    };
  
    return (
      <div>
        <button onClick={handleJoinRoomClick}>Join Room</button>
        <button onClick={handleCreateRoomClick}>Create Room</button>
      </div>
    );
}

export default LandingPage;
