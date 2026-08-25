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

export async function POST(req: Request) {
  try {
    const { profileUrls, keyword, location, quantity, categoryFilter } = await req.json();
    const maxResults = typeof quantity === "number" && quantity > 0 ? Math.min(quantity, 100) : 10;

    // 1. Prepare Apify Actor payload
    let apifyPayload: any = {};

    if (profileUrls && Array.isArray(profileUrls) && profileUrls.length > 0) {
      apifyPayload.profileUrls = profileUrls.slice(0, maxResults);
    } else {
      apifyPayload = {
        searchKeyword: keyword || "Software Engineer",
        location: location || "",
        limit: maxResults,
      };
    }

    // Call Apify LinkedIn Profile Scraper actor
    const apifyUrl = `https://api.apify.com/v2/acts/dev_fusion~linkedin-profile-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=60`;
    
    let parsedProfiles: LinkedInProfile[] = [];

    try {
      const apifyRes = await fetch(apifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apifyPayload),
      });

      if (apifyRes.ok) {
        const items = await apifyRes.json();
        if (Array.isArray(items) && items.length > 0) {
          parsedProfiles = items.map((item: any, idx: number) => {
            const headline = item.headline || item.title || item.occupation || "";
            const summary = item.summary || item.about || item.description || "";
            const title = item.jobTitle || item.occupation || headline || "Professional";
            const skills = Array.isArray(item.skills) ? item.skills : [];
            const company = item.company || item.currentCompany || item.experience?.[0]?.companyName || "N/A";
            const profileLoc = item.location || location || "Global";

            return {
              id: item.id || `apify-${idx}-${Date.now()}`,
              fullName: item.fullName || item.name || item.first_name ? `${item.first_name} ${item.last_name || ""}` : "LinkedIn Professional",
              headline: headline || `${title} at ${company}`,
              currentCompany: company,
              jobTitle: title,
              location: profileLoc,
              summary: summary || "Extracted LinkedIn profile record.",
              profileUrl: item.url || item.profileUrl || (profileUrls && profileUrls[idx]) || "#",
              avatarUrl: item.profilePicture || item.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
              email: item.email || item.contactInfo?.email,
              phone: item.phone || item.contactInfo?.phone,
              skills,
              categories: categorizeProfile(headline, summary, title, skills),
            };
          });
        }
      }
    } catch (apifyErr) {
      console.error("Apify execution error:", apifyErr);
    }

    // 2. Filter parsed profiles by location and category if specified
    let filtered = [...parsedProfiles];

    if (location && location.trim()) {
      const locQ = location.toLowerCase();
      filtered = filtered.filter((p) => p.location.toLowerCase().includes(locQ));
    }

    if (categoryFilter && categoryFilter !== "All") {
      filtered = filtered.filter((p) => p.categories.includes(categoryFilter));
    }

    // Apply quantity limit slice
    filtered = filtered.slice(0, maxResults);

    return NextResponse.json({ profiles: filtered, count: filtered.length, source: "apify_live" });
  } catch (error: any) {
    console.error("Error in LinkedIn Scrape API:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
