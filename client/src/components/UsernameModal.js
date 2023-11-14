import React, { useState, useRef } from 'react';
import axios from 'axios';

const UsernameModal = ({ onClose, setUsername }) => {
    const [username, setUsernameLocal] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (username) {
            try {
                console.log(username);
                await axios.post('/api/sessions/username', { username });
                console.log('hit the endpoint');
                setUsername(username);
                console.log('set the username');
                onClose(); // Close modal on successful username set
            } catch (err) {
                setError(err.response?.data?.message || 'Error setting username');
            }
        } else {
            setError('Username cannot be empty');
        }
    };

    return (
        <div className="username-modal">
            <input type="text" value={username} onChange={(e) => setUsernameLocal(e.target.value)} placeholder="Enter your username" />
            <button onClick={handleSubmit}>Submit</button>
            {error && <div className="error">{error}</div>}
        </div>
    );
};

export default UsernameModal;
