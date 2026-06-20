"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    return (
        <nav className="w-full px-6 py-4 flex items-center justify-between" style={{ background: "#0a0a0f", borderBottom: "1px solid #1f1f2e" }}>
            <a href="/" className="font-bold text-lg" style={{ color: "#a78bfa" }}>
                Ultrle AI
            </a>

            <div className="flex items-center gap-5">
                {user ? (
                    <>
                        <a href="/upload" className="text-sm" style={{ color: "#9ca3af" }}>
                            Study
                        </a>
                        <button
                            onClick={handleLogout}
                            className="text-sm"
                            style={{ color: "#9ca3af" }}
                        >
                            Log out
                        </button>
                    </>
                ) : (
                    <>
                        <a href="/login" className="text-sm" style={{ color: "#9ca3af" }}>
                            Log in
                        </a>
                        
                        <a href="/signup"
                            className="text-sm font-semibold px-4 py-2 rounded-full"
                            style={{ background: "#7c3aed", color: "white" }}
                        >
                            Sign up
                        </a>
                    </>
                )}
            </div>
        </nav>
    );
}