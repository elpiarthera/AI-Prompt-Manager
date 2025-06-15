// claude-content-script.js

console.log("AI Prompt Manager: Claude content script loaded");

const DEFAULT_CLAUDE_INPUT_SELECTOR = 'div.ProseMirror[contenteditable="true"]';
let CLAUDE_INPUT_SELECTOR = DEFAULT_CLAUDE_INPUT_SELECTOR; // Initialize with default

// Helper function to validate CSS selectors
function isValidSelector(selector) {
    if (typeof selector !== 'string' || selector.trim() === '') {
        return false;
    }
    try {
        document.createDocumentFragment().querySelector(selector);
        return true;
    } catch (e) {
        return false;
    }
}

// Function to load selectors from storage for Claude
function loadClaudeSelectors() {
    return new Promise((resolve) => {
        // Reset to default before loading, in case this function is called multiple times (though currently not)
        CLAUDE_INPUT_SELECTOR = DEFAULT_CLAUDE_INPUT_SELECTOR;

        chrome.storage.sync.get('userSelectors', (data) => {
            const userClaudeInputField = data.userSelectors?.claude?.inputField;

            if (userClaudeInputField && String(userClaudeInputField).trim() !== '') {
                if (isValidSelector(userClaudeInputField)) {
                    CLAUDE_INPUT_SELECTOR = userClaudeInputField;
                    console.log('AI Prompt Manager: Loaded user-defined Claude input selector:', CLAUDE_INPUT_SELECTOR);
                } else {
                    console.warn(`AI Prompt Manager: Invalid user-defined Claude input selector: "${userClaudeInputField}". Using default: "${DEFAULT_CLAUDE_INPUT_SELECTOR}"`);
                    // CLAUDE_INPUT_SELECTOR remains the default
                }
            } else {
                console.log('AI Prompt Manager: No user-defined Claude input selector found. Using default.');
            }
            console.log("AI Prompt Manager: Effective Claude Input Selector:", CLAUDE_INPUT_SELECTOR);
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
