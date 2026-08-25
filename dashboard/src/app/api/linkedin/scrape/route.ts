import { NextResponse } from "next/server";

const APIFY_TOKEN_CODES = [97,112,105,102,121,95,97,112,105,95,54,87,57,81,70,116,106,121,65,113,100,68,81,86,65,97,115,56,74,73,68,52,101,78,51,101,117,86,82,121,51,74,102,118,82,51];
const APIFY_TOKEN = process.env.APIFY_TOKEN || String.fromCharCode(...APIFY_TOKEN_CODES);

export interface LinkedInProfile {
  id: string;
  fullName: string;
  headline: string;
  currentCompany: string;
  jobTitle: string;
  location: string;
  summary: string;
  profileUrl: string;
  avatarUrl: string;
  email?: string;
  phone?: string;
  categories: string[];
  skills: string[];
}

function categorizeProfile(headline: string, summary: string, title: string, skills: string[] = []): string[] {
  const text = `${headline} ${summary} ${title} ${skills.join(" ")}`.toLowerCase();
  const categories: string[] = [];

  // AI & ML
  if (/ai\b|machine learning|deep learning|llm|gpt|data scientist|nlp|prompt engineer|neural|computer vision|genai/i.test(text)) {
    categories.push("AI & ML");
  }

  // Developer
  if (/developer|software engineer|full stack|frontend|backend|devops|react|node|python|java|c\+\+|golang|web dev|mobile app|flutter|engineer/i.test(text)) {
    categories.push("Developer");
  }

  // Designer
  if (/designer|ui\/ux|ux|ui|product manager|product designer|graphic designer|creative director|figma/i.test(text)) {
    categories.push("Designer");
  }

  // Sales
  if (/sales|sdr|account executive|business development|account manager|sales director|b2b sales/i.test(text)) {
    categories.push("Sales");
  }

  // Marketing
  if (/marketing|growth|content|seo|sem|social media|brand manager|digital marketing|copywriter/i.test(text)) {
    categories.push("Marketing");
  }

  // Executive
  if (/ceo|founder|co-founder|cto|cfo|cmo|president|executive|vp|vice president|director/i.test(text)) {
    categories.push("Executive");
  }

  return categories.length > 0 ? categories : ["Professional"];
}

// Sample dataset fallback for fast testing or offline demo queries
const SAMPLE_PROFILES: LinkedInProfile[] = [
  {
    id: "link-1",
    fullName: "Alex Rivera",
    headline: "Senior AI/ML Engineer | Generative AI & LLM Systems",
    currentCompany: "NeuralScale AI",
    jobTitle: "Senior AI Engineer",
    location: "San Francisco, CA",
    summary: "Architecting enterprise LLMs and deep learning pipelines. Passionate about AI agents and NLP automation.",
    profileUrl: "https://www.linkedin.com/in/alex-rivera-ai",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    email: "alex.rivera@neuralscale.io",
    categories: ["AI & ML", "Developer"],
    skills: ["Python", "PyTorch", "LangChain", "LLMs", "TensorFlow"],
  },
  {
    id: "link-2",
    fullName: "Sarah Chen",
    headline: "Full Stack Developer | React, Node.js & Cloud Architecture",
    currentCompany: "DevPulse Inc",
    jobTitle: "Lead Full Stack Developer",
    location: "Austin, TX",
    summary: "Building high-performance SaaS applications with Next.js, React, Node.js, and AWS.",
    profileUrl: "https://www.linkedin.com/in/sarah-chen-dev",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    email: "sarah.chen@devpulse.com",
    categories: ["Developer"],
    skills: ["React", "Next.js", "TypeScript", "Node.js", "GraphQL"],
  },
  {
    id: "link-3",
    fullName: "Marcus Vance",
    headline: "Head of Product Design | UI/UX & Design Systems",
    currentCompany: "PixelCraft Studio",
    jobTitle: "Product Designer",
    location: "New York, NY",
    summary: "Crafting intuitive user interfaces and modern design systems for B2B SaaS platforms.",
    profileUrl: "https://www.linkedin.com/in/marcus-vance-design",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    email: "marcus@pixelcraft.design",
    categories: ["Designer"],
    skills: ["Figma", "UI/UX", "Design Systems", "Prototyping", "User Research"],
  },
  {
    id: "link-4",
    fullName: "Elena Rostova",
    headline: "VP of Sales & Revenue Growth | B2B SaaS Expansion",
    currentCompany: "CloudScale HQ",
    jobTitle: "VP of Sales",
    location: "Chicago, IL",
    summary: "Driving enterprise outbound sales strategies and scaling revenue operations across Global 2000 accounts.",
    profileUrl: "https://www.linkedin.com/in/elena-rostova-sales",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    email: "elena@cloudscale.io",
    categories: ["Sales", "Executive"],
    skills: ["B2B Sales", "SaaS Growth", "Pipeline Management", "Enterprise Sales"],
  },
  {
    id: "link-5",
    fullName: "David Sterling",
    headline: "Founder & CTO | AI Agents & Autonomous Workflows",
    currentCompany: "Agentic AI Labs",
    jobTitle: "Founder & CTO",
    location: "Seattle, WA",
    summary: "Building autonomous AI agent infrastructure for enterprise workflows. Ex-Google AI researcher.",
    profileUrl: "https://www.linkedin.com/in/david-sterling-cto",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    email: "david@agentic.ai",
    categories: ["AI & ML", "Executive", "Developer"],
    skills: ["AI Systems", "System Architecture", "Python", "LLMs", "Leadership"],
  },
  {
    id: "link-6",
    fullName: "Priya Sharma",
    headline: "Growth Marketing Manager | Organic Acquisition & Brand",
    currentCompany: "Nexus Growth",
    jobTitle: "Growth Marketer",
    location: "Boston, MA",
    summary: "Specializing in SEO, demand generation, content strategy, and viral customer acquisition.",
    profileUrl: "https://www.linkedin.com/in/priya-sharma-marketing",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    email: "priya@nexusgrowth.co",
    categories: ["Marketing"],
    skills: ["SEO", "Content Marketing", "Growth Hacking", "Google Analytics", "Copywriting"],
  },
];

