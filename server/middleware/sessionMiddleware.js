const Session = require('../models/Session');
const { v4: uuidv4 } = require('uuid');

// middleware to check or create session
const sessionMiddleware = async (req, res, next) => {
    
    console.log("req object:", req);
    console.log("req.session object:", req.session);


    let sessionId = req.cookies.sessionId // assuming sessionId stored in cookie

    // if we arent recognized as being in a session
    if (!sessionId) {
        // create new session
        sessionId = uuidv4();

        try {
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            const expiresAt = new Date(Date.now() + maxAge);

            const newSession = new Session({
                sessionId,
                expiresAt
            });
            await newSession.save();

            // attach session to req obj for use in other routes
            req.session = newSession;

            res.cookie('sessionId', sessionId, {
                maxAge,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production' // set to true only in production
            });
        } catch (error) {
            // handle DB save error
            console.error("Error saving session:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }

        console.log('session created');
    } else {
        // validate session
        const existingSession = await Session.findOne({ sessionId });
        // if the session doesn't exist or is too old
        if (!existingSession || new Date(existingSession.expiresAt).getTime() < new Date().getTime()) {
            // handle invalid session, possibly create new session
            return res.status(400).json({ error: 'Invalid  or expired session.' });
        }
        // attach session to request object for use in other routes
        req.session = existingSession;

        console.log('valid session!');
    }
    next();
};

module.exports = sessionMiddleware;