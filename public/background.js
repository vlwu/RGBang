// This script can be expanded for more complex extension logic.
// For now, it's just here to satisfy the manifest requirement.
chrome.runtime.onInstalled.addListener(() => {
  console.log('RGBang extension installed.');
});
