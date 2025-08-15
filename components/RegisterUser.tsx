// app/components/RegisterUser.tsx
'use client';
import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';

export default function RegisterUser() {
    const { user, isSignedIn } = useUser();

    useEffect(() => {
        if (isSignedIn && user) {
            // send POST to your API route
            fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.emailAddresses[0].emailAddress,
                    role: 'STUDENT', // default role
                }),
            });
        }
    }, [isSignedIn, user]);

    return null; // hidden component, runs in background
}
