// socketHandlers/socketEvents.js

module.exports = function (io) {
    io.on('connection', (socket) => {
        console.log(`A user connected with session ID: ${socket.sessionID}`);

        // Handle a user joining a room
        socket.on('join room', (roomCode) => {
            socket.join(roomCode);

            // access username from the session
            const username = socket.request.session.username;

            // emit to all other users in the room
            socket.to(roomCode).emit('user joined', { username, id: socket.id });

            console.log(`User ${username} with session ID ${socket.sessionID} has joined room ${roomCode}`);
        });

        // Handle a user leaving a room
        socket.on('leave room', (roomCode) => {
            console.log(`User with session ID ${socket.sessionID} is leaving room ${roomCode}`);            
            socket.leave(roomCode);
            // You may want to emit an event to the room to announce that a user has left
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`User ${socket.id} has disconnected`);
            // You may want to handle additional cleanup here
        });

        // More event handlers as needed...
    });
};

  