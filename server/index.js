require('dotenv').config();

const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const sessionRoutes = require('./routes/sessionRoutes');
const roomRoutes = require('./routes/roomRoutes');
// const audioRoutes = require('./routes/audioRoutes');

const { PORT, DATABASE_URL, SESSION_SECRET } = require('./config');
const MongoDBStore = require('connect-mongodb-session')(session);

// for real time functionality
const http = require('http');
const { Server } = require('socket.io');
const socketEvents = require('./socketHandlers/socketEvents');

const app = express();

const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // client origin
        methods: ["GET", "POST", "DELETE"],
        credentials: true // allow credentials
    }
});

// attach event handlers to io instance
socketEvents(io);

app.use(cors({
    origin: "http://localhost:3000", // client origin
    methods: ["GET", "POST", "DELETE"],
    credentials: true // allow credentials
}));

app.use(cookieParser());
app.use(express.json());

const store = new MongoDBStore({
    uri: DATABASE_URL,
    collection: 'sessions'
});

store.on('error', function(error) {
    console.error('SESSION STORE ERROR:', error);
    // Add more robust error handling here
});

const sessionMiddleware = session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 2 // 2 hours
    }
});

app.use(sessionMiddleware);

// Wrap session middleware for Socket.IO to access session data
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));

// middleware for socket.io to access session data
io.use((socket, next) => {
    const session = socket.request.session;
    if (session) {
        // log session id
        console.log(`Session ID: ${session.id}`);

        // assign session id to the socket for later use
        socket.sessionId = session.id;

        next();
    } else {
        // If there is no session or it doesn't have the userId, it's an unauthorized access
        next(new Error('unauthorized'));
    }
});

mongoose.connect(DATABASE_URL)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

app.use('/api/sessions', sessionRoutes);
app.use('/api/rooms', roomRoutes(io)); // pass io instance
// app.use('/api/audios', audioRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
