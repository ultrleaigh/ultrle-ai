"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter();

    const handleReset = async () => {
        if (!password) {
            setMessage("Please enter a new password.");
            return;
        }

        if (password.length < 6) {
            setMessage("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        setMessage("");

        const { error } = await supabase.auth.updateUser({
            password,
        });

        if (error) {
            setMessage(error.message);
            setLoading(false);
            return;
        }

        setMessage("Password updated successfully!");
        setTimeout(() => {
            router.push("/login");
        }, 2000);
        setLoading(false);
    };

    return (
        <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <h1 className="text-3xl font-bold text-center mb-2">
                    Reset your password
                </h1>
                <p className="text-gray-400 text-center mb-8">
                    Enter your new password below.
                </p>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-300">
                            New password
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
                        onClick={handleReset}
                        disabled={loading}
                        className="bg-white text-black font-semibold py-3 rounded-full hover:bg-gray-200 disabled:opacity-50"
                    >
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </div>
            </div>
        </main>
    );
}