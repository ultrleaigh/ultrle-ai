import Groq from "groq-sdk";

export const maxDuration = 60;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
    try {
        const formData = await request.formData();
        const subject = formData.get("subject");
        const course = formData.get("course");
        const time = formData.get("time");
        const notes = formData.get("notes");

        const rawContent = notes || "No notes provided.";
        const contentToUse = rawContent.slice(0, 8000);

        const prompt = `
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
            messages: [
                {
                    role: "system",
                    content: "You are an expert university tutor helping a Ghanaian university student prepare for an exam. You respond only using information from the student's provided notes — never add outside knowledge.",
                },
                { role: "user", content: prompt },
            ],
            model: "llama-3.3-70b-versatile",
            max_tokens: 4096,
            temperature: 0.7,
        });

        const text = completion.choices[0]?.message?.content;

        if (!text) {
            return Response.json({ error: "No response from model." }, { status: 500 });
        }

        return Response.json({ result: text });

    } catch (error) {
        console.error("Error:", error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
}