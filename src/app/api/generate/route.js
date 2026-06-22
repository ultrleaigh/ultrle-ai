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
        const contentToUse = rawContent.slice(0, 5000);

        const prompt = `
You are a university professor helping a Ghanaian university student prepare for an exam. You teach clearly and thoroughly using only information from the student's notes. NEVER reproduce or quote the raw notes back. NEVER show page numbers, slide numbers, or raw extracted text.

The student is studying: ${course}
Their exam subject is: ${subject}
They have: ${time} before their exam

Here are their lecture notes and slides:
${contentToUse}

Using ONLY the content from the notes above, respond with VALID JSON ONLY — no markdown, no preamble, no code fences. The JSON must follow this exact structure:

{
  "topics": [
    { "name": "Topic name", "reason": "One sentence on why this topic matters for the exam" }
  ],
  "teaching": [
    { "topic": "Topic name", "explanation": "Full detailed professor-style explanation of this topic, written as multiple paragraphs of plain text separated by \\n\\n" }
  ],
  "summary": "A concise revision summary covering everything taught, written as plain text with \\n\\n between points",
  "mcqs": [
    { "question": "Question text", "options": { "A": "...", "B": "...", "C": "...", "D": "..." }, "answer": "A" }
  ],
  "essays": [
    { "question": "Essay question text", "modelAnswer": "Detailed model answer" }
  ]
}

Requirements:
- "topics" should have however many distinct key topics exist in the notes
- "teaching" must have one entry per topic listed in "topics", in the same order
- "mcqs" must contain exactly 10 questions
- "essays" must contain exactly 3 questions
- Only use information from the provided notes — do not add outside knowledge
- Be encouraging and clear in tone within the explanation and summary text
- Return ONLY the JSON object, nothing else before or after it
`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a university professor helping a Ghanaian university student prepare for an exam. You always respond with valid JSON only, following the exact structure requested. You teach clearly and only use information from the student's provided notes — never add outside knowledge.",
                },
                { role: "user", content: prompt },
            ],
            model: "llama-3.3-70b-versatile",
            max_tokens: 8000,
            temperature: 0.7,
            response_format: { type: "json_object" },
        });

        const text = completion.choices[0]?.message?.content;

        if (!text) {
            return Response.json({ error: "No response from model." }, { status: 500 });
        }

        let parsed;
try {
    parsed = JSON.parse(text);
} catch (parseError) {
    console.error("JSON parse failed:", parseError.message);
    console.error("Raw AI response was:", text);
    return Response.json({ error: "The AI returned an invalid format. Please try again with a shorter file." }, { status: 500 });
}

        return Response.json({ result: parsed });

    } catch (error) {
    console.error("Marking error:", error.message);
    if (error.message.includes("rate_limit") || error.message.includes("429")) {
        return Response.json({ error: "Our AI is currently busy. Please wait a minute and try again." }, { status: 429 });
    }
    return Response.json({ error: error.message }, { status: 500 });
}
}