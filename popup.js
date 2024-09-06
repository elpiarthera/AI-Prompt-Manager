// popup.js
document.addEventListener('DOMContentLoaded', function() {
    const promptList = document.getElementById('promptList');
    const promptCount = document.getElementById('promptCount');
    const addPromptButton = document.getElementById('addPromptButton');
    const addSelectedPromptsButton = document.getElementById('addSelectedPrompts');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;

    let prompts = [];
    let selectedPrompts = new Set();

    // Load prompts from storage
    chrome.storage.sync.get('prompts', function(data) {
        prompts = data.prompts || [];
        updatePromptList();
    });

    // Load dark mode preference
    chrome.storage.sync.get('darkMode', function(data) {
        if (data.darkMode) {
            body.classList.add('dark-mode');
            darkModeToggle.checked = true;
        }
    });

    // Update prompt list
    function updatePromptList() {
        promptList.innerHTML = '';
        prompts.forEach((prompt, index) => {
            const promptItem = document.createElement('div');
            promptItem.className = 'prompt-item';
            promptItem.innerHTML = `
                <input type="checkbox" id="prompt-${index}" data-index="${index}">
                <label for="prompt-${index}">${prompt.title}</label>
                <button class="edit-button" data-index="${index}">Edit</button>
                <button class="delete-button" data-index="${index}">Delete</button>
            `;
            promptList.appendChild(promptItem);
        });
        updatePromptCount();
        updateAddSelectedPromptsButton();
    }

    // Update prompt count
    function updatePromptCount() {
        const count = prompts.length;
        promptCount.textContent = `You have ${count} saved prompt${count !== 1 ? 's' : ''}.`;
    }

    // Update "Add Selected Prompts" button
    function updateAddSelectedPromptsButton() {
        addSelectedPromptsButton.textContent = `Add ${selectedPrompts.size} Selected Prompt${selectedPrompts.size !== 1 ? 's' : ''}`;
        addSelectedPromptsButton.disabled = selectedPrompts.size === 0;
    }

    // Add new prompt
    addPromptButton.addEventListener('click', function() {
        const title = prompt("Enter prompt title:");
        const text = prompt("Enter prompt text:");
        if (title && text) {
            prompts.push({title, text});
            chrome.storage.sync.set({prompts: prompts}, function() {
                updatePromptList();
            });
        }
    });

    // Handle checkbox changes
    promptList.addEventListener('change', function(e) {
        if (e.target.type === 'checkbox') {
            const index = parseInt(e.target.dataset.index);
            if (e.target.checked) {
                selectedPrompts.add(index);
            } else {
                selectedPrompts.delete(index);
            }
            updateAddSelectedPromptsButton();
        }
    });

    // Handle edit and delete buttons
    promptList.addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-button')) {
            const index = parseInt(e.target.dataset.index);
            const newTitle = prompt("Edit prompt title:", prompts[index].title);
            const newText = prompt("Edit prompt text:", prompts[index].text);
            if (newTitle && newText) {
                prompts[index] = {title: newTitle, text: newText};
                chrome.storage.sync.set({prompts: prompts}, function() {
                    updatePromptList();
                });
            }
        } else if (e.target.classList.contains('delete-button')) {
            const index = parseInt(e.target.dataset.index);
            if (confirm("Are you sure you want to delete this prompt?")) {
                prompts.splice(index, 1);
                chrome.storage.sync.set({prompts: prompts}, function() {
                    updatePromptList();
                });
            }
        }
    });

    // Add selected prompts
    addSelectedPromptsButton.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0].url.startsWith("https://chat.openai.com/")) {
                const selectedPromptTexts = Array.from(selectedPrompts).map(index => prompts[index].text);
                const combinedPrompt = selectedPromptTexts.join("\n\n");
                
                ensureContentScriptLoaded(tabs[0].id)
                    .then(() => {
                        chrome.tabs.sendMessage(tabs[0].id, {action: "insertPrompt", prompt: combinedPrompt}, function(response) {
                            if (chrome.runtime.lastError) {
                                console.error(chrome.runtime.lastError);
                                showNotification('Failed to insert prompts: ' + chrome.runtime.lastError.message, 'error');
                            } else if (response && response.success) {
                                showNotification("Prompts inserted successfully", 'success');
                                selectedPrompts.clear();
                                updateAddSelectedPromptsButton();
                                updatePromptList();
                            } else {
                                console.error("Failed to insert prompts:", response ? response.error : "Unknown error");
                                showNotification('Failed to insert prompts: ' + (response ? response.error : "Unknown error"), 'error');
                            }
                        });
                    })
                    .catch(error => {
                        console.error("Failed to load content script:", error);
                        showNotification("Failed to load content script. Please try refreshing the page.", 'error');
                    });
            } else {
                showNotification("Please navigate to ChatGPT to use this feature", 'warning');
            }
        });
    });

    // Dark mode toggle
    darkModeToggle.addEventListener('change', function() {
        body.classList.toggle('dark-mode');
        chrome.storage.sync.set({darkMode: darkModeToggle.checked});
    });

    // Ensure content script is loaded
    function ensureContentScriptLoaded(tabId) {
        return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tabId, {action: "ping"}, response => {
                if (chrome.runtime.lastError) {
                    // Content script not loaded, inject it
                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        files: ['content.js']
                    }, () => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    // Content script already loaded
                    resolve();
                }
            });
        });
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
});
