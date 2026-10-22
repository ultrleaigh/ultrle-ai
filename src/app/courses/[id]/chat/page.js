"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ChatPage() {
    const { id } = useParams();
    const [course, setCourse] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [sourceView, setSourceView] = useState(null);
    const bottomRef = useRef(null);

    const loadConversations = async () => {
        const { data } = await supabase
            .from("conversations")
            .select("id, title, updated_at")
            .eq("course_id", id)
            .order("updated_at", { ascending: false });
        setConversations(data || []);
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
            await loadConversations();
            setLoading(false);
        };
        init();
    }, [id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, sending]);

    const openConversation = async (convId) => {
        setError("");
        setSourceView(null);

        if (!convId) {
            setActiveId(null);
            setMessages([]);
            return;
        }

        const { data, error: loadError } = await supabase
            .from("messages")
            .select("id, role, content, sources")
            .eq("conversation_id", convId)
            .order("created_at", { ascending: true });

        if (loadError) {
            setError("Could not load this chat.");
            return;
        }

        setActiveId(convId);
        setMessages(data || []);
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || sending) return;

        setSending(true);
        setError("");
        setSourceView(null);
        setMessages((prev) => [
            ...prev,
            { id: `tmp-${Date.now()}`, role: "user", content: text, sources: [] },
        ]);
        setInput("");

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                window.location.href = "/signup";
                return;
            }

            const res = await fetch("/api/tutor", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ message: text, courseId: id, conversationId: activeId }),
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.error || "Something went wrong.");
            }

            setActiveId(data.conversationId);
            setMessages((prev) => [
                ...prev,
                { id: `a-${Date.now()}`, role: "assistant", content: data.answer, sources: data.sources || [] },
            ]);
            await loadConversations();
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const openSource = async (s) => {
        setSourceView({ fileName: s.fileName, page: s.page, content: "Loading..." });

        const { data } = await supabase
            .from("pages")
            .select("content")
            .eq("document_id", s.documentId)
            .eq("page_number", s.page)
            .single();

        setSourceView({
            fileName: s.fileName,
            page: s.page,
            content: data?.content || "Could not load this page.",
        });
    };

    const display = (text) => text.replace(/\[S(\d+)\]/g, "[$1]");

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
                <p style={{ color: "#6b7280" }}>Loading...</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen px-4 py-8" style={{ background: "#0a0a0f" }}>
            <div className="w-full max-w-2xl mx-auto">
                <a href={`/courses/${id}`} style={{ color: "#a78bfa", fontSize: "13px" }}>
                    ← Back to {course ? course.title : "course"}
                </a>

                <h1 className="text-xl font-bold text-white mt-3 mb-4">
                    {course ? `${course.title} tutor` : "Tutor"}
                </h1>

                <div className="flex gap-2 mb-4">
                    <select
                        value={activeId || ""}
                        onChange={(e) => openConversation(e.target.value)}
                        style={{
                            flex: 1,
                            background: "#1a1a2e",
                            border: "1px solid #2d2d3d",
                            color: "white",
                            borderRadius: "10px",
                            padding: "10px 12px",
                            fontSize: "14px",
                        }}
                    >
                        <option value="">New chat</option>
                        {conversations.map((c) => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => openConversation(null)}
                        className="font-semibold px-4 rounded-lg"
                        style={{ background: "#1a1a2e", color: "#a78bfa", border: "1px solid #3b1f6e", fontSize: "14px" }}
                    >
                        New
                    </button>
                </div>

                <div
                    className="rounded-2xl p-5 flex flex-col gap-4 mb-4"
                    style={{ background: "#12101a", border: "1px solid #1f1f2e", minHeight: "320px" }}
                >
                    {messages.length === 0 && !sending && (
                        <p style={{ color: "#6b7280", fontSize: "14px" }}>
                            Ask a question about this course. The tutor answers only from the PDFs you uploaded and shows which pages it used.
                        </p>
                    )}

                    {messages.map((m) => (
                        <div key={m.id} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "90%" }}>
                            <div
                                style={{
                                    background: m.role === "user" ? "#7c3aed" : "#1a1a2e",
                                    color: "white",
                                    borderRadius: "14px",
                                    padding: "10px 14px",
                                    fontSize: "14px",
                                    lineHeight: "1.6",
                                    whiteSpace: "pre-wrap",
                                }}
                            >
                                {display(m.content)}
                            </div>

                            {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {m.sources.map((s) => (
                                        <button
                                            key={s.marker}
                                            onClick={() => openSource(s)}
                                            style={{
                                                background: "#1e1530",
                                                color: "#c4b5fd",
                                                border: "1px solid #3b1f6e",
                                                borderRadius: "999px",
                                                padding: "4px 10px",
                                                fontSize: "12px",
                                            }}
                                        >
                                            [{s.marker.replace("S", "")}] {s.fileName}, p.{s.page}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {sending && <p style={{ color: "#6b7280", fontSize: "14px" }}>Thinking...</p>}
                    <div ref={bottomRef} />
                </div>

                {sourceView && (
                    <div className="rounded-xl p-4 mb-4" style={{ background: "#1a1a2e", border: "1px solid #3b1f6e" }}>
                        <div className="flex items-center justify-between mb-2">
                            <span style={{ color: "white", fontWeight: "600", fontSize: "13px" }}>
                                {sourceView.fileName}, page {sourceView.page}
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

                {error && <p style={{ color: "#f87171", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}

                <div className="flex gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Ask about this course..."
                        rows={2}
                        style={{
                            flex: 1,
                            background: "#1a1a2e",
                            border: "1px solid #2d2d3d",
                            color: "white",
                            borderRadius: "10px",
                            padding: "10px 14px",
                            fontSize: "14px",
                            outline: "none",
                            resize: "none",
                        }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={sending}
                        className="font-semibold px-5 rounded-lg disabled:opacity-50"
                        style={{ background: "#7c3aed", color: "white", fontSize: "14px" }}
                    >
                        Send
                    </button>
                </div>
            </div>
        </main>
    );
}