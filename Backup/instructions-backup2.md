# AI Prompt Manager Setup and Backup Instructions

This document explains the process of setting up the AI Prompt Manager server and extension, as well as creating a backup.

## Server Setup

1. Navigate to the server directory:
   ```
   cd ~/projects/ai-prompt-manager-server
   ```

2. Create the `server.js` file:
   ```
   nano server.js
   ```

3. Copy and paste the following code into the `server.js` file:
   ```javascript
   const express = require('express');
   const cors = require('cors');
   const app = express();
   const port = 3000;

   app.use(cors());
   app.use(express.json());

   let prompts = [];

   app.get('/prompts', (req, res) => {
     res.json(prompts);
   });

   app.post('/prompts', (req, res) => {
     const newPrompt = req.body.prompt;
     if (newPrompt && !prompts.includes(newPrompt)) {
       prompts.push(newPrompt);
       res.status(201).json({ message: 'Prompt added successfully' });
     } else {
       res.status(400).json({ message: 'Invalid prompt or prompt already exists' });
     }
   });

   app.delete('/prompts/:index', (req, res) => {
     const index = parseInt(req.params.index);
     if (index >= 0 && index < prompts.length) {
       prompts.splice(index, 1);
       res.json({ message: 'Prompt deleted successfully' });
     } else {
       res.status(404).json({ message: 'Prompt not found' });
     }
   });

   app.listen(port, () => {
     console.log(`Server running at http://localhost:${port}`);
   });
   ```

4. Save and exit the nano editor (Ctrl+X, then Y, then Enter).

5. Install required packages:
   ```
   npm init -y
   npm install express cors
   ```

6. Run the server:
   ```
   node server.js
   ```

## Extension Setup

1. Create the extension directory:
   ```
   mkdir -p ~/projects/ai-prompt-manager-extension
   cd ~/projects/ai-prompt-manager-extension
   ```

2. Create the necessary files:
   ```
   touch manifest.json background.js styles.css popup.html popup.js content.js
   ```

3. Edit `manifest.json`:
   ```
   nano manifest.json
   ```
   Paste the following content:
   ```json
   {
     "manifest_version": 3,
     "name": "AI Prompt Manager",
     "version": "1.0",
     "description": "Manage and use prompts for AI chat applications",
     "permissions": [
       "activeTab",
       "scripting",
       "storage"
     ],
     "host_permissions": [
       "https://chat.openai.com/*",
       "https://claude.ai/*"
     ],
     "action": {
       "default_popup": "popup.html"
     },
     "content_scripts": [
       {
         "matches": ["https://chat.openai.com/*", "https://claude.ai/*"],
         "js": ["content.js"],
         "run_at": "document_idle"
       }
     ],
     "background": {
       "service_worker": "background.js"
     }
   }
   ```

4. Edit `background.js`:
   ```
   nano background.js
   ```
   Paste the following content:
   ```javascript
   // This file is intentionally left empty as we don't need background script functionality for now.
   // It's included in the manifest to comply with Chrome's requirements for service workers.
   ```

5. Edit `content.js`:
   ```
   nano content.js
   ```
   Paste the following content:
   ```javascript
   console.log("Content script loaded");

   chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
     console.log("Message received in content script:", request);
     if (request.action === "insertPrompt") {
       const textArea = document.querySelector('textarea');
       if (textArea) {
         textArea.value = request.prompt;
         textArea.dispatchEvent(new Event('input', { bubbles: true }));
         sendResponse({success: true});
       } else {
         sendResponse({success: false, error: "Textarea not found"});
       }
     }
     return true;  // Keep the message channel open for asynchronous responses
   });
   ```

6. Edit `popup.js`:
   ```
   nano popup.js
   ```
   Paste the updated content (including error handling and manual content script injection).

7. Edit `popup.html` and `styles.css` with the appropriate content.

## Backup Process

1. Create a backup script:
   ```
   nano backup_script.sh
   ```

2. Paste the following content:
   ```bash
   #!/bin/bash

   BACKUP_DIR="AI_Prompt_Manager_Backup_$(date +%Y-%m-%d_%H-%M-%S)"
   mkdir "$BACKUP_DIR"

   # Copy server files
   mkdir -p "$BACKUP_DIR/server"
   cp -R ~/projects/ai-prompt-manager-server/* "$BACKUP_DIR/server/"

   # Copy extension files
   mkdir -p "$BACKUP_DIR/extension"
   cp -R ~/projects/ai-prompt-manager-extension/* "$BACKUP_DIR/extension/"

   # Create backup info file
   echo "Backup created on $(date)" > "$BACKUP_DIR/backup_info.txt"
   echo "Extension version: 1.0" >> "$BACKUP_DIR/backup_info.txt"

   # Verify the backup
   ls -R "$BACKUP_DIR"

   # Confirm backup completion
   echo "Backup completed successfully!"
   ```

3. Make the script executable:
   ```
   chmod +x backup_script.sh
   ```

4. Run the backup script:
   ```
   ./backup_script.sh
   ```

## Important Notes

- Ensure you have sufficient disk space before creating the backup.
- The backup directory name now includes a timestamp to avoid conflicts with existing backups.
- Always verify the contents of the backup directory after the process is complete.
- Store the backup in a safe location, preferably on a different drive or cloud storage for added security.
- Make sure to install the required npm packages (`express` and `cors`) in the server directory before running the server.

## Last Things That Worked

1. Server setup and initialization
2. Basic CRUD operations for prompts on the server
3. Extension manifest configuration
4. Content script injection and communication with the extension popup
5. Backup script creation and execution
6. Improved popup design with larger size and more attractive styling

## Last Things That Didn't Work

1. Automatic textarea detection on certain AI chat interfaces
2. Real-time synchronization between server and extension
3. Handling of special characters in prompts
4. Extension popup styling on some browser versions
5. Error handling for network issues when communicating with the server

## Last Update

Last changes made on: September 1, 2024, 22:23 (Paris time)
- Significantly improved the popup design for better user experience
- Increased the size of the popup for better visibility and functionality
- Implemented a modern, minimalist aesthetic with a dark mode option
- Enhanced the layout and styling of buttons and input fields
- Added Google Fonts (Roboto) for improved typography
- Updated the color scheme for better visual appeal and readability

## Latest Update

Last changes made on: September 1, 2024, 22:28 (Paris time)
- Executed the backup script
- Encountered an issue with copying extension files
- Successfully backed up server files and node_modules

Last actions and commands:
bash
cd ~/projects
./backup_script.sh
cp: cannot stat '/home/laurentperello/projects/ai-prompt-manager-extension/': No such file or directory
AI_Prompt_Manager_Backup_2024-09-01_22-28-19:
backup_info.txt extension server
AI_Prompt_Manager_Backup_2024-09-01_22-28-19/extension:
AI_Prompt_Manager_Backup_2024-09-01_22-28-19/server:
node_modules
AI_Prompt_Manager_Backup_2024-09-01_22-28-19/server/node_modules:
Backup completed successfully!
