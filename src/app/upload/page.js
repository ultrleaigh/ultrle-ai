"use client";

import { useState } from "react";

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

        setLoading(true);
        setResult("");

        const response = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject, course, time, notes }),
        });

        const data = await response.json();
        setResult(data.result);
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
                    <div className="mt-8 bg-gray-900 border border-gray-700 rounded-lg p-6 whitespace-pre-wrap text-gray-200 text-sm leading-relaxed">
                        {result}
                    </div>
                )}

            </div>
        </div>
    </main>
);
}
