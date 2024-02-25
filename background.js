/**
 * Open the main.html page when the extension icon is clicked.
 */
chrome.browserAction.onClicked.addListener(function () {
  chrome.windows.create({
    url: chrome.runtime.getURL("main.html"),
    type: "popup",
    width: 500,
    height: 600,
  });
});
