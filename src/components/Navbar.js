"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
            <a href="/" className="flex items-center">
                <div style={{ width: "180px", height: "40px", borderRadius: "20px", background: "white", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "4px 12px" }}>
                    <Image
                        src="/uailogo.png"
                        alt="Ultrle AI"
                        width={160}
                        height={32}
                        style={{ height: "100%", width: "auto", objectFit: "contain" }}
                        priority
                    />
                </div>
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