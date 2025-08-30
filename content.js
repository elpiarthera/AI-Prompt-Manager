// content.js

console.log("AI Prompt Manager: Content script loaded");

// --- Global Selectors ---
const DEFAULT_CHATGPT_SELECTORS = {
    inputField: 'textarea#prompt-textarea', // Default, will be overridden by stored if available
    submitButton: 'button[data-testid="send-button"]', // Default
    conversationContainer: 'div[class*="react-scroll-to-bottom"] > div > div', // Default for main message list
    messageElement: 'div[data-message-author-role]', // Default for each message block
    roleElement: '[data-message-author-role]', // Default for role, relative to messageElement
    contentElement: 'div.markdown' // Default for content, relative to messageElement
};
let CHATGPT_SELECTORS = { ...DEFAULT_CHATGPT_SELECTORS }; // Initialize with defaults

/**
 * Determines whether a given string is a valid CSS selector.
 *
 * @param {string} selector - The CSS selector string to validate.
 * @returns {boolean} True if {@link selector} is a valid CSS selector; otherwise, false.
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
 * Loads user-defined CSS selectors for ChatGPT UI elements from Chrome storage and updates the global selector object.
 *
 * Resets selectors to defaults before applying any valid user-defined overrides. Invalid or missing user selectors are ignored in favor of defaults.
 *
 * @returns {Promise<void>} Resolves when selectors have been loaded and applied.
 */
function loadSelectors() {
    return new Promise((resolve) => {
        // Ensure CHATGPT_SELECTORS is reset to defaults before loading user-defined ones
        // This is important if loadSelectors could be called multiple times, though currently it's only on init.
        CHATGPT_SELECTORS = { ...DEFAULT_CHATGPT_SELECTORS };

        chrome.storage.sync.get('userSelectors', (data) => {
            if (data.userSelectors && data.userSelectors.chatGPT) {
                console.log("AI Prompt Manager: Attempting to load user-defined ChatGPT selectors.");
                for (const key in DEFAULT_CHATGPT_SELECTORS) { // Iterate over known default keys
                    const userDefinedSelector = data.userSelectors.chatGPT[key];
                    if (userDefinedSelector && String(userDefinedSelector).trim() !== '') {
                        if (isValidSelector(userDefinedSelector)) {
                            CHATGPT_SELECTORS[key] = userDefinedSelector;
                        } else {
                            console.warn(`AI Prompt Manager: Invalid user-defined selector for ChatGPT's "${key}": "${userDefinedSelector}". Using default: "${DEFAULT_CHATGPT_SELECTORS[key]}"`);
                            // CHATGPT_SELECTORS[key] remains the default because we started with a fresh copy.
                        }
                    }
                    // If userDefinedSelector is empty or not set, the default from the initial spread is used.
                }
            } else {
                console.log("AI Prompt Manager: No user-defined ChatGPT selectors found. Using defaults.");
            }
            console.log("AI Prompt Manager: Effective ChatGPT Selectors:", CHATGPT_SELECTORS);
            resolve();
        });
    });
}

/**
 * Initializes the content script by loading selectors, injecting the overlay script, creating the overlay element, and setting up event listeners.
 *
 * @returns {Promise<void>} Resolves when initialization is complete.
 */
async function initialize() {
    await loadSelectors(); // Wait for selectors to be loaded

    // Inject the overlay script
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('overlay.js');
    (document.head || document.documentElement).appendChild(script);

    // Create and add the overlay to the page
    const overlay = document.createElement('ai-assistant-bridge');
    document.body.appendChild(overlay);

    // Set up event listeners for the overlay
    setupOverlayEventListeners(overlay);

    // Start MutationObserver (if needed for dynamic content)
    // For now, assuming selectors are stable enough or re-queried.
    // If dynamic loading of input field is an issue, re-enable observer.
    // startObserver();

    // Notify that the script has loaded successfully
    // chrome.runtime.sendMessage({action: "contentScriptLoaded"}); // Can be uncommented if needed by background
}

