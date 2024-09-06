// content.js

console.log("AI Prompt Manager: Content script loaded");

// Inject the overlay script
const script = document.createElement('script');
script.src = chrome.runtime.getURL('overlay.js');
(document.head || document.documentElement).appendChild(script);

// Create and add the overlay to the page
const overlay = document.createElement('ai-assistant-bridge');
document.body.appendChild(overlay);

// Function to find the input field
function findInputField() {
    const selectors = [
        'textarea#prompt-textarea',
        'textarea[data-id="root"]',
        'textarea[placeholder="Send a message"]',
        'div[contenteditable="true"]',
        'textarea',
        'input[type="text"]'
    ];

    for (let selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            console.log(`AI Prompt Manager: Input field found with selector: ${selector}`);
            return element;
        }
    }

    console.error("AI Prompt Manager: Input field not found");
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
    const selectors = [
        'button[data-testid="send-button"]',
        'button[aria-label="Send message"]',
        'button:has(svg)',
        'form button[type="submit"]',
        'button'
    ];

    for (let selector of selectors) {
        const button = document.querySelector(selector);
        if (button) {
            console.log(`AI Prompt Manager: Submit button found with selector: ${selector}`);
            return button;
        }
    }

    console.error("AI Prompt Manager: Submit button not found");
    return null;
}

// Function to insert prompt and submit
function insertAndSubmitPrompt(prompt) {
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
    const messages = document.querySelectorAll('.text-base');
    let conversation = '';
    messages.forEach((message) => {
        const role = message.querySelector('.font-semibold')?.textContent || 'Unknown';
        const content = message.querySelector('.whitespace-pre-wrap')?.textContent || '';
        conversation += `${role}: ${content}\n\n`;
    });
    return conversation;
}

// Function to extract the last ChatGPT answer
function extractLastAnswer() {
    const messages = document.querySelectorAll('.text-base');
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.querySelector('.font-semibold')?.textContent === 'ChatGPT') {
        return lastMessage.querySelector('.whitespace-pre-wrap')?.textContent || '';
    }
    return '';
}

// Set up event listeners for the overlay
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
        overlay.setLastAnswer(lastAnswer);
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
            overlay.setClaudeResponse(response.answer);
            overlay.showNotification('Received response from Claude API');
        } else {
            overlay.showNotification('Failed to get response from Claude API', 'error');
        }
    });
});

// Set up a MutationObserver to watch for changes in the DOM
const observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
        if (mutation.type === 'childList') {
            const inputField = findInputField();
            if (inputField) {
                observer.disconnect();
                console.log("AI Prompt Manager: Input field found after DOM change");
                break;
            }
        }
    }
});

// Start observing the document with the configured parameters
observer.observe(document.body, { childList: true, subtree: true });

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("AI Prompt Manager: Message received in content script:", request);

    if (request.action === "insertPrompt") {
        try {
            insertAndSubmitPrompt(request.prompt);
            sendResponse({success: true});
        } catch (error) {
            console.error("AI Prompt Manager: Error inserting prompt:", error);
            sendResponse({success: false, error: error.message});
        }
    }

    return true;  // Keep the message channel open for asynchronous responses
});

// Notify that the script has loaded successfully
chrome.runtime.sendMessage({action: "contentScriptLoaded"});
