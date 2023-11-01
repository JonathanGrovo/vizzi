const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // session id generation

const sessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        default: uuidv4, // unique session id
        unique: true
    },
    userName: String, // user specified name
    roomId: {
        type: mongoose.Schema.Types.ObjectId, // type used for document IDs
        ref: 'Room' // points to "Room" model
    },
    // add a timestamp to know when the session started.
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Expiration time for the session
    expiresAt: {
        type: Date,
        required: true
    },
    // settings specified in session
    settings: {
        someSetting: {
            type: Boolean,
            default: true
        },
    }
});

module.exports = mongoose.model('Session', sessionSchema);
