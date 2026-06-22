"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignUp() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSignUp = async () => {
        if (!email || !password) {
            setMessage("Please enter your email and password.");
            return;
        }

        if (password.length < 6) {
            setMessage("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        setMessage("");

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setMessage(error.message);
            setLoading(false);
            return;
        }

        if (data.user) {
            await supabase.from("profiles").insert({
                id: data.user.id,
                email: data.user.email,
            });
        }

        window.location.href = "/upload";
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0a0a0f" }}>
            <div className="w-full max-w-sm">

                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mt-4 mb-1">Create your account</h1>
                    <p className="text-sm" style={{ color: "#6b7280" }}>Join Ghanaian students preparing smarter.</p>
                </div>

                {/* Card */}
                <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: "#12101a", border: "1px solid #1f1f2e" }}>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold" style={{ color: "#9ca3af" }}>Email address</label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                            style={{ background: "#1a1a2e", border: "1px solid #2d2d3d", color: "white", borderRadius: "10px", padding: "12px 16px", fontSize: "14px", outline: "none" }}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold" style={{ color: "#9ca3af" }}>Password</label>
                        <input
                            type="password"
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                            style={{ background: "#1a1a2e", border: "1px solid #2d2d3d", color: "white", borderRadius: "10px", padding: "12px 16px", fontSize: "14px", outline: "none" }}
                        />
                    </div>

                    {message && (
                        <p className="text-xs text-center" style={{ color: "#f87171" }}>{message}</p>
                    )}

                    <button
                        onClick={handleSignUp}
                        disabled={loading}
                        className="font-semibold py-3 rounded-full transition-all disabled:opacity-50"
                        style={{ background: "#7c3aed", color: "white", fontSize: "14px" }}
                    >
                        {loading ? "Creating account..." : "Create Account"}
                    </button>

                    <p className="text-center text-xs" style={{ color: "#6b7280" }}>
                        Already have an account?{" "}
                        <a href="/login" style={{ color: "#a78bfa" }}>Log in</a>
                    </p>

                </div>
            </div>
        </main>
    );
}