// socketHandlers/socketEvents.js

module.exports = function (io) {
    io.on('connection', (socket) => {
        console.log(`A user connected with session ID: ${socket.sessionID}`);

        // Handle a user joining a room
        socket.on('join room', (roomCode) => {
            console.log(`User with session ID ${socket.sessionID} is joining room ${roomCode}`);
            socket.join(roomCode);
            // You may want to emit an event to the room to announce that a new user has joined
            socket.to(roomCode).emit('user joined', { id: socket.id });
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

  