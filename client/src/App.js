import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom'; 

// import components
import JoinRoom from './components/JoinRoom';
import UserSetup from './components/UserSetup';
import CreateRoom from './components/CreateRoom';

// import socket.io client
import io from 'socket.io-client';
const socket = io('http://localhost:3001');

socket.on('someEvent', (data) => {
    // handle real time event
});

// defining the main app component
function App() {

  // state variables for name and userId
  const [name, setName] = useState('');
  // tries to get userId from local storage initially
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');

  // ssets the states of name and userId using related functions
  const handleNameSet = (nameValue, userIdValue) => {
    setName(nameValue);
    setUserId(userIdValue);
  };

  // what is being rendered
  return (
    <Router>
        <div>
            {/* If userId does not exist, redirect to setup */}
            {!userId ? (
                <Navigate to="/setup" replace />
            ) : (
                <>
                    {/* Links to navigate */}
                    <nav>
                        <ul>
                            <li>
                                <Link to="/join">Join Room</Link>
                            </li>
                            <li>
                                <Link to="/create">Create Room</Link>
                            </li>
                        </ul>
                    </nav>
                </>
            )}

            {/* Routes to render components */}
            <Routes>
                <Route path="/setup" element={<UserSetup onNameSet={handleNameSet} />} />
                <Route path="/join" element={<JoinRoom userId={userId} name={name} />} />
                <Route path="/create" element={<CreateRoom userId={userId} />} />
            </Routes>
        </div>
    </Router>
);

}

export default App;

