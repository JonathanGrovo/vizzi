const express = require('express');
const User = require('../models/User');
const Room = require('../models/Room');
const router = express.Router();

router.post('/setup', async (req, res) => {
    console.log('Received request data:', req.body);  // <-- Log incoming data
    try {
        const { name } = req.body;

        // new user created
        const user = new User({
            name: name
        });

        console.log(`${user}`);


        await user.save();

        res.json({ message: "User setup successful", userId: user._id });

    } catch (error) {
        console.error('Detailed error:', error);  // <-- log the detailed error here
        res.status(500).json({ error: 'Error setting up user.' });
    }
});

// for checking if a user is in a room
router.get('/:userId/room', async (req, res) => {
    const userId = req.params.userId; // gets userId from request body
    const room = await findRoomByUserId(userId); // attempts to find room based on userId
    if (room) {
        res.json({ inRoom: true, roomCode: room.code }); // return true with roomId
    } else {
        res.json({ inRoom: false});
    }
});

// helper function to find a room by userId
async function findRoomByUserId(userId) {
    // Check if the user is an owner of a room
    const roomAsOwner = await Room.findOne({ owner: userId });

    // If found, return the room
    if (roomAsOwner) {
        return roomAsOwner;
    }

    // Otherwise, check if the user is in any room
    const roomAsUser = await Room.findOne({ 'users': userId });

    // If found, return the room
    if (roomAsUser) {
        return roomAsUser;
    }

    // If the user is neither an owner nor a user in any room, return null
    return null;
}

module.exports = router;