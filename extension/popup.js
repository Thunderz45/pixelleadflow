// LeadFlow Popup Controller

document.addEventListener("DOMContentLoaded", async () => {
  // Screens
  const loginScreen = document.getElementById("login-screen");
  const appScreen = document.getElementById("app-screen");

  // UI Bindings
  const authStatusEl = document.getElementById("auth-status");
  const projectSelectEl = document.getElementById("project-select");
  const keywordInputEl = document.getElementById("keyword-input");
  const locationInputEl = document.getElementById("location-input");
  const limitInputEl = document.getElementById("limit-input");

  const engineStatusEl = document.getElementById("engine-status");
  const leadsCountEl = document.getElementById("leads-count");
  const progressFillEl = document.getElementById("progress-fill");

  const btnStart = document.getElementById("btn-start");
  const btnPause = document.getElementById("btn-pause");
  const btnResume = document.getElementById("btn-resume");
  const btnStop = document.getElementById("btn-stop");
  const btnLoginGoogle = document.getElementById("btn-login-google");
  const lnkDashboard = document.getElementById("lnk-dashboard");

  let token = null;
  let activeApiUrl = "https://pixelleadflow.vercel.app";

  // Login click handler: redirect to Next.js dashboard login
  btnLoginGoogle.addEventListener("click", () => {
    chrome.tabs.create({ url: activeApiUrl });
  });

  // Initialize and Sync Auth Session
  chrome.runtime.sendMessage({ action: "SYNC_AUTH" }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn("Could not reach background script:", chrome.runtime.lastError);
      authStatusEl.innerText = "Error syncing";
      authStatusEl.className = "auth-badge auth-error";
      
      loginScreen.style.display = "flex";
      appScreen.style.display = "none";
      return;
    }

    if (!response) {
      console.warn("Empty response received from background script.");
      authStatusEl.innerText = "Error syncing";
      loginScreen.style.display = "flex";
      appScreen.style.display = "none";
      return;
    }

    const { auth, projects } = response;
    if (auth && auth.authenticated) {
      token = auth.token;
      activeApiUrl = auth.apiUrl || "http://localhost:3001";
      
      authStatusEl.innerText = auth.email;
      authStatusEl.title = auth.email;
      authStatusEl.className = "auth-badge";
      
      // Update footer redirect link to point to the active host Vercel/Local
      if (lnkDashboard) {
        lnkDashboard.href = `${activeApiUrl}/dashboard`;
      }

      // Show App panel, hide login CTA
      loginScreen.style.display = "none";
      appScreen.style.display = "flex";
      
      // Populate projects select dropdown
      projectSelectEl.innerHTML = '<option value="">Uncategorized</option>';
      if (projects && projects.length > 0) {
        projects.forEach((p) => {
          const opt = document.createElement("option");
          opt.value = p.id;
          opt.innerText = p.name;
          projectSelectEl.appendChild(opt);
        });
      }
    } else {
      // Not authenticated, prompt login screen
      loginScreen.style.display = "flex";
      appScreen.style.display = "none";
    }
  });

  // Restore current storage running states
  chrome.storage.local.get(["engineState", "authState"], (data) => {
    if (data.engineState) {
      updateUIState(data.engineState);
    }
  });

  // Listen to background updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "UPDATE_POPUP_STATE") {
      updateUIState(message.state);
    }
  });

  function disableInputs(disabled) {
    keywordInputEl.disabled = disabled;
    locationInputEl.disabled = disabled;
    limitInputEl.disabled = disabled;
    projectSelectEl.disabled = disabled;
  }

  function updateUIState(state) {
    if (!engineStatusEl) return;
    
    engineStatusEl.innerText = state.status;
    engineStatusEl.className = `status-value status-${state.status.toLowerCase()}`;
    leadsCountEl.innerText = state.leadsCount;

    // Progress bar calculations
    const maxVal = state.maxResults || 50;
    const countVal = state.leadsCount || 0;
    const percentage = Math.min((countVal / maxVal) * 100, 100);
    progressFillEl.style.width = `${percentage}%`;

    // Button states
    if (state.status === "searching" || state.status === "collecting") {
      disableInputs(true);
      btnStart.style.display = "none";
      btnStop.disabled = false;
      btnPause.disabled = false;
      btnPause.style.display = "flex";
      btnResume.style.display = "none";
    } else if (state.status === "paused") {
      disableInputs(true);
      btnStart.style.display = "none";
      btnStop.disabled = false;
      btnPause.style.display = "none";
      btnResume.disabled = false;
      btnResume.style.display = "flex";
    } else {
      // ready, completed, stopped
      disableInputs(false);
      btnStart.style.display = "flex";
      btnStart.disabled = !token; // only enable if logged in
      btnStop.disabled = true;
      btnPause.style.display = "flex";
      btnPause.disabled = true;
      btnResume.style.display = "none";

      // Restore inputs from completed search params
      if (state.keyword) keywordInputEl.value = state.keyword;
      if (state.location) locationInputEl.value = state.location;
      if (state.maxResults) limitInputEl.value = state.maxResults;
      if (state.projectId) projectSelectEl.value = state.projectId;
    }
  }

  // Action Click Listeners
  btnStart.addEventListener("click", () => {
    const keyword = keywordInputEl.value.trim();
    const location = locationInputEl.value.trim();
    const maxResults = parseInt(limitInputEl.value) || 50;
    const projectId = projectSelectEl.value;

    if (!keyword) {
      alert("Please enter a search keyword.");
      return;
    }

    const command = {
      action: "START_SCRAPE",
      keyword,
      location,
      maxResults,
      projectId
    };

    chrome.runtime.sendMessage(command, (res) => {
      if (res && res.error) {
        alert(res.error);
      }
    });
  });

  btnPause.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "PAUSE_SCRAPE" });
  });

  btnResume.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "RESUME_SCRAPE" });
  });

  btnStop.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "STOP_SCRAPE" });
  });
});
