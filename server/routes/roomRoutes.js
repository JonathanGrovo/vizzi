const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const User = require('../models/User');

// defines lax room size
const MAX_ROOM_SIZE = 10;

// function for generating unique room codes
async function generateUniqueRoomCode(length = 6) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let roomCode;

    do {
        roomCode = '';
        for (let i = 0; i < length; i++) {
            roomCode += characters.charAt(Math.floor(Math.random() * characters.length));
        }
    } while (await Room.findOne({ code: roomCode })); //loops until code not found in database

    return roomCode;
}

// route definitions:

// creating room logic
router.post('/', async (req, res) => { // allows for use of await keyword
    try {
        const roomCode = await generateUniqueRoomCode();
        // using schema to construct a new room document
        const newRoom = new Room({
            code: roomCode,
            owner: req.body.userId // assuming userId sent in request body
        });
        await newRoom.save(); // saves new room to database, waits before cont.
        res.json({ roomCode }); // response back to client
    } catch (error) {
        res.status(500).json({ error: 'Error creating room. Please try again.' });
    }
});


// joining room logic
router.post('/join', async (req, res) => {
    try {
        // query for finding room with code matching one sent in req body
        const room = await Room.findOne({ code: req.body.roomCode });

        if (!room) { // if a room was not found
            return res.status(400).json({ error: 'Invalid room code.' });
        }

        // check if room has reaached capacity
        if (room.users.length >= MAX_ROOM_SIZE) {
            return res.status(400).json({ error: 'Room is full.' });
        }

        const user = await User.findById(req.body.userId); // searching for user based on user id

        // Check if user is already in the room they're trying to join
        if (user.roomId && user.roomId.toString() === room._id.toString()) {
            return res.status(400).json({ error: 'You are already in this room.' });
        }

        user.roomId = room._id; // roomId of user is id of room being joined
        await user.save(); // saves to database

        // add the user to the room's users array without duplicates
        await Room.updateOne({ _id: room._id }, { $addToSet: { users: user._id } });

        res.json({ message: 'Joined room successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Error joining room. Please try again.' });
    }
});

// leaving room logic
router.post('/leave', async (req, res) => {
    try {
        const room = await Room.findOne({ code: req.body.roomCode });
        const user = await User.findById(req.body.userId); // searching for user based on user id

        if (room && user) { // if the room and the user specified are found

            // If the user is the owner and there are more users in the room
            if (String(room.owner) === String(user._id) && room.users.length > 1) {
                // The frontend should prompt the owner to pick a new owner and send their ID in the request
                if (!req.body.newOwnerId) {
                    return res.status(400).json({ message: 'Please provide a new room owner.' });
                }

                const newOwner = await User.findById(req.body.newOwnerId);
                if (!newOwner) {
                    return res.status(400).json({ message: 'New owner not found.' });
                }

                room.owner = newOwner._id;
                await room.save();
            }

            // Remove the user from the room's users array
            await Room.updateOne({ _id: room._id }, { $pull: { users: user._id } });

            user.roomId = null; // Set roomId to null since we are leaving a room
            await user.save();

            // fetch updated room data to check remaining users
            const updatedRoom = await Room.findById(room._id);

            // if no users left, delete the room
            if (updatedRoom.users.length === 0) {
                await Room.deleteOne({ _id: updatedRoom._id });
                return res.json({ message: 'Left room successfully and room has been deleted as it is empty.' });
            }

            res.json({ message: 'Left room successfully!' });
        } else {
            res.status(400).json({ error: 'Invalid room code.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error leaving room. Please try again.' });
    }
});


// getting room details logic
router.get('/:roomCode', async (req, res) => { // :roomCode is a route parameter
    try {
        // look for roomCode matching one provided in url
        const room = await Room.findOne({ code: req.params.roomCode })
                            .populate('owner', 'name') // get owner's name
                            .populate('users', 'name') // gets names of all users in room
        if (room) {
            // array of all users currently in the room
            const usersInRoom = await User.find({ roomId: room._id });
            res.json({ room, users: usersInRoom }); // room details and list of users in room as JSON
        } else { // room wasn't found
            res.status(404).json({ error: 'Room not found.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching room details. Please try again.' });
    }
});

// room deletion upon owner request logic
router.delete('/delete', async (req, res) => {
    try {
        const room = await Room.findOne({ code: req.body.roomCode });
        const user = await User.findById(req.body.userId);

        if (!room || !user) {
            return res.status(400).json({ error: 'Invalid room code or user.' });
        }

        // ensure the user is the owner of the room
        if (String(room.owner) !== String(user._id)) {
            return res.status(403).json({ error: 'Only the owner can delete the room' });
        }

        // set roomId to null for all users in the room
        await User.updateMany({ roomId: room._id }, { $set: { roomId: null } });

        // delete the room
        await Room.deleteOne({ _id: room._id });

        res.json({ message: 'Room deleted successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting room. Please try again.' });
    }
})

// other room related routes go here

// export router
module.exports = router;