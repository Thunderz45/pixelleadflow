// LeadFlow Maps DOM Scraper

let isRunning = false;
let isPaused = false;
let collectedLeads = new Set();
let scrapeState = {
  status: "ready",
  leadsCount: 0,
  keyword: "",
  location: "",
  maxResults: 50,
  projectId: ""
};

// Listen to control actions from Background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content script received action:", message.action);

  if (message.action === "START_SCRAPE") {
    const { keyword, location, maxResults, projectId } = message;
    
    scrapeState = {
      status: "searching",
      leadsCount: 0,
      keyword,
      location,
      maxResults,
      projectId
    };

    collectedLeads.clear();
    isRunning = true;
    isPaused = false;

    // Check if we are already on the correct search page
    const expectedSearchUrl = `https://www.google.com/maps/search/${encodeURIComponent(keyword + " " + location)}`;
    if (!window.location.href.includes(encodeURIComponent(keyword))) {
      reportState("searching");
      window.location.href = expectedSearchUrl;
      sendResponse({ success: true, redirecting: true });
    } else {
      sendResponse({ success: true });
      setTimeout(runScrapeLoop, 3000); // Wait for page stability
    }
    return;
  }

  if (message.action === "PAUSE_SCRAPE") {
    isPaused = true;
    reportState("paused");
    sendResponse({ success: true });
  }

  if (message.action === "RESUME_SCRAPE") {
    isPaused = false;
    reportState("collecting");
    sendResponse({ success: true });
    runScrapeLoop();
  }

  if (message.action === "STOP_SCRAPE") {
    isRunning = false;
    reportState("stopped");
    sendResponse({ success: true });
  }
});

// Automatically trigger loop if page has just reloaded for search redirect
if (window.location.href.includes("/maps/search/")) {
  chrome.storage.local.get("engineState", (data) => {
    if (data.engineState && data.engineState.status === "searching") {
      scrapeState = data.engineState;
      scrapeState.status = "collecting";
      isRunning = true;
      isPaused = false;
      setTimeout(runScrapeLoop, 4000);
    }
  });
}

// Scrape Loop Engine
async function runScrapeLoop() {
  if (!isRunning || isPaused) return;

  reportState("collecting");

  try {
    const feed = findScrollableFeed();
    if (!feed) {
      console.warn("Google Maps sidebar feed not found.");
      reportState("stopped");
      return;
    }

    let previousScrollHeight = feed.scrollHeight;
    let scrollAttempts = 0;

    while (isRunning && !isPaused && collectedLeads.size < scrapeState.maxResults) {
      const cards = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
      
      for (const card of cards) {
        if (!isRunning || isPaused || collectedLeads.size >= scrapeState.maxResults) break;

        const detailUrl = card.getAttribute("href");
        if (!detailUrl || collectedLeads.has(detailUrl)) continue;

        // Visual indicator on card
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.style.border = "2px solid #06b6d4";

        // Click card to open detailed right-side info panel
        const clickTarget = card.querySelector('.qBF1Pd') || card;
        (clickTarget).click();
        
        // Wait for details side panel to load
        await sleep(2500);

        // Parse fields
        const parsedLead = parseSidePanelDetails();
        parsedLead.projectId = scrapeState.projectId;

        // Verify we collected at least a name
        if (parsedLead.name) {
          collectedLeads.add(detailUrl);
          scrapeState.leadsCount = collectedLeads.size;
          
          // Send record details to save API
          await saveLeadToDatabase(parsedLead);
          
          reportState("collecting");
        }

        // Reset outline
        card.style.border = "none";
      }

      // Scroll feed down
      feed.scrollTo(0, feed.scrollHeight);
      await sleep(1500);

      // Check if we hit bottom of feed
      if (feed.scrollHeight === previousScrollHeight) {
        scrollAttempts++;
        if (scrollAttempts > 3) {
          console.log("Reached end of Google Maps listing.");
          break;
        }
      } else {
        scrollAttempts = 0;
        previousScrollHeight = feed.scrollHeight;
      }
    }

    if (isRunning && !isPaused) {
      reportState("completed");
    }

  } catch (error) {
    console.error("Scraper encountered an error:", error);
    reportState("stopped");
  }
}

// Find Google Maps left sidebar feed scrollable element
function findScrollableFeed() {
  // Common role="feed" or layout selectors
  const feedByRole = document.querySelector('div[role="feed"]');
  if (feedByRole) return feedByRole;

  // Fallback searches
  const scrollContainers = Array.from(document.querySelectorAll('div'));
  return scrollContainers.find(el => {
    const style = window.getComputedStyle(el);
    return (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.clientHeight > 300 && el.querySelectorAll('a[href*="/maps/place/"]').length > 2;
  });
}

// Parse details from Right side info panel
function parseSidePanelDetails() {
  const result = {
    name: "",
    rating: 0,
    reviewsCount: 0,
    address: "N/A",
    phone: "N/A",
    website: "",
    email: "N/A"
  };

  try {
    // 1. Name
    const titleEl = document.querySelector('h1.DUwDvf');
    result.name = titleEl ? titleEl.innerText.trim() : "";

    // 2. Rating & Reviews
    const ratingEl = document.querySelector('div.F7nice span aria-hidden');
    if (ratingEl) {
      result.rating = parseFloat(ratingEl.textContent.trim()) || 0;
    }
    const reviewsEl = document.querySelector('div.F7nice span:nth-child(2)');
    if (reviewsEl) {
      result.reviewsCount = parseInt(reviewsEl.textContent.replace(/[()]/g, "").trim()) || 0;
    }

    // 3. Address
    const addrBtn = document.querySelector('button[data-item-id="address"]');
    if (addrBtn) {
      result.address = addrBtn.innerText.trim();
    }

    // 4. Phone
    const phoneBtn = document.querySelector('button[data-item-id*="phone:tel:"]');
    if (phoneBtn) {
      result.phone = phoneBtn.innerText.trim();
    }

    // 5. Website
    const webBtn = document.querySelector('a[data-item-id="authority"]');
    if (webBtn) {
      result.website = webBtn.getAttribute("href") || "";
    }

    // 6. Basic Email extraction from website content (Mocking email lookup placeholder)
    if (result.website) {
      result.email = `info@${extractDomain(result.website)}`;
    }

  } catch (err) {
    console.error("Field parsing error:", err);
  }

  return result;
}

function extractDomain(url) {
  try {
    let hostname = new URL(url).hostname;
    return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  } catch (e) {
    return "";
  }
}

// Post lead details to Next.js API router
async function saveLeadToDatabase(lead) {
  try {
    const { authState } = await chrome.storage.local.get("authState");
    if (!authState || !authState.token) return;
    const url = authState.apiUrl || "https://pixelleadflow.vercel.app";
    await fetch(`${url}/api/leads/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authState.token}`
      },
      body: JSON.stringify(lead)
    });
  } catch (err) {
    console.error("Failed to post lead data:", err);
  }
}

function reportState(status) {
  scrapeState.status = status;
  chrome.runtime.sendMessage({
    action: "SCRAPE_PROGRESS",
    state: scrapeState
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
