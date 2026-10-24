"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const PASS_MARK = 2;

export default function LearnPage() {
    const { id } = useParams();
    const [course, setCourse] = useState(null);
    const [docs, setDocs] = useState([]);
    const [topics, setTopics] = useState([]);
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [active, setActive] = useState(null);
    const [lesson, setLesson] = useState(null);
    const [lessonLoading, setLessonLoading] = useState(false);
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);
    const [saveNote, setSaveNote] = useState("");
    const [sourceView, setSourceView] = useState(null);

    const loadTopics = async () => {
        const { data } = await supabase
            .from("topics")
            .select("id, document_id, position, title, description, page_start, page_end, lesson_created_at")
            .eq("course_id", id);
        setTopics(data || []);
    };

    const loadAttempts = async () => {
        const { data } = await supabase
            .from("topic_attempts")
            .select("topic_id, score, total, created_at")
            .order("created_at", { ascending: false });
        setAttempts(data || []);
    };

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = "/signup";
                return;
            }

            const { data: courseData } = await supabase
                .from("courses")
                .select("id, title")
                .eq("id", id)
                .single();

            if (!courseData) {
                setError("Course not found.");
                setLoading(false);
                return;
            }

            setCourse(courseData);

            const { data: docData } = await supabase
                .from("documents")
                .select("id, created_at")
                .eq("course_id", id)
                .order("created_at", { ascending: true });
            setDocs(docData || []);

            await loadTopics();
            await loadAttempts();
            setLoading(false);
        };
        init();
    }, [id]);

    const docIndex = {};
    docs.forEach((d, i) => { docIndex[d.id] = i; });

    const sortedTopics = [...topics].sort(
        (a, b) => (docIndex[a.document_id] ?? 0) - (docIndex[b.document_id] ?? 0) || a.position - b.position
    );

    const bestFor = (topicId) => {
        const own = attempts.filter((a) => a.topic_id === topicId);
        if (own.length === 0) return null;
        const best = own.reduce((m, a) => (a.score > m.score ? a : m), own[0]);
        return { score: best.score, total: best.total, count: own.length };
    };

    const openTopic = async (topic) => {
        setActive(topic);
        setLesson(null);
        setAnswers({});
        setResult(null);
        setSaveNote("");
        setSourceView(null);
        setError("");
        setLessonLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                window.location.href = "/signup";
                return;
            }

            const res = await fetch("/api/lesson", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ topicId: topic.id }),
            });
            const data = await res.json();

            if (!res.ok || data.error) {
                throw new Error(data.error || "Could not prepare this lesson.");
            }

            setLesson(data.lesson);
            if (!data.cached) await loadTopics();
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLessonLoading(false);
        }
    };

    const closeTopic = () => {
        setActive(null);
        setLesson(null);
        setSourceView(null);
        setError("");
    };

    const openSource = async (page) => {
        setSourceView({ page, content: "Loading..." });
        const { data } = await supabase
            .from("pages")
            .select("content")
            .eq("document_id", active.document_id)
            .eq("page_number", page)
            .single();
        setSourceView({ page, content: data?.content || "Could not load this page." });
    };

    const submitChecks = async () => {
        if (!lesson) return;
        const score = lesson.checks.filter((c, i) => answers[i] === c.answer).length;
        const total = lesson.checks.length;
        setResult({ score, total });
        setSaveNote("");

        const { error: saveError } = await supabase
            .from("topic_attempts")
            .insert({ topic_id: active.id, answers, score, total });

        if (saveError) {
            console.error("Attempt save failed:", saveError);
            setSaveNote("Your result is shown, but it could not be saved.");
        } else {
            await loadAttempts();
        }
    };

    const tryAgain = () => {
        setAnswers({});
        setResult(null);
        setSaveNote("");
    };

    const goToNext = () => {
        const index = sortedTopics.findIndex((t) => t.id === active.id);
        const next = sortedTopics[index + 1];
        if (next) openTopic(next);
    };

    const renderCited = (text) =>
        String(text)
            .split(/(\[P\d+\])/g)
            .map((part, i) => {
                const m = part.match(/^\[P(\d+)\]$/);
                if (!m) return part;
                return (
                    <button
                        key={i}
                        onClick={() => openSource(Number(m[1]))}
                        style={{
                            background: "#1e1530",
                            color: "#c4b5fd",
                            border: "1px solid #3b1f6e",
                            borderRadius: "999px",
                            padding: "0 8px",
                            fontSize: "11px",
                            margin: "0 2px",
                        }}
                    >
                        p.{m[1]}
                    </button>
                );
            });

    const paragraphs = (text) =>
        String(text || "")
            .split("\n\n")
            .filter((p) => p.trim())
            .map((p, i) => (
                <p key={i} style={{ color: "#d1d5db", fontSize: "14px", lineHeight: "1.7", marginBottom: "10px" }}>
                    {renderCited(p)}
                </p>
            ));

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
                <p style={{ color: "#6b7280" }}>Loading...</p>
            </main>
        );
    }

    const allAnswered = lesson && Object.keys(answers).length === lesson.checks.length;
    const activeIndex = active ? sortedTopics.findIndex((t) => t.id === active.id) : -1;
    const hasNext = active && activeIndex >= 0 && activeIndex < sortedTopics.length - 1;

    return (
        <main className="min-h-screen px-4 py-10" style={{ background: "#0a0a0f" }}>
            <div className="w-full max-w-2xl mx-auto">
                {!active ? (
                    <a href={`/courses/${id}`} style={{ color: "#a78bfa", fontSize: "13px" }}>
                        ← Back to {course ? course.title : "course"}
                    </a>
                ) : (
                    <button onClick={closeTopic} style={{ color: "#a78bfa", fontSize: "13px" }}>
                        ← All topics
                    </button>
                )}

                <h1 className="text-xl font-bold text-white mt-3 mb-5">
                    {active ? active.title : course ? `Learn: ${course.title}` : "Learn"}
                </h1>

                {error && <p style={{ color: "#f87171", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}

                {!active && (
                    sortedTopics.length === 0 ? (
                        <p style={{ color: "#6b7280" }}>
                            No course map yet. Open the course page and build one first.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {sortedTopics.map((t, i) => {
                                const best = bestFor(t.id);
                                const passed = best && best.score >= PASS_MARK;
                                let label = t.lesson_created_at ? "Lesson ready" : "Not started";
                                if (best) {
                                    label = passed
                                        ? `Understood (best ${best.score}/${best.total})`
                                        : `Best ${best.score}/${best.total}, try again`;
                                }
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => openTopic(t)}
                                        className="rounded-xl px-5 py-4 text-left"
                                        style={{ background: "#12101a", border: "1px solid #1f1f2e", color: "white" }}
                                    >
                                        <div style={{ fontSize: "14px", fontWeight: "600" }}>{i + 1}. {t.title}</div>
                                        {t.description && (
                                            <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>{t.description}</div>
                                        )}
                                        <div style={{ fontSize: "12px", marginTop: "6px", color: passed ? "#4ade80" : "#a78bfa" }}>
                                            {label}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )
                )}

                {active && lessonLoading && (
                    <p style={{ color: "#a78bfa", fontSize: "14px" }}>
                        Preparing your lesson. The first time takes a little while, and it is saved for next time...
                    </p>
                )}

                {active && lesson && (
                    <div className="flex flex-col gap-5">
                        {lesson.covered_pages && lesson.covered_pages[1] < active.page_end && (
                            <p style={{ color: "#9ca3af", fontSize: "12px" }}>
                                This lesson covers pages {lesson.covered_pages[0]} to {lesson.covered_pages[1]} of this topic.
                            </p>
                        )}

                        <div className="rounded-2xl p-5" style={{ background: "#12101a", border: "1px solid #1f1f2e" }}>
                            {lesson.objective && (
                                <p style={{ color: "white", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>
                                    After this lesson you will be able to: {lesson.objective}
                                </p>
                            )}
                            {lesson.prerequisites && lesson.prerequisites.length > 0 && (
                                <p style={{ color: "#9ca3af", fontSize: "13px" }}>
                                    You should already know: {lesson.prerequisites.join("; ")}
                                </p>
                            )}
                        </div>

                        {lesson.sections.map((s, i) => (
                            <div key={i} className="rounded-2xl p-5" style={{ background: "#12101a", border: "1px solid #1f1f2e" }}>
                                <h3 style={{ color: "white", fontSize: "15px", fontWeight: "600", marginBottom: "8px" }}>
                                    {s.heading}
                                </h3>
                                {paragraphs(s.body)}
                            </div>
                        ))}

                        {lesson.example && (
                            <div className="rounded-2xl p-5" style={{ background: "#12101a", border: "1px solid #1f1f2e" }}>
                                <h3 style={{ color: "white", fontSize: "15px", fontWeight: "600", marginBottom: "8px" }}>Example</h3>
                                {paragraphs(lesson.example)}
                            </div>
                        )}

                        {lesson.misconceptions && lesson.misconceptions.length > 0 && (
                            <div className="rounded-2xl p-5" style={{ background: "#12101a", border: "1px solid #1f1f2e" }}>
                                <h3 style={{ color: "white", fontSize: "15px", fontWeight: "600", marginBottom: "8px" }}>
                                    Common mistakes
                                </h3>
                                {lesson.misconceptions.map((m, i) => (
                                    <p key={i} style={{ color: "#d1d5db", fontSize: "14px", lineHeight: "1.7", marginBottom: "8px" }}>
                                        • {renderCited(m)}
                                    </p>
                                ))}
                            </div>
                        )}

                        {lesson.beyond_slides && (
                            <div className="rounded-2xl p-5" style={{ background: "#1a1a2e", border: "1px dashed #4b5563" }}>
                                <h3 style={{ color: "#fbbf24", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                                    Beyond your slides
                                </h3>
                                <p style={{ color: "#9ca3af", fontSize: "11px", marginBottom: "8px" }}>
                                    General knowledge from the AI. It is not from your materials and has not been verified.
                                </p>
                                <p style={{ color: "#d1d5db", fontSize: "14px", lineHeight: "1.7" }}>{lesson.beyond_slides}</p>
                            </div>
                        )}

                        {sourceView && (
                            <div className="rounded-xl p-4" style={{ background: "#1a1a2e", border: "1px solid #3b1f6e" }}>
                                <div className="flex items-center justify-between mb-2">
                                    <span style={{ color: "white", fontWeight: "600", fontSize: "13px" }}>
                                        Your slides, page {sourceView.page}
                                    </span>
                                    <button onClick={() => setSourceView(null)} style={{ color: "#a78bfa", fontSize: "13px" }}>
                                        Close
                                    </button>
                                </div>
                                <p style={{ color: "#6b7280", fontSize: "11px", marginBottom: "8px" }}>
                                    Text extracted from the PDF. Diagrams and images are not included.
                                </p>
                                <p style={{ color: "#d1d5db", fontSize: "13px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                                    {sourceView.content}
                                </p>
                            </div>
                        )}

                        <div className="rounded-2xl p-5" style={{ background: "#12101a", border: "1px solid #1f1f2e" }}>
                            <h3 style={{ color: "white", fontSize: "15px", fontWeight: "600", marginBottom: "4px" }}>
                                Check your understanding
                            </h3>
                            <p style={{ color: "#6b7280", fontSize: "12px", marginBottom: "14px" }}>
                                Answer all {lesson.checks.length}, then submit. This is a quick check, not proof that you have mastered the topic.
                            </p>

                            {lesson.checks.map((c, i) => (
                                <div key={i} className="mb-5">
                                    <p style={{ color: "white", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>
                                        {i + 1}. {c.question}
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        {Object.entries(c.options).map(([key, val]) => {
                                            const selected = answers[i] === key;
                                            let bg = selected ? "#1e1530" : "#1a1a2e";
                                            let border = selected ? "#7c3aed" : "#2d2d3d";
                                            let color = selected ? "#c4b5fd" : "#9ca3af";

                                            if (result) {
                                                if (key === c.answer) {
                                                    bg = "#16331f";
                                                    border = "#22c55e";
                                                    color = "#4ade80";
                                                } else if (selected) {
                                                    bg = "#331616";
                                                    border = "#ef4444";
                                                    color = "#f87171";
                                                }
                                            }

                                            return (
                                                <button
                                                    key={key}
                                                    disabled={!!result}
                                                    onClick={() => setAnswers({ ...answers, [i]: key })}
                                                    className="text-left text-sm px-4 py-2.5 rounded-lg"
                                                    style={{ background: bg, border: `1px solid ${border}`, color, cursor: result ? "default" : "pointer" }}
                                                >
                                                    {key}) {val}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {result && c.explanation && (
                                        <p style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.6", marginTop: "8px" }}>
                                            {renderCited(c.explanation)}
                                        </p>
                                    )}
                                </div>
                            ))}

                            {!result ? (
                                <button
                                    onClick={submitChecks}
                                    disabled={!allAnswered}
                                    className="font-semibold px-6 py-2.5 rounded-full disabled:opacity-40"
                                    style={{ background: "#7c3aed", color: "white", fontSize: "14px" }}
                                >
                                    Submit answers
                                </button>
                            ) : (
                                <div>
                                    <p style={{ color: result.score >= PASS_MARK ? "#4ade80" : "#fbbf24", fontSize: "15px", fontWeight: "600" }}>
                                        You scored {result.score} out of {result.total}.{" "}
                                        {result.score >= PASS_MARK
                                            ? "Good, this topic looks understood for now."
                                            : "Read the explanations above, review the lesson, then try again."}
                                    </p>
                                    {saveNote && <p style={{ color: "#f87171", fontSize: "12px", marginTop: "4px" }}>{saveNote}</p>}
                                    <div className="flex gap-3 mt-4">
                                        <button
                                            onClick={tryAgain}
                                            className="font-semibold px-5 py-2 rounded-full"
                                            style={{ background: "#1a1a2e", color: "#a78bfa", border: "1px solid #3b1f6e", fontSize: "13px" }}
                                        >
                                            Try again
                                        </button>
                                        {hasNext && (
                                            <button
                                                onClick={goToNext}
                                                className="font-semibold px-5 py-2 rounded-full"
                                                style={{ background: "#7c3aed", color: "white", fontSize: "13px" }}
                                            >
                                                Next topic
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}