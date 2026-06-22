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
        <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0a0a0f" }}>
            <div className="w-full max-w-sm">

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">Reset your password</h1>
                    <p className="text-sm" style={{ color: "#6b7280" }}>Enter your new password below.</p>
                </div>

                <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: "#12101a", border: "1px solid #1f1f2e" }}>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold" style={{ color: "#9ca3af" }}>New password</label>
                        <input
                            type="password"
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleReset()}
                            style={{ background: "#1a1a2e", border: "1px solid #2d2d3d", color: "white", borderRadius: "10px", padding: "12px 16px", fontSize: "14px", outline: "none" }}
                        />
                    </div>

                    {message && (
                        <p className="text-xs text-center" style={{ color: message.includes("success") ? "#4ade80" : "#f87171" }}>
                            {message}
                        </p>
                    )}

                    <button
                        onClick={handleReset}
                        disabled={loading}
                        className="font-semibold py-3 rounded-full transition-all disabled:opacity-50"
                        style={{ background: "#7c3aed", color: "white", fontSize: "14px" }}
                    >
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </div>
            </div>
        </main>
    );
}