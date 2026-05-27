import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
    try {
        const { subject, course, time, notes } = await request.json();

        const prompt = `
You are an expert university tutor helping a Ghanaian University student prepare for an exam.

The student is studying: ${course}
Their exam subject is: ${subject}
They have: ${time} before their exam
Their lecture notes are: ${notes}

Please generate the following in a clear, structured format:

1. STUDY PLAN
A prioritised step-by-step study plan based on the time they have available.

2. KEY SUMMARIES
The most important topics and concepts they must know for this exam.

3. PRACTICE QUESTIONS
10 practice questions with answers based on their notes.

4. ESSAY OUTLINES
2 possible essay questions with detailed outlines they can use to answer them.

Be specific, practical, and encouraging. Write as if you are a senior student who has already passed this exam.
`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
        });

        const text = completion.choices[0].message.content;

        return Response.json({ result: text });

    } catch (error) {
        console.error("Groq error:", error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
}