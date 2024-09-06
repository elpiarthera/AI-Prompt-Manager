// popup.js
console.log("Popup script started");

function persistentLog(message) {
    console.log(message);
    let log = JSON.parse(localStorage.getItem('debug_log') || '[]');
    log.push(`${new Date().toISOString()}: ${message}`);
    localStorage.setItem('debug_log', JSON.stringify(log));
}

function displayLog() {
    let log = JSON.parse(localStorage.getItem('debug_log') || '[]');
    console.log('Debug Log:', log);
    alert('Debug Log:\n' + log.join('\n'));
}

document.addEventListener('DOMContentLoaded', async () => {
    persistentLog("DOM fully loaded");

    try {
        const darkModeToggle = document.getElementById('darkModeToggle');
        const body = document.body;
        const promptList = document.getElementById('promptList');
        const promptCount = document.getElementById('promptCount');
        const addPromptButton = document.getElementById('addPromptButton');
        const mainScreen = document.getElementById('mainScreen');
        const addEditScreen = document.getElementById('addEditScreen');
        const promptTitleInput = document.getElementById('promptTitle');
        const promptTextArea = document.getElementById('promptText');
        const savePromptButton = document.getElementById('savePromptButton');
        const cancelButton = document.getElementById('cancelButton');
        const settingsButton = document.getElementById('settingsButton');
        const settingsScreen = document.getElementById('settingsScreen');
        const displayDebugLogButton = document.getElementById('displayDebugLogButton');
        const managePromptsButton = document.getElementById('managePromptsButton');
        const backToMainButton = document.getElementById('backToMainButton');
        const managePromptsScreen = document.getElementById('managePromptsScreen');
        const managePromptsList = document.getElementById('managePromptsList');
        const backToSettingsButton = document.getElementById('backToSettingsButton');
        const addSelectedPromptsButton = document.getElementById('addSelectedPrompts');

        let prompts = [];
        let editingIndex = -1;
        let selectedPrompts = new Set();

        persistentLog("Elements initialized");

        // Load saved prompts from localStorage
        if (localStorage.getItem('prompts')) {
            prompts = JSON.parse(localStorage.getItem('prompts'));
            persistentLog(`Loaded ${prompts.length} prompts from localStorage`);
            updatePromptList();
        } else {
            persistentLog("No saved prompts found in localStorage");
        }

        // Load saved theme preference from localStorage
        if (localStorage.getItem('darkMode') === 'true') {
            body.classList.add('dark-mode');
            darkModeToggle.checked = true;
            persistentLog("Dark mode enabled from localStorage");
        }

        // Dark mode toggle
        darkModeToggle.addEventListener('change', () => {
            const isDarkMode = body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', isDarkMode);
            persistentLog(`Dark mode toggled: ${isDarkMode}`);
        });

        // Add prompt button
        addPromptButton.addEventListener('click', () => {
            showAddEditScreen();
        });

        // Save prompt
        savePromptButton.addEventListener('click', () => {
            const title = promptTitleInput.value.trim();
            const text = promptTextArea.value.trim();
            if (title && text) {
                if (editingIndex === -1) {
                    prompts.push({ title, text });
                    persistentLog(`Saved new prompt: ${title}`);
                } else {
                    prompts[editingIndex] = { title, text };
                    persistentLog(`Updated prompt at index ${editingIndex}: ${title}`);
                }
                localStorage.setItem('prompts', JSON.stringify(prompts));
                updatePromptList();
                updateManagePromptsList();
                showMainScreen();
                clearAddEditForm();
            } else {
                persistentLog("Attempted to save empty prompt");
                alert("Please enter both a title and text for the prompt.");
            }
        });

        // Cancel button
        cancelButton.addEventListener('click', () => {
            showMainScreen();
            clearAddEditForm();
        });

        // Settings button
        settingsButton.addEventListener('click', () => {
            mainScreen.style.display = 'none';
            settingsScreen.style.display = 'block';
        });

        // Back to main button
        backToMainButton.addEventListener('click', () => {
            settingsScreen.style.display = 'none';
            mainScreen.style.display = 'block';
        });

        // Display Debug Log button
        displayDebugLogButton.addEventListener('click', displayLog);

        // Manage Prompts button
        managePromptsButton.addEventListener('click', () => {
            settingsScreen.style.display = 'none';
            managePromptsScreen.style.display = 'block';
            updateManagePromptsList();
        });

        // Back to Settings button
        backToSettingsButton.addEventListener('click', () => {
            managePromptsScreen.style.display = 'none';
            settingsScreen.style.display = 'block';
        });

        function updatePromptList() {
            promptList.innerHTML = '';
            prompts.forEach((prompt, index) => {
                const promptItem = document.createElement('div');
                promptItem.className = 'prompt-item';
                promptItem.innerHTML = `
                    <input type="checkbox" class="prompt-checkbox" data-index="${index}">
                    <span>${prompt.title}</span>
                `;
                promptList.appendChild(promptItem);
            });
            updatePromptCount();
            persistentLog("Prompt list updated");
        }

        function updateManagePromptsList() {
            managePromptsList.innerHTML = '';
            prompts.forEach((prompt, index) => {
                const promptItem = document.createElement('div');
                promptItem.className = 'manage-prompt-item';
                promptItem.innerHTML = `
                    <span>${prompt.title}</span>
                    <button class="edit-prompt" data-index="${index}">Edit</button>
                    <button class="delete-prompt" data-index="${index}">Delete</button>
                `;
                managePromptsList.appendChild(promptItem);
            });
        }

        // Event listener for checkbox changes
        promptList.addEventListener('change', (e) => {
            if (e.target.classList.contains('prompt-checkbox')) {
                const index = parseInt(e.target.getAttribute('data-index'));
                if (e.target.checked) {
                    selectedPrompts.add(index);
                } else {
                    selectedPrompts.delete(index);
                }
                updateAddSelectedPromptsButton();
            }
        });

        // Add selected prompts button
        addSelectedPromptsButton.addEventListener('click', async () => {
            if (selectedPrompts.size > 0) {
                try {
                    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                    let combinedPrompt = '';
                    selectedPrompts.forEach(index => {
                        combinedPrompt += prompts[index].text + '\n\n';
                    });
                    await chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        function: insertPromptIntoChatGPT,
                        args: [combinedPrompt.trim()]
                    });
                    persistentLog(`Inserted ${selectedPrompts.size} prompts`);
                    selectedPrompts.clear();
                    updateAddSelectedPromptsButton();
                    updatePromptList(); // Uncheck all checkboxes
                } catch (error) {
                    persistentLog(`Error inserting prompts: ${error.message}`);
                    alert(`Failed to insert prompts: ${error.message}`);
                }
            } else {
                alert("Please select at least one prompt to add.");
            }
        });

        // Event listener for the "Edit" and "Delete" buttons in Manage Prompts
        managePromptsList.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            if (e.target.classList.contains('edit-prompt')) {
                editingIndex = index;
                showAddEditScreen(prompts[index]);
            } else if (e.target.classList.contains('delete-prompt')) {
                prompts.splice(index, 1);
                localStorage.setItem('prompts', JSON.stringify(prompts));
                persistentLog(`Deleted prompt at index: ${index}`);
                updateManagePromptsList();
                updatePromptList();
            }
        });

        function updatePromptCount() {
            const count = prompts.length;
            promptCount.textContent = `You have ${count} saved prompt${count !== 1 ? 's' : ''}.`;
            persistentLog(`Updated prompt count: ${count}`);
        }

        function updateAddSelectedPromptsButton() {
            addSelectedPromptsButton.textContent = `Add ${selectedPrompts.size} Selected Prompt${selectedPrompts.size !== 1 ? 's' : ''}`;
            addSelectedPromptsButton.disabled = selectedPrompts.size === 0;
        }

        function insertPromptIntoChatGPT(promptText) {
            const chatInput = document.querySelector('textarea');
            if (chatInput) {
                chatInput.value = promptText;
                chatInput.focus();
                chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                return `Prompt inserted: ${promptText}`;
            } else {
                throw new Error("ChatGPT input field not found");
            }
        }

        function showAddEditScreen(prompt = null) {
            mainScreen.style.display = 'none';
            settingsScreen.style.display = 'none';
            managePromptsScreen.style.display = 'none';
            addEditScreen.style.display = 'block';
            if (prompt) {
                promptTitleInput.value = prompt.title;
                promptTextArea.value = prompt.text;
                document.getElementById('addEditTitle').textContent = 'Edit Prompt';
            } else {
                document.getElementById('addEditTitle').textContent = 'Add New Prompt';
            }
        }

        function showMainScreen() {
            addEditScreen.style.display = 'none';
            settingsScreen.style.display = 'none';
            managePromptsScreen.style.display = 'none';
            mainScreen.style.display = 'block';
            editingIndex = -1;
        }

        function clearAddEditForm() {
            promptTitleInput.value = '';
            promptTextArea.value = '';
        }

        persistentLog("Popup script initialization complete");
    } catch (error) {
        persistentLog(`Error in main script: ${error.message}`);
        alert(`An error occurred: ${error.message}`);
    }
});
