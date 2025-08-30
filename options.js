// options.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const statusArea = document.getElementById('statusArea');

    // Input fields from options.html
    const inputs = {
        chatGPT: {
            inputField: document.getElementById('chatgpt_input_selector'),
            submitButton: document.getElementById('chatgpt_submit_selector'),
            conversationContainer: document.getElementById('chatgpt_conversation_container_selector'),
            messageElement: document.getElementById('chatgpt_message_selector'),
            roleElement: document.getElementById('chatgpt_role_selector'),
            contentElement: document.getElementById('chatgpt_content_selector')
        },
        claude: {
            inputField: document.getElementById('claude_input_selector')
        },
        claudeApiKey: document.getElementById('claude_api_key') // API Key input
    };

    // Buttons
    const saveButton = document.getElementById('saveButton');
    const resetButton = document.getElementById('resetButton');

    // Default selector values
    const defaultSelectors = {
        chatGPT: {
            inputField: 'textarea#prompt-textarea',
            submitButton: 'button[data-testid="send-button"]',
            conversationContainer: 'div[class*="react-scroll-to-bottom"] > div > div', // Main scrollable message list
            messageElement: 'div[data-message-author-role]', // Each message block
            roleElement: '[data-message-author-role]', // To get the role attribute itself
            contentElement: 'div.markdown' // Actual content within a message
        },
        claude: {
            inputField: 'div.ProseMirror[contenteditable="true"]'
        }
    };

    /**
     * Loads user-configured selectors and the Claude API key from Chrome storage and populates the corresponding input fields with stored or default values.
     *
     * @remark The status message indicating options loading is shown before both asynchronous storage retrievals complete.
     */
    function loadOptions() {
        // Load selectors from sync storage
        chrome.storage.sync.get('userSelectors', (syncData) => {
            const loadedSelectors = syncData.userSelectors || {};

            for (const key in defaultSelectors.chatGPT) {
                if (inputs.chatGPT[key]) {
                    inputs.chatGPT[key].value = (loadedSelectors.chatGPT && loadedSelectors.chatGPT[key]) ?
                                                loadedSelectors.chatGPT[key] : defaultSelectors.chatGPT[key];
                }
            }
            for (const key in defaultSelectors.claude) {
                 if (inputs.claude[key]) {
                    inputs.claude[key].value = (loadedSelectors.claude && loadedSelectors.claude[key]) ?
                                               loadedSelectors.claude[key] : defaultSelectors.claude[key];
                }
            }
        });

        // Load API key from local storage
        chrome.storage.local.get('claudeApiKey', (localData) => {
            if (inputs.claudeApiKey) {
                inputs.claudeApiKey.value = localData.claudeApiKey || '';
            }
        });
        // Note: displayStatus might show "Options loaded" before both async calls complete.
        // For a more robust solution, use Promises or await if in an async function.
        // For this scope, we'll accept it. A single displayStatus after a Promise.all would be ideal.
        displayStatus("Options loading initiated.", "info");
    }

    /**
     * Saves the current ChatGPT and Claude selector values and the Claude API key to Chrome storage.
     *
     * Collects trimmed selector values from input fields and stores them in Chrome's sync storage, while the Claude API key is saved to local storage. Displays a status message indicating success or any encountered error after both save operations complete.
     */
    function saveOptions() {
        let saveError = null;
        let selectorsSaved = false;
        let apiKeySaved = false;

        function checkCompletionAndNotify() {
            if (selectorsSaved && apiKeySaved) {
                if (saveError) {
                    displayStatus(`Error saving settings: ${saveError}`, "error");
                } else {
                    displayStatus("Settings saved successfully!", "success");
                }
            }
        }

        // Save Selectors to sync
        const userSelectorsToSave = { chatGPT: {}, claude: {} };
        for (const key in inputs.chatGPT) {
            if (inputs.chatGPT[key]) userSelectorsToSave.chatGPT[key] = inputs.chatGPT[key].value.trim();
        }
        for (const key in inputs.claude) {
            if (inputs.claude[key]) userSelectorsToSave.claude[key] = inputs.claude[key].value.trim();
        }
        chrome.storage.sync.set({ userSelectors: userSelectorsToSave }, () => {
            if (chrome.runtime.lastError) saveError = chrome.runtime.lastError.message;
            selectorsSaved = true;
            checkCompletionAndNotify();
        });

        // Save API Key to local
        const claudeApiKeyToSave = inputs.claudeApiKey ? inputs.claudeApiKey.value : '';
        chrome.storage.local.set({ claudeApiKey: claudeApiKeyToSave }, () => {
            if (chrome.runtime.lastError && !saveError) saveError = chrome.runtime.lastError.message; // Prioritize first error
            apiKeySaved = true;
            checkCompletionAndNotify();
        });
    }

    /**
     * Resets all selector input fields to their default values and clears the Claude API key, then saves these defaults.
     */
    function resetToDefaults() {
        // Populate ChatGPT fields with defaults
        for (const key in defaultSelectors.chatGPT) {
            if (inputs.chatGPT[key]) {
                inputs.chatGPT[key].value = defaultSelectors.chatGPT[key];
            }
        }
        // Populate Claude fields with defaults
        for (const key in defaultSelectors.claude) {
            if (inputs.claude[key]) {
                inputs.claude[key].value = defaultSelectors.claude[key];
            }
        }

        // Clear API Key
        if (inputs.claudeApiKey) {
            inputs.claudeApiKey.value = '';
        }

        saveOptions(); // Save these defaults (including cleared API key)
    }

    /**
     * Displays a temporary status message in the status area with a style based on the message type.
     *
     * @param {string} message - The message to display to the user.
     * @param {string} [type="info"] - The type of message, which determines the CSS class applied (e.g., "info", "success", "error").
     *
     * @remark
     * The message is automatically cleared after 3 seconds.
     */
    function displayStatus(message, type = "info") {
        statusArea.textContent = message;
        statusArea.className = `status-message ${type}`; // Ensure CSS handles .info, .success, .error
        setTimeout(() => {
            statusArea.textContent = '';
            statusArea.className = 'status-message';
        }, 3000);
    }

    // Event Listeners
    saveButton.addEventListener('click', saveOptions);
    resetButton.addEventListener('click', resetToDefaults);

    // Initial load
    loadOptions();
});
