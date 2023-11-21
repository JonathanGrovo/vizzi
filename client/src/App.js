import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom'; 
import axios from 'axios';

// import components
import JoinRoom from './components/JoinRoom';
import CreateRoom from './components/CreateRoom';
import Room from './components/Room';
import { WebSocketProvider } from './contexts/WebSocketContext';

// import hooks
import useSkipRedirection from './hooks/useSkipRedirection';

axios.defaults.baseURL = 'http://localhost:5000'; // backend url
axios.defaults.withCredentials = true;

// global navigation component
function NavigationHandler({ isInRoom, roomId }) {
  const navigate = useNavigate(); // get navigate function

  useEffect(() => {
    console.log(`NavigationHandler effect triggered: isInRoom: ${isInRoom}, roomCode: ${roomId}`);
    if (isInRoom && roomId) {
      console.log('Navigating to room:', roomId);
      navigate(`/room/${roomId}`);
    }
  }, [isInRoom, roomId]); // run when any of these change

  return null;
}

function App() {
    const [roomId, setRoomId] = useState(null); // room id initially set to null
    const [isInRoom, setIsInRoom] = useState(false); // not initially in room
  
    // const navigate = useNavigate();
    const skipRedirection = useSkipRedirection();

    // ensures one tab per session
    useEffect(() => {
        // unique identifier for the tab
        const tabId = new Date().getTime();

        // set value in localStorage
        localStorage.setItem('tabId', tabId);

        // event listener for storage changes
        const handleStorageChange = (event) => {
          if (event.key === 'tabId' && event.newValue !== null && parseInt(event.newValue, 10) !== tabId) {
            alert('This app is already open in another tab');
            window.close(); // MIGHT NOT ALWAYS WORK
          }
        };

        window.addEventListener('storage', handleStorageChange);

        // clean up
        return () => {
          localStorage.removeItem('tabId');
          window.removeEventListener('storage', handleStorageChange);
        };
    }, []);


    // const [isLoading, setIsLoading] = useState(true); // for loading states
    
    const mounted = useRef(false);
    
    useEffect(() => {
      // avoid global navigation on join links
      if (!skipRedirection && !mounted.current) {
        mounted.current = true;
        console.log('Initial session check starting');
        
        axios.get('/api/sessions/active-room')
          .then(response => {
            console.log('Initial session check completed', response.data);
            const data = response.data;
            if (data && data.activeRoom) {
              // An active room was found in the session
              setRoomId(data.activeRoom);
              setIsInRoom(true);
            } else {
              // No active room was found, but it's not an error
              setRoomId(null);
              setIsInRoom(false);
            }
          })
          .catch(error => {
            console.error("There was a problem with the request:", error);
          });
      }
    }, [skipRedirection]); // path dependent
  
    return (
      <WebSocketProvider>
        <div>
          <NavigationHandler isInRoom={isInRoom} roomId={roomId} />
            <div>
                  <Routes>
                    <Route path="/" element={<CreateRoom />} />
                    <Route path="/join/:roomId" element={<JoinRoom />} />
                    <Route path="/room/:roomId" element={<Room roomId={roomId}/>} />
                  </Routes>
            </div>
        </div>
      </WebSocketProvider>
    );
}

export default App;