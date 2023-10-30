import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom'; 

// import components
import JoinRoom from './components/JoinRoom';
import UserSetup from './components/UserSetup';
import CreateRoom from './components/CreateRoom';
import LandingPage from './components/LandingPage';
import Room from './components/Room';

// import socket.io client
import io from 'socket.io-client';

// specify CORS configurations
const socket = io('http://localhost:5000', {
    withCredentials: true,
});

socket.on('someEvent', (data) => {
    // handle real time event
});

function App() {
    const [name, setName] = useState('');
    const [action, setAction] = useState(''); // join or create
    const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
    const [roomId, setRoomId] = useState(null); // room id initially set to null
    const [isInRoom, setIsInRoom] = useState(false); // not initially in room
  
    const handleNameSet = (nameValue, userIdValue) => {
      setName(nameValue);
      setUserId(userIdValue);
    };

    // In your App.js component
    useEffect(() => {
        console.log('Action:', action);
    }, [action]);

    useEffect(() => {
        console.log('UserId:', userId, 'IsInRoom:', isInRoom);
    }, [userId, isInRoom]);
    
  

    useEffect(() => {
        if (userId) {
          (async () => {
            const inRoom = await checkIsInRoom(userId);
            setIsInRoom(inRoom);
            if (inRoom) {
              const room = await getRoomId(userId);
              setRoomId(room);
            }
          })();
        }
      }, [userId]);
  
    const handleAction = (actionType) => {
      setAction(actionType);
    };
  
    return (
        <Router>
          <div>
            {userId && isInRoom ? (
              <Navigate to={`/room/${roomId}`} replace />
            ) : (
              <>
                <Routes>
                  <Route path="/" element={<LandingPage onAction={setAction} />} />
                  <Route path="/setup" element={<UserSetup onNameSet={handleNameSet} action={action} />} />
                  <Route path="/join" element={<JoinRoom userId={userId} name={name} />} />
                  <Route path="/create" element={<CreateRoom userId={userId} />} />
                  <Route path="/room/:roomId" element={<Room />} />
                </Routes>
              </>
            )}
          </div>
        </Router>
      );
  }
  
// for checking if a user is on a room or not
async function checkIsInRoom(userId) {
    const response = await fetch(`/api/users/${userId}/room`); // string literal
    const data = await response.json();
    return data.inRoom;
}

// gets the id of the room
async function getRoomId(userId) {
    const response = await fetch(`/api/users/${userId}/room`);
    const data = await response.json();
    return data.roomId;
}

export default App;

