import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom'; 
import axios from 'axios';

// import components
import JoinRoom from './components/JoinRoom';
import CreateRoom from './components/CreateRoom';
import LandingPage from './components/LandingPage';
import Room from './components/Room';

axios.defaults.baseURL = 'http://localhost:5000'; // backend url
axios.defaults.withCredentials = true;

// component for navigation
function NavigationHandler({ isInRoom, roomCode }) {
  const navigate = useNavigate(); // get navigate function

  useEffect(() => {
    console.log(`NavigationHandler effect triggered: isInRoom: ${isInRoom}, roomCode: ${roomCode}`);
    if (isInRoom && roomCode) {
      console.log('Navigating to room:', roomCode);
      navigate(`/room/${roomCode}`);
    }
  }, [isInRoom, roomCode]); // run when any of these change

  return null;
}

function App() {
    const [name, setName] = useState('');
    const [action, setAction] = useState(''); // join or create
    const [roomCode, setRoomCode] = useState(null); // room id initially set to null
    const [isInRoom, setIsInRoom] = useState(false); // not initially in room
  
    const [isLoading, setIsLoading] = useState(true); // for loading states

    const handleNameSet = (nameValue, userIdValue) => {
      console.log('Setting name and userID', nameValue);
      setName(nameValue);
    };
    
    const mounted = useRef(false);
    
    useEffect(() => {
      if (!mounted.current) {
        mounted.current = true; // Set the mounted ref to true
        console.log('Initial session check starting');
        
        axios.get('/api/sessions/active-room')
          .then(response => {
            console.log('Initial session check completed', response.data);
            const data = response.data;
            if (data && data.activeRoom) {
              // An active room was found in the session
              setRoomCode(data.activeRoom);
              setIsInRoom(true);
            } else {
              // No active room was found, but it's not an error
              setRoomCode(null);
              setIsInRoom(false);
            }
          })
          .catch(error => {
            console.error("There was a problem with the request:", error);
          });
      }
    }, []); // The dependency array remains empty to emulate componentDidMount
    
    const handleAction = (actionType) => {
      setAction(actionType);
    };
  
    return (
      <Router>
        <NavigationHandler isInRoom={isInRoom} roomCode={roomCode} />
          <div>
                <Routes>
                  <Route path="/" element={<LandingPage onAction={setAction} />} />
                  <Route path="/join" element={<JoinRoom name={name} />} />
                  <Route path="/create" element={<CreateRoom />} />
                  <Route path="/room/:roomCode" element={<Room roomCode={roomCode}/>} />
                </Routes>
          </div>
      </Router>
    );
}

export default App;