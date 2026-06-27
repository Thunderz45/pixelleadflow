// LeadFlow Service Worker
let activeScrapeTabId = null;
const VERCEL_URL = "https://pixelleadflow.vercel.app";
let detectedApiUrl = VERCEL_URL;

// Synchronize authentication from dashboard cookies
async function syncAuthState() {
  try {
    const cookie = await chrome.cookies.get({
      url: VERCEL_URL,
      name: "leadflow_auth_token"
    });

    if (cookie && cookie.value) {
      const token = cookie.value;
      const payloadBase64 = token.split('.')[1];
      const payloadDecoded = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
      
      const authState = {
        authenticated: true,
        token: token,
        uid: payloadDecoded.user_id || payloadDecoded.sub,
        email: payloadDecoded.email || "Sync Active",
        apiUrl: VERCEL_URL
      };

      await chrome.storage.local.set({ authState });
      console.log("LeadFlow Auth synced email:", authState.email, "Target API:", VERCEL_URL);
      return authState;
    } else {
      const authState = { 
        authenticated: false, 
        token: null, 
        uid: null, 
        email: null,
        apiUrl: VERCEL_URL 
      };
      await chrome.storage.local.set({ authState });
      console.log("LeadFlow Auth: Not authenticated for host:", VERCEL_URL);
      return authState;
    }
  } catch (error) {
    console.error("Auth sync failure:", error);
    return { authenticated: false, token: null, uid: null, email: null, apiUrl: VERCEL_URL };
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

    const url = authState.apiUrl || VERCEL_URL;

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
