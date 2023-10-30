import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function JoinRoom({ userId, name }) {
    const [roomCode, setRoomCode] = useState(''); // holds code user enters to join room
    const [message, setMessage] = useState(''); // holds message shown to user

    const navigate = useNavigate();

    const handleGoToCreateRoom = () => {
        navigate('/create'); // navigate to create room page
    }

    const handleJoin = async () => {
        try {
            // send roomCode, name of user and userId to backend
            const response = await fetch('/api/rooms/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    roomCode,
                    name,
                    userId
                })
            });

            // wait for response from backend
            const data = await response.json();

            if(data.error) {
                setMessage(data.error);
            } else { // successful room join
                setMessage(data.message);
                // redirect to the room or handle the room joining logic here
            }
        } catch (error) {
            setMessage('Failed to join room. Please try again');
        }
    };

    return (
        <div>
            <h1>Join a Room</h1>
            <div>
                <input 
                    type="text"
                    placeholder="Enter room code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                />
                <button onClick={handleJoin}>Join</button>
            </div>
            {message && <p>{message}</p>}
            <button onClick={handleGoToCreateRoom}>Go to Create Room</button>
        </div>
    );
};

export default JoinRoom;