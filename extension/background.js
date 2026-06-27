// LeadFlow Service Worker
let activeScrapeTabId = null;
const VERCEL_URL = "https://pixelleadflow.vercel.app";
let detectedApiUrl = VERCEL_URL;

// Fallback: Query tab local storage directly if cookie reading is restricted
async function getAuthTokenFromLocalStorage() {
  try {
    const tabs = await chrome.tabs.query({ url: "*://pixelleadflow.vercel.app/*" });
    if (tabs && tabs.length > 0) {
      // Use scripting API to grab localStorage variables from active tab
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => {
          return {
            token: localStorage.getItem("leadflow_auth_token"),
            email: localStorage.getItem("leadflow_user_email"),
            uid: localStorage.getItem("leadflow_user_id")
          };
        }
      });
      if (results && results[0] && results[0].result) {
        return results[0].result;
      }
    }
  } catch (err) {
    console.warn("Could not read auth from tab localStorage:", err);
  }
  return null;
}

// Synchronize authentication from dashboard cookies
async function syncAuthState() {
  try {
    // 1. Try reading the cookie (port/scheme checked)
    const cookie = await chrome.cookies.get({
      url: VERCEL_URL + "/",
      name: "leadflow_auth_token"
    });

    let token = cookie ? cookie.value : null;
    let email = null;
    let uid = null;

    if (token) {
      const payloadBase64 = token.split('.')[1];
      const payloadDecoded = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
      email = payloadDecoded.email;
      uid = payloadDecoded.user_id || payloadDecoded.sub;
    } else {
      // 2. Fallback: Query tab localStorage directly
      const tabData = await getAuthTokenFromLocalStorage();
      if (tabData && tabData.token) {
        token = tabData.token;
        email = tabData.email;
        uid = tabData.uid;
        console.log("LeadFlow Auth: Successfully synchronized credentials from tab localStorage.");
      }
    }

    if (token) {
      const authState = {
        authenticated: true,
        token: token,
        uid: uid || "user",
        email: email || "Sync Active",
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

// Create a new campaign project in Firestore via Dashboard API
async function createCampaignProject(token, apiUrl, name) {
  try {
    const res = await fetch(`${apiUrl}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name, description: "Created via Chrome Extension" })
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    } else {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || "Failed API status check." };
    }
  } catch (error) {
    console.error("Create project fetch error:", error);
    return { success: false, error: error.message || "Network request failed." };
  }
}

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

  if (message.action === "CREATE_PROJECT") {
    syncAuthState()
      .then((auth) => {
        if (auth.authenticated) {
          createCampaignProject(auth.token, auth.apiUrl, message.name)
            .then((res) => {
              sendResponse(res);
            })
            .catch((err) => {
              sendResponse({ success: false, error: err.message });
            });
        } else {
          sendResponse({ success: false, error: "Authentication session expired or invalid." });
        }
      })
      .catch((err) => {
        sendResponse({ success: false, error: "Failed to initialize auth sync." });
      });
    return true; // async resolution
  }

  // Routing controls from Popup to Content Script
  if (message.action === "START_SCRAPE") {
    const { keyword, location } = message;
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(keyword + " " + location)}`;

    // Open Google Maps search directly in a separate MINIMIZED background window
    chrome.windows.create({
      url: searchUrl,
      type: "normal",
      state: "minimized"
    }, (newWindow) => {
      if (newWindow && newWindow.tabs && newWindow.tabs.length > 0) {
        const newTab = newWindow.tabs[0];
        activeScrapeTabId = newTab.id;

        // Listen for the tab load completion, then trigger the scraping loop
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
          if (tabId === activeScrapeTabId && changeInfo.status === "complete") {
            chrome.tabs.onUpdated.removeListener(listener);

            // Persist search parameters to storage for redirect/reload recovery
            chrome.storage.local.set({
              engineState: {
                status: "searching",
                leadsCount: 0,
                keyword,
                location,
                maxResults: message.maxResults,
                projectId: message.projectId
              }
            }, () => {
              chrome.tabs.sendMessage(activeScrapeTabId, message, (res) => {
                sendResponse(res || { success: true, background: true });
              });
            });
          }
        });
      } else {
        sendResponse({ error: "Failed to open background automation window." });
      }
    });
    return true; // async sendResponse
  }

  if (["PAUSE_SCRAPE", "RESUME_SCRAPE", "STOP_SCRAPE"].includes(message.action)) {
    if (activeScrapeTabId) {
      if (message.action === "STOP_SCRAPE") {
        // Close the background automation tab/window when stopped!
        chrome.tabs.remove(activeScrapeTabId).catch(() => {});
        activeScrapeTabId = null;
      } else {
        // Send pause/resume down to the background tab
        chrome.tabs.sendMessage(activeScrapeTabId, message, (response) => {
          sendResponse(response || { success: true });
        });
        return true;
      }
    }
    sendResponse({ success: true });
    return;
  }

  // Progress update from Content Script
  if (message.action === "SCRAPE_PROGRESS") {
    chrome.storage.local.set({ engineState: message.state });
    
    // Broadcast progress to popup if open
    chrome.runtime.sendMessage({
      action: "UPDATE_POPUP_STATE",
      state: message.state
    }).catch(() => {/* popup might be closed */});

    // Automatically close the minimized background tab when finished or stopped
    if (["completed", "stopped", "ready"].includes(message.state.status.toLowerCase())) {
      if (activeScrapeTabId) {
        chrome.tabs.remove(activeScrapeTabId).catch(() => {});
        activeScrapeTabId = null;
      }
    }

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
