// LeadFlow Service Worker
let activeScrapeTabId = null;
const VERCEL_URL = "https://leadflow.pixelstudiox.in";
let detectedApiUrl = VERCEL_URL;

// Synchronize authentication from dashboard cookies
async function syncAuthState() {
  try {
    // Try reading the cookie (port/scheme checked)
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
      return projects;
    }
  } catch (error) {
    console.error("Could not load projects from API:", error);
  }
  return null;
}

// Fetch active scraper configurations from Dashboard API
async function fetchScraperSettings(token, apiUrl) {
  try {
    const res = await fetch(`${apiUrl}/api/settings`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      const settings = await res.json();
      return settings;
    }
  } catch (error) {
    console.error("Could not load settings from API:", error);
  }
  return {
    defaultMaxResults: 50,
    autoScrollDelay: 1000,
    retryAttempts: 3,
    skipDuplicates: true
  };
}

// Fetch active scrape run state from Dashboard API
async function fetchLatestScrapeState(token, apiUrl) {
  try {
    const res = await fetch(`${apiUrl}/api/scrape/history`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      const state = await res.json();
      return state;
    }
  } catch (error) {
    console.error("Could not load scrape history from API:", error);
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

// Send lead details to Dashboard API (Executed in Background Service Worker to bypass CORS restrictions)
async function postLeadRecord(token, apiUrl, lead) {
  try {
    const res = await fetch(`${apiUrl}/api/leads/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(lead)
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    } else {
      const errText = await res.text();
      console.error("Leads save API response failed:", errText);
      return { success: false, error: errText };
    }
  } catch (error) {
    console.error("Leads save fetch request failed:", error);
    return { success: false, error: error.message };
  }
}

// Handle incoming message pipelines
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received msg:", message);

  if (message.action === "SAVE_LEAD") {
    syncAuthState()
      .then((auth) => {
        if (auth.authenticated) {
          postLeadRecord(auth.token, auth.apiUrl, message.lead)
            .then((res) => {
              sendResponse(res);
            })
            .catch((err) => {
              sendResponse({ success: false, error: err.message });
            });
        } else {
          sendResponse({ success: false, error: "Auth session expired. Please log in." });
        }
      })
      .catch((err) => {
        sendResponse({ success: false, error: "Failed to sync credentials." });
      });
    return true; // async resolution
  }

  if (message.action === "SYNC_AUTH") {
    syncAuthState()
      .then((auth) => {
        if (auth.authenticated) {
          Promise.all([
            fetchCampaignProjects(auth.token, auth.apiUrl),
            fetchLatestScrapeState(auth.token, auth.apiUrl)
          ])
            .then(([projs, serverState]) => {
              sendResponse({ auth, projects: projs || [], serverState });
            })
            .catch((err) => {
              console.error("SYNC_AUTH fetch failure:", err);
              sendResponse({ auth, projects: [], serverState: null });
            });
        } else {
          sendResponse({ auth, projects: [], serverState: null });
        }
      })
      .catch((err) => {
        console.error("Auth sync failure inside messaging:", err);
        sendResponse({
          auth: { authenticated: false, token: null, uid: null, email: null, apiUrl: detectedApiUrl },
          projects: [],
          serverState: null
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

    syncAuthState().then(async (auth) => {
      let dbSettings = { autoScrollDelay: 1000, retryAttempts: 3, skipDuplicates: true };
      if (auth.authenticated) {
        const fetched = await fetchScraperSettings(auth.token, auth.apiUrl);
        if (fetched) {
          dbSettings = fetched;
        }
      }

      // Merge user settings into the message sent to content.js
      const mergedMessage = {
        ...message,
        settings: dbSettings
      };

      chrome.windows.create({
        url: searchUrl,
        type: "normal",
        state: "minimized"
      }, (newWindow) => {
        if (newWindow && newWindow.tabs && newWindow.tabs.length > 0) {
          const newTab = newWindow.tabs[0];
          activeScrapeTabId = newTab.id;

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
                  projectId: message.projectId,
                  settings: dbSettings
                }
              }, () => {
                chrome.tabs.sendMessage(activeScrapeTabId, mergedMessage, (res) => {
                  sendResponse(res || { success: true, background: true });
                });
              });
            }
          });
        } else {
          sendResponse({ error: "Failed to open background automation window." });
        }
      });
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
