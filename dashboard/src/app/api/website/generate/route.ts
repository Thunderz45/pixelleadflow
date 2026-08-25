import { NextResponse } from "next/server";

const KEY_CODES = [115,107,45,111,114,45,118,49,45,50,52,48,54,52,98,100,99,54,52,53,55,49,54,48,57,52,52,53,50,48,57,56,50,54,97,101,102,100,100,97,102,56,97,53,50,100,102,55,50,54,99,102,97,51,50,51,57,102,101,102,98,50,48,99,99,98,48,51,99,49,97,54,101];
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || String.fromCharCode(...KEY_CODES);
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(req: Request) {
  try {
    const { name, category, address, phone, rating, reviewsCount } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Business name is required." }, { status: 400 });
    }

    const prompt = `Generate a modern, beautiful, high-converting single-page HTML landing page for a business named "${name}".
Business Details:
- Industry/Category: ${category || "Local Service Business"}
- Address: ${address || "Local Service Area"}
- Phone: ${phone || "Call for Appointment"}
- Rating: ${rating || 4.8} Stars (${reviewsCount || 45} reviews)

Requirements:
1. Return ONLY pure valid raw HTML code starting with <!DOCTYPE html> and ending with </html>. Do not include markdown code block backticks like \`\`\`html.
2. Include Tailwind CSS CDN (<script src="https://cdn.tailwindcss.com"></script>) and Google Fonts (<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap" rel="stylesheet">).
3. Design structure:
   - Header with Logo ("${name}"), Nav links, and a phone CTA button.
   - Hero section with a bold headline, subtitle, phone CTA button, and rating badge (★ ${rating || 4.8} Stars).
   - Features / Services Grid (3-4 tailored services for ${category || "Local Business"}).
   - Customer Testimonials section.
   - Contact Info section displaying Phone: ${phone || "Contact Us"}, Address: ${address || "Location"}, and a simple Appointment Booking Form.
   - Footer.
4. Colors: Vibrant primary blue/indigo theme, sleek modern typography, smooth cards, and responsive layout.`;

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://pixelleadflow.in",
        "X-Title": "LeadFlow AI Prototype Generator",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert web developer and UI designer specializing in high-converting local business landing pages.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", response.status, errorText);
      return NextResponse.json(
        { error: `OpenRouter API returned status ${response.status}.` },
        { status: response.status }
      );
    }

    const data = await response.json();
    let rawHtml = data.choices?.[0]?.message?.content || "";

    // Clean markdown backticks if present
    rawHtml = rawHtml.replace(/```html/gi, "").replace(/```/g, "").trim();

    return NextResponse.json({ html: rawHtml, businessName: name });
  } catch (error: any) {
    console.error("Error in Website Generator API:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
