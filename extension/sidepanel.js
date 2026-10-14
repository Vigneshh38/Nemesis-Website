const DEFAULT_APP_URL = "http://localhost:3000";

const frame = document.getElementById("nemesis-frame");
const inspectTabBtn = document.getElementById("inspect-tab-btn");
const settingsBtn = document.getElementById("settings-toggle-btn");
const settingsModal = document.getElementById("settings-modal");
const appUrlInput = document.getElementById("app-url-input");
const saveSettingsBtn = document.getElementById("save-settings-btn");
const cancelSettingsBtn = document.getElementById("cancel-settings-btn");
const targetUrlInput = document.getElementById("target-url-input");
const quickInspectBtn = document.getElementById("quick-inspect-btn");

let currentBaseUrl = DEFAULT_APP_URL;

// Load stored URL
chrome.storage.sync.get(["nemesisAppUrl"], (res) => {
  if (res.nemesisAppUrl) {
    currentBaseUrl = res.nemesisAppUrl.replace(/\/$/, "");
    appUrlInput.value = currentBaseUrl;
  }
  frame.src = currentBaseUrl;
});

// Toggle Settings
settingsBtn.addEventListener("click", () => {
  settingsModal.classList.toggle("active");
});

cancelSettingsBtn.addEventListener("click", () => {
  settingsModal.classList.remove("active");
});

saveSettingsBtn.addEventListener("click", () => {
  let val = appUrlInput.value.trim().replace(/\/$/, "");
  if (!val) val = DEFAULT_APP_URL;
  chrome.storage.sync.set({ nemesisAppUrl: val }, () => {
    currentBaseUrl = val;
    frame.src = val;
    settingsModal.classList.remove("active");
  });
});

// Quick Scan from input
function scanInput(val) {
  if (!val) return;
  // If looks like URL, point frame directly to link scanner
  const target = `${currentBaseUrl}/tools/link?url=${encodeURIComponent(val)}`;
  frame.src = target;
}

quickInspectBtn.addEventListener("click", () => {
  scanInput(targetUrlInput.value.trim());
});

targetUrlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    scanInput(targetUrlInput.value.trim());
  }
});

// Inspect active tab
inspectTabBtn.addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && !tab.url.startsWith("chrome://")) {
      targetUrlInput.value = tab.url;
      scanInput(tab.url);
    }
  } catch (err) {
    console.error("Could not fetch active tab:", err);
  }
});
