// LeadFlow Service Worker
let activeScrapeTabId = null;
let detectedApiUrl = "http://localhost:3001";

// Dynamically detect which port the dashboard is active on
async function detectActivePort() {
  // 1. Scan open tabs for a matching dashboard url
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.url) {
        try {
          const urlObj = new URL(tab.url);
          if ((urlObj.hostname === "localhost" || urlObj.hostname === "127.0.0.1") && 
              (urlObj.port === "3001")) {
            return urlObj.origin;
          }
          if (urlObj.hostname.endsWith(".vercel.app")) {
            return urlObj.origin;
          }
        } catch (e) {}
      }
    }
  } catch (err) {
    console.warn("Could not query browser tabs:", err);
  }
  return null;
}

// Synchronize authentication from dashboard cookies
async function syncAuthState() {
  try {
    let targetUrl = await detectActivePort();
    let cookie = null;

    if (targetUrl) {
      cookie = await chrome.cookies.get({
        url: targetUrl,
        name: "leadflow_auth_token"
      });
    }

    // If no matching cookie on active tab origin, scan loopbacks and vercel domains directly
    if (!cookie || !cookie.value) {
      const candidates = [
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://pixelleadflow.vercel.app"
      ];
      
      for (const origin of candidates) {
        if (origin === targetUrl) continue;
        try {
          const testCookie = await chrome.cookies.get({
            url: origin,
            name: "leadflow_auth_token"
          });
          if (testCookie && testCookie.value) {
            cookie = testCookie;
            targetUrl = origin;
            break;
          }
        } catch (e) {}
      }
    }

    // Default fallback
    detectedApiUrl = targetUrl || "http://localhost:3001";

    if (cookie && cookie.value) {
      const token = cookie.value;
      const payloadBase64 = token.split('.')[1];
      const payloadDecoded = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
      
      const authState = {
        authenticated: true,
        token: token,
        uid: payloadDecoded.user_id || payloadDecoded.sub,
        email: payloadDecoded.email || "Sync Active",
        apiUrl: detectedApiUrl
      };

      await chrome.storage.local.set({ authState });
      console.log("LeadFlow Auth synced email:", authState.email, "Target API:", detectedApiUrl);
      return authState;
    } else {
      const authState = { 
        authenticated: false, 
        token: null, 
        uid: null, 
        email: null,
        apiUrl: detectedApiUrl 
      };
      await chrome.storage.local.set({ authState });
      console.log("LeadFlow Auth: Not authenticated for host:", detectedApiUrl);
      return authState;
    }
  } catch (error) {
    console.error("Auth sync failure:", error);
    return { authenticated: false, token: null, uid: null, email: null, apiUrl: detectedApiUrl };
  }
}

// Fetch campaigns list from the Dashboard API
async function fetchCampaignProjects(token, apiUrl) {
  try {
    const res = await fetch(`${apiUrl}/api/projects`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      const projects = await res.json();
      await chrome.storage.local.set({ projects });
      return projects;
    }
  } catch (error) {
    console.error("Could not load projects from API:", error);
  }
  return null;
}

// Listen for install / startups
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    engineState: {
      status: "ready",
      leadsCount: 0,
      keyword: "",
      location: "",
      projectId: ""
    }
  });
  syncAuthState();
});

chrome.runtime.onStartup.addListener(() => {
  syncAuthState();
});

// Alarm / timer for background cookie check
chrome.alarms.create("syncAuthAlarm", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "syncAuthAlarm") {
    syncAuthState();
  }
});

// Handle incoming message pipelines
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received msg:", message);

  if (message.action === "SYNC_AUTH") {
    syncAuthState()
      .then((auth) => {
        if (auth.authenticated) {
          fetchCampaignProjects(auth.token, auth.apiUrl)
            .then((projs) => {
              sendResponse({ auth, projects: projs || [] });
            })
            .catch((err) => {
              console.error("Projects fetch failure inside messaging:", err);
              sendResponse({ auth, projects: [] });
            });
        } else {
          sendResponse({ auth, projects: [] });
        }
      })
      .catch((err) => {
        console.error("Auth sync failure inside messaging:", err);
        sendResponse({
          auth: { authenticated: false, token: null, uid: null, email: null, apiUrl: detectedApiUrl },
          projects: []
        });
      });
    return true; // async resolution
  }

  // Routing controls from Popup to Content Script
  if (["START_SCRAPE", "PAUSE_SCRAPE", "RESUME_SCRAPE", "STOP_SCRAPE"].includes(message.action)) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        sendResponse({ error: "No active window tabs found." });
        return;
      }
      const activeTab = tabs[0];
      activeScrapeTabId = activeTab.id;

      // Ensure we are on Google Maps
      if (!activeTab.url || !activeTab.url.includes("google.") || !activeTab.url.includes("/maps")) {
        sendResponse({ error: "Please open Google Maps page in active tab." });
        return;
      }

      // Propagate the action down to Content Script
      chrome.tabs.sendMessage(activeTab.id, message, (response) => {
        sendResponse(response || { success: true });
      });
    });
    return true;
  }

  // Progress update from Content Script
  if (message.action === "SCRAPE_PROGRESS") {
    chrome.storage.local.set({ engineState: message.state });
    
    // Broadcast progress to popup if open
    chrome.runtime.sendMessage({
      action: "UPDATE_POPUP_STATE",
      state: message.state
    }).catch(() => {/* popup might be closed */});

    // Update active history run record in Firebase
    syncProgressToDashboard(message.state);
  }
});

// Sync progress record to Next.js API
async function syncProgressToDashboard(state) {
  try {
    const { authState } = await chrome.storage.local.get("authState");
    if (!authState || !authState.token) return;

    const url = authState.apiUrl || "http://localhost:3001";

    await fetch(`${url}/api/scrape/history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authState.token}`
      },
      body: JSON.stringify({
        keyword: state.keyword,
        location: state.location,
        projectId: state.projectId,
        maxResults: state.maxResults,
        resultsCount: state.leadsCount,
        status: state.status
      })
    });
  } catch (err) {
    console.error("Dashboard sync error:", err);
  }
}
