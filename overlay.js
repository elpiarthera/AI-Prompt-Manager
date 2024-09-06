// overlay.js
class AIAssistantBridgeOverlay extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          all: initial;
          font-family: Arial, sans-serif;
        }
        .overlay {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 300px;
          background-color: white;
          border: 1px solid #ccc;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          z-index: 99999;
          overflow: hidden;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background-color: #f0f0f0;
          border-bottom: 1px solid #ccc;
        }
        h3 {
          margin: 0;
          font-size: 16px;
        }
        .close-button {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
        }
        .content {
          padding: 10px;
        }
        button {
          width: 100%;
          padding: 8px;
          margin-bottom: 10px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        button:hover {
          background-color: #0056b3;
        }
        textarea {
          width: 100%;
          padding: 8px;
          margin-bottom: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          resize: vertical;
        }
        .drag-handle {
          cursor: move;
          user-select: none;
        }
      </style>
      <div class="overlay">
        <div class="header">
          <h3 class="drag-handle">AI Assistant Bridge</h3>
          <button class="close-button">&times;</button>
        </div>
        <div class="content">
          <button id="copyConversation">Copy Full Conversation</button>
          <button id="copyLastAnswer">Copy Last ChatGPT Answer</button>
          <textarea id="lastAnswer" rows="5" placeholder="Last ChatGPT answer will appear here"></textarea>
          <button id="sendToClaudeTab">Send to Claude Tab</button>
          <button id="sendToClaudeAPI">Send to Claude API</button>
          <textarea id="claudeResponse" rows="5" placeholder="Claude's response will appear here" readonly></textarea>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const closeButton = this.shadowRoot.querySelector('.close-button');
    closeButton.addEventListener('click', () => this.remove());

    const copyConversationButton = this.shadowRoot.getElementById('copyConversation');
    copyConversationButton.addEventListener('click', () => this.copyConversation());

    const copyLastAnswerButton = this.shadowRoot.getElementById('copyLastAnswer');
    copyLastAnswerButton.addEventListener('click', () => this.copyLastAnswer());

    const sendToClaudeTabButton = this.shadowRoot.getElementById('sendToClaudeTab');
    sendToClaudeTabButton.addEventListener('click', () => this.sendToClaudeTab());

    const sendToClaudeAPIButton = this.shadowRoot.getElementById('sendToClaudeAPI');
    sendToClaudeAPIButton.addEventListener('click', () => this.sendToClaudeAPI());

    this.setupDraggable();
  }

  setupDraggable() {
    const overlay = this.shadowRoot.querySelector('.overlay');
    const dragHandle = this.shadowRoot.querySelector('.drag-handle');
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      overlay.style.left = `${startLeft + deltaX}px`;
      overlay.style.top = `${startTop + deltaY}px`;
    };

    const onMouseUp = () => {
      isDragging = false;
      overlay.style.cursor = 'default';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    dragHandle.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = overlay.offsetLeft;
      startTop = overlay.offsetTop;
      overlay.style.cursor = 'grabbing';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  copyConversation() {
    this.dispatchEvent(new CustomEvent('aibridge-copy-conversation'));
  }

  copyLastAnswer() {
    this.dispatchEvent(new CustomEvent('aibridge-copy-last-answer'));
  }

  sendToClaudeTab() {
    const lastAnswer = this.shadowRoot.getElementById('lastAnswer').value;
    this.dispatchEvent(new CustomEvent('aibridge-send-to-claude-tab', { detail: lastAnswer }));
  }

  sendToClaudeAPI() {
    const lastAnswer = this.shadowRoot.getElementById('lastAnswer').value;
    this.dispatchEvent(new CustomEvent('aibridge-send-to-claude-api', { detail: lastAnswer }));
  }

  setLastAnswer(answer) {
    this.shadowRoot.getElementById('lastAnswer').value = answer;
  }

  setClaudeResponse(response) {
    this.shadowRoot.getElementById('claudeResponse').value = response;
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.backgroundColor = type === 'error' ? '#ff4444' : '#4CAF50';
    notification.style.color = 'white';
    notification.style.zIndex = '10000';
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

customElements.define('ai-assistant-bridge', AIAssistantBridgeOverlay);
