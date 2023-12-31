// socketHandlers/socketEvents.js

const Room = require("../models/Room");

module.exports = function (io) {
    io.on('connection', (socket) => {
        console.log(`A user connected with session ID: ${socket.sessionId}`);

        // Handle a user joining a room
        socket.on('join room', async (roomId, username) => {

            socket.join(roomId);

            // access username from the session
            // const username = socket.request.session.username;
            if (!username) return; // only proceed if username is set

            // emit to all other users in the room
            socket.to(roomId).emit('user joined', {
                username,
                sessionId: socket.sessionId,
                socketId: socket.id
            })

            // update socketId in room's user list
            const room = await Room.findOne({ _id: roomId });
            const user  = room.users.find(u => u.sessionId === socket.sessionId);
            
            // after updating the user's socket ID in the room
            if (user) {
                user.socketId = socket.id;
                await room.save();

                // emit an event to update the socket ID for all clients
                io.to(roomId).emit('update user socket', {
                    sessionId: socket.sessionId,
                    newSocketId: socket.id
                })
            }
            console.log(`User ${username} with session ID ${socket.sessionId} and socket ID ${socket.id} has joined room ${roomId}`);
        });

        socket.on('update username', async (newUsername) => {
            // ... validate username ...

            // Find room and update username and socket ID
            const room = await Room.findOne({ 'users.sessionId': socket.sessionId });
            const user = room.users.find(u => u.sessionId === socket.sessionId);
            if (user) {
                user.username = newUsername;
                user.socketId = socket.id;
                await room.save();

                // Notify other users in the room
                io.to(room._id).emit('username updated', { sessionId: socket.sessionId, newUsername });
            }
            console.log('username updated');
        });

        // handle a user leaving a room
        socket.on('leave room', async (roomId) => {
            console.log(`User with session ID ${socket.sessionId} is leaving room ${roomId}`);    
            
            // emit an event to the room
            io.to(roomId).emit('user left', { sessionId: socket.sessionId });

            socket.leave(roomId);
        })

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`User ${socket.id} has disconnected`);
            // You may want to handle additional cleanup here
        });

        // More event handlers as needed...
    });
};

  