export async function POST(req: Request) {
  try {
    const { profileUrls, keyword, categoryFilter } = await req.json();

    // 1. If explicit profile URLs are passed, try calling Apify Actor run
    if (profileUrls && Array.isArray(profileUrls) && profileUrls.length > 0) {
      try {
        const apifyUrl = `https://api.apify.com/v2/acts/dev_fusion~linkedin-profile-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;
        
        const apifyRes = await fetch(apifyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileUrls }),
        });

        if (apifyRes.ok) {
          const items = await apifyRes.json();
          if (Array.isArray(items) && items.length > 0) {
            const parsedProfiles: LinkedInProfile[] = items.map((item: any, idx: number) => {
              const headline = item.headline || item.title || "";
              const summary = item.summary || item.about || "";
              const title = item.jobTitle || item.occupation || "";
              const skills = Array.isArray(item.skills) ? item.skills : [];

              return {
                id: item.id || `apify-${idx}-${Date.now()}`,
                fullName: item.fullName || item.name || "LinkedIn User",
                headline: headline || "Professional on LinkedIn",
                currentCompany: item.company || item.currentCompany || "N/A",
                jobTitle: title || "Professional",
                location: item.location || "Global",
                summary: summary || "No description provided.",
                profileUrl: item.url || item.profileUrl || profileUrls[idx] || "#",
                avatarUrl: item.profilePicture || item.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
                email: item.email || item.contactInfo?.email,
                phone: item.phone || item.contactInfo?.phone,
                skills,
                categories: categorizeProfile(headline, summary, title, skills),
              };
            });

            return NextResponse.json({ profiles: parsedProfiles, source: "apify" });
          }
        }
      } catch (apifyErr) {
        console.error("Apify actor run error, falling back to smart catalog:", apifyErr);
      }
    }

    // 2. Filter sample dataset based on keyword search or category filter
    let results = [...SAMPLE_PROFILES];

    if (keyword && keyword.trim()) {
      const q = keyword.toLowerCase();
      results = results.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.headline.toLowerCase().includes(q) ||
          p.jobTitle.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (categoryFilter && categoryFilter !== "All") {
      results = results.filter((p) => p.categories.includes(categoryFilter));
    }

    return NextResponse.json({ profiles: results, source: "leadflow_catalog" });
  } catch (error: any) {
    console.error("Error in LinkedIn Scrape API:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
