// claude-content-script.js

console.log("Claude content script loaded");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'pasteText') {
    const inputField = document.querySelector('textarea'); // Adjust selector as needed
    if (inputField) {
      inputField.value = request.text;
      inputField.dispatchEvent(new Event('input', { bubbles: true }));
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Input field not found' });
    }
  }
  return true;
});