/**
 * Returns the ChatGPT input field element based on the current selector configuration.
 *
 * @returns {HTMLElement|null} The input field element if found; otherwise, {@code null}.
 */
function findInputField() {
    const element = document.querySelector(CHATGPT_SELECTORS.inputField);
    if (element) {
        console.log(`AI Prompt Manager: Input field found with selector: ${CHATGPT_SELECTORS.inputField}`);
        return element;
    }
    console.error("AI Prompt Manager: Input field not found with selector:", CHATGPT_SELECTORS.inputField);
    return null;
}

// Function to insert text into the input field
function insertTextIntoField(field, text) {
    if (field.tagName.toLowerCase() === 'textarea' || field.tagName.toLowerCase() === 'input') {
        field.value = text;
    } else if (field.getAttribute('contenteditable') === 'true') {
        field.textContent = text;
    }
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.focus();
}

/**
 * Returns the ChatGPT submit button element using the current selector configuration.
 *
 * @returns {Element|null} The submit button element if found; otherwise, {@code null}.
 */
function findSubmitButton() {
    const button = document.querySelector(CHATGPT_SELECTORS.submitButton);
    if (button) {
        console.log(`AI Prompt Manager: Submit button found with selector: ${CHATGPT_SELECTORS.submitButton}`);
        return button;
    }
    console.error("AI Prompt Manager: Submit button not found with selector:", CHATGPT_SELECTORS.submitButton);
    return null;
}

/**
 * Inserts a prompt into the ChatGPT input field and submits it.
 *
 * If the submit button is available and enabled, it is clicked to submit the prompt. Otherwise, an Enter key press is simulated on the input field.
 *
 * @param {string} prompt - The prompt text to insert and submit.
 * @throws {Error} If the input field cannot be found in the DOM.
 */
async function insertAndSubmitPrompt(prompt) { // Made async if findInputField/Button become async due to retries
    const inputField = findInputField();
    if (!inputField) {
        throw new Error("Input field not found");
    }

    insertTextIntoField(inputField, prompt);

    // Try to find and click the submit button
    const submitButton = findSubmitButton();
    if (submitButton && !submitButton.disabled) {
        submitButton.click();
    } else {
        console.log("AI Prompt Manager: Submit button not found or disabled, simulating Enter key press");
        inputField.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            which: 13,
            keyCode: 13,
            bubbles: true
        }));
    }
}

/**
 * Extracts the entire conversation from the ChatGPT interface as a formatted string.
 *
 * Iterates through all detected message elements, retrieving the role and content for each, and concatenates them into a readable transcript separated by double newlines.
 *
 * @returns {string} The full conversation with each message formatted as "role: content".
 */
function extractConversation() {
    // CHATGPT_SELECTORS.conversationContainer might point to the direct parent of messages or a higher ancestor.
    // CHATGPT_SELECTORS.messageElement should identify individual message blocks.
    const messageElements = document.querySelectorAll(CHATGPT_SELECTORS.messageElement);
    let conversation = '';
    messageElements.forEach((messageEl) => {
        // Role and content selectors are relative to the messageElement
        const roleElem = messageEl.querySelector(CHATGPT_SELECTORS.roleElement) || messageEl.getAttributeNode(CHATGPT_SELECTORS.roleElement.replace(/\[|\]/g, ''));
        const role = roleElem ? (roleElem.textContent || (roleElem.nodeType === Node.ATTRIBUTE_NODE ? roleElem.value : 'Unknown')) : 'Unknown';

        const contentElem = messageEl.querySelector(CHATGPT_SELECTORS.contentElement);
        const content = contentElem ? contentElem.textContent.trim() : '';

        if (content) { // Only add if there's actual content
             conversation += `${role}: ${content}\n\n`;
        }
    });
    return conversation;
}

