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
            redirectTo: "http://localhost:3000/reset-password",
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
        <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <h1 className="text-3xl font-bold text-center mb-2">
                    Forgot your password?
                </h1>
                <p className="text-gray-400 text-center mb-8">
                    Enter your email and we'll send you a reset link.
                </p>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-300">
                            Email address
                        </label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white"
                        />
                    </div>

                    {message && (
                        <p className="text-sm text-center text-yellow-400">
                            {message}
                        </p>
                    )}

                    <button
                        onClick={handleReset}
                        disabled={loading}
                        className="bg-white text-black font-semibold py-3 rounded-full hover:bg-gray-200 disabled:opacity-50"
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>

                    <p className="text-center text-gray-400 text-sm">
                        Remember your password?{" "}
                        <a href="/login" className="text-white underline">
                            Log in
                        </a>
                    </p>
                </div>
            </div>
        </main>
    );
} 