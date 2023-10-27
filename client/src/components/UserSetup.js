import React, { useState, useEffect } from 'react';

const UserSetup = ({ onNameSet }) => {
    const [name, setName] = useState(''); // state management for user's name
    const [userId, setUserId] = useState(localStorage.getItem('userId') || null);

    // saves current userId to browser local storage
    useEffect(() => {
        if (userId) { // only set userId in local storage if it exists
            console.log('not sure,', userId);
            localStorage.setItem('userId', userId);
        }
    }, [userId]);

    // called when "next" button clicked
    const handleNameSubmit = async () => {
        if (name) { // if there is a name in the field
            try { // sends the name and userId to the backend
                const response = await fetch('/api/users/setup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name
                    })
                });


                if (response.ok) {
                    // wait for the response from the backend
                    const data = await response.json();
                    if (data.message === "User setup successful") {
                        setUserId(data.userId); // set the userId returned from the server
                        onNameSet(name, userId); // handle successful setup
                    } else {
                        // handle any specific messages or errors from server
                    }
                } else {
                    console.error("Error from server:", await response.text());
                }
            } catch (error) {
                    console.error("Error setting up user:", error);
            }
        }
    };

    // rendering the component
    return (
        <div>
            <h1>Welcome! Let's get started.</h1>
            <input 
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <button onClick={handleNameSubmit}>Next</button>
        </div>
    );
};

export default UserSetup;