/**
 * Extracts the content of the last AI-generated answer in the current ChatGPT conversation.
 *
 * Returns the text of the most recent message whose role is identified as "assistant" or "chatgpt" (case-insensitive), or an empty string if no such message is found.
 *
 * @returns {string} The last AI answer's text, or an empty string if unavailable.
 */
function extractLastAnswer() {
    const messageElements = document.querySelectorAll(CHATGPT_SELECTORS.messageElement);
    if (messageElements.length === 0) return '';

    const lastMessageEl = messageElements[messageElements.length - 1];

    const roleElem = lastMessageEl.querySelector(CHATGPT_SELECTORS.roleElement) || lastMessageEl.getAttributeNode(CHATGPT_SELECTORS.roleElement.replace(/\[|\]/g, ''));
    const role = roleElem ? (roleElem.textContent || (roleElem.nodeType === Node.ATTRIBUTE_NODE ? roleElem.value : null)) : null;

    // Assuming 'assistant' or 'ChatGPT' (or similar) is the role for AI's response.
    // This might need to be configurable or more robust.
    if (role && (role.toLowerCase().includes('assistant') || role.toLowerCase().includes('chatgpt'))) {
        const contentElem = lastMessageEl.querySelector(CHATGPT_SELECTORS.contentElement);
        return contentElem ? contentElem.textContent.trim() : '';
    }
    return '';
}


/**
 * Attaches event listeners to the overlay element for handling custom AI bridge events.
 *
 * Sets up handlers for copying the conversation or last answer to the clipboard, and for sending text to Claude via a browser tab or API. Displays notifications on the overlay to indicate success or failure of each action.
 *
 * @param {HTMLElement} overlay - The overlay element to which event listeners are attached.
 */
function setupOverlayEventListeners(overlay) {
    overlay.addEventListener('aibridge-copy-conversation', () => {
        const conversation = extractConversation();
        navigator.clipboard.writeText(conversation).then(() => {
            overlay.showNotification('Conversation copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy conversation:', err);
            overlay.showNotification('Failed to copy conversation', 'error');
        });
    });

    overlay.addEventListener('aibridge-copy-last-answer', () => {
        const lastAnswer = extractLastAnswer();
        navigator.clipboard.writeText(lastAnswer).then(() => {
            overlay.showNotification('Last answer copied to clipboard!');
            overlay.setLastAnswer(lastAnswer); // Assuming overlay has this method
        }).catch(err => {
            console.error('Failed to copy last answer:', err);
            overlay.showNotification('Failed to copy last answer', 'error');
        });
    });

    overlay.addEventListener('aibridge-send-to-claude-tab', (event) => {
        chrome.runtime.sendMessage({ action: 'sendToClaudeTab', text: event.detail });
        overlay.showNotification('Sending to Claude tab...');
    });

    overlay.addEventListener('aibridge-send-to-claude-api', (event) => {
        overlay.showNotification('Sending to Claude API...');
        chrome.runtime.sendMessage({ action: 'sendToClaudeAPI', text: event.detail }, (response) => {
            if (response && response.answer) {
                overlay.setClaudeResponse(response.answer); // Assuming overlay has this method
                overlay.showNotification('Received response from Claude API');
            } else {
                overlay.showNotification('Failed to get response from Claude API', 'error');
            }
        });
    });
}


// Message listener - unchanged for now, but might need to be inside initialize if it depends on selectors.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("AI Prompt Manager: Message received in content script:", request);

    if (request.action === "insertPrompt") {
        insertAndSubmitPrompt(request.prompt)
            .then(() => sendResponse({success: true}))
            .catch(error => {
                console.error("AI Prompt Manager: Error inserting prompt:", error);
                sendResponse({success: false, error: error.message});
            });
        return true; // Indicate async response
    } else if (request.action === "ping") { // For checking if content script is loaded
        sendResponse({ status: "pong" });
        return true;
    }
    // For other actions, if any, return true if async response is needed.
});

// Initialize the script
initialize();
