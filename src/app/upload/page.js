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

const STEPS = ["topics", "teaching", "summary", "test"];
const STEP_LABELS = {
    topics: "What to focus on",
    teaching: "Understanding each topic",
    summary: "Quick revision",
    test: "Check your understanding",
};

export default function Upload() {
    const [subject, setSubject] = useState("");
    const [course, setCourse] = useState("");
    const [time, setTime] = useState("30 mins");
    const [notes, setNotes] = useState("");
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [checking, setChecking] = useState(true);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [stepIndex, setStepIndex] = useState(0);
    const [teachingIndex, setTeachingIndex] = useState(0);
    const [mcqAnswers, setMcqAnswers] = useState({});
    const [essayAnswers, setEssayAnswers] = useState({});
    const [essayFeedback, setEssayFeedback] = useState({});
    const [markingIndex, setMarkingIndex] = useState(null);

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

        setLoading(true);
        setResult(null);
        setStepIndex(0);
        setTeachingIndex(0);
        setMcqAnswers({});
        setEssayAnswers({});
        setEssayFeedback({});

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
            formData.append("notes", contentToSend.slice(0, 5000));

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

    const handleMarkEssay = async (index, question, modelAnswer) => {
        const studentAnswer = essayAnswers[index];
        if (!studentAnswer || studentAnswer.trim().length < 10) {
            alert("Please write a more complete answer before submitting.");
            return;
        }

        setMarkingIndex(index);

        try {
            const response = await fetch("/api/mark-essay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question, studentAnswer, modelAnswer }),
            });

            const data = await response.json();

            if (data.error) {
                alert(data.error);
                setMarkingIndex(null);
                return;
            }

            setEssayFeedback({ ...essayFeedback, [index]: data.result });

        } catch (error) {
            alert("Something went wrong marking your answer. Please try again.");
        } finally {
            setMarkingIndex(null);
        }
    };

    const currentStep = STEPS[stepIndex];

    const goNext = () => {
        if (currentStep === "teaching" && result && teachingIndex < result.teaching.length - 1) {
            setTeachingIndex(teachingIndex + 1);
            return;
        }
        if (stepIndex < STEPS.length - 1) {
            setStepIndex(stepIndex + 1);
            setTeachingIndex(0);
        }
    };

    const goBack = () => {
        if (currentStep === "teaching" && teachingIndex > 0) {
            setTeachingIndex(teachingIndex - 1);
            return;
        }
        if (stepIndex > 0) {
            setStepIndex(stepIndex - 1);
            if (STEPS[stepIndex - 1] === "teaching" && result) {
                setTeachingIndex(result.teaching.length - 1);
            }
        }
    };

    const isLastSubStep = () => {
        if (currentStep === "teaching" && result) {
            return teachingIndex === result.teaching.length - 1;
        }
        return true;
    };

    const isVeryLastStep = stepIndex === STEPS.length - 1 && isLastSubStep();

    return (
        <main className="min-h-screen px-4 py-12" style={{ background: "#0a0a0f" }}>
            <div className="w-full max-w-xl lg:max-w-2xl mx-auto">

                {!result && (
                    <>
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-white mb-1">Let's prepare you for your exam</h1>
                            <p className="text-sm" style={{ color: "#6b7280" }}>Fill in the details below and Ultrle AI will do the rest.</p>
                        </div>

                        <div className="rounded-2xl p-6 flex flex-col gap-5" style={{ background: "#12101a", border: "1px solid #1f1f2e" }}>

                            <div className="flex flex-col gap-1">
                                <label style={labelStyle}>What programme do you offer?</label>
                                <select value={course} onChange={(e) => setCourse(e.target.value)} style={inputStyle}>
                                    <option value="">Select your programme</option>
                                    {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
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
                                <select value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle}>
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
                                    {file && <p className="text-xs mt-3 font-semibold" style={{ color: "#a78bfa" }}>✓ {file.name}</p>}
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
                    </>
                )}

                {result && (
                    <div>
                        {/* Progress indicator */}
                        <div className="flex items-center justify-center gap-2 mb-6">
                            {STEPS.map((step, i) => (
                                <div
                                    key={step}
                                    style={{
                                        height: "4px",
                                        flex: 1,
                                        maxWidth: "60px",
                                        borderRadius: "2px",
                                        background: i <= stepIndex ? "#7c3aed" : "#1f1f2e",
                                    }}
                                />
                            ))}
                        </div>

                        <p className="text-center text-xs font-semibold tracking-widest uppercase mb-6" style={{ color: "#7c3aed" }}>
                            {STEP_LABELS[currentStep]}
                            {currentStep === "teaching" && ` — ${teachingIndex + 1} of ${result.teaching.length}`}
                        </p>

                        <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: "#12101a", border: "1px solid #1f1f2e", minHeight: "300px" }}>

                            {currentStep === "topics" && (
                                <div className="flex flex-col gap-4">
                                    {result.topics.map((t, i) => (
                                        <div key={i} className="pb-4" style={{ borderBottom: i < result.topics.length - 1 ? "1px solid #1f1f2e" : "none" }}>
                                            <h3 className="font-semibold text-white mb-1">{i + 1}. {t.name}</h3>
                                            <p className="text-sm" style={{ color: "#9ca3af" }}>{t.reason}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {currentStep === "teaching" && result.teaching[teachingIndex] && (
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">{result.teaching[teachingIndex].topic}</h3>
                                    {result.teaching[teachingIndex].explanation.split("\n\n").map((para, i) => (
                                        <p key={i} className="text-sm leading-relaxed mb-3" style={{ color: "#9ca3af" }}>{para}</p>
                                    ))}
                                </div>
                            )}

                            {currentStep === "summary" && (
                                <div>
                                    {result.summary.split("\n\n").map((para, i) => (
                                        <p key={i} className="text-sm leading-relaxed mb-3" style={{ color: "#9ca3af" }}>{para}</p>
                                    ))}
                                </div>
                            )}

                            {currentStep === "test" && (
                                <div className="flex flex-col gap-6">
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-semibold text-white">Multiple choice questions</h3>
                                            {Object.keys(mcqAnswers).length === result.mcqs.length && (
                                                <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "#1e1530", color: "#a78bfa" }}>
                                                    Score: {result.mcqs.filter((q, i) => mcqAnswers[i] === q.answer).length} / {result.mcqs.length}
                                                </span>
                                            )}
                                        </div>
                                        {result.mcqs.map((q, i) => {
                                            const selected = mcqAnswers[i];
                                            return (
                                                <div key={i} className="mb-5 pb-5" style={{ borderBottom: "1px solid #1f1f2e" }}>
                                                    <p className="text-sm font-medium text-white mb-3">{i + 1}. {q.question}</p>
                                                    <div className="flex flex-col gap-2">
                                                        {Object.entries(q.options).map(([key, val]) => {
                                                            let bg = "#1a1a2e";
                                                            let border = "#2d2d3d";
                                                            let textColor = "#9ca3af";

                                                            if (selected) {
                                                                if (key === q.answer) {
                                                                    bg = "#16331f";
                                                                    border = "#22c55e";
                                                                    textColor = "#4ade80";
                                                                } else if (key === selected && key !== q.answer) {
                                                                    bg = "#331616";
                                                                    border = "#ef4444";
                                                                    textColor = "#f87171";
                                                                }
                                                            }

                                                            return (
                                                                <button
                                                                    key={key}
                                                                    onClick={() => {
                                                                        if (!selected) {
                                                                            setMcqAnswers({ ...mcqAnswers, [i]: key });
                                                                        }
                                                                    }}
                                                                    disabled={!!selected}
                                                                    className="text-left text-sm px-4 py-2.5 rounded-lg transition-all"
                                                                    style={{ background: bg, border: `1px solid ${border}`, color: textColor, cursor: selected ? "default" : "pointer" }}
                                                                >
                                                                    {key}) {val}
                                                                    {selected && key === q.answer && "  ✓"}
                                                                    {selected && key === selected && key !== q.answer && "  ✗"}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-white mb-3">Essay questions</h3>
                                        {result.essays.map((e, i) => {
                                            const feedback = essayFeedback[i];
                                            const isMarking = markingIndex === i;

                                            return (
                                                <div key={i} className="mb-5 pb-5" style={{ borderBottom: i < result.essays.length - 1 ? "1px solid #1f1f2e" : "none" }}>
                                                    <p className="text-sm font-medium text-white mb-3">{i + 1}. {e.question}</p>

                                                    <textarea
                                                        placeholder="Type your answer here..."
                                                        value={essayAnswers[i] || ""}
                                                        onChange={(ev) => setEssayAnswers({ ...essayAnswers, [i]: ev.target.value })}
                                                        disabled={!!feedback}
                                                        rows={4}
                                                        style={{ ...inputStyle, resize: "none", lineHeight: "1.6", marginBottom: "10px", opacity: feedback ? 0.6 : 1 }}
                                                    />

                                                    {!feedback ? (
                                                        <button
                                                            onClick={() => handleMarkEssay(i, e.question, e.modelAnswer)}
                                                            disabled={isMarking}
                                                            className="text-xs font-semibold px-4 py-2 rounded-full transition-all disabled:opacity-50"
                                                            style={{ background: "#7c3aed", color: "white" }}
                                                        >
                                                            {isMarking ? "Marking..." : "Submit for marking"}
                                                        </button>
                                                    ) : (
                                                        <div className="rounded-lg p-4 mt-2" style={{ background: "#1a1a2e", border: "1px solid #2d2d3d" }}>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{
                                                                    background: feedback.verdict === "strong" ? "#16331f" : feedback.verdict === "good" ? "#1e1530" : "#331616",
                                                                    color: feedback.verdict === "strong" ? "#4ade80" : feedback.verdict === "good" ? "#a78bfa" : "#f87171",
                                                                }}>
                                                                    {feedback.score}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm" style={{ color: "#9ca3af" }}>{feedback.feedback}</p>
                                                            <details className="mt-3">
                                                                <summary className="text-xs cursor-pointer" style={{ color: "#6b7280" }}>View model answer</summary>
                                                                <p className="text-sm mt-2" style={{ color: "#9ca3af" }}>{e.modelAnswer}</p>
                                                            </details>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Navigation buttons */}
                        <div className="flex items-center justify-between mt-6">
                            <button
                                onClick={goBack}
                                disabled={stepIndex === 0 && teachingIndex === 0}
                                className="font-semibold px-6 py-2.5 rounded-full transition-all disabled:opacity-30"
                                style={{ background: "#1a1a2e", color: "#a78bfa", border: "1px solid #3b1f6e", fontSize: "14px" }}
                            >
                                Back
                            </button>

                            {!isVeryLastStep ? (
                                <button
                                    onClick={goNext}
                                    className="font-semibold px-6 py-2.5 rounded-full transition-all"
                                    style={{ background: "#7c3aed", color: "white", fontSize: "14px" }}
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    onClick={() => setResult(null)}
                                    className="font-semibold px-6 py-2.5 rounded-full transition-all"
                                    style={{ background: "#7c3aed", color: "white", fontSize: "14px" }}
                                >
                                    Start over
                                </button>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </main>
    );
}