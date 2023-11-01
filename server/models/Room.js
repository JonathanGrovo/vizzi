const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({ 
    // unique room ID
    code: {
        type: String,
        required: true,
        unique: true
    },
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
        type: String, // points to session
        ref: 'Session'
    },
    // sessions associated with the room
    users: [{
        type: String, // again, since we are using uuid for user ids
        ref: 'Session'
    }],
    // list of muted sessions in the room
    mutedUsers: [{
        type: String,
        ref: 'Session'
    }],
    // settings that the owner can adjust manually
    settings: {
        maxUsers: {
            type: Number,
            default: 10
        },
        muteOnEntry: {
            type: Boolean,
            default: false
        }
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
