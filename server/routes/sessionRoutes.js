const express = require('express');
const router = express.Router();

// set or update username for the session
router.post('/username', (req, res) => {
  if (req.session) {
      const { username } = req.body;
      // Define username validation rules
      const minLength = 3;
      const maxLength = 20;
      const usernameRegex = /^[a-zA-Z0-9_\-]+$/; // Alphanumeric, underscore, hyphen

      // Trim username and check length
      const trimmedUsername = username.trim();
      if (trimmedUsername.length < minLength || trimmedUsername.length > maxLength) {
          return res.status(400).send({ message: `Username must be between ${minLength} and ${maxLength} characters.` });
      }

      // Check against regular expression
      if (!usernameRegex.test(trimmedUsername)) {
          return res.status(400).send({ message: 'Username can only contain letters, numbers, underscores, and hyphens.' });
      }

      // Add additional checks (profanity, uniqueness, etc.) here

      // If all checks pass, proceed to set username
      req.session.username = trimmedUsername;
      res.status(200).send({ message: 'Username set successfully.' });
  } else {
      res.status(401).send({ message: 'No session found.' });
  }
});

// getting information about a single session
router.get('/info', (req, res) => {
    if(req.session) {
      // Respond with session info, including the username if set
      res.status(200).json({
        sessionId: req.sessionID,
        username: req.session.username || 'Guest',
        // Add other session-related information here
      });
    } else {
      res.status(401).send({ message: 'No active session.' });
    }
  });
  
  // updating session specific settings
  router.post('/settings', (req, res) => {
    if (req.session) {
      req.session.settings = req.body.settings;
      res.status(200).json({ message: 'Settings updated successfully.' });
    } else {
      res.status(401).send({ message: 'No active session.' });
    }
  });
  
  // getting session specific settings
  router.get('/settings', (req, res) => {
    if (req.session && req.session.settings) {
      res.status(200).json(req.session.settings);
    } else {
      res.status(404).send({ message: 'Settings not found.' });
    }
  });

// session heartneat to keep session active passively
router.get('/heartbeat', (req, res) => {
    if(req.session) {
      // Update the session to reset the expiration time
      req.session._garbage = Date();
      req.session.touch();
      res.status(200).send({ message: 'Session heartbeat received.' });
    } else {
      res.status(401).send({ message: 'No active session to keep alive.' });
    }
  });

  // active session renewal, triggered by user
router.post('/renew', (req, res) => {
if (req.session) {
    // This could regenerate the session ID if needed
    req.session.regenerate((err) => {
    if (err) {
        res.status(500).send({ message: 'Error renewing session.' });
    } else {
        res.status(200).send({ message: 'Session renewed successfully.' });
    }
    });
} else {
    res.status(400).send({ message: 'No active session to renew.' });
}
});
  
// setting the active room of a session
router.post('/active-room', (req, res) => {
    if (req.session) {
      req.session.activeRoom = req.body.roomId;
      res.status(200).json({ message: 'Active room updated successfully.' });
    } else {
      res.status(401).send({ message: 'No active session.' });
    }
  });
  
// getting the active room of a session
router.get('/active-room', (req, res) => {
    if (req.session && req.session.activeRoom) {
        res.status(200).json({ activeRoom: req.session.activeRoom });
    } else {
      console.log('No active room in the session');
      res.status(200).json({ activeRoom: null });
    }
});

  module.exports = router;
  