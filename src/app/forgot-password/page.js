"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleReset = async () => {
        if (!email) {
            setMessage("Please enter your email address.");
            return;
        }

        setLoading(true);
        setMessage("");

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            setMessage(error.message);
            setLoading(false);
            return;
        }

        setMessage("Password reset link sent! Check your email.");
        setLoading(false);
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0a0a0f" }}>
            <div className="w-full max-w-sm">

                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">Forgot your password?</h1>
                    <p className="text-sm" style={{ color: "#6b7280" }}>Enter your email and we'll send you a reset link.</p>
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
                            onKeyDown={(e) => e.key === "Enter" && handleReset()}
                            style={{ background: "#1a1a2e", border: "1px solid #2d2d3d", color: "white", borderRadius: "10px", padding: "12px 16px", fontSize: "14px", outline: "none" }}
                        />
                    </div>

                    {message && (
                        <p className="text-xs text-center" style={{ color: message.includes("sent") ? "#4ade80" : "#f87171" }}>
                            {message}
                        </p>
                    )}

                    <button
                        onClick={handleReset}
                        disabled={loading}
                        className="font-semibold py-3 rounded-full transition-all disabled:opacity-50"
                        style={{ background: "#7c3aed", color: "white", fontSize: "14px" }}
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>

                    <p className="text-center text-xs" style={{ color: "#6b7280" }}>
                        Remember your password?{" "}
                        <a href="/login" style={{ color: "#a78bfa" }}>Log in</a>
                    </p>

                </div>
            </div>
        </main>
    );
}