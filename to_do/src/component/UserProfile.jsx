'use client';

import { useState, useEffect } from 'react';

export default function UserProfile({ userId }) {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null); // 1. Added error state

    useEffect(() => {
        // 2. Ignore flag to prevent "race conditions" if userId changes rapidly
        let isMounted = true;

        setUser(null); // Reset UI to loading state when ID changes
        setError(null);

        fetch(`https://jsonplaceholder.typicode.com/users/${userId}`)
            .then((res) => {
                if (!res.ok) throw new Error('User not found');
                return res.json();
            })
            .then((data) => {
                if (isMounted) {
                    setUser(data);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    setError(err.message);
                }
            });

        // Cleanup function: runs right before the effect runs again or component unmounts
        return () => {
            isMounted = false;
        };

    }, [userId]);

    // 3. UI states based on data status
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
    if (!user) return <p>Loading user data...</p>;

    return (
        <div className='justify-center gap-3 bg-white p-6 rounded shadow-md w-full max-w-sm border-gray-400'>
            <h1 className='text-black font-bold '>{user.name}</h1>
            <p className='text-black'>Email: {user.email}</p>
            <p className='text-black'>Username: {user.username}</p>
        </div>
    );
}