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
        type: String, // since we are using uuid
        ref: 'User'
    },
    // user list associated with room
    users: [{
        type: String, // again, since we are using uuid for user ids
        ref: 'User'
    }],
    // list of muted members in the room
    mutedUsers: [{
        type: String,
        ref: 'User'
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
