// background.js

// This listener triggers when the extension icon is clicked.
chrome.action.onClicked.addListener((tab) => {
  // Check if the current tab's URL matches the OpenAI Chat URL.
  if (tab.url && tab.url.startsWith("https://chat.openai.com/")) {
    // Send a message to the content script to toggle the overlay.
    chrome.tabs.sendMessage(tab.id, { action: 'toggleOverlay' });
    console.log('toggleOverlay message sent');
  } else {
    // If it's not on OpenAI Chat, set the popup to the popup.html
    chrome.action.setPopup({ tabId: tab.id, popup: "popup.html" });
    chrome.action.openPopup();
  }
});

// Listen for messages from the content or popup scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background script:', message);

  if (message.action === 'sendToClaudeTab') {
    chrome.tabs.create({ url: 'https://claude.ai' }, (tab) => {
      // Listener to detect when the new tab is fully loaded
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
          // Send the message to paste text into Claude's input field
          chrome.tabs.sendMessage(tabId, {
            action: 'pasteText',
            text: message.text
          });
          chrome.tabs.onUpdated.removeListener(listener); // Clean up the listener
        }
      });
    });
    sendResponse({ success: true });
  } else if (message.action === 'sendToClaudeAPI') {
    // Implement Claude API call here (stubbed as example)
    console.log('Sending message to Claude API:', message.text);
    // Simulating an API call with setTimeout
    setTimeout(() => {
      // Simulate an API response
      sendResponse({ answer: `Claude API response: ${message.text}` });
    }, 1000);
    return true; // Keep the message channel open for async response
  } else if (message.action === 'contentScriptLoaded') {
    console.log('Content script loaded successfully');
    sendResponse({ success: true });
  }
  
  // Return true to indicate that we will respond asynchronously
  return true;
});

// Listen for tab updates to inject content script into Claude tab if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('https://claude.ai')) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['claude-content-script.js']
    });
  }
});
