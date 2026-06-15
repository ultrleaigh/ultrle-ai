"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            setMessage("Please enter your email and password.");
            return;
        }

        setLoading(true);
        setMessage("");

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setMessage(error.message);
            setLoading(false);
            return;
        }

        router.push("/upload");
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0a0a0f" }}>
            <div className="w-full max-w-sm">

                {/* Logo */}
                <div className="text-center mb-8">
                    <a href="/" className="text-xl font-bold" style={{ color: "#a78bfa" }}>Ultrle AI</a>
                    <h1 className="text-2xl font-bold text-white mt-4 mb-1">Welcome back</h1>
                    <p className="text-sm" style={{ color: "#6b7280" }}>Log in to continue preparing for your exam.</p>
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
                            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                            style={{ background: "#1a1a2e", border: "1px solid #2d2d3d", color: "white", borderRadius: "10px", padding: "12px 16px", fontSize: "14px", outline: "none" }}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold" style={{ color: "#9ca3af" }}>Password</label>
                            <a href="/forgot-password" className="text-xs" style={{ color: "#a78bfa" }}>Forgot password?</a>
                        </div>
                        <input
                            type="password"
                            placeholder="Your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                            style={{ background: "#1a1a2e", border: "1px solid #2d2d3d", color: "white", borderRadius: "10px", padding: "12px 16px", fontSize: "14px", outline: "none" }}
                        />
                    </div>

                    {message && (
                        <p className="text-xs text-center" style={{ color: "#f87171" }}>{message}</p>
                    )}

                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="font-semibold py-3 rounded-full transition-all disabled:opacity-50"
                        style={{ background: "#7c3aed", color: "white", fontSize: "14px" }}
                    >
                        {loading ? "Logging in..." : "Log In"}
                    </button>

                    <p className="text-center text-xs" style={{ color: "#6b7280" }}>
                        Don't have an account?{" "}
                        <a href="/signup" style={{ color: "#a78bfa" }}>Sign up free</a>
                    </p>

                </div>
            </div>
        </main>
    );
}