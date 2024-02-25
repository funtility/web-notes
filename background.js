/**
 * Open the main.html page when the extension icon is clicked.
 */
chrome.action.onClicked.addListener(function (tab) {
  chrome.windows.create({
    url: chrome.runtime.getURL("main.html"),
    type: "popup",
    width: 500,
    height: 600,
  });
  setTimeout(() => {
    chrome.runtime.sendMessage({ type: "openPopup", tab: tab });
  }, 500);
});
