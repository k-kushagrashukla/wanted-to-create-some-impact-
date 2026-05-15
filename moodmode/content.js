// Stop execution if extension context is already invalid
if (!chrome.runtime?.id) {
  throw new Error("Extension context invalidated");
}

function applyTheme(themeName) {
  if (!chrome.runtime?.id) return;

  const theme = MoodThemes?.[themeName];
  if (!theme) return;

  const styleId = "moodmode-style";
  let styleTag = document.getElementById(styleId);

  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = styleId;
    document.head.appendChild(styleTag);
  }

  styleTag.textContent = `
:root{
  --mm-bg-primary:${theme.bgPrimary};
  --mm-bg-secondary:${theme.bgSecondary};
  --mm-text-primary:${theme.textPrimary};
  --mm-text-muted:${theme.textMuted};
  --mm-border:${theme.border};
}

html, body {
  background-color: var(--mm-bg-primary) !important;
  color: var(--mm-text-primary) !important;
  transition: background-color 0.25s ease, color 0.25s ease;
}

body *:not(img):not(video):not(svg):not(canvas):not(iframe) {
  background-color: transparent !important;
  color: var(--mm-text-primary) !important;
}

input, textarea, button, select {
  background-color: var(--mm-bg-secondary) !important;
  color: var(--mm-text-primary) !important;
  border: 1px solid var(--mm-border) !important;
}

pre, code {
  background-color: var(--mm-bg-secondary) !important;
  color: var(--mm-text-primary) !important;
  padding: 4px 6px;
  border-radius: 6px;
}

a {
  color: var(--mm-text-muted) !important;
}

img, video, svg, canvas, iframe {
  background: none !important;
  filter: none !important;
}
`;
}

const hostname = window.location.hostname;

function loadTheme() {
  if (!chrome.runtime?.id) return;

  chrome.storage.sync.get([hostname, "_global"], (result) => {
    if (chrome.runtime.lastError || !chrome.runtime?.id) return;

    const siteData = result[hostname];
    const globalData = result["_global"];

    if (siteData && siteData.enabled) {
      applyTheme(siteData.theme);
    } else if (globalData && globalData.enabled) {
      applyTheme(globalData.theme);
    }
  });
}

loadTheme();

/* MESSAGE LISTENER */
try {
  chrome.runtime.onMessage.addListener((message) => {
    if (!chrome.runtime?.id) return;

    if (message.action === "updateTheme") {
      loadTheme();
    }
  });
} catch (e) {
  // ignore if extension reloaded
}

/* MUTATION OBSERVER (SAFE + DEBOUNCED) */
let debounceTimer;

const observer = new MutationObserver(() => {
  if (!chrome.runtime?.id) return;

  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    loadTheme();
  }, 400);
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});