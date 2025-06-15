// claude-content-script.js

console.log("AI Prompt Manager: Claude content script loaded");

let CLAUDE_INPUT_SELECTOR = 'div.ProseMirror[contenteditable="true"]'; // Default

// Function to load selectors from storage for Claude
function loadClaudeSelectors() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('userSelectors', (data) => {
            if (data.userSelectors && data.userSelectors.claude &&
                data.userSelectors.claude.inputField && String(data.userSelectors.claude.inputField).trim() !== '') {
                CLAUDE_INPUT_SELECTOR = data.userSelectors.claude.inputField;
                console.log('AI Prompt Manager: Loaded user-defined Claude input selector:', CLAUDE_INPUT_SELECTOR);
            } else {
                console.log('AI Prompt Manager: Using default Claude input selector.');
            }
            resolve();
        });
    });
}

async function initializeClaudeScript() {
    await loadClaudeSelectors();
    // Any other initialization steps that depend on selectors can go here.
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'pasteText') {
    const inputField = document.querySelector(CLAUDE_INPUT_SELECTOR);
    if (inputField) {
      // For contenteditable divs, setting innerText or textContent is more appropriate
      if (inputField.isContentEditable) {
        inputField.textContent = request.text;
      } else { // For textarea or input
        inputField.value = request.text;
      }
      inputField.dispatchEvent(new Event('input', { bubbles: true }));
      inputField.focus(); // Focus the field after pasting
      sendResponse({ success: true });
    } else {
      console.error('AI Prompt Manager: Claude input field not found with selector:', CLAUDE_INPUT_SELECTOR);
      sendResponse({ success: false, error: 'Input field not found for Claude.ai' });
    }
  } else if (request.action === "ping") { // For checking if content script is loaded
    sendResponse({ status: "pong" });
  }
  return true; // Keep channel open for async response
});

// Initialize the script
initializeClaudeScript();
