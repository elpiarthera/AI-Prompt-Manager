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

    function loadOptions() {
        chrome.storage.sync.get(['userSelectors', 'claudeApiKey'], (data) => {
            const loadedSelectors = data.userSelectors || {};
            const loadedApiKey = data.claudeApiKey || '';

            // Populate ChatGPT fields
            for (const key in defaultSelectors.chatGPT) {
                if (inputs.chatGPT[key]) {
                    inputs.chatGPT[key].value = (loadedSelectors.chatGPT && loadedSelectors.chatGPT[key]) ?
                                                loadedSelectors.chatGPT[key] : defaultSelectors.chatGPT[key];
                }
            }

            // Populate Claude fields
            for (const key in defaultSelectors.claude) {
                 if (inputs.claude[key]) {
                    inputs.claude[key].value = (loadedSelectors.claude && loadedSelectors.claude[key]) ?
                                               loadedSelectors.claude[key] : defaultSelectors.claude[key];
                }
            }

            // Populate Claude API Key
            if (inputs.claudeApiKey) {
                inputs.claudeApiKey.value = loadedApiKey;
            }

            displayStatus("Options loaded.", "info");
        });
    }

    function saveOptions() {
        const userSelectorsToSave = {
            chatGPT: {},
            claude: {}
        };

        for (const key in inputs.chatGPT) {
            if (inputs.chatGPT[key]) {
                userSelectorsToSave.chatGPT[key] = inputs.chatGPT[key].value.trim();
            }
        }
        for (const key in inputs.claude) {
            if (inputs.claude[key]) {
                userSelectorsToSave.claude[key] = inputs.claude[key].value.trim();
            }
        }

        const claudeApiKeyToSave = inputs.claudeApiKey ? inputs.claudeApiKey.value : ''; // Do not trim API key

        chrome.storage.sync.set({
            userSelectors: userSelectorsToSave,
            claudeApiKey: claudeApiKeyToSave
        }, () => {
            if (chrome.runtime.lastError) {
                displayStatus(`Error saving settings: ${chrome.runtime.lastError.message}`, "error");
            } else {
                displayStatus("Settings saved successfully!", "success");
            }
        });
    }

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
