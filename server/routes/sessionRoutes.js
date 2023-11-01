const express = require('express');
const Room = require('../models/Room');
const sessionMiddleware = require('../middleware/sessionMiddleware'); // import session middleware

const router = express.Router();

router.use(sessionMiddleware); // use session middleware

// use session data to check if the user is in a room
router.get('/checkroom', async (req, res) => {
    const session = req.session;

    console.log('CHECKROOM HIT')

    try {
        // attempt to find room baased on sessionId
        const room = await findRoomBySessionId(session.sessionId);

        if (room) { // if we find a room
            res.json({ inRoom: true, roomCode: room.code });
        } else {
            res.json({ inRoom: false });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// helper function for finding room based on session id
async function findRoomBySessionId(sessionId) {
    try {
        return await Room.findOne({ 'sessionId': sessionId });
    } catch (error) { // some database error
        console.error("Error finding room by session ID:", error);
        throw new Error('Could not find session.');
    }
}

module.exports = router;