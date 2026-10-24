"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const WINDOW = 10;
const PAUSE_MS = 20000;
const BUSY_WAIT_MS = 60000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function CoursePage() {
    const { id } = useParams();
    const [course, setCourse] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [mappingId, setMappingId] = useState(null);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");

    const loadDocuments = async () => {
        const { data, error } = await supabase
            .from("documents")
            .select("*")
            .eq("course_id", id)
            .order("created_at", { ascending: false });

        if (error) {
            setError("Could not load your files. Please refresh the page.");
        } else {
            setDocuments(data);
        }
    };

    const loadTopics = async () => {
        const { data } = await supabase
            .from("topics")
            .select("id, document_id, position, title, description, page_start, page_end")
            .eq("course_id", id)
            .order("position", { ascending: true });
        setTopics(data || []);
    };

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = "/signup";
                return;
            }

            const { data: courseData, error: courseError } = await supabase
                .from("courses")
                .select("*")
                .eq("id", id)
                .single();

            if (courseError || !courseData) {
                setError("Course not found.");
                setLoading(false);
                return;
            }

            setCourse(courseData);
            await loadDocuments();
            await loadTopics();
            setLoading(false);
        };
        init();
    }, [id]);

    const extractPages = async (file) => {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            setStatus(`Reading page ${i} of ${pdf.numPages}...`);
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const text = content.items
                .map((item) => item.str)
                .join(" ")
                .replace(/\u0000/g, "")
                .trim();
            pages.push(text);
        }
        return pages;
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        e.target.value = "";
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            setError("File is too large. Please upload a file smaller than 10MB.");
            return;
        }

        setUploading(true);
        setError("");
        setStatus("Starting...");

        try {
            const pages = await extractPages(file);
            const readable = pages.filter((p) => p.length > 0).length;

            if (readable === 0) {
                setError("No readable text was found in this PDF. It may be a scan or made of images.");
                setStatus("");
                setUploading(false);
                return;
            }

            setStatus("Saving...");
            const { data: doc, error: docError } = await supabase
                .from("documents")
                .insert({ course_id: id, file_name: file.name, page_count: pages.length })
                .select()
                .single();

            if (docError) throw new Error("Could not save the file.");

            const rows = pages.map((content, i) => ({
                document_id: doc.id,
                page_number: i + 1,
                content,
            }));

            for (let i = 0; i < rows.length; i += 50) {
                const { error: pageError } = await supabase.from("pages").insert(rows.slice(i, i + 50));
                if (pageError) {
                    await supabase.from("documents").delete().eq("id", doc.id);
                    throw new Error("Could not save the pages. Please try again.");
                }
            }

            const empty = pages.length - readable;
            setStatus(
                `Saved ${pages.length} pages.` +
                (empty > 0 ? ` ${empty} page(s) had no readable text (likely images).` : "")
            );
            await loadDocuments();
        } catch (err) {
            console.error(err);
            setError(err.message || "Something went wrong. Please try again.");
            setStatus("");
        } finally {
            setUploading(false);
        }
    };

    const mappedEndOf = (docId) => {
        const own = topics.filter((t) => t.document_id === docId);
        return own.length ? Math.max(...own.map((t) => t.page_end)) : 0;
    };

    const buildMap = async (doc) => {
        setMappingId(doc.id);
        setError("");

        try {
            const { data: latest } = await supabase
                .from("topics")
                .select("page_end")
                .eq("document_id", doc.id)
                .order("page_end", { ascending: false })
                .limit(1)
                .maybeSingle();

            let nextPage = latest ? latest.page_end + 1 : 1;

            while (nextPage <= doc.page_count) {
                const start = nextPage;
                const end = Math.min(start + WINDOW - 1, doc.page_count);
                setStatus(`Building your course map: pages ${start} to ${end} of ${doc.page_count}...`);

                let attempts = 0;
                let result = null;

                while (true) {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) {
                        window.location.href = "/signup";
                        return;
                    }

                    const res = await fetch("/api/map", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify({ documentId: doc.id, startPage: start, endPage: end }),
                    });
                    const data = await res.json();

                    if (res.status === 429) {
                        attempts += 1;
                        if (attempts > 3) {
                            throw new Error("This is taking longer than expected. Wait a few minutes, then press Continue course map.");
                        }
                        setStatus("This section is taking a little longer. Retrying shortly...");
                        await sleep(BUSY_WAIT_MS);
                        setStatus(`Building your course map: pages ${start} to ${end} of ${doc.page_count}...`);
                        continue;
                    }

                    if (!res.ok) {
                        throw new Error(data.error || "Something went wrong while building the map.");
                    }

                    result = data;
                    break;
                }

                nextPage = result.nextPage;
                await loadTopics();

                if (nextPage <= doc.page_count) {
                    setStatus("Preparing the next section...");
                    await sleep(PAUSE_MS);
                }
            }

            setStatus("Course map ready.");
        } catch (err) {
            console.error(err);
            setError(err.message || "Building the map stopped. Press Continue course map to resume.");
            setStatus("");
        } finally {
            await loadTopics();
            setMappingId(null);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
                <p style={{ color: "#6b7280" }}>Loading...</p>
            </main>
        );
    }

    const busy = uploading || mappingId !== null;

    return (
        <main className="min-h-screen px-4 py-12" style={{ background: "#0a0a0f" }}>
            <div className="w-full max-w-xl mx-auto">
                <a href="/courses" style={{ color: "#a78bfa", fontSize: "13px" }}>
                    ← Back to my courses
                </a>

                <h1 className="text-2xl font-bold text-white mt-3 mb-4">
                    {course ? course.title : "Course"}
                </h1>

                {course && documents.length > 0 && (
                    <a
                        href={`/courses/${id}/chat`}
                        className="inline-block font-semibold px-6 py-3 rounded-full mb-6"
                        style={{ background: "#7c3aed", color: "white", fontSize: "15px" }}
                    >
                        Open tutor chat
                    </a>
                )}

                {course && (
                    <div className="rounded-2xl p-6 flex flex-col gap-4 mb-6" style={{ background: "#12101a", border: "1px solid #1f1f2e" }}>
                        <label style={{ fontSize: "12px", fontWeight: "600", color: "#9ca3af" }}>
                            Add a lecture PDF
                        </label>
                        <div
                            onClick={() => !busy && document.getElementById("pdfInput").click()}
                            className="flex flex-col items-center justify-center cursor-pointer rounded-xl py-8"
                            style={{ border: "1.5px dashed #2d2d3d", background: "#1a1a2e", opacity: busy ? 0.6 : 1 }}
                        >
                            <p className="text-sm" style={{ color: "#6b7280" }}>
                                {uploading ? "Working..." : "Click to choose a PDF"}
                            </p>
                            <p className="text-xs mt-1" style={{ color: "#6b7280" }}>Max 10MB</p>
                        </div>
                        <input id="pdfInput" type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                    </div>
                )}

                {status && <p style={{ color: "#a78bfa", fontSize: "13px", marginBottom: "12px" }}>{status}</p>}
                {error && <p style={{ color: "#f87171", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}

                {course && (
                    documents.length === 0 ? (
                        <p style={{ color: "#6b7280" }}>No files yet. Add your first lecture PDF above.</p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {documents.map((d) => {
                                const mappedEnd = mappedEndOf(d.id);
                                const complete = mappedEnd >= d.page_count;
                                const own = topics.filter((t) => t.document_id === d.id);
                                const isMapping = mappingId === d.id;

                                return (
                                    <div
                                        key={d.id}
                                        className="rounded-xl px-5 py-4"
                                        style={{ background: "#12101a", border: "1px solid #1f1f2e", color: "white" }}
                                    >
                                        <div style={{ fontSize: "14px" }}>{d.file_name}</div>
                                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                                            {d.page_count} pages saved
                                            {" · "}
                                            {complete
                                                ? `Course map ready (${own.length} topics)`
                                                : mappedEnd > 0
                                                    ? `Partly mapped (to page ${mappedEnd} of ${d.page_count})`
                                                    : "Course map not built yet"}
                                        </div>

                                        {!complete && (
                                            <button
                                                onClick={() => buildMap(d)}
                                                disabled={busy}
                                                className="font-semibold px-4 py-2 rounded-full mt-3 disabled:opacity-50"
                                                style={{ background: "#7c3aed", color: "white", fontSize: "13px" }}
                                            >
                                                {isMapping
                                                    ? "Building..."
                                                    : mappedEnd > 0
                                                        ? "Continue course map"
                                                        : "Build course map"}
                                            </button>
                                        )}

                                        {own.length > 0 && (
                                            <details className="mt-3" open={complete}>
                                                <summary className="text-xs cursor-pointer" style={{ color: "#a78bfa" }}>
                                                    Topics ({own.length})
                                                </summary>
                                                <ol className="mt-2 flex flex-col gap-2" style={{ paddingLeft: "0", listStyle: "none" }}>
                                                    {own.map((t, i) => (
                                                        <li key={t.id} style={{ fontSize: "13px" }}>
                                                            <span style={{ color: "white" }}>{i + 1}. {t.title}</span>
                                                            <span style={{ color: "#6b7280" }}> (pages {t.page_start} to {t.page_end})</span>
                                                            {t.description && (
                                                                <div style={{ color: "#9ca3af", fontSize: "12px" }}>{t.description}</div>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ol>
                                            </details>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </div>
        </main>
    );
}