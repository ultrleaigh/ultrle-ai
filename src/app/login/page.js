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
        <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <h1 className="text-3xl font-bold text-center mb-2">
                    Welcome back
                </h1>
                <p className="text-gray-400 text-center mb-8">
                    Log in to continue preparing for your exam.
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

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-300">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="Your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white"
                        />
                    </div>

                    {message && (
                        <p className="text-sm text-center text-yellow-400">
                            {message}
                        </p>
                    )}

                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="bg-white text-black font-semibold py-3 rounded-full hover:bg-gray-200 disabled:opacity-50"
                    >
                        {loading ? "Logging in..." : "Log In"}
                    </button>

                    <p className="text-center text-gray-400 text-sm">
                        <a href="/forgot-password" className="text-white underline">
                            Forgot your password?
                        </a>
                    </p>

                    <p className="text-center text-gray-400 text-sm">
                        Don't have an account?{" "}
                        <a href="/signup" className="text-white underline">
                            Sign up free
                        </a>
                    </p>
                </div>
            </div>
        </main>
    );
}