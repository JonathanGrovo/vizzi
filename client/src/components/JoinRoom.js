import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { WebSocketContext } from '../contexts/WebSocketContext';

function JoinRoom() {
  const { roomId } = useParams();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const navigate = useNavigate();
  const { disconnectWebSocket } = useContext(WebSocketContext);
  const isJoiningRoomRef = useRef(false); // ref to track join request
  const checkingActiveRoom = useRef(false); // ref to track if checking active room

  const handleRoomSwitch = async () => {
    try {
      // retrieve the current room ID
      const activeRoomResponse = await axios.get('/api/sessions/active-room');
      const currentActiveRoom = activeRoomResponse.data.activeRoom;

      if (!currentActiveRoom) {
        console.log('No active room found to leave.');
        return;
      }

      console.log('disconnecting from room', currentActiveRoom);
      disconnectWebSocket(); // disconnect from the current room

      // make the api call to leave the current active room
      await axios.post(`/api/rooms/leave/${currentActiveRoom}`);

      // proceed to join the new room
      await joinNewRoom();
    } catch (error) {
      console.error('Error switching rooms:', error);
    }
  }

  const joinNewRoom = async () => {
    
    if (isJoiningRoomRef.current) {
      console.log('Join request already in progress');
      return;
    }

    console.log('join request started')
    isJoiningRoomRef.current = true; // set the ref

    try {
      const response = await axios.post(`/api/rooms/join/${roomId}`);
      if (response.data.error) {
        console.log(response.data.error);
        // setIsJoiningRoom(false); // reset flag on error
      } else {
        navigate(`/room/${roomId}`);
        console.log('navigating to:', `/room/${roomId}`);
      }
    } catch (error) {
      console.log('Error joining room:', error);
      // setIsJoiningRoom(false); // reset flag on error
    } finally {
      isJoiningRoomRef.current = false; // reset the ref
    }
  };

  const validateAndHandleRoomJoin = async () => {

    if (checkingActiveRoom.current) {
      console.log('we are in the process of checking active room');
      return;
    }

    console.log('active room validation started');
    checkingActiveRoom.current = true; // set the ref

    try {
      console.log('WE ARE HITTING NUMBER 2');
      const activeRoomResponse = await axios.get('/api/sessions/active-room');
      const currentActiveRoom = activeRoomResponse.data.activeRoom;

      console.log(currentActiveRoom, roomId);

      if (currentActiveRoom && currentActiveRoom !== roomId) {
        setShowConfirmDialog(true);
        console.log('ConfirmDialog:', showConfirmDialog);
      } else {
        await joinNewRoom();
      }
    } catch (error) {
      console.error('Error during room validation:', error);
    } finally {
      checkingActiveRoom.current = false;
    }
  };

  useEffect(() => {
    validateAndHandleRoomJoin();
  }, [roomId]);

  return (
    <div>
      <h1>Join Room</h1>
      {showConfirmDialog ? (
        <div>
          <p>You are already in a different room. Do you want to leave that room and join this one?</p>
          <button onClick={handleRoomSwitch}>Yes, switch rooms</button>
          <button onClick={() => navigate('/')}>No, stay in the current room</button>
        </div>
      ) : null}
    </div>
  );
}

export default JoinRoom;
