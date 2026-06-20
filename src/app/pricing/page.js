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
    try {
        const verifyResponse = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference: transaction.reference }),
        });

        const verifyData = await verifyResponse.json();

        if (verifyData.verified) {
            await supabase
                .from("profiles")
                .update({ is_pro: true })
                .eq("id", user.id);
            window.location.href = "/upload?upgraded=true";
        } else {
            alert("Payment could not be verified. Please contact support if you were charged.");
            setLoading(false);
        }
    } catch (error) {
        alert("Something went wrong verifying your payment. Please contact support if you were charged.");
        setLoading(false);
    }
},
            onCancel: () => {
                setLoading(false);
            },
        });
    };

    return (
        <main className="min-h-screen px-4 py-16" style={{ background: "#0a0a0f" }}>
            <div className="w-full max-w-3xl mx-auto">

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold" style={{ background: "#1e1530", color: "#a78bfa", border: "1px solid #3b1f6e" }}>
                        ✦ Simple, fair pricing
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Start free. Upgrade when you need more.</h1>
                    <p className="text-sm" style={{ color: "#6b7280" }}>No hidden fees. Cancel anytime.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Free plan */}
                    <div className="rounded-2xl p-8 flex flex-col gap-4" style={{ background: "#12101a", border: "1px solid #1f1f2e" }}>
                        <h2 className="text-lg font-semibold text-white">Free</h2>
                        <div>
                            <span className="text-4xl font-bold text-white">GHS 0</span>
                        </div>
                        <p className="text-sm" style={{ color: "#6b7280" }}>Forever free</p>

                        <ul className="flex flex-col gap-3 text-sm mt-2">
                            <li className="flex items-center gap-2" style={{ color: "#9ca3af" }}>
                                <span style={{ color: "#7c3aed" }}>✓</span> 5 study plan generations per day
                            </li>
                            <li className="flex items-center gap-2" style={{ color: "#9ca3af" }}>
                                <span style={{ color: "#7c3aed" }}>✓</span> Topic breakdowns and teaching
                            </li>
                            <li className="flex items-center gap-2" style={{ color: "#9ca3af" }}>
                                <span style={{ color: "#7c3aed" }}>✓</span> Practice questions and essays
                            </li>
                            <li className="flex items-center gap-2" style={{ color: "#9ca3af" }}>
                                <span style={{ color: "#7c3aed" }}>✓</span> All university programmes
                            </li>
                            <li className="flex items-center gap-2" style={{ color: "#4b5563" }}>
                                <span style={{ color: "#4b5563" }}>✗</span> Unlimited generations
                            </li>
                            <li className="flex items-center gap-2" style={{ color: "#4b5563" }}>
                                <span style={{ color: "#4b5563" }}>✗</span> Save study plans
                            </li>
                            <li className="flex items-center gap-2" style={{ color: "#4b5563" }}>
                                <span style={{ color: "#4b5563" }}>✗</span> Download as PDF
                            </li>
                        </ul>

                        
                        < a href="/signup"
                            className="mt-4 font-semibold py-3 rounded-full text-center transition-all"
                            style={{ background: "#1a1a2e", color: "#a78bfa", border: "1px solid #3b1f6e", fontSize: "14px" }}
                        >
                            Get Started Free
                        </a>
                    </div>

                    {/* Pro plan */}
                    <div className="rounded-2xl p-8 flex flex-col gap-4 relative" style={{ background: "#1a1530", border: "2px solid #7c3aed" }}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">Pro</h2>
                            <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "#7c3aed", color: "white" }}>
                                Most popular
                            </span>
                        </div>
                        <div>
                            <span className="text-4xl font-bold text-white">GHS 30</span>
                            <span className="text-sm ml-1" style={{ color: "#9ca3af" }}>/month</span>
                        </div>
                        <p className="text-sm" style={{ color: "#a78bfa" }}>Everything you need to pass</p>

                        <ul className="flex flex-col gap-3 text-sm mt-2">
                            <li className="flex items-center gap-2 text-white">
                                <span style={{ color: "#a78bfa" }}>✓</span> Unlimited generations
                            </li>
                            <li className="flex items-center gap-2 text-white">
                                <span style={{ color: "#a78bfa" }}>✓</span> Topic breakdowns and teaching
                            </li>
                            <li className="flex items-center gap-2 text-white">
                                <span style={{ color: "#a78bfa" }}>✓</span> Practice questions and essays
                            </li>
                            <li className="flex items-center gap-2 text-white">
                                <span style={{ color: "#a78bfa" }}>✓</span> All university programmes
                            </li>
                            <li className="flex items-center gap-2 text-white">
                                <span style={{ color: "#a78bfa" }}>✓</span> Save study plans
                            </li>
                            <li className="flex items-center gap-2 text-white">
                                <span style={{ color: "#a78bfa" }}>✓</span> Download as PDF
                            </li>
                            <li className="flex items-center gap-2 text-white">
                                <span style={{ color: "#a78bfa" }}>✓</span> Priority support
                            </li>
                        </ul>

                        <button
                            onClick={handleUpgrade}
                            disabled={loading}
                            className="mt-4 font-semibold py-3 rounded-full transition-all disabled:opacity-50"
                            style={{ background: "#7c3aed", color: "white", fontSize: "14px" }}
                        >
                            {loading ? "Loading..." : "Upgrade to Pro"}
                        </button>
                    </div>

                </div>

                <p className="text-center text-xs mt-10" style={{ color: "#4b5563" }}>
                    Pay via MTN Mobile Money, Telecel Cash, AirtelTigo Money or card. Powered by Paystack.
                </p>
            </div>
        </main>
    );
}