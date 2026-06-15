"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const COURSES = [
    "Accounting", "Actuarial Science", "Agricultural Engineering", "Agriculture",
    "Architecture", "Banking and Finance", "Biochemistry", "Biology",
    "Biomedical Engineering", "Business Administration", "Chemical Engineering",
    "Chemistry", "Civil Engineering", "Communication Studies", "Computer Engineering",
    "Computer Science", "Dental Surgery", "Development Planning", "Economics",
    "Electrical Engineering", "Environmental Science", "Estate Management",
    "Food Science and Technology", "Geography", "Geomatic Engineering", "Human Biology",
    "Hydraulics Engineering", "Industrial Art", "Information Technology", "Journalism",
    "Law", "Marketing", "Mathematics", "Mechanical Engineering", "Medicine and Surgery",
    "Meteorology", "Nursing", "Optometry", "Pharmacy", "Physics", "Political Science",
    "Procurement", "Psychology", "Public Administration", "Publishing Studies",
    "Quantity Surveying", "Sociology", "Statistics", "Telecommunication Engineering",
    "Textile Engineering",
];

const inputStyle = {
    background: "#1a1a2e",
    border: "1px solid #2d2d3d",
    color: "white",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "14px",
    outline: "none",
    width: "100%",
};

const labelStyle = {
    fontSize: "12px",
    fontWeight: "600",
    color: "#9ca3af",
    marginBottom: "4px",
    display: "block",
};

