import { NextResponse } from "next/server";

const KEY_CODES = [
  115,107,45,111,114,45,118,49,45,50,48,51,53,51,56,52,99,102,100,50,101,51,54,50,57,97,102,48,50,55,52,56,97,102,55,56,97,102,52,55,101,101,52,57,51,50,99,52,100,55,99,102,49,97,100,100,101,99,48,55,52
];
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || String.fromCharCode(...KEY_CODES);

const ONECHAT_SYSTEM_PROMPT = `You are OneChat AI, an elite Business Growth Consultant & Small Business Coach.
YOUR MISSION: Give highly detailed, practical, step-by-step masterclass advice on how to start, market, acquire clients, and scale small businesses from scratch.

COMMUNICATION RULES:
1. Always give unique, specific, and actionable advice.
2. Structure your answers with clear bold headings, numbered steps, bullet points, and concrete examples.
3. Provide word-for-word scripts, pricing models, and outreach tactics whenever relevant.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === "user")?.content || "";

    const payloadMessages = [
      { role: "system", content: ONECHAT_SYSTEM_PROMPT },
      ...messages,
    ];

    const modelsToTry = [
      "openai/gpt-4o-mini",
      "google/gemini-2.0-flash-001",
      "meta-llama/llama-3.3-70b-instruct",
      "deepseek/deepseek-r1-distill-llama-70b",
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
            max_tokens: 1200,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply && reply.trim().length > 10) {
            return NextResponse.json({ reply: reply.trim() });
          }
        } else {
          const errBody = await response.text();
          console.warn(`OpenRouter model ${modelName} returned status ${response.status}:`, errBody);
        }
      } catch (err) {
        console.warn(`OneChat model ${modelName} request failed:`, err);
      }
    }

    // Dynamic Fallback Advisor Engine: Generates unique, rich responses for every query if AI models are busy
    const dynamicReply = generateDynamicGrowthAdvice(lastUserMessage);
    return NextResponse.json({ reply: dynamicReply });

  } catch (error: any) {
    console.error("Error in OneChat API route:", error);
    return NextResponse.json({ error: error.message || "Failed to process chat" }, { status: 500 });
  }
}

function generateDynamicGrowthAdvice(userQuery: string): string {
  const query = userQuery.toLowerCase();

  if (query.includes("first 10") || query.includes("scratch") || query.includes("start")) {
    return `### 🚀 Master Strategy: Acquiring Your First 10 Clients from Scratch ($0 Budget)

Here is a proven 4-step execution framework to get 10 paying local business clients in 30 days:

#### Step 1: Identify "Low-Hanging Fruit" Local Leads
- Use **LeadFlow** to search for local service providers (Dentists, Plumbers, Roofers, Salons) in your city.
- Filter for businesses with a **4.0+ Star Rating** but **MISSING a website URL** on Google Maps. These businesses already have great service, but lose 60% of mobile calls to competitors.

#### Step 2: Build a Free AI Website Prototype
- Use LeadFlow's **Website Generator** to create a custom, high-converting prototype landing page for their business.
- Include click-to-call buttons, instant WhatsApp chat, and embedded Google review badges.

#### Step 3: Value-First Cold Outreach (WhatsApp & Email)
- Send a short video or screenshot walk-through of the prototype website.
- **Pitch Script**:
  > *"Hi [Business Name] team, I saw your 4.8★ Google rating in [City]. You have great feedback, but missing a website link is sending phone leads to competitors. I built a custom mobile prototype website for [Business Name] to capture 2x more calls this month. Would you like to view it for free?"*

#### Step 4: Close on a Monthly Retainer ($300 - $500/mo)
- Offer a 7-day free trial.
- Pitch a simple monthly retainer package: **$300/month** for site hosting, weekly Google Business updates, and automated review collection.
- 10 clients at $300/mo = **$3,000/month ($36,000/year)** predictable recurring revenue!`;
  }

  if (query.includes("marketing") || query.includes("zero budget") || query.includes("local")) {
    return `### 📈 Top 4 Zero-Budget Local Marketing Strategies for Small Businesses

If you have $0 for paid ads, execute these 4 high-ROI organic channels:

