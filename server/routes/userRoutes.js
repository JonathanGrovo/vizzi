const express = require('express');
const User = require('../models/User');
const router = express.Router();

router.post('/setup', async (req, res) => {
    console.log('Received request data:', req.body);  // <-- Log incoming data
    try {
        const { name } = req.body;

        // new user created
        const user = new User({
            name: name
        });

        await user.save();

        res.json({ message: "User setup successful", userId: user._id });

    } catch (error) {
        console.error('Detailed error:', error);  // <-- log the detailed error here
        res.status(500).json({ error: 'Error setting up user.' });
    }
});

module.exports = router;