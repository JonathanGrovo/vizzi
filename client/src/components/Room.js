import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../hooks/useSocket';
import UsernameModal from './UsernameModal';
import '../styles/UsernameModal.css'

const Room = () => {
  const { roomId } = useParams();
  const [users, setUsers] = useState([]);
  const socket = useSocket(roomId);
  const [username, setUsername] = useState(null);
  const [showModal, setShowModal] = useState(true);

  const [joinLink, setJoinLink] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // CHANGE URL HERE AS NECESry\
    setJoinLink(`http://localhost:3000/join/${roomId}`);
  }, [roomId]);

  // function to copy join link to clipboard
  const copyJoinLink = async () => {
    try {
      await navigator.clipboard.writeText(joinLink);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }

  const mounted = useRef(false);

  // ensuring modal is not shown if username already set for session
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      const checkUsername = async () => {
        try {
          const response = await axios.get('/api/sessions/check-username');
          if (response.data.username) {
            setUsername(response.data.username);
            setShowModal(false);
          } else {
            setShowModal(true);
          }
        } catch (error) {
          console.error("Error checking session username:", error);
          // Handle error (e.g., show an error message)
        }
      };
    
      checkUsername();
  }
  }, []);  

  useEffect(() => {
    if (socket) {
      socket.on('user joined', (data) => {
        setUsers(prevUsers => [...prevUsers, data.username]);
      });
      return () => {
        socket.off('user joined');
      };
    }
  }, [socket]);

  const handleUsernameSubmit = (enteredUsername) => {
    setUsername(enteredUsername);
    setShowModal(false);
  }
  

  return (
    <div className="room">
      <button onClick={copyJoinLink}>Copy Join Link</button>
      <h2>Room: {roomId}</h2>
      {showModal && <UsernameModal onClose={handleUsernameSubmit} />}
      <ul>
        {users.map((user, index) => <li key={index}>{user}</li>)}
      </ul>
      {/* ... other room content ... */}
    </div>
  );
};

export default Room;
