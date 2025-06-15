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
    chrome.storage.sync.get('claudeApiKey', (data) => {
      if (!data.claudeApiKey || data.claudeApiKey.trim() === '') {
        sendResponse({ error: 'Claude API key not set. Please set it in the extension options.' });
        return; // Must return here as sendResponse was called.
      }

      const apiKey = data.claudeApiKey;
      const apiUrl = 'https://api.anthropic.com/v1/messages';
      const model = "claude-3-haiku-20240307"; // Or a different model if preferred

      const requestBody = {
        model: model,
        max_tokens: 2048, // Increased max_tokens for potentially longer responses
        messages: [
          { role: "user", content: message.text }
        ]
      };

      console.log('Sending message to Claude API with model:', model, 'and text:', message.text);

      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      .then(response => {
        if (!response.ok) {
          // Attempt to read error body for more details
          return response.json().then(errorBody => {
            console.error('Claude API Error Response:', errorBody);
            // Try to extract a meaningful message from common error structures
            let detail = "Unknown error";
            if (errorBody && errorBody.error && errorBody.error.message) {
                detail = errorBody.error.message;
            } else if (errorBody && errorBody.detail) {
                detail = errorBody.detail;
            } else {
                detail = JSON.stringify(errorBody);
            }
            throw new Error(`HTTP error ${response.status}: ${detail}`);
          }).catch((parsingError) => {
            // If reading error body fails or it's not JSON
            console.error('Claude API: Failed to parse error response:', parsingError);
            throw new Error(`HTTP error ${response.status}. Could not parse error details.`);
          });
        }
        return response.json();
      })
      .then(apiResponse => {
        console.log('Claude API Full Response:', apiResponse);
        const claudeTextResponse = apiResponse.content && apiResponse.content[0] && apiResponse.content[0].text;
        if (claudeTextResponse !== undefined && claudeTextResponse !== null) { // Check for undefined or null explicitly
          sendResponse({ answer: claudeTextResponse });
        } else {
          console.error('Unexpected API response structure from Claude:', apiResponse);
          sendResponse({ error: 'Unexpected API response structure.', details: apiResponse });
        }
      })
      .catch(error => {
        console.error('Claude API call failed:', error);
        sendResponse({ error: `Claude API call failed: ${error.message}` });
      });
    });
    return true; // Keep the message channel open for async response (due to storage.get and fetch)
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
