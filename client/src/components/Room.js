import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
// import { useSocket } from '../hooks/useSocket';
import UsernameModal from './UsernameModal';
import '../styles/UsernameModal.css'
// import { listeners } from '../../../server/models/Room';

const Room = () => {
  const { roomId } = useParams();
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState(null);
  const [showModal, setShowModal] = useState(true);

  const [joinLink, setJoinLink] = useState('');
  const navigate = useNavigate();

  // const socket = useSocket(roomId, username);

  const SOCKET_SERVER_URL = 'http://localhost:5000';

  // for managing the join link that can be copied
  useEffect(() => {
    // change url as necessary
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

  // function to handle leaving the room
  const leaveRoom = async () => {
    try {
      // disconnect from websocket
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      // api call to backend to leave the room
      const response = await axios.post(`/api/rooms/leave/${roomId}`);
      if (response.status === 200) {
        // navigate to homepage
        navigate('/');
      }
    } catch (error) {
      console.error('Error leaving room:', error);
      // handle error
    }
  }

  // function to handle (manual) room deletion
  const deleteRoom = async () => {
    try {
      const response = await axios.delete(`/api/rooms/delete/${roomId}`);
      if (response.status === 200) {
        alert('Room deleted successfully');
        navigate('/');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  }

  // handler for kicking a user
  const kickUser = async (sessionId, socketId) => {
    try {
      const response = await axios.post(`/api/rooms/kick/${roomId}`, { sessionId : sessionId, socketId : socketId });
      if (response.status === 200) {
        alert('User kicked successfully.');
        // update the users list state if necessary
      }
    } catch (error) {
      console.error('Error kicking user:', error);
      // handle error
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

  const socketRef = useRef(null);

  useEffect(() => {
    console.log(roomId, username);
    // only establish a connection if roomId and username are available
    if (roomId && username) {

      socketRef.current = io(SOCKET_SERVER_URL, {
        withCredentials: true,
        query: { roomId, username },
      });

      // emit 'join room' after username is set
      socketRef.current.emit('join room', roomId, username);
      console.log('rerender occuring');

      // listener for 'user joined' event
      socketRef.current.on('user joined', (data) => {
        console.log('thisbeinghit 2', data.username);
        setUsers(prevUsers => [...prevUsers, { username: data.username, sessionId: data.sessionId, socketId: data.socketId }]);
      });

      // listener for 'room deleted'
      socketRef.current.on('room deleted', () => {
        alert('The room has been deleted.');
        
        // make request to server to clear activeRoom field in session
        axios.post('/api/sessions/clear-active-room').then(() => {
          navigate('/');
        }).catch(error => {
          console.error('Error clearing active room:', error);
        });
      });

      // listener for 'kicked'
      socketRef.current.on('kicked', () => {
        alert('You have been kicked out of the room');
        
        // make request to server to clear activeRoom field in session
        axios.post('/api/sessions/clear-active-room').then(() => {
          navigate('/');
        }).catch(error => {
          console.error('Error clearing active room:', error);
        });
      });
      
      return () => {
        // disconnect the socket on cleanup
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [roomId, username]) // depend on roomId and username

  // when the user sets their username
  const handleUsernameSubmit = (enteredUsername) => {
    setUsername(enteredUsername);
    setShowModal(false);
  }
  
  return (
    <div className="room">
      <button onClick={copyJoinLink}>Copy Join Link</button>
      <button onClick={leaveRoom}>Leave Room</button>
      <button onClick={deleteRoom}>Delete Room</button>
      <h2>Room: {roomId}</h2>
      {showModal && <UsernameModal onClose={handleUsernameSubmit} />}
      <ul>
        {users.map((user, index) => (
          <li key={index}>
            {user.username}
            {user.username !== username && <button onClick={() => kickUser(user.sessionId, user.socketId)}>Kick</button>}
          </li>
        ))}
      </ul>
      {/* ... other room content ... */}
    </div>
  );
};

export default Room;
