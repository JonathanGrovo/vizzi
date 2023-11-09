import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';

const Room = () => {
  const { roomCode } = useParams();
  const [users, setUsers] = useState([]);

  // Establish the socket connection and set up event listeners
  const socket = useSocket(roomCode);

  useEffect(() => {
    if (socket) { // if a connection exists
      // Listen for the 'user joined' event from the server
      socket.on('user joined', (data) => {
        console.log(`${data.username} has joined the room.`);
        // Add the new user to the list of users in state
        setUsers(prevUsers => [...prevUsers, data.username]);
      });

      // Clean up the event listener when the component unmounts
      return () => {
        socket.off('user joined');
      };
    }
  }, [socket]);

  // Render the room and the list of users
  return (
    <div>
      <h2>Room: {roomCode}</h2>
      <ul>
        {users.map((user, index) => (
          <li key={index}>{user}</li>
        ))}
      </ul>
      {/* ... other room content ... */}
    </div>
  );
};

export default Room;
