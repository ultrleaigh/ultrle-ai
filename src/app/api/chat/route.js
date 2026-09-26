import Groq from "groq-sdk";

export const maxDuration = 30;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
    try {
        const { messages, notes, subject, course } = await request.json();

        if (!messages || messages.length === 0) {
            return Response.json({ error: "No message provided." }, { status: 400 });
        }

        const systemPrompt = `
You are a university professor helping a Ghanaian university student with follow-up questions about their exam material.

The student is studying: ${course}
Their exam subject is: ${subject}

Here are their lecture notes — answer ONLY using this content. If the student asks something not covered in their notes, politely say it's not covered in their notes and offer to explain the closest related concept that IS in their notes.

Notes:
${notes.slice(0, 4000)}

Be clear, encouraging, and concise. Keep answers focused and not overly long unless the student asks for more detail.
`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                ...messages,
            ],
            model: "llama-3.3-70b-versatile",
            max_tokens: 1000,
            temperature: 0.7,
        });

        const text = completion.choices[0]?.message?.content;

        if (!text) {
            return Response.json({ error: "No response from model." }, { status: 500 });
        }

        return Response.json({ result: text });

    } catch (error) {
        console.error("Chat error:", error.message);
        if (error.message.includes("rate_limit") || error.message.includes("429")) {
            return Response.json({ error: "Our AI is currently busy. Please wait a minute and try again." }, { status: 429 });
        }
        return Response.json({ error: error.message }, { status: 500 });
    }
}