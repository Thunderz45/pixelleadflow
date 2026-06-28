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
  const btnLogin = document.getElementById("btn-login");
  const lnkDashboard = document.getElementById("lnk-dashboard");
  const btnAddProject = document.getElementById("btn-add-project");
  const btnViewLeads = document.getElementById("btn-view-leads");

  let token = null;

  function populateProjectsDropdown(projectsList, selectedId = "") {
    projectSelectEl.innerHTML = '<option value="">Uncategorized</option>';
    if (projectsList && projectsList.length > 0) {
      projectsList.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.innerText = p.name;
        if (p.id === selectedId) {
          opt.selected = true;
        }
        projectSelectEl.appendChild(opt);
      });
    }
  }
  let activeApiUrl = "https://leadflow.pixelstudiox.in";

  // Login click handler: redirect to Next.js dashboard login
  btnLogin.addEventListener("click", () => {
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
      activeApiUrl = auth.apiUrl || "https://leadflow.pixelstudiox.in";
      
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
      
      // Force UI state refresh with the token now assigned
      chrome.storage.local.get("engineState", (data) => {
        if (data.engineState) {
          updateUIState(data.engineState);
        } else {
          updateUIState({ status: "ready", leadsCount: 0 });
        }
      });

      // Populate projects select dropdown
      populateProjectsDropdown(projects);
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

  // Create Project click handler
  btnAddProject.addEventListener("click", () => {
    const name = prompt("Enter new project campaign name:");
    if (!name || !name.trim()) return;

    btnAddProject.disabled = true;
    chrome.runtime.sendMessage({ action: "CREATE_PROJECT", name: name.trim() }, (response) => {
      btnAddProject.disabled = false;
      if (response && response.success && response.project) {
        // Refresh project list and automatically select the new project!
        chrome.runtime.sendMessage({ action: "SYNC_AUTH" }, (syncRes) => {
          if (syncRes && syncRes.projects) {
            populateProjectsDropdown(syncRes.projects, response.project.id);
          }
        });
      } else {
        alert(response?.error || "Failed to create campaign project. Make sure you are logged in.");
      }
    });
  });

  // View Saved Leads click handler: redirect to dashboard filtered project view
  btnViewLeads.addEventListener("click", () => {
    const projectId = projectSelectEl.value; // gets document ID, e.g. "zT81oB7a3d"
    const targetUrl = projectId 
      ? `${activeApiUrl}/dashboard/saved?project=${projectId}`
      : `${activeApiUrl}/dashboard/saved`;
    chrome.tabs.create({ url: targetUrl });
  });
});
