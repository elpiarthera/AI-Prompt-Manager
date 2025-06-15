// claude-content-script.js

console.log("AI Prompt Manager: Claude content script loaded");

const DEFAULT_CLAUDE_INPUT_SELECTOR = 'div.ProseMirror[contenteditable="true"]';
let CLAUDE_INPUT_SELECTOR = DEFAULT_CLAUDE_INPUT_SELECTOR; // Initialize with default

/**
 * Determines whether a given string is a valid CSS selector.
 *
 * @param {string} selector - The CSS selector string to validate.
 * @returns {boolean} `true` if {@link selector} is a valid CSS selector, otherwise `false`.
 */
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

/**
 * Loads the Claude input field selector from Chrome storage, updating the global selector if a valid user-defined value is found.
 *
 * If no valid user-defined selector is present, the default selector is used.
 *
 * @returns {Promise<void>} Resolves when the selector has been loaded and set.
 */
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

/**
 * Initializes the Claude content script by loading the appropriate input field selector.
 *
 * Awaits loading of user-defined or default selectors before performing further initialization steps.
 */
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
