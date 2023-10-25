const mongoose = require('mongoose');

const audioSchema = new mongoose.Schema({
    filePath: { // may be relative path or url depending on what we do ~
        type: String,
        required: true
    },
    // length of the audio file
    length: Number,
    uploader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room'
    },
    addedAt: {
        type: Date,
        default: Date.now
    },
    // what position this song is in queue
    order: {
        type: Number,
        required: true
    },
    // this is optional
    isPlaying: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Audio', audioSchema);
