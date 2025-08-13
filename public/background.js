// This function is called when the user clicks on the extension action (the icon).
chrome.action.onClicked.addListener(async (tab) => {
  const gameUrl = chrome.runtime.getURL("index.html");

  // Check if a tab with the game's URL is already open.
  const tabs = await chrome.tabs.query({ url: gameUrl });

  if (tabs.length > 0) {
    // If it's already open, focus that tab and window.
    await chrome.tabs.update(tabs[0].id, { active: true });
    await chrome.windows.update(tabs[0].windowId, { focused: true });
  } else {
    // If not, create a new tab.
    chrome.tabs.create({ url: gameUrl });
  }
});