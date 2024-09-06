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

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function readFileAsync(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('File reading failed'));
        reader.readAsText(file);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    persistentLog("DOM fully loaded");

    try {
        const darkModeToggle = document.getElementById('darkModeToggle');
        const body = document.body;
        const promptInput = document.getElementById('promptInput');
        const savePromptButton = document.getElementById('savePrompt');
        const promptList = document.getElementById('promptList');
        const promptCount = document.getElementById('promptCount');
        // Comment out the file input and import CSV button
        // const fileInput = document.getElementById('fileInput');
        // const importCSVButton = document.getElementById('importCSV');
        const displayLogButton = document.createElement('button');
        displayLogButton.textContent = 'Display Debug Log';
        displayLogButton.addEventListener('click', displayLog);
        document.body.appendChild(displayLogButton);

        let prompts = [];

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

        // Save prompt
        savePromptButton.addEventListener('click', () => {
            const promptText = promptInput.value.trim();
            if (promptText) {
                prompts.push(promptText);
                localStorage.setItem('prompts', JSON.stringify(prompts));
                persistentLog(`Saved new prompt: ${promptText}`);
                updatePromptList();
                promptInput.value = '';
            } else {
                persistentLog("Attempted to save empty prompt");
            }
        });

        // Comment out the CSV related code
        /*
        importCSVButton.addEventListener('click', () => {
            persistentLog("Import CSV button clicked");
            fileInput.click();
        });

        fileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            persistentLog(`File selected: ${file ? file.name : 'No file'}`);
            if (file) {
                try {
                    const text = await readFileAsync(file);
                    persistentLog(`File read successfully, content length: ${text.length}`);
                    await processCSVWithDelay(text);
                } catch (error) {
                    persistentLog(`Error processing file: ${error.message}`);
                    alert(`Failed to process file: ${error.message}`);
                }
            }
        });

        async function processCSVWithDelay(data) {
            persistentLog("Starting CSV processing...");
            await delay(100); // Small delay before processing

            try {
                const rows = data.split('\n').filter(Boolean);
                persistentLog(`CSV rows after split and filter: ${rows.length}`);

                if (rows.length === 0) {
                    throw new Error("CSV file appears to be empty or incorrectly formatted");
                }

                let newPromptsCount = 0;
                rows.forEach((row, index) => {
                    const promptText = row.trim();
                    if (promptText && !prompts.includes(promptText)) {
                        prompts.push(promptText);
                        newPromptsCount++;
                        persistentLog(`Added prompt from CSV (line ${index + 1}): ${promptText}`);
                    } else if (!promptText) {
                        persistentLog(`Empty or invalid row at line ${index + 1}`);
                    } else {
                        persistentLog(`Duplicate prompt ignored (line ${index + 1}): ${promptText}`);
                    }
                });

                localStorage.setItem('prompts', JSON.stringify(prompts));
                updatePromptList();
                persistentLog(`CSV import complete. Added ${newPromptsCount} new prompts.`);
                alert(`CSV import complete. Added ${newPromptsCount} new prompts.`);
            } catch (error) {
                persistentLog(`Error processing CSV: ${error.message}`);
                alert(`Failed to process CSV file: ${error.message}`);
            }

            await delay(100); // Small delay after processing
            persistentLog("CSV processing completed");
        }
        */

        function updatePromptList() {
            promptList.innerHTML = '';
            prompts.forEach((prompt, index) => {
                const promptItem = document.createElement('div');
                promptItem.className = 'prompt-item';
                promptItem.innerHTML = `
                    <span>${prompt}</span>
                    <button class="use-prompt" data-index="${index}">Use</button>
                    <button class="delete-prompt" data-index="${index}">Delete</button>
                `;
                promptList.appendChild(promptItem);
            });
            updatePromptCount();
            persistentLog("Prompt list updated");
        }

        // Event listener for the "Use" and "Delete" buttons
        promptList.addEventListener('click', (e) => {
            if (e.target.classList.contains('use-prompt')) {
                const index = parseInt(e.target.getAttribute('data-index'));
                const promptText = prompts[index];
                persistentLog(`Use prompt clicked: ${promptText}`);
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        function: insertPromptIntoChatGPT,
                        args: [promptText]
                    });
                });
            }
            if (e.target.classList.contains('delete-prompt')) {
                const index = parseInt(e.target.getAttribute('data-index'));
                prompts.splice(index, 1);
                localStorage.setItem('prompts', JSON.stringify(prompts));
                persistentLog(`Deleted prompt at index: ${index}`);
                updatePromptList();
            }
        });

        function updatePromptCount() {
            const count = prompts.length;
            promptCount.textContent = `You have ${count} saved prompt${count !== 1 ? 's' : ''}.`;
            persistentLog(`Updated prompt count: ${count}`);
        }

        function insertPromptIntoChatGPT(promptText) {
            const chatInput = document.querySelector('textarea');
            if (chatInput) {
                chatInput.value = promptText;
                chatInput.focus();
                chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                persistentLog(`Prompt inserted into ChatGPT: ${promptText}`);
            } else {
                persistentLog("ChatGPT input field not found");
            }
        }

        // Check extension state
        chrome.runtime.sendMessage({action: "checkState"}, response => {
            persistentLog(`Extension state: ${JSON.stringify(response)}`);
        });
        chrome.runtime.sendMessage({action: "logCSVImport"}, response => {
            console.log("CSV import logged:", response);
        });
        chrome.runtime.sendMessage({action: "reportError", error: "Some error message"}, response => {
            console.log("Error reported:", response);
        });

        persistentLog("Popup script initialization complete");
    } catch (error) {
        persistentLog(`Error in main script: ${error.message}`);
        alert(`An error occurred: ${error.message}`);
    }
});