// mongoose allows for schema modeling for application data
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// constructs a new schema
const userSchema = new mongoose.Schema({ 
    _id: { // using uuidv4 for user id specification
        type: String,
        default: uuidv4
    },
    name: {
        type: String,
        required: true
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId, // type used for document IDs
        ref: 'Room' // points to "Room" model
    },
    // add a timestamp to know when the user joined. will help when cleaning up old, inactive users
    joinedAt: {
        type: Date,
        default: Date.now
    }
 });

 // schema is compiled into a model
module.exports = mongoose.model('User', userSchema);