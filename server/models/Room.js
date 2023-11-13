const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({ 
    createdAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // room owner stored for privileges
    owner: {
        type: String,
    },
    // sessions associated with the room
    users: [{
        sessionId: { type: String, required: true },
        status: {
            type: String,
            enum: ['online', 'away', 'offline'],
            default: 'offline'
        },
        lastActive: { type: Date, default: Date.now }
    }],
    // settings that the owner can adjust manually
    settings: {
        maxUsers: {
            type: Number,
            default: 10
        },
    },
    currentAudio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Audio'
    },
    playbackState: {
        type: String,
        enum: ['playing', 'paused', 'stopped'],
        default: 'stopped'
    },
    playbackPosition: {
        type: Number,
        default: 0 // time in seconds
    }
 });

module.exports = mongoose.model('Room', roomSchema);
