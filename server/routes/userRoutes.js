const express = require('express');
const User = require('../models/User');
const router = express.Router();

router.post('/setup', async (req, res) => {
    try {
        const { name, userId } = req.body;

        // check if user with provided userId already exists
        let user = await User.findOne({ _id: userId });

        if (user) {
            // update existing user's name
            user.name = name;
        } else {
            // create a new user
            user = new User({
                _id: userId,
                name: name
            });
        }

        await user.save();

        res.json({ message: "User setup successful", userId: user._id });

    } catch (error) {
        res.status(500).json({ error: 'Error setting up user.' });
    }
});

module.exports = router;