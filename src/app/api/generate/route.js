import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function isJsonFailure(error) {
    const code = error?.error?.error?.code || error?.code;
    return code === "json_validate_failed";
}

async function generatePlan(prompt) {
    return groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "You are a university professor helping a Ghanaian university student prepare for an exam. You always respond with valid JSON only, following the exact structure requested. You teach clearly and only use information from the student's provided notes — never add outside knowledge.",
            },
            { role: "user", content: prompt },
        ],
        model: "qwen/qwen3.8-27b",
        max_tokens: 8000,
        temperature: 0.4,
        response_format: { type: "json_object" },
    });
}

export async function POST(request) {
    try {
        const authHeader = request.headers.get("authorization") || "";
        const token = authHeader.replace("Bearer ", "").trim();
        if (!token) {
            return Response.json({ error: "Please log in to continue." }, { status: 401 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData?.user) {
            return Response.json({ error: "Your session has expired. Please log in again." }, { status: 401 });
        }

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
    { "topic": "Topic name", "explanation": "Professor-style explanation of this topic, written as 2 to 3 short paragraphs of plain text separated by \\n\\n" }
  ],
  "summary": "A concise revision summary covering everything taught, written as plain text with \\n\\n between points",
  "mcqs": [
    { "question": "Question text", "options": { "A": "...", "B": "...", "C": "...", "D": "..." }, "answer": "A" }
  ],
  "essays": [
    { "question": "Essay question text", "modelAnswer": "Model answer of 4 to 6 sentences" }
  ]
}

Requirements:
- "topics" must have between 3 and 6 entries: choose the most important topics in the notes
- "teaching" must have one entry per topic listed in "topics", in the same order
- "mcqs" must contain exactly 10 questions
- "essays" must contain exactly 3 questions
- Only use information from the provided notes — do not add outside knowledge
- Be encouraging and clear in tone within the explanation and summary text
- Inside any text value, never use double quote characters. Use single quotes instead.
- Return ONLY the JSON object, nothing else before or after it
`;

        let completion;
        try {
            completion = await generatePlan(prompt);
        } catch (firstError) {
            if (isJsonFailure(firstError)) {
                console.error("First attempt returned invalid JSON, retrying once.");
                completion = await generatePlan(prompt);
            } else {
                throw firstError;
            }
        }

        const text = completion.choices[0]?.message?.content;

        if (!text) {
            return Response.json({ error: "No response from model." }, { status: 500 });
        }

        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch (parseError) {
            console.error("JSON parse failed:", parseError.message);
            return Response.json({ error: "The AI returned an invalid format. Please try again." }, { status: 500 });
        }

        return Response.json({ result: parsed });

    } catch (error) {
        console.error("Generate error:", error.message);
        console.error("Error status:", error.status);
        const message = error.message || "";
        if (message.includes("rate_limit") || message.includes("429")) {
            return Response.json({ error: "Our AI is currently busy. Please wait a minute and try again." }, { status: 429 });
        }
        if (isJsonFailure(error)) {
            return Response.json({ error: "The AI could not produce a valid study plan. Please try again, or use a shorter file." }, { status: 500 });
        }
        return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
}