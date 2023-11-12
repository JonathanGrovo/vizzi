const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

// room creation logic
router.post('/create', async (req, res) => {
    try {
        const session = req.session;
        const sessionId = session.id; // session ID from express-session

        // Check if the user is already in any room
        const existingMembership = await Room.findOne({ users: sessionId });
        if (existingMembership) {
            return res.status(400).json({ error: 'You are already in a room.' });
        }
        
        // Construct a new room document using the Room model
        const newRoom = new Room({
            owner: sessionId, // use session ID as owner
            users: [sessionId], // add the session ID to the users array
            settings: { // Accept settings from the request body, with defaults
                maxUsers: req.body.maxUsers || 10,
                muteOnEntry: req.body.muteOnEntry || false
            }
        });

        // save new room to the database
        const savedRoom = await newRoom.save();

        // Update session to reflect room ownership and membership
        session.activeRoom = savedRoom._id;

        res.status(201).json({ roomId: savedRoom._id }); // return _id for frontend use
    } catch (error) {
        // res.status(500).json({ error: 'Error creating room. Please try again.' });
        console.error('Error saving room:', error);
        res.status(500).json({ error: error.message || 'Error creating room. Please try again.' });
    }
});

// logic for joining a room using room ID in the URL
router.get('/join/:roomId', async (req, res) => {
    const { roomId } = req.params;

    try {
        // Find room by _id
        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({ error: 'Room not found.' });
        }

        // Check if room has reached capacity
        if (room.users.length >= room.settings.maxUsers) {
            return res.status(400).json({ error: 'Room is full.' });
        }

        const sessionId = req.session.id;

        // Check if user is already in the room
        if (room.users.includes(sessionId)) {
            return res.status(400).json({ error: 'You are already in this room.' });
        }

        // Add user to room's users array
        room.users.push(sessionId);
        await room.save();

        // Set room _id in session to indicate user has joined the room
        req.session.activeRoom = roomId;

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
        // Find room by _id instead of code
        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({ error: 'Room not found.' });
        }

        // Remove the user from the room's users array
        room.users.pull(req.session.id); // Ensure you're using the correct session identifier

        // Check if the owner is trying to leave
        if (req.session.id === room.owner) {
            // Ownership transfer logic here
            // ...
        } else {
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
        }
    } catch (error) {
        res.status(500).json({ error: 'Error leaving room. Please try again.' });
    }
});

// getting room details logic
router.get('/:roomId', async (req, res) => {
    try {
        const room = await Room.findById(req.params.roomId);
        if (room) {
            res.json({ room, users: room.users });
        } else {
            res.status(404).json({ error: 'Room not found.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching room details. Please try again.' });
    }
});

// room deletion upon owner request logic
router.delete('/delete/:roomId', async (req, res) => {
    const roomId = req.params.roomId;

    try {
        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({ error: 'Room not found.' });
        }

        if (String(room.owner) !== String(req.session.id)) {
            return res.status(403).json({ error: 'Only the owner can delete the room.' });
        }

        await Room.deleteOne({ _id: room._id });
        res.json({ message: 'Room deleted successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting room. Please try again.' });
    }
});

// other room related routes go here

// export router
module.exports = router;