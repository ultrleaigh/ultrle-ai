"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CoursePage() {
    const { id } = useParams();
    const [course, setCourse] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
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
                            onClick={() => !uploading && document.getElementById("pdfInput").click()}
                            className="flex flex-col items-center justify-center cursor-pointer rounded-xl py-8"
                            style={{ border: "1.5px dashed #2d2d3d", background: "#1a1a2e", opacity: uploading ? 0.6 : 1 }}
                        >
                            <p className="text-sm" style={{ color: "#6b7280" }}>
                                {uploading ? "Working..." : "Click to choose a PDF"}
                            </p>
                            <p className="text-xs mt-1" style={{ color: "#6b7280" }}>Max 10MB</p>
                        </div>
                        <input id="pdfInput" type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                        {status && <p style={{ color: "#a78bfa", fontSize: "13px" }}>{status}</p>}
                    </div>
                )}

                {error && <p style={{ color: "#f87171", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}

                {course && (
                    documents.length === 0 ? (
                        <p style={{ color: "#6b7280" }}>No files yet. Add your first lecture PDF above.</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {documents.map((d) => (
                                <div
                                    key={d.id}
                                    className="rounded-xl px-5 py-4"
                                    style={{ background: "#12101a", border: "1px solid #1f1f2e", color: "white" }}
                                >
                                    <div style={{ fontSize: "14px" }}>{d.file_name}</div>
                                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                                        {d.page_count} pages saved
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </main>
    );
}