require('dotenv').config(); // for environment variables

const express = require('express'); // framework for apis
const mongoose = require('mongoose'); // helps handle interaction between express and mongodb
const cors = require('cors'); // help controls requests for resources between domains
const http = require('http'); // required for socket.io

// route specifiers
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
// const audioRoutes = require('./routes/audioRoutes');

const morgan = require('morgan'); // logs http requests
const socketIO = require('socket.io'); // for real time functionality

const {PORT, DATABASE_URL} = require('./config'); // config import

// basic server setup
const app = express();

app.use(cors({ // allows cross origin requests from all urls, MUST CHANGE WHEN DEPLOYED
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
}));

// create an http server using express app
const server = http.createServer(app);

// initialize socket.io with the http server
const io = socketIO(server, {
    cors: {
        origin: "http://localhost:3000", // application frontend url
        methods: ["GET", "POST"],
        credentials: true // allows cookies to be sent and received
    }
});

// executes when a client connects
io.on('connection', (socket) => {
    console.log('New client connected');
    // real time logic here
})

// Middleware
app.use(morgan('combined'));
  
app.use(express.json());  // For parsing application/json

// Connecting to DB

// connecting to the database
mongoose.connect(DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// endpoint test
app.get('/', (req, res) => {
    res.send('Hello squirrel');
});

// routing to appropriate files
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
// app.use('/api/audios', audioRoutes);

// global error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Start the http and socket.io server on same port 5000
server.listen(PORT, () => {
    console.log(`Server and Socket.io are running on port ${PORT}`);
});
