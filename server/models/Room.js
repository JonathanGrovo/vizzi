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
    // room owner stored for privileges
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // user list associated with room
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
 });

module.exports = mongoose.model('Room', roomSchema);