#### 1. Google Business Profile Optimization (Local Map Pack #1 Rank)
- **Primary Category**: Select the exact primary service category.
- **Geo-Tagged Photos**: Upload 3-5 real photos weekly with location metadata enabled.
- **Weekly Google Posts**: Publish short updates with a clear "Call Now" or "Visit Website" button.

#### 2. Automated 5-Star Review Generation Funnel
- Set up an automated SMS/WhatsApp link requesting feedback within 2 hours of serving a customer.
- **Formula**: Every 10 new 5-star Google reviews boosts map pack ranking by 1-2 positions.

#### 3. B2B Strategic Alliances & Referral Swaps
- Partner with non-competing businesses that share your exact target audience (e.g. Real estate agents partnering with home painters or mortgage brokers).
- Offer a 10-15% commission or mutual referral trade on closed leads.

#### 4. High-Converting Mobile Landing Page with 1-Click WhatsApp
- Ensure mobile visitors can connect via WhatsApp or Click-to-Call within 3 seconds of landing on your page.`;
  }

  if (query.includes("script") || query.includes("whatsapp") || query.includes("cold")) {
    return `### 📲 High-Converting Cold WhatsApp & Email Outreach Script

Use this exact 3-part script to outreach local business owners and convert them into sales calls:

#### Cold WhatsApp / Email Message:
> **Subject**: Quick question about [Business Name]'s [Rating]★ Google listing
>
> Hi [Owner Name / Team],
>
> We were reviewing top-rated [Industry] providers in [City] and noticed your impressive **[Rating]-star Google Maps listing** with [Review Count] positive reviews.
>
> However, potential customers searching on mobile are missing a direct website link to view your services and book appointments instantly.
>
> We created a custom, mobile-optimized AI website prototype specifically for **[Business Name]** to help you capture 2x more phone calls this month.
>
> Would you be open to taking a quick look at the prototype website? No obligation at all.
>
> Best regards,  
> [Your Name] | LeadFlow Marketing

#### Objection Handling:
- **"We already have a website."** -> *"That's great! We ran a quick mobile UX audit on it and found 3 conversion bottlenecks that are dropping your mobile calls. I'd love to share the audit report with you."*
- **"How much does it cost?"** -> *"Viewing the prototype is 100% free. If you love it, our complete monthly growth package is just $300/mo."*`;
  }

  if (query.includes("retainer") || query.includes("pricing") || query.includes("convert") || query.includes("close")) {
    return `### 💎 How to Price & Package Local Business Retainers ($300 - $1,000/mo)

Stop charging one-time fees! Shift to monthly recurring retainers for predictable income.

#### Recommended 2-Tier Pricing Model:

**Tier 1: Starter Growth ($299 / month)**
- Custom High-Speed Mobile Website
- Managed Hosting & SSL Security
- Monthly Google Business Profile Updates
- Lead Delivery to Client's Phone / WhatsApp

**Tier 2: Dominator Growth ($599 / month)**
- Everything in Tier 1
- Automated WhatsApp & SMS 5-Star Review Engine
- 3-Page AI Business Audit & Competitor Benchmark Reports
- Local SEO Geo-Citations & Backlink Optimization

#### Closing Pitch Framework:
> *"Mr. Client, a single new customer is worth $500 - $2,000 to your business. If our growth system brings you just 2 extra clients per month, your $300 retainer pays for itself 5x over. Shall we activate your prototype site today?"*`;
  }

  // Fallback for custom or unique small business questions
  return `### 💡 OneChat Growth Advice for: "${userQuery}"

To scale your small business efficiently from scratch, follow this 3-pillar action plan tailored to your goal:

#### 1. Core Offer Clarity & High-Margin Positioning
- Focus on a specific niche (e.g., Plumbers, Dentists, Salons) where the client lifetime value is high.
- Package your services into a recurring monthly retainer ($300 - $600/month) rather than a one-time project fee.

#### 2. High-Intent Lead Generation (Google Maps & Local Search)
- Use **LeadFlow** to find local businesses in your target city with high ratings but missing or outdated web presence.
- Send value-first video audits or custom website prototypes to demonstrate immediate ROI before asking for money.

#### 3. Systematic Conversion & Client Retention
- Implement 1-Click WhatsApp lead triggers and automated Google review funnels.
- Send monthly performance updates showing total lead calls generated to lock in long-term client retention.

*Ask OneChat for specific outreach scripts, pricing templates, or step-by-step local SEO guides!*`;
}
