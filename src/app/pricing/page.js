"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Pricing() {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

    const handleUpgrade = async () => {
        if (!user) {
            window.location.href = "/signup";
            return;
        }

        setLoading(true);

        const PaystackPop = (await import("@paystack/inline-js")).default;
        const handler = new PaystackPop();

        handler.newTransaction({
            key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
            email: user.email,
            amount: 30 * 100,
            currency: "GHS",
            onSuccess: async (transaction) => {
                await supabase
                    .from("profiles")
                    .update({ is_pro: true })
                    .eq("id", user.id);
                window.location.href = "/upload?upgraded=true";
            },
            onCancel: () => {
                setLoading(false);
            },
        });
    };

    return (
        <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-12">
            <div className="w-full max-w-3xl">
                <h1 className="text-4xl font-bold text-center mb-2">
                    Simple, fair pricing
                </h1>
                <p className="text-gray-400 text-center mb-12">
                    Start free. Upgrade when you need more.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 flex flex-col gap-4">
                        <h2 className="text-xl font-bold">Free</h2>
                        <p className="text-4xl font-bold">GHS 0</p>
                        <p className="text-gray-400 text-sm">Forever free</p>
                        <ul className="flex flex-col gap-3 text-sm text-gray-300 mt-2">
                            <li>✓ 5 study plan generations per day</li>
                            <li>✓ Study plans, summaries, practice questions</li>
                            <li>✓ Essay outlines</li>
                            <li>✓ All university programmes</li>
                            <li>✗ Unlimited generations</li>
                            <li>✗ Save study plans</li>
                            <li>✗ Download as PDF</li>
                        </ul>
                        
                        <a  href="/signup"
                            className="mt-4 border border-white text-white font-semibold py-3 rounded-full text-center hover:bg-white hover:text-black transition-colors"
                        >
                            Get Started Free
                        </a>
                    </div>

                    <div className="bg-white text-black rounded-2xl p-8 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold">Pro</h2>
                            <span className="bg-black text-white text-xs px-3 py-1 rounded-full">
                                Most Popular
                            </span>
                        </div>
                        <p className="text-4xl font-bold">GHS 30</p>
                        <p className="text-gray-500 text-sm">per month</p>
                        <ul className="flex flex-col gap-3 text-sm text-gray-700 mt-2">
                            <li>✓ Unlimited generations</li>
                            <li>✓ Study plans, summaries, practice questions</li>
                            <li>✓ Essay outlines</li>
                            <li>✓ All university programmes</li>
                            <li>✓ Save study plans</li>
                            <li>✓ Download as PDF</li>
                            <li>✓ Priority support</li>
                        </ul>
                        <button
                            onClick={handleUpgrade}
                            disabled={loading}
                            className="mt-4 bg-black text-white font-semibold py-3 rounded-full hover:bg-gray-800 disabled:opacity-50"
                        >
                            {loading ? "Loading..." : "Upgrade to Pro"}
                        </button>
                    </div>

                </div>

                <p className="text-center text-gray-600 text-xs mt-8">
                    Pay via MTN Mobile Money, Telecel Cash, AirtelTigo Money or card. Powered by Paystack.
                </p>
            </div>
        </main>
    );
}