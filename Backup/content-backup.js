chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'insertPrompt') {
      const chatInput = document.querySelector('textarea'); // Assuming the input field is a textarea
      if (chatInput) {
          chatInput.value = request.prompt;
          chatInput.focus();
          chatInput.dispatchEvent(new Event('input', { bubbles: true })); // Trigger input event to reflect the change
      }
  }
});
