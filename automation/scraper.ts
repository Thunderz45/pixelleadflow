import puppeteer from "puppeteer";

// Load configuration parameters from Environment Variables
const KEYWORD = process.env.KEYWORD || "Dentists";
const LOCATION = process.env.LOCATION || "Boston";
const MAX_RESULTS = parseInt(process.env.MAX_RESULTS || "15");
const PROJECT_ID = process.env.PROJECT_ID || "";
const AUTH_TOKEN = process.env.AUTH_TOKEN || "";
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

if (!AUTH_TOKEN) {
  console.error("CRITICAL: AUTH_TOKEN environment variable is required to synchronize lead outputs.");
  process.exit(1);
}

interface LeadData {
  name: string;
  phone: string;
  website: string;
  email: string;
  address: string;
  rating: number;
  reviewsCount: number;
  projectId: string;
}

// Sleep utility
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runScraper() {
  console.log(`Starting LeadFlow Puppeteer Engine...`);
  console.log(`Query: [${KEYWORD}] in [${LOCATION}] (Limit: ${MAX_RESULTS} leads)`);

  const browser = await puppeteer.launch({
    headless: false, // visible for local validation
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,800"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Update starting status in dashboard
  await syncProgressToDashboard("searching", 0);

  try {
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(KEYWORD + " " + LOCATION)}`;
    console.log(`Navigating to Google Maps search URL...`);
    await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 60000 });

    // 1. Identify left side scrollable panel
    console.log("Locating search results panel...");
    const feedSelector = 'div[role="feed"]';
    await page.waitForSelector(feedSelector, { timeout: 15000 }).catch(() => {
      console.log("Standard role='feed' selector not found. Trying fallback selectors.");
    });

    let collectedLeadsCount = 0;
    const processedUrls = new Set<string>();

    await syncProgressToDashboard("collecting", 0);

    // 2. Loop scrolling and collecting listings
    let scrollAttempts = 0;
    while (collectedLeadsCount < MAX_RESULTS && scrollAttempts < 10) {
      // Find place card elements on page
      const cardLinks = await page.$$eval('a[href*="/maps/place/"]', (anchors) => 
        anchors.map(a => a.getAttribute("href") || "")
      );

      const uniqueCardUrls = cardLinks.filter(url => url && !processedUrls.has(url));
      console.log(`Found ${uniqueCardUrls.length} new listing links on page.`);

      if (uniqueCardUrls.length === 0) {
        // Try scrolling to load more rows
        console.log("No new listings found on page. Scrolling down...");
        await page.evaluate(() => {
          const feed = document.querySelector('div[role="feed"]');
          if (feed) {
            feed.scrollBy(0, 1000);
          } else {
            window.scrollBy(0, 1000);
          }
        });
        await delay(2000);
        scrollAttempts++;
        continue;
      }

      scrollAttempts = 0; // reset scroll attempts since we found items

      for (const cardUrl of uniqueCardUrls) {
        if (collectedLeadsCount >= MAX_RESULTS) break;

        processedUrls.add(cardUrl);

        try {
          console.log(`\nProcessing: ${cardUrl.slice(0, 60)}...`);
          
          // Click on the specific place card by matching the href
          const cardElement = await page.$(`a[href="${cardUrl.replace(/"/g, '\\"')}"]`);
          if (cardElement) {
            await cardElement.click();
            await delay(3000); // Wait for details side panel to load
          } else {
            console.log("Card DOM element couldn't be clicked. Skipping.");
            continue;
          }

          // Parse side panel data
          const parsedLead = await page.evaluate((projId) => {
            const getInnerVal = (sel: string) => {
              const el = document.querySelector(sel);
              return el ? (el as HTMLElement).innerText.trim() : "";
            };

            const title = getInnerVal("h1.DUwDvf");
            
            // Rating & Review count
            let rating = 0;
            let reviews = 0;
            const ratingText = getInnerVal("div.F7nice span");
            if (ratingText) rating = parseFloat(ratingText) || 0;

            const reviewCountText = getInnerVal("div.F7nice span:nth-child(2)");
            if (reviewCountText) {
              reviews = parseInt(reviewCountText.replace(/[()]/g, "").trim()) || 0;
            }

            // Contact Address
            let address = "N/A";
            const addrEl = document.querySelector('button[data-item-id="address"]');
            if (addrEl) address = (addrEl as HTMLElement).innerText.trim();

            // Contact Phone
            let phone = "N/A";
            const phoneEl = document.querySelector('button[data-item-id*="phone:tel:"]');
            if (phoneEl) phone = (phoneEl as HTMLElement).innerText.trim();

            // Website url
            let website = "";
            const webEl = document.querySelector('a[data-item-id="authority"]');
            if (webEl) website = webEl.getAttribute("href") || "";

            let email = "N/A";
            if (website) {
              try {
                let domain = new URL(website).hostname;
                if (domain.startsWith("www.")) domain = domain.slice(4);
                email = `info@${domain}`;
              } catch (e) {}
            }

            return {
              name: title,
              rating,
              reviewsCount: reviews,
              address,
              phone,
              website,
              email,
              projectId: projId
            };
          }, PROJECT_ID);

          if (parsedLead.name) {
            console.log(`Collected: ${parsedLead.name} (${parsedLead.phone})`);
            
            // Save lead to database
            const saved = await saveLeadToDatabase(parsedLead);
            if (saved) {
              collectedLeadsCount++;
              await syncProgressToDashboard("collecting", collectedLeadsCount);
            }
          }

        } catch (cardErr) {
          console.error("Error scraping listing card:", cardErr);
        }
      }

      // Scroll left panel container down for next iteration
      await page.evaluate(() => {
        const feed = document.querySelector('div[role="feed"]');
        if (feed) {
          feed.scrollTo(0, feed.scrollHeight);
        }
      });
      await delay(2000);
    }

    console.log(`\nAutomation Run finished! Collected ${collectedLeadsCount} leads successfully.`);
    await syncProgressToDashboard("completed", collectedLeadsCount);

  } catch (error) {
    console.error("Puppeteer automation failed:", error);
    await syncProgressToDashboard("stopped", collectedLeadsCount);
  } finally {
    await browser.close();
  }
}

// Post lead details to Next.js API router
async function saveLeadToDatabase(lead: LeadData): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/leads/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify(lead)
    });
    if (res.ok) {
      const data = await res.json();
      return !data.duplicated; // returns true if new lead added
    }
  } catch (err) {
    console.error("Failed to post lead database entry:", err);
  }
  return false;
}

// Sync progress record to Next.js API
async function syncProgressToDashboard(status: string, count: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/scrape/history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify({
        keyword: KEYWORD,
        location: LOCATION,
        projectId: PROJECT_ID,
        maxResults: MAX_RESULTS,
        resultsCount: count,
        status: status
      })
    });
    if (!res.ok) {
      console.warn("Could not sync run status to Dashboard server.");
    }
  } catch (err) {
    console.error("Dashboard history sync error:", err);
  }
}

// Start scraper
runScraper();
