require('dotenv').config();

const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const sessionRoutes = require('./routes/sessionRoutes');
// Uncomment these as needed
const roomRoutes = require('./routes/roomRoutes');
// const audioRoutes = require('./routes/audioRoutes');

const { PORT, DATABASE_URL, SESSION_SECRET } = require('./config');
const MongoDBStore = require('connect-mongodb-session')(session);

const app = express();

app.use(cors({
    origin: "http://localhost:3000", // Adjust for production
    methods: ["GET", "POST"],
    credentials: true
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

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Use env variable to toggle this
        maxAge: 1000 * 60 * 60 * 2 // 2 hours
    }
}));

mongoose.connect(DATABASE_URL)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

app.use('/api/sessions', sessionRoutes);
// Uncomment these as needed
app.use('/api/rooms', roomRoutes);
// app.use('/api/audios', audioRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
