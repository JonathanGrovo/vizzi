const express = require('express');
const Room = require('../models/Room');

const router = express.Router();

// use session data to check if the user is in a room
router.get('/checkroom', async (req, res) => {
    console.log('hitting checkroom!');

    try {
        // attempt to find room based on session ID from express-session
        const room = await findRoomBySessionId(req.session.id);

        if (room) { // if we find a room
            res.json({ inRoom: true, roomCode: room.code });
        } else {
            res.json({ inRoom: false });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// for checking if a user has a related session
router.get("/checksession", (req, res) => {
    console.log('hitting checksession!');
    if (req.session) {
      res.json({
        userId: req.session.userId,
        isInRoom: req.session.isInRoom,
        roomCode: req.session.roomCode,
      });
    } else {
      res.json({
        userId: null,
        isInRoom: false,
        roomCode: null,
      });
    }
});

// helper function for finding room based on session ID
async function findRoomBySessionId(sessionId) {
    try {
        return await Room.findOne({ 'users': sessionId });
    } catch (error) { // some database error
        console.error("Error finding room by session ID:", error);
        throw new Error('Could not find session.');
    }
}

module.exports = router;
