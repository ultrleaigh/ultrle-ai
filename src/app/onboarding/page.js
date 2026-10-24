"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const UNIVERSITIES = ["KNUST", "University of Ghana", "UCC", "UDS", "GIMPA", "Other"];

const LEVELS = ["Level 100", "Level 200", "Level 300", "Level 400", "Postgraduate"];

const PROGRAMMES = [
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

export default function Onboarding() {
    const [university, setUniversity] = useState("");
    const [programme, setProgramme] = useState("");
    const [level, setLevel] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = "/signup";
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("university, programme, level")
                .eq("id", user.id)
                .single();

            if (profile) {
                setUniversity(profile.university || "");
                setProgramme(profile.programme || "");
                setLevel(profile.level || "");
            }
            setLoading(false);
        };
        init();
    }, []);

    const handleSave = async () => {
        if (!university || !programme || !level) {
            setError("Please choose your university, programme and level.");
            return;
        }

        setSaving(true);
        setError("");

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = "/signup";
            return;
        }

        const { data, error: saveError } = await supabase
            .from("profiles")
            .update({ university, programme, level, onboarded: true })
            .eq("id", user.id)
            .select();

        if (saveError || !data || data.length === 0) {
            console.error("Profile save failed:", saveError, data);
            setError("Could not save your profile. Please try again.");
            setSaving(false);
            return;
        }

        window.location.href = "/courses";
    };

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
                <p style={{ color: "#6b7280" }}>Loading...</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen px-4 py-12" style={{ background: "#0a0a0f" }}>
            <div className="w-full max-w-xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">Tell us about your studies</h1>
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                        This helps the tutor pitch explanations at the right level.
                    </p>
                </div>

                <div className="rounded-2xl p-6 flex flex-col gap-5" style={{ background: "#12101a", border: "1px solid #1f1f2e" }}>
                    <div className="flex flex-col gap-1">
                        <label style={labelStyle}>University</label>
                        <select value={university} onChange={(e) => setUniversity(e.target.value)} style={inputStyle}>
                            <option value="">Select your university</option>
                            {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label style={labelStyle}>Programme of study</label>
                        <select value={programme} onChange={(e) => setProgramme(e.target.value)} style={inputStyle}>
                            <option value="">Select your programme</option>
                            {PROGRAMMES.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label style={labelStyle}>Level</label>
                        <select value={level} onChange={(e) => setLevel(e.target.value)} style={inputStyle}>
                            <option value="">Select your level</option>
                            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>

                    {error && <p style={{ color: "#f87171", fontSize: "13px" }}>{error}</p>}

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="font-semibold py-3 rounded-full disabled:opacity-50"
                        style={{ background: "#7c3aed", color: "white", fontSize: "15px" }}
                    >
                        {saving ? "Saving..." : "Save and continue"}
                    </button>
                </div>
            </div>
        </main>
    );
}