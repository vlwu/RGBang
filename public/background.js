// Listens for a click on the extension's icon and opens the game in a new tab.
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("index.html")
  });
});
