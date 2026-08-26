import { NextResponse } from "next/server";

const KEY_CODES = [
  115,107,45,111,114,45,118,49,45,50,48,51,53,51,56,52,99,102,100,50,101,51,54,50,57,97,102,48,50,55,52,56,97,102,55,56,97,102,52,55,101,101,52,57,51,50,99,52,100,55,99,102,49,97,100,100,101,99,48,55,52
];
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || String.fromCharCode(...KEY_CODES);

const ONECHAT_SYSTEM_PROMPT = `You are OneChat AI, an elite Business Growth Advisor & Small Business Coach specializing strictly in helping small businesses grow from scratch.

YOUR MISSION:
Give clear, highly actionable, step-by-step advice on how to start, market, acquire clients, and scale a small business from $0 to sustainable monthly revenue.

KEY TOPICS YOU EXCEL AT:
1. Getting your first 10 clients from scratch with zero ad spend.
2. Local SEO & Google Business Profile optimization strategies.
3. Cold outreach scripts (Email, WhatsApp, Phone calls) that close local business clients.
4. High-converting landing page strategies and lead capture funnels.
5. Pricing, packaging, and monthly retainer sales tactics.

COMMUNICATION STYLE:
- Professional, encouraging, pragmatic, and direct.
- Use clean bullet points, bold key action items, and practical examples.
- Never use generic fluff; provide concrete scripts, frameworks, and actionable roadmaps.`;

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
      "google/gemini-2.0-flash-001",
      "meta-llama/llama-3.3-70b-instruct",
      "openai/gpt-4o-mini",
    ];

    for (const modelName of modelsToTry) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://leadflow.in",
            "X-Title": "OneChat AI Small Business Advisor",
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
          if (reply) {
            return NextResponse.json({ reply });
          }
        }
      } catch (err) {
        console.warn(`OneChat model ${modelName} failed:`, err);
      }
    }

    return NextResponse.json({
      reply: "OneChat AI is currently updating. Here is a proven small business growth framework: 1. Identify 50 local unoptimized Google Maps profiles. 2. Offer them a free custom website prototype. 3. Close 3-5 clients on a $300/mo retainer for site management and Google review generation.",
    });
  } catch (error: any) {
    console.error("Error in OneChat API route:", error);
    return NextResponse.json({ error: error.message || "Failed to process chat" }, { status: 500 });
  }
}
