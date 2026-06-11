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
You are a university professor helping a Ghanaian university student prepare for an upcoming exam. The student has limited time and needs to focus only on what matters most.

The student is studying: ${course}
Their exam subject is: ${subject}
They have: ${time} before their exam

Here are their lecture notes and slides:
${contentToUse}

Using ONLY the content from the notes above, do the following:

---

STEP 1 — TOPICS TO FOCUS ON
List the most important topics from the notes that are most likely to appear in the exam. For each topic, write one sentence explaining why it is important.

---

STEP 2 — TEACH EACH TOPIC
For every topic you listed above, teach it in full detail as a university professor would explain it to a student. Break it down step by step. Use simple, clear language. Use examples where helpful. Only use information from the provided notes — do not add outside knowledge.

---

STEP 3 — FINAL SUMMARY
Write a concise summary of everything taught in Step 2. This should serve as a quick revision sheet the student can read right before their exam.

---

STEP 4 — TEST THE STUDENT
Create the following questions based strictly on the notes:

a) 10 multiple choice questions with 4 options each (A, B, C, D) and indicate the correct answer for each.

b) 3 essay questions with detailed model answers based on the notes.

---

Be encouraging, clear, and thorough. Speak directly to the student. Only use information from their notes.
`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a university professor helping a Ghanaian university student prepare for an exam. You teach clearly, explain thoroughly, and only use information from the student's provided notes — never add outside knowledge.",
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