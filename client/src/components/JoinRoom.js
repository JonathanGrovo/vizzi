import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function JoinRoom() {
  const { roomId } = useParams();
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [activeRoom, setActiveRoom] = useState(null);

  const mounted = useRef(false);

  const handleRoomSwitch = async (activeRoom) => {
    try {
      // // websocket disconnection logic
      // if (socketRef.current) {
      //   socketRef.current.emit('leave room', activeRoom);
      //   socketRef.current.disconnect();
      // }

      // disconnect from the current websocket connection for the active room
      disconnectWebSocket(activeRoom);

      // leave current room api endpoint
      await axios.post(`/api/rooms/leave/${activeRoom}`);

      // // join new room
      // const joinResponse = await axios.post(`/api/rooms/join/${roomId}`);
      // if (joinResponse.data.error) {
      //   setMessage(joinResponse.data.error);
      // } else {
      //   // establish new websocket connection for new room
      //   socketRef.current = io(SOCKET_SERVER_URL, {
      //     withCredentials: true,
      //     query: { roomId },
      //   });
      //   socketRef.current.emit('join room', roomId);

      //   navigate(`/room/${roomId}`);

      // if pass activeRoom check, just join room
      const validationResponse = await axios.post(`/api/rooms/join/${roomId}`);
      if (validationResponse.data.error) {
        setMessage(validationResponse.data.error);
      } else {
        navigate(`/room/${roomId}`);
      }
    } catch (error) {
      setMessage('Error switching rooms. Please try again.');
    }
  };

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      const validateAndJoinRoom = async () => {
        try {
          // Check if user is already in a different room
          const activeRoomResponse = await axios.get('/api/sessions/active-room');
          setActiveRoom(activeRoomResponse.data.activeRoom);          
          if (activeRoom && activeRoom !== roomId) {
            setShowConfirmDialog(true);
            return;
          }

          // if pass activeRoom check, just join room
          const validationResponse = await axios.post(`/api/rooms/join/${roomId}`);
          if (validationResponse.data.error) {
            setMessage(validationResponse.data.error);
          } else {
            navigate(`/room/${roomId}`);
          }
        } catch (error) {
          setMessage('Error joining room. Please try again.');
        }
      };

      validateAndJoinRoom();
    }
  }, [roomId, navigate]);

  return (
    <div>
      <h1>Join Room</h1>
      {showConfirmDialog ? (
        <div>
          <p>{message}</p>
          <button onClick={handleRoomSwitch}>Yes, switch rooms</button>
          <button onClick={() => navigate('/')}>No, stay in the current room</button>
        </div>
      ) : (
        <p>{message}</p>
      )}
    </div>
  );
  
}

export default JoinRoom;
