import Groq from "groq-sdk";

export const maxDuration = 30;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
    try {
        const { question, studentAnswer, modelAnswer } = await request.json();

        if (!studentAnswer || studentAnswer.trim().length < 10) {
            return Response.json({ error: "Please write a more complete answer before submitting." }, { status: 400 });
        }

        const prompt = `
You are a university professor marking a student's essay answer.

Question: ${question}

Model answer (for reference): ${modelAnswer}

Student's answer: ${studentAnswer}

Compare the student's answer to the model answer. Respond with VALID JSON ONLY in this exact format, no markdown, no code fences:

{
  "score": "X/10",
  "feedback": "2-3 sentences of constructive feedback. Mention what they got right and what they missed, compared to the model answer.",
  "verdict": "strong" | "good" | "needs work"
}

Be fair and encouraging but honest. Base the score strictly on how well the student's answer covers the same key points as the model answer.
`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a fair, encouraging university professor marking essay answers. You always respond with valid JSON only.",
                },
                { role: "user", content: prompt },
            ],
            model: "qwen/qwen3.8-27b",
            max_tokens: 1500,
            temperature: 0.5,
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
            console.error("Marking JSON parse failed:", parseError.message);
            return Response.json({ error: "The AI returned an invalid format. Please try submitting again." }, { status: 500 });
        }

        return Response.json({ result: parsed });

    } catch (error) {
        console.error("Marking error:", error.message);
        const message = error.message || "";
        if (message.includes("rate_limit") || message.includes("429")) {
            return Response.json({ error: "The AI is busy right now. Please wait a minute and try again." }, { status: 429 });
        }
        return Response.json({ error: "Something went wrong marking your answer. Please try again." }, { status: 500 });
    }
}