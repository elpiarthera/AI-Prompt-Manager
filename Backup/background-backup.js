chrome.runtime.onInstalled.addListener(() => {
  console.log("AI Prompt Manager extension installed.");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PROCESS_CSV") {
    console.log("Received CSV data:", message.data);
    sendResponse({ status: "success" });
  } else {
    console.warn("Unknown message type:", message.type);
  }
});

// If you don't need the alarms API, simply don't use it. 
// If you plan to use it in the future, ensure you add the "alarms" permission in the manifest.
