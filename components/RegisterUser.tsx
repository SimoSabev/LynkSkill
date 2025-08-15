"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function RegisterUser() {
    const { isLoaded, user } = useUser();
    const [sent, setSent] = useState(false); // prevent multiple API calls

    useEffect(() => {
        if (!isLoaded || !user || sent) return;

        const email = user.primaryEmailAddress?.emailAddress;
        if (!email) return;

        console.log("📤 Sending user to API");
        fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: user.id,
                email,
                role: "STUDENT",
            }),
        })
            .then(res => res.json())
            .then(data => {
                console.log("✅ API response:", data);
                setSent(true);
            })
            .catch(err => console.error("❌ API error:", err));
    }, [isLoaded, user, sent]);


    return null;
}
