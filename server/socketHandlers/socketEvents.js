// socketHandlers/socketEvents.js

const Room = require("../models/Room");

module.exports = function (io) {
    io.on('connection', (socket) => {
        console.log(`A user connected with session ID: ${socket.sessionId}`);

        // Handle a user joining a room
        socket.on('join room', async (roomCode) => {

            socket.join(roomCode);

            // access username from the session
            const username = socket.request.session.username;
            if (!username) return; // only proceed if username is set


            console.log(username);
            // emit to all other users in the room
            socket.to(roomCode).emit('user joined', {
                username,
                sessionId: socket.sessionId,
                socketId: socket.id
            })

            console.log(`User ${username} with session ID ${socket.sessionId} and socket ID ${socket.id} has joined room ${roomCode}`);

            // update socketId in room's user list
            const room = await Room.findOne({ _id: roomCode });
            const user  = room.users.find(u => u.sessionId === socket.sessionId);
            
            // after updating the user's socket ID in the room
            if (user) {
                console.log('on join room');
                user.socketId = socket.id;
                await room.save();

                // emit and event to update the socket ID for all clients
                io.to(roomCode).emit('update user socket', {
                    sessionId: socket.sessionId,
                    newSocketId: socket.id
                })
            }
        });

        socket.on('update username', async (newUsername) => {
            // ... validate username ...

            console.log('we are getting this faer..');
            // Find room and update username and socket ID
            const room = await Room.findOne({ 'users.sessionId': socket.sessionId });
            const user = room.users.find(u => u.sessionId === socket.sessionId);
            if (user) {
                console.log('on username update');
                user.username = newUsername;
                user.socketId = socket.id;
                await room.save();

                // Notify other users in the room
                io.to(room._id).emit('username updated', { sessionId: socket.sessionId, newUsername });
            }
        });

        // // Handle a user leaving a room
        // socket.on('leave room', (roomCode) => {
        //     console.log(`User with session ID ${socket.sessionId} is leaving room ${roomCode}`);            
        //     socket.leave(roomCode);
        //     // You may want to emit an event to the room to announce that a user has left
        // });

        // handle a user leaving a room
        socket.on('leave room', async (roomCode) => {
            console.log(`User with session ID ${socket.sessionId} is leaving room ${roomCode}`);    
            
            // emit an event to the room
            io.to(roomCode).emit('user left', { sessionId: socket.sessionId });

            socket.leave(roomCode);
        })

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`User ${socket.id} has disconnected`);
            // You may want to handle additional cleanup here
        });

        // More event handlers as needed...
    });
};

  