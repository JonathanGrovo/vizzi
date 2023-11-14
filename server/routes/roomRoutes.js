const express = require('express');
const router = express.Router();
const Room = require('../models/Room');


module.exports = (io) => {
    // room creation logic
    router.post('/create', async (req, res) => {
        try {
            const session = req.session;
            const sessionId = session.id; // session ID from express-session

            // Check if the user is already in any room
            const existingMembership = await Room.findOne({ 'users.sessionId': sessionId });
            if (existingMembership) {
                return res.status(400).json({ error: 'You are already in a room.' });
            }
            
            // Construct a new room document using the Room model
            const newRoom = new Room({
                owner: sessionId, // use session ID as owner
                users: [{
                    sessionId: sessionId, // add the session ID to the users array
                    status: 'online',    // set initial status to online
                    lastActive: new Date() // set lastActive to the current time
                }],
                settings: { // Accept settings from the request body, with defaults
                    maxUsers: req.body.maxUsers || 10,
                }
            });

            // save new room to the database
            const savedRoom = await newRoom.save();

            // Update session to reflect room ownership and membership
            session.activeRoom = savedRoom._id.toString();

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
            if (room.users.some(user => user.sessionId === sessionId)) {
                return res.status(400).json({ error: 'You are already in this room.' });
            }

            // Add user to room's users array
            room.users.push({
                sessionId: sessionId,
                status: 'online',    // set user status to online
                lastActive: new Date() // set lastActive to current time
            });
            await room.save();

            // Set room _id in session to indicate user has joined the room
            req.session.activeRoom = roomId;

            res.status(200).json({ message: 'Joined room successfully!' });
        } catch (error) {
            res.status(500).json({ error: 'Error joining room. Please try again.' });
        }
    });

    // leaving room logic
    router.post('/leave/:roomId', async (req, res) => {
        if (!req.session || !req.session.activeRoom) {
            return res.status(400).json({ error: 'You are not in a room.' });
        }

        try {
            const roomId = req.session.activeRoom;
            const sessionId = req.session.id;
            // Find room by _id
            const room = await Room.findById(roomId);

            if (!room) {
                return res.status(404).json({ error: 'Room not found.' });
            }

            // Check if the user is in the room
            const userIndex = room.users.findIndex(user => user.sessionId === sessionId);
            if (userIndex === -1) {
                return res.status(400).json({ error: 'You are not in this room.' });
            }

            // Remove the user from the room's users array
            room.users.splice(userIndex, 1);

            // check if the room is now empty
            if (room.users.length === 0) {
                // delete the room as it's empty
                await Room.deleteOne({ _id: roomId });

                // clear the activeRoom of the session
                delete req.session.activeRoom;
                await req.session.save();

                res.json({ message: 'Room deleted successfully as it was empty.' });
            } else {
                // Check if the owner is trying to leave
                if (sessionId === room.owner) {
                    room.owner = room.users[0].sessionId;
                }

                await room.save();

                // Clear the activeRoom from the session
                delete req.session.activeRoom;
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

    // endpoint for kicking users from the room
    router.post('/kick/:roomId', async (req, res) => {
        const roomId = req.params.roomId;
        const userToKick = req.body.sessionId;
        const userToKickSocketId = req.body.socketId;

        console.log('1');

        try {
            const room = await Room.findById(roomId);
            if (!room) {
                return res.status(404).json({ error: 'Room not found.' });
            }

            // Check if the requester is the room owner
            if (String(room.owner) !== String(req.session.id)) {
                return res.status(403).json({ error: 'Only the owner can kick users.' });
            }

            // Check if the user to be kicked is in the room
            const userIndex = room.users.findIndex(user => user.sessionId === userToKick);
            if (userIndex === -1) {
                console.log(userToKick);

                return res.status(400).json({ error: 'User not found in the room.' });
            }

            // Remove the user from the room
            room.users.splice(userIndex, 1);
            await room.save();

            // notify kicked user via WebSocket
            io.to(userToKickSocketId).emit('kicked', { message: 'You have been kicked out of the room.' });

            res.json({ message: 'User kicked successfully.' });
        } catch (error) {
            res.status(500).json({ error: 'Error kicking user. Please try again.' });
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

            // notify room members of room deletion
            io.to(roomId).emit('room deleted', { message: 'Room has been deleted by the owner.' });

            // delete the room
            await Room.deleteOne({ _id: room._id });
            res.json({ message: 'Room deleted successfully!' });

            // Additional cleanup after deletion if needed
        } catch (error) {
            res.status(500).json({ error: 'Error deleting room. Please try again.' });
        }
    });

    // other room related routes go here

    return router;
};