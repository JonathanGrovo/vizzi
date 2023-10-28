require('dotenv').cofig(); // for environment variables

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

// const PORT = process.env.PORT || 5000;

// create an http server using express app
const server = http.createServer(app);

// initialize socket.io with the http server
const io = socketIO(server);

// executes when a client connects
io.on('connection', (socket) => {
    console.log('New client connected');
    // real time logic here
})

// Middleware
app.use(morgan('combined'));
app.use(cors()); // alloows cross origin requests
app.use(express.json());  // For parsing application/json

// Connecting to DB

// defined either from env var or local db

// const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/myDatabase';

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
