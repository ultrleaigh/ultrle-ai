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
        <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <h1 className="text-3xl font-bold text-center mb-2">
                    Create your account
                </h1>
                <p className="text-gray-400 text-center mb-8">
                    Join thousands of Ghanaian students preparing smarter.
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
                            onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-300">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white"
                        />
                    </div>

                    {message && (
                        <p className="text-sm text-center text-yellow-400">
                            {message}
                        </p>
                    )}

                    <button
                        onClick={handleSignUp}
                        disabled={loading}
                        className="bg-white text-black font-semibold py-3 rounded-full hover:bg-gray-200 disabled:opacity-50"
                    >
                        {loading ? "Creating account..." : "Create Account"}
                    </button>

                    <p className="text-center text-gray-400 text-sm">
                        Already have an account?{" "}
                        <a href="/login" className="text-white underline">
                            Log in
                        </a>
                    </p>
                </div>
            </div>
        </main>
    );
}