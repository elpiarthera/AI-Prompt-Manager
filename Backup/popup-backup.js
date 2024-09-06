// popup.js
console.log("Popup script started");

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded");

    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;
    const promptInput = document.getElementById('promptInput');
    const savePromptButton = document.getElementById('savePrompt');
    const promptList = document.getElementById('promptList');
    const promptCount = document.getElementById('promptCount');
    const fileInput = document.getElementById('fileInput');
    const importCSVButton = document.getElementById('importCSV');
    let prompts = [];

    console.log("Elements initialized:", {
        darkModeToggle,
        body,
        promptInput,
        savePromptButton,
        promptList,
        promptCount,
        fileInput,
        importCSVButton
    });

    // Load saved prompts from localStorage
    if (localStorage.getItem('prompts')) {
        prompts = JSON.parse(localStorage.getItem('prompts'));
        console.log("Loaded prompts from localStorage:", prompts);
        updatePromptList();
    } else {
        console.log("No saved prompts found in localStorage");
    }

    // Load saved theme preference from localStorage
    if (localStorage.getItem('darkMode') === 'true') {
        body.classList.add('dark-mode');
        darkModeToggle.checked = true;
        console.log("Dark mode enabled from localStorage");
    } else {
        console.log("Dark mode not enabled from localStorage");
    }

    // Dark mode toggle
    darkModeToggle.addEventListener('change', () => {
        const isDarkMode = body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        console.log("Dark mode toggled:", isDarkMode);
    });

    // Save prompt
    savePromptButton.addEventListener('click', () => {
        const promptText = promptInput.value.trim();
        if (promptText) {
            prompts.push(promptText);
            localStorage.setItem('prompts', JSON.stringify(prompts));
            console.log("Saved new prompt:", promptText);
            updatePromptList();
            promptInput.value = '';
        } else {
            console.warn("Attempted to save empty prompt");
        }
    });

    // Handle Import CSV Button Click
    importCSVButton.addEventListener('click', () => {
        console.log("Import CSV button clicked");
        fileInput.click();
    });

    // Handle File Selection
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        console.log("File selected:", file);
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const text = e.target.result;
                console.log("File read successfully, content length:", text.length);
                processCSV(text);
            };
            reader.onerror = function(e) {
                console.error("Error reading file:", e);
                alert("Failed to read file. Please try again.");
            };
            reader.readAsText(file);
        } else {
            console.error("No file selected");
        }
    });

    // Process CSV Data
    function processCSV(data) {
        try {
            console.log("Processing CSV data...");
            const rows = data.split('\n').filter(Boolean); // Filter out any empty lines
            console.log("CSV rows after split and filter:", rows);

            if (rows.length === 0) {
                console.error("CSV file appears to be empty or incorrectly formatted");
                alert("The CSV file appears to be empty or incorrectly formatted. Please check the file and try again.");
                return;
            }

            let newPromptsCount = 0;
            rows.forEach((row, index) => {
                const promptText = row.trim();
                if (promptText && !prompts.includes(promptText)) {
                    prompts.push(promptText);
                    newPromptsCount++;
                    console.log(`Added prompt from CSV (line ${index + 1}):`, promptText);
                } else if (!promptText) {
                    console.warn(`Empty or invalid row at line ${index + 1}`);
                } else {
                    console.warn(`Duplicate prompt ignored (line ${index + 1}):`, promptText);
                }
            });

            localStorage.setItem('prompts', JSON.stringify(prompts));
            updatePromptList();
            console.log(`CSV import complete. Added ${newPromptsCount} new prompts.`);
            alert(`CSV import complete. Added ${newPromptsCount} new prompts.`);
        } catch (error) {
            console.error("Error processing CSV:", error);
            alert("Failed to process CSV file. Please ensure it is properly formatted.");
        }
    }

    // Update prompt list
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
        console.log("Prompt list updated");
    }

    // Event listener for the "Use" and "Delete" buttons
    promptList.addEventListener('click', (e) => {
        if (e.target.classList.contains('use-prompt')) {
            const index = parseInt(e.target.getAttribute('data-index'));
            const promptText = prompts[index];
            console.log("Use prompt clicked:", promptText);
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
            console.log("Deleted prompt at index:", index);
            updatePromptList();
        }
    });

    // Update prompt count
    function updatePromptCount() {
        const count = prompts.length;
        promptCount.textContent = `You have ${count} saved prompt${count !== 1 ? 's' : ''}.`;
        console.log("Updated prompt count:", count);
    }

    // Function to be executed in the ChatGPT page
    function insertPromptIntoChatGPT(promptText) {
        const chatInput = document.querySelector('textarea');
        if (chatInput) {
            chatInput.value = promptText;
            chatInput.focus();
            chatInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log("Prompt inserted into ChatGPT:", promptText);
        } else {
            console.error("ChatGPT input field not found");
        }
    }

    console.log("Popup script initialization complete");
});