import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom'; 
import axios from 'axios';

// import components
import JoinRoom from './components/JoinRoom';
import UserSetup from './components/UserSetup';
import CreateRoom from './components/CreateRoom';
import LandingPage from './components/LandingPage';
import Room from './components/Room';

// import socket.io client
// import io from 'socket.io-client';

axios.defaults.baseURL = 'http://localhost:5000'; // backend url
axios.defaults.withCredentials = true;

// // specify CORS configurations
// const socket = io('http://localhost:5000', {
//     withCredentials: true,
// });

// socket.on('someEvent', (data) => {
//     // handle real time event
// });

// component for navigation
function NavigationHandler({ userId, isInRoom, roomCode }) {
  const navigate = useNavigate(); // get navigate function

  useEffect(() => {
    if (userId && isInRoom && roomCode) {
      navigate(`/room/${roomCode}`);
    }
  }, [userId, isInRoom, roomCode]); // run when any of these change

  return null;
}

function App() {
    const [name, setName] = useState('');
    const [action, setAction] = useState(''); // join or create
    const [userId, setUserId] =  useState('');
    const [roomCode, setRoomCode] = useState(null); // room id initially set to null
    const [isInRoom, setIsInRoom] = useState(false); // not initially in room
  
    const [isLoading, setIsLoading] = useState(true); // for loading states

    const handleNameSet = (nameValue, userIdValue) => {
      setName(nameValue);
      setUserId(userIdValue);
    };
  
    useEffect(() => {
      axios.get('/api/sessions/checksession', {
        withCredentials: true,
      })
      .then(response => {
        const data = response.data;
        if (data.userId) {
          setUserId(data.userId);
        }
        if (data.isInRoom) {
          setIsInRoom(data.isInRoom);
        }
        if (data.roomCode) {
          setRoomCode(data.roomCode);
        }
      })
      .catch(error => {
        console.error("There was a problem checking the session:", error);
      });
    }, []); // Empty dependency array means this useEffect runs once when the component mounts
  
    const handleAction = (actionType) => {
      setAction(actionType);
    };
  
    return (
      <Router>
        <NavigationHandler userId={userId} isInRoom={isInRoom} roomCode={roomCode} />
          <div>
                <Routes>
                  <Route path="/" element={<LandingPage onAction={setAction} />} />
                  <Route path="/setup" element={<UserSetup onNameSet={handleNameSet} action={action} />} />
                  <Route path="/join" element={<JoinRoom userId={userId} name={name} />} />
                  <Route path="/create" element={<CreateRoom userId={userId} />} />
                  <Route path="/room/:roomCode" element={<Room />} />
                </Routes>
          </div>
      </Router>
    );
}

// for checking if a user is on a room or not
async function checkIsInRoom() {
  console.log('checkisinroom hit');
  try {
    // get request
    const response = await axios.get("/api/sessions/checkroom", {
      withCredentials: true
    });
    return response.data.inRoom;
  } catch (error) {
    console.error("There was a problem checking if in room:", error);
  }
}

// gets the id of the room
async function getRoomCode() {
  try {
    const response = await axios.get("/api/sessions/checkroom", {
      withCredentials: true
    });
    return response.data.roomCode;
  } catch (error) {
    console.error("There was a problem getting the room code:", error);
  }
}

export default App;

