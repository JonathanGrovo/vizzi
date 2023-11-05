const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

// function for generating unique room codes
async function generateUniqueRoomCode(length = 6) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
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

// for validating if a room exists (prior to username prompt)
router.post('/validate', async (req, res) => {
    const { roomCode } = req.body; // gets room code from req body

    try {
        // finds the room if it exists
        const room = await Room.findOne({ code: roomCode });
        if (room) {
            res.json({ valid: true });
        } else {
            res.status(404).json({ error: 'Room not found.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error validating room. Please try again.' });
    }
});

// room creation logic
router.post('/create', async (req, res) => {
    // Check if a username is set in the session
    if (!req.session || !req.session.username) {
        return res.status(400).json({ error: 'Username is required to create a room.' });
    }

    try {
        const session = req.session;
        const sessionId = session.id; // session ID from express-session

        // Check if the user is already in any room
        const existingMembership = await Room.findOne({ users: sessionId });
        if (existingMembership) {
            return res.status(400).json({ error: 'You are already in a room.' });
        }

        // Generate a unique room code
        const roomCode = await generateUniqueRoomCode();
        
        // Construct a new room document using the Room model
        const newRoom = new Room({
            code: roomCode,
            owner: sessionId, // use session ID as owner
            users: [sessionId], // add the session ID to the users array
            settings: { // Accept settings from the request body, with defaults
                maxUsers: req.body.maxUsers || 10,
                muteOnEntry: req.body.muteOnEntry || false
            }
        });

        // Save the new room to the database
        await newRoom.save();

        // Update session to reflect room ownership and membership
        session.activeRoom = roomCode; // or session.roomCode if you prefer that naming
        // await session.save();

        res.status(201).json({ roomCode });
    } catch (error) {
        res.status(500).json({ error: 'Error creating room. Please try again.' });
    }
});

// logic for joining a room
router.post('/join', async (req, res) => {
    // if no session exists, or if no username exists for the session
    if (!req.session || !req.session.username) {
        return res.status(400).json({ error: 'Username is required to join a room.' });
    }

    try {
        // query for finding room with code matching one sent in req body, not depending on case
        const room = await Room.findOne({ code: { $regex: new RegExp(`^${req.body.roomCode}$`, 'i') } });

        if (!room) { // if room with given code does not exist
            return res.status(404).json({ error: 'Invalid room code.' });
        }

        // check if room has reached capacity
        if (room.users.length >= room.settings.maxUsers) {
            return res.status(400).json({ error: 'Room is full.' });
        }

        const sessionId = req.session.id;

        // Check if user is already in the room they're trying to join
        if (room.users.includes(sessionId)) {
            return res.status(400).json({ error: 'You are already in this room.' });
        }

        // add the user to the room's users array without duplicates
        room.users.push(sessionId); // Alternatively use $addToSet as you did before
        await room.save();

        // Set room code in session to indicate user has joined the room
        req.session.activeRoom = room.code;
        // await req.session.save();

        res.status(200).json({ message: 'Joined room successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Error joining room. Please try again.' });
    }
});

// leaving room logic
router.post('/leave', async (req, res) => {
    if (!req.session || !req.session.activeRoom) {
        return res.status(400).json({ error: 'You are not in a room.' });
    }

    try {
        const roomId = req.session.activeRoom;
        const room = await Room.findOne({ code: roomId });

        if (!room) {
            return res.status(404).json({ error: 'Room not found.' });
        }

        // Remove the user from the room's users array
        room.users.pull(req.session.sessionId);

        // Check if the owner is trying to leave
        if (req.session.sessionId === room.owner) {
            // If there are other users in the room, ask for ownership transfer
            if (room.users.length > 0) {
                // This is a placeholder. Implement the ownership transfer logic
                // based on your application's requirements.
                return res.status(403).json({ error: 'Please transfer ownership before leaving the room.' });
            } else {
                // If the owner is the last to leave, delete the room.
                await Room.deleteOne({ _id: room._id });
                req.session.destroy();
                return res.json({ message: 'Left room and deleted it successfully.' });
            }
        }

        // If not the owner, just leave the room.
        await room.save();

        // Clear the activeRoom from the session
        delete req.session.activeRoom;

        // Consider whether you really want to destroy the session here.
        // If you have other data in the session you might just want to save the changes.
        // req.session.destroy();

        // Save the session state after making changes
        await req.session.save();

        res.json({ message: 'Left room successfully.' });

    } catch (error) {
        res.status(500).json({ error: 'Error leaving room. Please try again.' });
    }
});

// getting room details logic
router.get('/:roomCode', async (req, res) => {
    try {
        const room = await Room.findOne({ code: req.params.roomCode });
        if (room) {
            // Simplified response as there is no user name to populate.
            // This response only includes session IDs of users in the room.
            res.json({ room, users: room.users });
        } else {
            res.status(404).json({ error: 'Room not found.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching room details. Please try again.' });
    }
});


// room deletion upon owner request logic
router.delete('/delete/:roomCode', async (req, res) => {
    // Use params for sensitive actions like deleting.
    const roomCode = req.params.roomCode;

    try {
        const room = await Room.findOne({ code: roomCode });

        if (!room) {
            return res.status(404).json({ error: 'Room not found.' });
        }

        if (String(room.owner) !== String(req.session.sessionId)) {
            return res.status(403).json({ error: 'Only the owner can delete the room.' });
        }

        // If there is a User model or equivalent, update their roomId to null.
        // Otherwise, this step is not necessary.
        // await User.updateMany({ roomId: room._id }, { $set: { roomId: null } });

        await Room.deleteOne({ _id: room._id });
        res.json({ message: 'Room deleted successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting room. Please try again.' });
    }
});


// other room related routes go here

// export router
module.exports = router;