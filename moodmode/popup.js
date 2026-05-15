document.addEventListener("DOMContentLoaded", async () => {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // 🚫 Block restricted pages
    if (
      !tab ||
      !tab.url ||
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("edge://") ||
      tab.url.startsWith("about:")
    ) {
      document.body.innerHTML =
        "<p style='padding:16px'>MoodMode cannot run on this page.</p>";
      return;
    }

    const hostname = new URL(tab.url).hostname;

    const themeSelect = document.getElementById("themeSelect");
    const enableToggle = document.getElementById("enableToggle");
    const globalToggle = document.getElementById("globalToggle");

    // 🔥 LOAD BOTH GLOBAL + SITE DATA
    chrome.storage.sync.get([hostname, "_global"], (result) => {
      const siteData = result[hostname];
      const globalData = result["_global"];

      if (siteData) {
        enableToggle.checked = siteData.enabled;
        themeSelect.value = siteData.theme;
        globalToggle.checked = false;
      } else if (globalData) {
        enableToggle.checked = globalData.enabled;
        themeSelect.value = globalData.theme;
        globalToggle.checked = true;
      }
    });

    function updateTheme() {
      const theme = themeSelect.value;
      const enabled = enableToggle.checked;
      const isGlobal = globalToggle.checked;

      if (isGlobal) {
        chrome.storage.sync.remove(hostname);

        chrome.storage.sync.set({
          _global: {
            theme: theme,
            enabled: enabled,
          },
        });
      } else {
        chrome.storage.sync.remove("_global");

        chrome.storage.sync.set({
          [hostname]: {
            theme: theme,
            enabled: enabled,
          },
        });
      }

      // ✅ SAFE message sending
      if (tab.id) {
        chrome.tabs.sendMessage(
          tab.id,
          { action: "updateTheme" },
          () => {
            if (chrome.runtime.lastError) {
              // Prevents error from showing in console
              console.log("Message ignored:", chrome.runtime.lastError.message);
            }
          }
        );
      }
    }

    themeSelect.addEventListener("change", updateTheme);
    enableToggle.addEventListener("change", updateTheme);
    globalToggle.addEventListener("change", updateTheme);

  } catch (error) {
    console.log("Popup error:", error);
  }
});