export default function Upload() {
    const [subject, setSubject] = useState("");
    const [course, setCourse] = useState("");
    const [time, setTime] = useState("30 mins");
    const [notes, setNotes] = useState("");
    const [file, setFile] = useState(null);
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
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
            <main className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
                <p style={{ color: "#6b7280" }}>Loading...</p>
            </main>
        );
    }

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            if (selected.size > 10 * 1024 * 1024) {
                alert("File is too large. Please upload a file smaller than 10MB.");
                return;
            }
            setFile(selected);
        }
    };

    const extractTextFromPDF = async (file) => {
        try {
            setLoadingMessage("Reading your file...");
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
                setLoadingMessage(`Reading page ${i} of ${pdf.numPages}...`);
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                fullText += content.items.map((item) => item.str).join(" ") + "\n";
            }
            return fullText.trim();
        } catch (err) {
            console.error("PDF extraction failed:", err);
            throw new Error("Could not read your PDF. Please try pasting your notes instead.");
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
                await supabase.from("profiles").update({ daily_uses: 0, last_reset: new Date() }).eq("id", user.id);
                setProfile({ ...profile, daily_uses: 0 });
            } else if (profile.daily_uses >= 5) {
                alert("You've used all 5 free generations for today. Come back tomorrow or upgrade to Pro for unlimited access.");
                return;
            }
        }

        setLoading(true);
        setResult("");

        try {
            let contentToSend = notes;
            if (file) {
                const fileText = await extractTextFromPDF(file);
                if (fileText && fileText.length > 50) {
                    contentToSend = fileText;
                } else {
                    alert("Your file was uploaded but no text could be extracted. Using pasted notes instead.");
                    contentToSend = notes;
                }
            }
            if (!contentToSend || contentToSend.trim().length < 10) {
                alert("Please upload a file or paste your notes before generating.");
                setLoading(false);
                return;
            }

            setLoadingMessage("Generating your study plan...");
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 55000);
            const formData = new FormData();
            formData.append("subject", subject);
            formData.append("course", course);
            formData.append("time", time);
            formData.append("notes", contentToSend.slice(0, 8000));

            const response = await fetch("/api/generate", {
                method: "POST",
                body: formData,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            setResult(data.result);

            if (user && profile && !profile.is_pro) {
                const newCount = (profile.daily_uses || 0) + 1;
                await supabase.from("profiles").update({ daily_uses: newCount }).eq("id", user.id);
                setProfile({ ...profile, daily_uses: newCount });
            }
        } catch (error) {
            if (error.name === "AbortError") {
                alert("This is taking too long. Please try again with shorter notes or a smaller file.");
            } else {
                alert("Something went wrong: " + error.message);
            }
        } finally {
            setLoading(false);
            setLoadingMessage("");
        }
    };

    return (
        <main className="min-h-screen px-4 py-12" style={{ background: "#0a0a0f" }}>
            <div className="w-full max-w-xl mx-auto">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">Let's prepare you for your exam</h1>
                    <p className="text-sm" style={{ color: "#6b7280" }}>Fill in the details below and Ultrle AI will do the rest.</p>
                </div>

                {/* Usage counter */}
                {profile && !profile.is_pro && (
                    <div className="rounded-xl px-4 py-3 mb-6 text-center" style={{ background: "#12101a", border: "1px solid #1f1f2e" }}>
                        <p className="text-sm" style={{ color: "#9ca3af" }}>
                            Free generations today:{" "}
                            <span className="font-semibold text-white">{Math.max(0, 5 - (profile.daily_uses || 0))} / 5 remaining</span>
                        </p>
                        <a href="/pricing" className="text-xs mt-1 block" style={{ color: "#a78bfa" }}>
                            Upgrade to Pro for unlimited access →
                        </a>
                    </div>
                )}

                {/* Form card */}
                <div className="rounded-2xl p-6 flex flex-col gap-5" style={{ background: "#12101a", border: "1px solid #1f1f2e" }}>

                    <div className="flex flex-col gap-1">
                        <label style={labelStyle}>What programme do you offer?</label>
                        <select
                            value={course}
                            onChange={(e) => setCourse(e.target.value)}
                            style={inputStyle}
                        >
                            <option value="">Select your programme</option>
                            {COURSES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label style={labelStyle}>What subject is your exam on?</label>
                        <input
                            type="text"
                            placeholder="e.g. Organic Chemistry, Microeconomics"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                            style={inputStyle}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label style={labelStyle}>How much time do you have?</label>
                        <select
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            style={inputStyle}
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

                    <div className="flex flex-col gap-1">
                        <label style={labelStyle}>Upload your lecture slides</label>
                        <div
                            onClick={() => document.getElementById("fileInput").click()}
                            className="flex flex-col items-center justify-center cursor-pointer rounded-xl py-8 transition-all"
                            style={{ border: "1.5px dashed #2d2d3d", background: "#1a1a2e" }}
                        >
                            <p className="text-sm" style={{ color: "#6b7280" }}>Click to upload a PDF</p>
                            <p className="text-xs mt-1" style={{ color: "#374151" }}>Max 10MB</p>
                            {file && (
                                <p className="text-xs mt-3 font-semibold" style={{ color: "#a78bfa" }}>✓ {file.name}</p>
                            )}
                        </div>
                        <input id="fileInput" type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label style={labelStyle}>Or paste your notes here</label>
                        <textarea
                            placeholder="Paste your lecture notes here..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={6}
                            style={{ ...inputStyle, resize: "none", lineHeight: "1.6" }}
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="font-semibold py-3 rounded-full transition-all disabled:opacity-50"
                        style={{ background: "#7c3aed", color: "white", fontSize: "15px" }}
                    >
                        {loading ? loadingMessage || "Generating..." : "Generate My Study Plan"}
                    </button>

                </div>

                {/* Results */}
                {result && (
                    <div className="mt-8 flex flex-col gap-4">
                        {result.split("\n").map((line, index) => {
                            if (line.match(/^(WHAT TO FOCUS ON|UNDERSTANDING EACH TOPIC|QUICK REVISION|CHECK YOUR UNDERSTANDING)/)) {
                                return (
                                    <div key={index} className="mt-8 mb-2 flex items-center gap-3">
                                        <div className="h-px flex-1" style={{ background: "#1f1f2e" }} />
                                        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#7c3aed" }}>
                                            {line.trim()}
                                        </span>
                                        <div className="h-px flex-1" style={{ background: "#1f1f2e" }} />
                                    </div>
                                );
                            }
                            if (line.startsWith("###") || line.startsWith("##") || (line.startsWith("**") && line.endsWith("**"))) {
                                return (
                                    <h2 key={index} className="text-base font-semibold text-white mt-4">
                                        {line.replace(/#{1,3}\s*/g, "").replace(/\*\*/g, "").trim()}
                                    </h2>
                                );
                            }
                            if (line.trim() === "") {
                                return <div key={index} className="h-1" />;
                            }
                            return (
                                <p key={index} className="text-sm leading-relaxed" style={{ color: "#9ca3af" }}>
                                    {line.replace(/\*\*/g, "")}
                                </p>
                            );
                        })}
                    </div>
                )}

            </div> 
        </main>
    );
}