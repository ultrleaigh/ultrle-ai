"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const COURSES = [
    "Accounting",
    "Actuarial Science",
    "Agricultural Engineering",
    "Agriculture",
    "Architecture",
    "Banking and Finance",
    "Biochemistry",
    "Biology",
    "Biomedical Engineering",
    "Business Administration",
    "Chemical Engineering",
    "Chemistry",
    "Civil Engineering",
    "Communication Studies",
    "Computer Engineering",
    "Computer Science",
    "Dental Surgery",
    "Development Planning",
    "Economics",
    "Electrical Engineering",
    "Environmental Science",
    "Estate Management",
    "Food Science and Technology",
    "Geography",
    "Geomatic Engineering",
    "Human Biology",
    "Hydraulics Engineering",
    "Industrial Art",
    "Information Technology",
    "Journalism",
    "Law",
    "Marketing",
    "Mathematics",
    "Mechanical Engineering",
    "Medicine and Surgery",
    "Meteorology",
    "Nursing",
    "Optometry",
    "Pharmacy",
    "Physics",
    "Political Science",
    "Procurement",
    "Psychology",
    "Public Administration",
    "Publishing Studies",
    "Quantity Surveying",
    "Sociology",
    "Statistics",
    "Telecommunication Engineering",
    "Textile Engineering",
];

export default function Upload() {
    const [subject, setSubject] = useState("");
    const [course, setCourse] = useState("");
    const [time, setTime] = useState("30 mins");
    const [notes, setNotes] = useState("");
    const [file, setFile] = useState(null);
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                window.location.href = "/signup";
                return;
            }

            setUser(user);

            const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();
            setProfile(profileData);
            setChecking(false);
        };
        getUser();
    }, []);

    if (checking) {
        return (
            <main className="min-h-screen bg-black text-white flex items-center justify-center">
                <p className="text-gray-400">Loading...</p>
            </main>
        );
    }

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
        }
    };

    const handleGenerate = async () => {
        if (!subject || !course) {
            alert("Please enter your programme and subject before generating.");
            return;
        }

        if (!user) {
            window.location.href = "/signup";
            return;
        }

        if (profile && !profile.is_pro) {
            const lastReset = new Date(profile.last_reset);
            const now = new Date();
            const hoursSinceReset = (now - lastReset) / (1000 * 60 * 60);

            if (hoursSinceReset >= 24) {
                await supabase
                    .from("profiles")
                    .update({ daily_uses: 0, last_reset: new Date() })
                    .eq("id", user.id);
                setProfile({ ...profile, daily_uses: 0 });
            } else if (profile.daily_uses >= 5) {
                alert("You've used all 5 free generations for today. Come back tomorrow or upgrade to Pro for unlimited access.");
                return;
            }
        }

        setLoading(true);
        setResult("");

        const response = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject, course, time, notes }),
        });

        const data = await response.json();
        setResult(data.result);

        if (user && profile && !profile.is_pro) {
            const newCount = (profile.daily_uses || 0) + 1;
            await supabase
                .from("profiles")
                .update({ daily_uses: newCount })
                .eq("id", user.id);
            setProfile({ ...profile, daily_uses: newCount });
        }

        setLoading(false);
    };

    return (
        <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-12">
            <div className="w-full max-w-xl">
                <h1 className="text-3xl font-bold mb-2 text-center">
                    Let's prepare you for your exam
                </h1>
                <p className="text-gray-400 text-center mb-8">
                    Fill in the details below and Ultrle AI will do the rest.
                </p>

                {profile && !profile.is_pro && (
                    <div className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 mb-6 text-center">
                        <p className="text-sm text-gray-400">
                            Free generations today:{" "}
                            <span className="text-white font-semibold">
                                {Math.max(0, 5 - (profile.daily_uses || 0))} / 5 remaining
                            </span>
                        </p>
                        <a href="/pricing" className="text-xs text-yellow-400 underline mt-1 block">
                            Upgrade to Pro for unlimited access
                        </a>
                    </div>
                )}

                <div className="flex flex-col gap-6">

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-300">
                            What programme do you offer?
                        </label>
                        <select
                            value={course}
                            onChange={(e) => setCourse(e.target.value)}
                            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white"
                        >
                            <option value="">Select your programme</option>
                            {COURSES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-300">
                            What subject or course is your exam on?
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Organic Chemistry, Microeconomics"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-300">
                            How much time do you have before your exam?
                        </label>
                        <select
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white"
                        >
                            <option>30 mins</option>
                            <option>1 hour</option>
                            <option>2 hours</option>
                            <option>5 hours</option>
                            <option>1 day</option>
                            <option>2 days</option>
                            <option>3 days</option>
                            <option>1 week</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-300">
                            Upload your lecture slides or notes
                        </label>
                        <div
                            className="bg-gray-900 border border-dashed border-gray-600 rounded-lg px-4 py-8 flex flex-col items-center justify-center cursor-pointer hover:border-white transition-colors"
                            onClick={() => document.getElementById("fileInput").click()}
                        >
                            <p className="text-gray-400 text-sm mb-2">
                                Click to upload a file
                            </p>
                            <p className="text-gray-600 text-xs">
                                PDF, PPT, PPTX, DOC, DOCX supported
                            </p>
                            {file && (
                                <p className="text-green-400 text-sm mt-3">
                                    ✓ {file.name}
                                </p>
                            )}
                        </div>
                        <input
                            id="fileInput"
                            type="file"
                            accept=".pdf,.ppt,.pptx,.doc,.docx"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-300">
                            Or paste your notes here
                        </label>
                        <textarea
                            placeholder="Paste your lecture notes here..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={8}
                            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-white resize-none"
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="bg-white text-black font-semibold py-3 rounded-full hover:bg-gray-200 disabled:opacity-50"
                    >
                        {loading ? "Generating your study plan..." : "Generate My Study Plan"}
                    </button>

                    {result && (
                        <div className="mt-8 flex flex-col gap-4">
                            {result.split("\n").map((line, index) => {
                                if (line.startsWith("###") || line.startsWith("##") || (line.startsWith("**") && line.endsWith("**"))) {
                                    return (
                                        <h2 key={index} className="text-xl font-bold text-white mt-6 border-b border-gray-700 pb-2">
                                            {line.replace(/#{1,3}\s*/g, "").replace(/\*\*/g, "").trim()}
                                        </h2>
                                    );
                                }
                                if (line.trim() === "") {
                                    return <div key={index} className="h-1" />;
                                }
                                return (
                                    <p key={index} className="text-gray-300 text-sm leading-relaxed">
                                        {line.replace(/\*\*/g, "")}
                                    </p>
                                );
                            })}
                        </div>
                    )}

                </div>
            </div>
        </main>
    );
} 