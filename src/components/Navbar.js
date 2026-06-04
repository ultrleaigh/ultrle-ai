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
        <nav className="w-full bg-black border-b border-gray-800 px-6 py-4 flex items-center justify-between">
            <a href="/" className="text-white font-bold text-xl">
                Ultrle AI
            </a>

            <div className="flex items-center gap-4">
                <a href="/pricing" className="text-gray-400 text-sm hover:text-white">
                    Pricing
                </a>
                {user ? (
                    <>
                        <a href="/upload" className="text-gray-400 text-sm hover:text-white">
                            Study
                        </a>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-gray-400 hover:text-white"
                        >
                            Log out
                        </button>
                    </>
                ) : (
                    <>
                        <a href="/login" className="text-gray-400 text-sm hover:text-white">
                            Log in
                        </a>
                        <a href="/signup" className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-full hover:bg-gray-200">
                            Sign up
                        </a>
                    </>
                )}
            </div>
        </nav>
    );
}