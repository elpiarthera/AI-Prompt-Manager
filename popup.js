// popup.js
document.addEventListener('DOMContentLoaded', function() {
    const promptList = document.getElementById('promptList');
    const promptCount = document.getElementById('promptCount');
    const addPromptButton = document.getElementById('addPromptButton');
    const addSelectedPromptsButton = document.getElementById('addSelectedPrompts');
    const darkModeToggle = document.getElementById('darkModeToggle');

    // Modal elements
    const modal = document.getElementById('addEditPromptModal');
    const modalTitle = document.getElementById('modalTitle');
    const promptTitleInput = document.getElementById('promptTitle');
    const promptTextInput = document.getElementById('promptText');
    const savePromptButton = document.getElementById('savePromptButton');
    const cancelButton = document.getElementById('cancelButton');
    const body = document.body;
    const openOptionsPageButton = document.getElementById('openOptionsPageButton');

    let prompts = [];
    let selectedPrompts = new Set();
    let currentModalCallback = null;

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

    /**
     * Renders the list of saved prompts in the popup UI, updating checkboxes, labels, and action buttons for each prompt.
     *
     * Displays a placeholder message if no prompts exist. Ensures the prompt count and the "Add Selected Prompts" button state are updated to reflect the current selection and prompt list.
     */
    function updatePromptList() {
        promptList.innerHTML = ''; // Clear existing items

        if (!prompts || prompts.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'No prompts saved yet. Click "Add a prompt" to get started!';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.color = 'var(--secondary-color)'; // Use CSS variable if available
            promptList.appendChild(emptyMessage);
        } else {
            prompts.forEach((prompt, index) => {
                const promptItem = document.createElement('div');
                promptItem.className = 'prompt-item';

                // Checkbox
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `prompt-${index}`;
                checkbox.dataset.index = index;
                checkbox.checked = selectedPrompts.has(index);
                promptItem.appendChild(checkbox);

                // Label
                const label = document.createElement('label');
                label.htmlFor = `prompt-${index}`;
                label.textContent = prompt.title; // Safely sets text content
                promptItem.appendChild(label);

                // Edit Button
                const editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.classList.add('edit-button', 'btn-secondary', 'btn-small');
                editButton.dataset.index = index;
                promptItem.appendChild(editButton);

                // Delete Button
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.classList.add('delete-button', 'btn-danger', 'btn-small');
                deleteButton.dataset.index = index;
                promptItem.appendChild(deleteButton);

                promptList.appendChild(promptItem);
            });
        }

        updatePromptCount();
        // The checkbox state is set during creation, so direct re-querying might not be needed
        // unless other operations modify checkboxes outside this function.
        // If issues arise, the explicit check can be re-added:
        // promptList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        //     const idx = parseInt(cb.dataset.index);
        //     cb.checked = selectedPrompts.has(idx);
        // });
        updateAddSelectedPromptsButton();
    }

    /**
     * Displays the modal dialog for adding or editing a prompt.
     *
     * @param {string} title - The title to display at the top of the modal.
     * @param {Object} [prompt={}] - Optional prompt data to pre-fill the modal fields.
     * @param {string} [prompt.title] - The prompt's title to pre-fill.
     * @param {string} [prompt.text] - The prompt's text to pre-fill.
     * @param {Function} callback - Function to call when the user saves the modal.
     */
    function showModal(title, prompt = {}, callback) {
        modalTitle.textContent = title;
        promptTitleInput.value = prompt.title || '';
        promptTextInput.value = prompt.text || '';
        currentModalCallback = callback;
        modal.style.display = 'block';
        promptTitleInput.focus();
    }

    /**
     * Hides the prompt modal dialog and clears its input fields and callback.
     */
    function hideModal() {
        modal.style.display = 'none';
        promptTitleInput.value = '';
        promptTextInput.value = '';
        currentModalCallback = null;
    }

    /**
     * Updates the displayed count of saved prompts in the UI.
     */
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
        showModal('Add New Prompt', {}, (newTitle, newText) => {
            if (newTitle && newText) {
                prompts.push({ title: newTitle, text: newText });
                chrome.storage.sync.set({ prompts: prompts }, function() {
                    if (chrome.runtime.lastError) {
                        console.error("Error saving prompt:", chrome.runtime.lastError);
                        showNotification('Error saving prompt.', 'error');
                    } else {
                        updatePromptList();
                        showNotification('Prompt added successfully.', 'success');
                        hideModal(); // Hide modal on successful save
                    }
                });
            } else if (newTitle || newText) {
                showNotification('Both title and text are required to save a prompt.', 'warning');
                // Do not hide modal, let user correct.
            } else {
                hideModal(); // Both empty, assume cancel
            }
        });
    });

    // Save prompt button in modal
    savePromptButton.addEventListener('click', function() {
        if (currentModalCallback) {
            const title = promptTitleInput.value.trim();
            const text = promptTextInput.value.trim();
            currentModalCallback(title, text);
        }
    });

    // Cancel button in modal
    cancelButton.addEventListener('click', function() {
        hideModal();
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
            const currentPrompt = prompts[index];
            showModal('Edit Prompt', currentPrompt, (updatedTitle, updatedText) => {
                if (updatedTitle && updatedText) {
                    prompts[index] = { title: updatedTitle, text: updatedText };
                    chrome.storage.sync.set({ prompts: prompts }, function() {
                        if (chrome.runtime.lastError) {
                            console.error("Error updating prompt:", chrome.runtime.lastError);
                            showNotification('Error updating prompt.', 'error');
                        } else {
                            updatePromptList();
                            showNotification('Prompt updated successfully.', 'success');
                            hideModal(); // Hide modal on successful save
                        }
                    });
                } else if (updatedTitle || updatedText) {
                     showNotification('Both title and text are required to save a prompt.', 'warning');
                     // Do not hide modal, let user correct.
                } else { // If both are empty, effectively a cancel
                    hideModal();
                }
            });
        } else if (e.target.classList.contains('delete-button')) {
            const index = parseInt(e.target.dataset.index);
            if (confirm("Are you sure you want to delete this prompt?")) {
                const promptToDelete = prompts[index]; // Store the prompt before deleting
                const oldSelectedPrompts = new Set(selectedPrompts); // Capture current selection state

                // Optimistically remove from local array first
                prompts.splice(index, 1);

                // Adjust selectedPrompts immediately after local splice
                // This logic correctly handles shifting indices for items selected after the deleted one.
                const newSelectedPromptsAfterOptimisticDelete = new Set();
                oldSelectedPrompts.forEach(selectedIndex => {
                    if (selectedIndex > index) {
                        newSelectedPromptsAfterOptimisticDelete.add(selectedIndex - 1);
                    } else if (selectedIndex < index) {
                        newSelectedPromptsAfterOptimisticDelete.add(selectedIndex);
                    }
                    // If selectedIndex === index (the deleted prompt), it's not added to the new set.
                });
                selectedPrompts = newSelectedPromptsAfterOptimisticDelete;

                // Update UI immediately for responsiveness (will be reverted if sync fails)
                updatePromptList();

                chrome.storage.sync.set({ prompts: prompts }, function() {
                    if (chrome.runtime.lastError) {
                        console.error("Error deleting prompt from sync:", chrome.runtime.lastError.message);
                        showNotification('Error deleting prompt. Reverting changes.', 'error');

                        // Revert local changes: reinsert the prompt and restore selection state
                        prompts.splice(index, 0, promptToDelete); // Correctly reinsert the original prompt
                        selectedPrompts = oldSelectedPrompts;    // Revert selectedPrompts to its state before this attempt

                        updatePromptList(); // Re-render to reflect the reverted state
                    } else {
                        // Data saved successfully, UI is already up-to-date from optimistic update
                        showNotification('Prompt deleted successfully.', 'success');
                        // updatePromptList(); // Already called optimistically, but calling again ensures consistency if needed
                                           // or if some part of updatePromptList depends on successful save.
                                           // For now, the optimistic update should be sufficient.
                    }
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

    /**
     * Displays a notification message in the popup with a fade-out effect.
     *
     * @param {string} message - The notification text to display.
     * @param {string} [type='info'] - The notification type, used for styling (e.g., 'info', 'success', 'error', 'warning').
     *
     * @remark
     * Notifications appear in a dedicated area at the top-right of the popup and automatically fade out after a short delay.
     */
    function showNotification(message, type = 'info') {
        const notificationArea = document.getElementById('notificationArea') || createNotificationArea();
        const notificationDiv = document.createElement('div');
        notificationDiv.textContent = message;
        notificationDiv.className = `notification ${type}`;

        // Prepend new notification so it appears on top
        if (notificationArea.firstChild) {
            notificationArea.insertBefore(notificationDiv, notificationArea.firstChild);
        } else {
            notificationArea.appendChild(notificationDiv);
        }

        setTimeout(() => {
            notificationDiv.style.opacity = '0'; // Start fade out
            setTimeout(() => {
                notificationDiv.remove();
                if (!notificationArea.hasChildNodes()) {
                    // Optionally remove the container if it's empty and you prefer that
                    // notificationArea.remove();
                }
            }, 500); // Remove after fade out
        }, 3000); // Start hiding after 3 seconds
    }

    /**
     * Ensures a notification area container exists in the DOM and returns it.
     *
     * @returns {HTMLElement} The notification area container element.
     *
     * @remark
     * If the container does not exist, it is created, styled, and appended to the document body.
     */
    function createNotificationArea() {
        let area = document.getElementById('notificationArea');
        if (!area) {
            area = document.createElement('div');
            area.id = 'notificationArea';
            // Basic styling for the container. More advanced styling should be in styles.css
            area.style.position = 'fixed';
            area.style.top = '10px'; // Adjusted to be less intrusive
            area.style.right = '10px';
            area.style.zIndex = '1005'; // Ensure it's above modal backdrop (modal z-index is 1, backdrop is implicitly lower)
            area.style.width = 'auto';
            area.style.maxWidth = 'calc(100% - 20px)'; // Max width related to body padding
            document.body.appendChild(area);
        }
        return area;
    }

    // Options page button
    if(openOptionsPageButton) { // Check if the button exists
        openOptionsPageButton.addEventListener('click', function() {
            if (chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
            } else {
                // Fallback for older versions or if the function is not available
                window.open(chrome.runtime.getURL('options.html'));
            }
        });
    }
});
