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

// Function to load selectors from storage
function loadSelectors() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('userSelectors', (data) => {
            if (data.userSelectors && data.userSelectors.chatGPT) {
                console.log("AI Prompt Manager: Loading user-defined ChatGPT selectors.");
                for (const key in CHATGPT_SELECTORS) {
                    if (data.userSelectors.chatGPT[key] && String(data.userSelectors.chatGPT[key]).trim() !== '') {
                        CHATGPT_SELECTORS[key] = data.userSelectors.chatGPT[key];
                    }
                }
            } else {
                console.log("AI Prompt Manager: Using default ChatGPT selectors.");
            }
            console.log("AI Prompt Manager: Effective ChatGPT Selectors:", CHATGPT_SELECTORS);
            resolve();
        });
    });
}

// --- Initialize Script ---
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

// Function to find the input field
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

// Function to find the submit button
function findSubmitButton() {
    const button = document.querySelector(CHATGPT_SELECTORS.submitButton);
    if (button) {
        console.log(`AI Prompt Manager: Submit button found with selector: ${CHATGPT_SELECTORS.submitButton}`);
        return button;
    }
    console.error("AI Prompt Manager: Submit button not found with selector:", CHATGPT_SELECTORS.submitButton);
    return null;
}

// Function to insert prompt and submit
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

// Function to extract the full conversation
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

// Function to extract the last ChatGPT answer
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
