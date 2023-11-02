require('dotenv').config(); // for environment variables

const express = require('express'); // framework for apis
const mongoose = require('mongoose'); // helps handle interaction between express and mongodb
const cors = require('cors'); // help controls requests for resources between domains
const http = require('http'); // required for socket.io
const cookieParser = require('cookie-parser');

// route specifiers
const sessionRoutes = require('./routes/sessionRoutes');
const roomRoutes = require('./routes/roomRoutes');
// const audioRoutes = require('./routes/audioRoutes');

// const morgan = require('morgan'); // logs http requests
// const socketIO = require('socket.io'); // for real time functionality
const {PORT, DATABASE_URL, SESSION_SECRET} = require('./config'); // config import
const session = require('express-session'); // session management
const MongoDBStore = require('connect-mongodb-session')(require('express-session'));

// basic server setup
const app = express();

app.use(cors({ // allows cross origin requests from all urls, MUST CHANGE WHEN DEPLOYED
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
}));

// // create an http server using express app
// const server = http.createServer(app);

// // initialize socket.io with the http server
// const io = socketIO(server, {
//     cors: {
//         origin: "http://localhost:3000", // application frontend url
//         methods: ["GET", "POST"],
//         credentials: true // allows cookies to be sent and received
//     }
// });

// // executes when a client connects
// io.on('connection', (socket) => {
//     console.log('New client connected');
//     // real time logic here
// })

app.use((req, res, next) => {
    console.log(`Accessed route: ${req.url}`);
    next();
  });
  

// Middleware
app.use(cookieParser());
// app.use(morgan('combined'));
app.use(express.json());  // For parsing application/json

const store = new MongoDBStore({
    uri: DATABASE_URL,
    collection: 'sessions'
});

// catch errors
store.on('error', function(error) {
    console.error('SESSION STORE ERROR:', error);
});

// express-session middleware
app.use(session({
    secret: SESSION_SECRET, // change this
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: { 
        secure: false, // user secure true for https, change this
        maxAge: 1000 * 60 * 60 * 2 // 2 hours
    }
}));

app.use((req, res, next) => {
    console.log('After session middleware');
    console.log('Session ID:', req.sessionID);
    next();
});

// connecting to the database
mongoose.connect(DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// routing to appropriate files
app.use('/api/sessions', sessionRoutes);
// app.use('/api/rooms', roomRoutes);
// app.use('/api/audios', audioRoutes);

// global error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// // Start the http and socket.io server on same port 5000
// server.listen(PORT, () => {
//     console.log(`Server and Socket.io are running on port ${PORT}`);
// });

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})

app.get('/api/test-session', (req, res) => {
    if (!req.session.views) {
        req.session.views = 1;
    } else {
        req.session.views += 1;
    }
    res.json({ views: req.session.views });
});