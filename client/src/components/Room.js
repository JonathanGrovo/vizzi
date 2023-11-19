import React, { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
// import { useSocket } from '../hooks/useSocket';
import UsernameModal from './UsernameModal';
import '../styles/UsernameModal.css'
// import { listeners } from '../../../server/models/Room';

import { WebSocketContext } from '../contexts/WebSocketContext';

const Room = () => {
  const { roomId } = useParams();
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const [joinLink, setJoinLink] = useState('');
  const navigate = useNavigate();

  const { disconnectWebSocket } = useContext(WebSocketContext);

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
        socketRef.current.emit('leave room', roomId);
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
        alert('The room has been deleted by the owner.');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  }

  // handler for kicking a user
  const kickUser = async (sessionId, socketId) => {
    try {
      console.log(sessionId, socketId);
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

  // when the page loads, the list of users is up to date
  useEffect(() => {
    // fetch current users in the room
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`/api/rooms/users/${roomId}`);
        setUsers(response.data.users);
        setCurrentSessionId(response.data.currentSessionId);
      } catch (error) {
        console.error('Error fetching room users:', error);
      }
    };

    fetchUsers();
  }, [roomId]);


  const mounted = useRef(false);

  // logic for showing or hiding modal
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      
      // Check if it's the user's first visit in this browser session
      const isFirstVisit = !sessionStorage.getItem('hasVisited');
      setShowModal(isFirstVisit);
  
      // If it's the first visit, set the flag in session storage
      if (isFirstVisit) {
        sessionStorage.setItem('hasVisited', 'true');
      }
    }
  }, []);
  
  const socketRef = useRef(null);

  useEffect(() => {
    // establish connection if roomId is available
    if (roomId) {
      socketRef.current = io(SOCKET_SERVER_URL, {
        withCredentials: true,
        query: { roomId, username: username || 'Loading...' },
      });

      // emit 'join room' after username is set
      socketRef.current.emit('join room', roomId, username || 'Loading...');

      // listener for 'user joined' event
      socketRef.current.on('user joined', (data) => {
        setUsers(prevUsers => {
          // Check if the user is already in the list
          if (prevUsers.some(user => user.sessionId === data.sessionId)) {
            return prevUsers; // User already in the list, no need to add
          }
          return [...prevUsers, { username: data.username, sessionId: data.sessionId, socketId: data.socketId }];
        });
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

      // listener for 'kicked', wherein this user is the one kicked
      socketRef.current.on('kicked', () => {
        alert('You have been kicked out of the room');
        console.log('this user is being kicked');
        
        // make request to server to clear activeRoom field in session
        axios.post('/api/sessions/clear-active-room').then(() => {
          navigate('/');
          alert('You have been kicked out of the room');
        }).catch(error => {
          console.error('Error clearing active room:', error);
        });
      });

      // listener for 'user kicked'
      socketRef.current.on('user kicked', (data) => {
        setUsers(prevUsers => prevUsers.filter(user => user.sessionId !== data.sessionId ));
        console.log(data.sessionId, 'is being kicked');
      });

      // listener for 'username updated' (may need adjustment)
      socketRef.current.on('username updated', (data) => {
        setUsers(prevUsers => {
          return prevUsers.map(user => {
            if (user.sessionId === data.sessionId) {
              return { ...user, username: data.newUsername };
            }
            return user;
          });
        });
      });

      // listener for 'update user socket'
      socketRef.current.on('update user socket', (data) => {
        setUsers(prevUsers => {
          return prevUsers.map(user => {
            if (user.sessionId === data.sessionId) {
              // update the socket id for the user
              return { ...user, socketId: data.newSocketId };
            }
            return user;
          });
        });
      });

      // listener for 'user left' event
      socketRef.current.on('user left', (data) => {
        setUsers(prevUsers => {
          // remove the user who left from the user list
          return prevUsers.filter(user => user.sessionId !== data.sessionId);
        })
      })
      
      return () => {
        // disconnect the socket on cleanup
        if (socketRef.current) {
          socketRef.current.disconnect();
        };
        socketRef.current.off('user left');
      };
    }
  }, [roomId, username]) // depend on roomId and username

  // when the user sets their username, close the modal
  const closeModal = () => {
    setShowModal(false);
  }

  // onClose={handleUsernameSubmit}
  
  return (
    <div className="room">
      <button onClick={copyJoinLink}>Copy Join Link</button>
      <button onClick={leaveRoom}>Leave Room</button>
      <button onClick={deleteRoom}>Delete Room</button>
      <h2>Room: {roomId}</h2>
      {showModal && <UsernameModal closeModal={closeModal} setUsername={setUsername}/>}
      <ul>
        {users.map((user, index) => (
          <li key={index}>
            {user.username}
            {currentSessionId && user.sessionId !== currentSessionId && (
            <button onClick={() => kickUser(user.sessionId, user.socketId)}>Kick</button>
            )}
          </li>
        ))}
      </ul>
      {/* ... other room content ... */}
    </div>
  );
};

export default Room;
