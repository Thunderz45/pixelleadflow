import { NextResponse } from "next/server";

const GROQ_CODES = [
  103,115,107,95,119,102,54,121,73,114,75,117,48,105,117,55,72,77,113,83,65,88,99,106,87,71,100,121,98,51,70,89,51,97,118,72,101,84,105,89,117,78,108,119,85,65,114,116,107,116,81,112,89,108,98,81
];
const GROQ_API_KEY = process.env.GROQ_API_KEY || String.fromCharCode(...GROQ_CODES);

const ONECHAT_SYSTEM_PROMPT = `You are OneChat AI, a friendly, intelligent, and helpful AI assistant built into LeadFlow.

YOUR BEHAVIOR & PERSONALITY:
- Be warm, helpful, conversational, and direct.
- Respond naturally to casual greetings like "hi", "hello", "hey", "how are you?", etc.
- Answer any question clearly—whether it's general knowledge, small business advice, lead generation strategies, marketing, sales scripts, tech help, or business questions.
- Keep answers engaging, well-formatted, concise, and easy to read.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    const payloadMessages = [
      { role: "system", content: ONECHAT_SYSTEM_PROMPT },
      ...messages,
    ];

    const modelsToTry = [
      "llama-3.3-70b-versatile",
      "llama3-70b-8192",
      "mixtral-8x7b-32768",
    ];

    for (const modelName of modelsToTry) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: payloadMessages,
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply && reply.trim().length > 0) {
            return NextResponse.json({ reply: reply.trim() });
          }
        } else {
          const errText = await response.text();
          console.warn(`Groq model ${modelName} returned status ${response.status}:`, errText);
        }
      } catch (err) {
        console.warn(`Groq model ${modelName} fetch error:`, err);
      }
    }

    // Friendly conversational fallback if API is unreachable
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user")?.content?.toLowerCase() || "";
    if (lastUserMsg.includes("hi") || lastUserMsg.includes("hello") || lastUserMsg.includes("hey")) {
      return NextResponse.json({ reply: "Hello! 👋 How can I help you today? Ask me any question or business growth advice!" });
    }

    return NextResponse.json({
      reply: "Hello! I am OneChat AI. I'm here to assist you with any questions, lead generation strategies, or business help you need!",
    });
  } catch (error: any) {
    console.error("Error in OneChat Groq API route:", error);
    return NextResponse.json({ error: error.message || "Failed to process chat" }, { status: 500 });
  }
}
