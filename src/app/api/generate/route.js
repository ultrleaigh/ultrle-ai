import Groq from "groq-sdk";
import PDFParser from "pdf2json";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function extractTextFromPDF(buffer) {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();

        pdfParser.on("pdfParser_dataReady", (pdfData) => {
            const text = pdfData.Pages.map((page) =>
                page.Texts.map((t) => { try { return decodeURIComponent(t.R[0].T); } catch { return t.R[0].T; } }).join(" ")
            ).join("\n");
            resolve(text);
        });

        pdfParser.on("pdfParser_dataError", (error) => {
            reject(error);
        });

        pdfParser.parseBuffer(buffer);
    });
}

export async function POST(request) {
    try {
        const formData = await request.formData();
        const subject = formData.get("subject");
        const course = formData.get("course");
        const time = formData.get("time");
        const notes = formData.get("notes");
        const file = formData.get("file");

        let fileText = "";

        if (file && file.size > 0) {
            const buffer = Buffer.from(await file.arrayBuffer());
            fileText = await extractTextFromPDF(buffer);
        }

        const contentToUse = fileText || notes || "No notes provided.";

        const prompt = `
You are an expert university tutor helping a Ghanaian University student prepare for an exam.

The student is studying: ${course}
Their exam subject is: ${subject}
They have: ${time} before their exam

Here are their actual lecture notes and slides — base your entire response STRICTLY on this content:
${contentToUse}

Using ONLY the content above, generate the following in a clear, structured format:

1. STUDY PLAN
A prioritised step-by-step study plan based on the time they have available and the topics in their notes.

2. KEY SUMMARIES
The most important topics and concepts from their notes that they must know for this exam.

3. PRACTICE QUESTIONS
10 practice questions with answers based strictly on their notes.

4. ESSAY OUTLINES
2 possible essay questions with detailed outlines based on their notes.

Be specific, practical, and encouraging. Only use information from the provided notes — do not add outside information.
`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
        });

        const text = completion.choices[0].message.content;

        return Response.json({ result: text });

    } catch (error) {
        console.error("Error:", error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
}