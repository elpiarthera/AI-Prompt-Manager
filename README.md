# AI Prompt Manager

AI Prompt Manager is a Chrome extension designed to help you efficiently manage and utilize your AI prompts, with a special focus on enhancing your experience with ChatGPT and Claude.
It allows you to store, categorize, and quickly access your favorite prompts, streamlining your workflow and boosting your productivity when interacting with these AI platforms.
This extension provides features like an overlay for ChatGPT, clipboard integration, and the ability to inject prompts directly into the chat interfaces.

## Features

- **Prompt Management:** Add, edit, delete, and store your prompts directly in the browser.
- **Insert Prompts into ChatGPT:** Seamlessly insert single or multiple selected prompts into the ChatGPT interface.
- **Dark Mode:** Enjoy a comfortable viewing experience with dark mode for the popup interface.
- **Copy ChatGPT Conversation:** Easily copy the entire ChatGPT conversation to your clipboard.
- **Copy Last ChatGPT Answer:** Quickly copy the last response from ChatGPT.
- **Send to Claude:** Send text or prompts to a new tab in `Claude.ai`.
- **ChatGPT Overlay:** Access quick actions and manage prompts via an overlay directly on ChatGPT pages.
- **Prompt Count:** Keep track of your saved prompts with a readily visible count.

## Installation

1.  **Download the Extension:**
    *   You can download the repository as a ZIP file from its `GitHub` page (if available) and then extract it to a local folder.
    *   Alternatively, if you have `Git` installed, you can clone the repository using `git clone <repository-url>`.
2.  **Open Chrome Extensions Page:**
    *   Launch Google Chrome.
    *   Type `chrome://extensions` in the address bar and press Enter.
3.  **Enable Developer Mode:**
    *   On the Extensions page, look for a toggle switch labeled "Developer mode" (usually located in the top-right corner) and make sure it is turned on.
4.  **Load the Extension:**
    *   Click on the "Load unpacked" button that appears after enabling Developer mode.
5.  **Select Extension Directory:**
    *   In the file dialog that opens, navigate to the directory where you downloaded or cloned the extension files.
    *   Select the root folder of the project (the one containing the `manifest.json` file) and click "Select Folder" or "Open".

The AI Prompt Manager extension should now be installed and visible in your list of Chrome extensions.

## How to Use

### Accessing the Extension

Click the AI Prompt Manager icon in the Chrome toolbar (it might be inside the "Extensions" puzzle piece menu) to open the popup interface.

### Managing Prompts

The popup interface is your central hub for managing prompts:

-   **Viewing Prompts:** Your saved prompts are listed here. The total count of your prompts is displayed at the top.
-   **Adding a New Prompt:**
    1.  Click the "Add New Prompt" button.
    2.  Enter a descriptive "Title" for your prompt.
    3.  Write or paste the "Prompt Text" in the larger text area.
    4.  Click "Save Prompt".
-   **Editing a Prompt:**
    1.  Click the "Edit" button next to the prompt you want to modify.
    2.  Make your changes to the title or text.
    3.  Click "Save Changes".
-   **Deleting a Prompt:**
    1.  Click the "Delete" button next to the prompt you want to remove.
    2.  Confirm the deletion if prompted.
-   **Dark Mode:** Use the toggle switch (often labeled "Dark Mode" or with a moon/sun icon) in the popup to switch between light and dark themes for the extension interface.

### Using Prompts with ChatGPT

1.  **Open the Extension Popup:** While on any webpage, click the extension icon.
2.  **Select Prompts:** Check the boxes next to the prompts you want to use. You can select one or multiple prompts.
3.  **Insert Prompts:** Click the "Add Selected Prompts to ChatGPT" button. The text of the selected prompts will be combined and inserted into the active ChatGPT input field. If you are not on a ChatGPT tab, this action might be disabled or might prompt you to navigate to ChatGPT.

### ChatGPT Overlay Features

When you are on a ChatGPT page (`https://chat.openai.com/*`), an overlay menu may appear (or be accessible via a small button added by the extension) offering quick actions:

-   **Copy Full Conversation:** Click this button to copy the entire visible conversation from ChatGPT to your clipboard.
-   **Copy Last Answer:** Click this button to copy only the last response from ChatGPT to your clipboard.
-   **Send to Claude Tab:** This option will take the current text (e.g., from the ChatGPT input or a selected part of the conversation) and open a new tab for `Claude.ai`, pasting the text there.
-   **Send to Claude API:** This feature allows sending text directly to the Claude API (Note: This may require separate API key configuration not covered here).

### Interacting with Claude

-   **Send to Claude Tab:** As mentioned above, this feature (available from the ChatGPT overlay or potentially within the popup) will open `https://claude.ai/new` and paste the selected or active text content into the message box on `Claude.ai`. This is useful for quickly transferring ideas or prompts between the two AI platforms.

## For Developers

### Project Structure Overview

-   `manifest.json`: The core file that defines the extension's properties, permissions, and components.
-   `background.js`: The service worker for the extension, handling background tasks, message passing, and event management.
-   `popup.html` & `popup.js`: Define the structure and functionality of the extension's main popup interface where users manage their prompts.
-   `styles.css`: Contains the CSS styles for the popup interface and potentially other UI elements.
-   `content.js`: Injected into ChatGPT pages (`https://chat.openai.com/*`). Handles interactions with the ChatGPT DOM, such as inserting prompts and enabling overlay features.
-   `overlay.js`: Contains the JavaScript for the overlay menu on ChatGPT pages. This script provides quick action buttons and is loaded as a web accessible resource as defined in `manifest.json`.
-   `claude-content-script.js`: Injected into Claude pages (`https://claude.ai/*`). Handles interactions with the Claude DOM, primarily for pasting text when the "Send to Claude Tab" feature is used.
-   `icons/`: Directory containing the extension's icons (e.g., `icon16.png`, `icon48.png`, `icon128.png`).

### Developer Notes and Historical Context

The file `instructions.md` in this repository contains more detailed notes on the development setup, initial ideas, and historical context of the project. Please be aware that some information within `instructions.md`, particularly regarding server components or specific API integrations, might be outdated or refer to elements not currently part of the core extension.

### Contributing

Contributions are welcome! If you have ideas for new features, improvements, or bug fixes:

1.  Fork the repository.
2.  Create a new branch for your feature or fix (e.g., `git checkout -b feature/your-feature-name` or `bugfix/issue-description`).
3.  Make your changes and commit them with clear, descriptive messages.
4.  Push your branch to your fork.
5.  Submit a pull request to the main repository for review.

Please ensure your code follows the existing style and that any new functionality is clearly documented.
