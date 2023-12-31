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
        
            // Check if the user already has a username, if not autogenerate one
            const username = req.session.username || `User${Math.floor(Math.random() * 10000)}`;

            // Construct a new room document using the Room model
            const newRoom = new Room({
                owner: sessionId, // use session ID as owner
                users: [{
                    sessionId: sessionId,
                    socketId: req.body.socketId,
                    username: username, // use existing or autogenerated username
                    status: 'online',
                    lastActive: new Date()
                }],
                settings: { // Accept settings from the request body, with defaults
                    maxUsers: req.body.maxUsers || 10,
                }
            });
    
            // save new room to the database
            const savedRoom = await newRoom.save();
    
            // Update session to reflect room ownership and membership
            session.activeRoom = savedRoom._id.toString();
            
            // Update session username only if it was autogenerated
            if (!req.session.username) {
                req.session.username = username;
            }
    
            res.status(201).json({ roomId: savedRoom._id, username: username }); // return _id and username for frontend use
        } catch (error) {
            console.error('Error saving room:', error);
            res.status(500).json({ error: error.message || 'Error creating room. Please try again.' });
        }
    });
    

    // Endpoint for joining a room and setting an initial username
    router.post('/join/:roomId', async (req, res) => {
        const { roomId } = req.params;
        const sessionId = req.session.id;

        try {
            const room = await Room.findById(roomId);

            if (!room) {
                return res.status(404).json({ error: 'Room not found.' });
            }

            // Check if room has reached capacity
            if (room.users.length >= room.settings.maxUsers) {
                return res.status(400).json({ error: 'Room is full.' });
            }

            // Check if user is already in the room
            if (room.users.some(user => user.sessionId === sessionId)) {
                return res.status(400).json({ error: 'You are already in this room.' });
            }

            // Check if the user already has a username, if not autogenerate one
            const username = req.session.username || `User${Math.floor(Math.random() * 10000)}`;

            // Add user to room's users array with existing or autogenerated username
            room.users.push({
                sessionId: sessionId,
                socketId: req.body.socketId,
                username: username,
                status: 'online',
                lastActive: new Date()
            });
            await room.save();

            // Set room _id in session
            req.session.activeRoom = roomId;

            // Update session username only if it was autogenerated
            if (!req.session.username) {
                req.session.username = username;
            }

            res.status(200).json({ message: 'Joined room successfully!', username: username });
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
                return res.status(400).json({ error: 'User not found in the room.' });
            }

            // Remove the user from the room
            room.users.splice(userIndex, 1);
            await room.save();

            // notify kicked user via WebSocket
            io.to(userToKickSocketId).emit('this kicked', { message: 'You have been kicked out of the room.' });

            // notify all other users of kicked user
            io.to(roomId).emit('other kicked', { sessionId: userToKick });

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

    // get endpoint to fetch users in a room
    router.get('/users/:roomId', async (req, res) => {
        try {
            const roomId = req.params.roomId;
            const room = await Room.findById(roomId);
    
            if (!room) {
                return res.status(404).send('Room not found');
            }
    
            // Include the current user's session ID in the response
            const currentSessionId = req.session.id; // Assuming you are using express-session
    
            res.json({ users: room.users, currentSessionId });
        } catch (error) {
            console.error('Error fetching room users:', error);
            res.status(500).send('Internal server error');
        }
    });
    

    // other room related routes go here

    return router;
};