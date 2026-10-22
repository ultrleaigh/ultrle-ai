"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Courses() {
    const [courses, setCourses] = useState([]);
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const loadCourses = async () => {
        const { data, error } = await supabase
            .from("courses")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            setError("Could not load your courses. Please refresh the page.");
        } else {
            setCourses(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = "/signup";
                return;
            }
            await loadCourses();
        };
        init();
    }, []);

    const handleCreate = async () => {
        const trimmed = title.trim();
        if (trimmed.length < 2) {
            setError("Please enter a course name.");
            return;
        }

        setSaving(true);
        setError("");

        const { error } = await supabase.from("courses").insert({ title: trimmed });

        if (error) {
            setError("Could not save the course. Please try again.");
        } else {
            setTitle("");
            await loadCourses();
        }
        setSaving(false);
    };

    return (
        <main className="min-h-screen px-4 py-12" style={{ background: "#0a0a0f" }}>
            <div className="w-full max-w-xl mx-auto">
                <h1 className="text-2xl font-bold text-white mb-6">My courses</h1>

                <div className="rounded-2xl p-6 flex flex-col gap-4 mb-6" style={{ background: "#12101a", border: "1px solid #1f1f2e" }}>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#9ca3af" }}>
                        New course
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Databases"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        style={{
                            background: "#1a1a2e",
                            border: "1px solid #2d2d3d",
                            color: "white",
                            borderRadius: "10px",
                            padding: "12px 16px",
                            fontSize: "14px",
                            outline: "none",
                            width: "100%",
                        }}
                    />
                    <button
                        onClick={handleCreate}
                        disabled={saving}
                        className="font-semibold py-3 rounded-full disabled:opacity-50"
                        style={{ background: "#7c3aed", color: "white", fontSize: "15px" }}
                    >
                        {saving ? "Saving..." : "Add course"}
                    </button>
                    {error && <p style={{ color: "#f87171", fontSize: "13px" }}>{error}</p>}
                </div>

                {loading ? (
                    <p style={{ color: "#6b7280" }}>Loading...</p>
                ) : courses.length === 0 ? (
                    <p style={{ color: "#6b7280" }}>No courses yet. Add your first one above.</p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {courses.map((c) => (
                            <a
                                key={c.id}
                                href={`/courses/${c.id}`}
                                className="rounded-xl px-5 py-4 block"
                                style={{ background: "#12101a", border: "1px solid #1f1f2e", color: "white" }}
                            >
                                {c.title}
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}