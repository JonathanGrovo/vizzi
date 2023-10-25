const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const audioRoutes = require('./routes/audioRoutes');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());  // For parsing application/json

// Connecting to DB
const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/myDatabase';
mongoose.connect(DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Routes
app.get('/', (req, res) => {
    res.send('Hello World');
});

// app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
// app.use('/api/audios', audioRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
