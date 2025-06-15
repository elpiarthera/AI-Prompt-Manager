# Comprehensive Testing Strategy for AI Prompt Manager

## Overview

The purpose of this testing strategy is to ensure the reliability, performance, security, and maintainability of the AI Prompt Manager Chrome Extension. By implementing a robust testing framework, we aim to:

- Achieve high code coverage for critical paths and core functionality.
- Prevent regressions through automated testing.
- Facilitate confident refactoring and feature development.
- Ensure accessibility, performance, and user experience meet high standards.
- Support the extension's adaptability as AI platforms (like ChatGPT and Claude.ai) evolve.

This strategy will incorporate various testing types, including unit, integration, and end-to-end tests, to cover all aspects of the extension. While Test-Driven Development (TDD) is an ideal, for this existing codebase, we will focus on adding comprehensive tests retrospectively and applying TDD for new features.

## Testing Philosophy

- **Pragmatic TDD**: For new features, aim to write tests before code to define expected behavior. For existing code, prioritize adding tests for critical and complex areas.
- **User-Centric Testing**: Focus on user interactions with the popup, options page, and overlay, as well as the extension's behavior on target websites (ChatGPT, Claude.ai).
- **Continuous Testing (Future Goal)**: While full CI/CD might be overkill for a small extension, aim to run tests locally before any significant change or release. Automating this via GitHub Actions can be a future goal.
- **Comprehensive Coverage**: Test all layers of the extension: UI components (popup, options, overlay), background logic, content script interactions with web pages, and storage mechanisms.
- **Maintainability**: Write clear, maintainable tests that are easy to understand and update as the extension evolves.

## The Testing Pyramid Model

Our strategy is guided by the **Testing Pyramid**, a model that promotes a balanced distribution of test types to ensure a fast, reliable, and cost-effective test suite. For the AI Prompt Manager, the pyramid consists of:

- **Base (Unit Tests)**: The majority of tests will be fast, isolated unit tests that verify individual functions or modules within `popup.js`, `options.js`, `background.js`, and helper functions in content scripts. These will use a Node.js test runner like `Jest`, with mocking for Chrome APIs and external services.
- **Middle (Integration Tests)**: Fewer integration tests will validate interactions between different parts of the extension. Examples include:
    - Popup/Options working with `chrome.storage`.
    - Message passing between Popup/Content Scripts and the Background Script.
    - Content script logic interacting with a mocked DOM (e.g., using JSDOM or via `Puppeteer`).
- **Top (End-to-End Tests)**: A small number of E2E tests will verify critical user flows in a real browser environment using a tool like `Puppeteer`. These tests will cover scenarios like adding a prompt, navigating to ChatGPT, and injecting the prompt, or changing settings in the options page and observing their effect.

This structure aims to minimize test maintenance costs while maximizing confidence in the extension's behavior. For more details, refer to Martin Fowler’s [Test Pyramid article](https://martinfowler.com/bliki/TestPyramid.html).

## Setup and Prerequisites

Before running tests, ensure the development environment is properly configured:

- **Node.js and Package Manager**: Install a recent LTS version of Node.js and a package manager (`npm`, `pnpm`, or `yarn`). This is required for `Jest` (test runner) and `Puppeteer` (E2E testing).
- **Project Dependencies**: While the extension itself has no build-step dependencies, testing tools will be added as `devDependencies` in a `package.json` file (to be created).
  - Create `package.json`: Run `npm init -y` (or equivalent) in the project root if it doesn't exist.
  - Install Testing Tools: `npm install --save-dev jest jest-environment-jsdom puppeteer jest-puppeteer eslint` (or `pnpm`/`yarn` equivalents). Note: These are examples; specific versions might change over time.
- **Browser for E2E Testing**: Google Chrome or Chromium is required for `Puppeteer` tests.
- **Extension Files**: For E2E tests, the extension files (`manifest.json`, JS files, HTML, CSS) must be available in their current state. No separate build step is currently part of the extension.
- **Configuration Files**:
  - `jest.config.js`: To configure `Jest`, including setup for `jest-puppeteer` and mocking Chrome APIs.
  - `.eslintrc.js` (or similar): For linting test code (and potentially source code).
- **Environment Variables**:
  - For Claude API tests (if live API testing is attempted, though mostly mocked): A test API key might be needed, managed securely and not committed (e.g., via environment variables or a `.env` file ignored by Git). For most tests, the API will be mocked.

## Technologies Used

The testing stack for the AI Prompt Manager Chrome Extension will include:

- **JavaScript (ES6+)**: The extension is written in plain JavaScript. Tests will also be in JavaScript.
- **`Jest`**:
  - Primary test runner for unit and integration tests.
  - Provides assertion library and mocking capabilities.
  - Can be configured to run in a Node.js environment (for logic tests) or JSDOM environment (for some DOM-related unit tests).
- **`jest-environment-jsdom`**: To allow testing DOM manipulation logic from `popup.js`, `options.js` in a simulated DOM environment within `Jest`.
- **`Puppeteer`**:
  - For end-to-end (E2E) testing the extension in a real Chromium browser.
  - Useful for testing UI interactions (popup, options page, overlay), content script injection and behavior on mock pages, and integration with Chrome extension APIs in a browser context.
- **`jest-puppeteer`**:
  - Integrates `Puppeteer` with `Jest`, allowing `Puppeteer` tests to be written within the `Jest` framework.
  - Manages browser setup and teardown.
- **Mocking Utilities**:
  - **`Jest` Mocks (`jest.fn()`, `jest.mock()`):** For mocking functions, modules, and especially Chrome Extension APIs (`chrome.storage.sync`, `chrome.runtime.sendMessage`, etc.) in unit/integration tests.
  - **(Potentially) `msw` (Mock Service Worker):** If advanced HTTP request mocking for the Claude API is needed beyond simple `fetch` mocks in `Jest`/`Puppeteer`. For the current scope, `Jest`'s `fetch` mocking or `Puppeteer`'s network interception might suffice.
- **`ESLint`**: For code quality and consistency in both source and test files.

## Test Types

The testing strategy for AI Prompt Manager includes multiple test types to ensure comprehensive coverage:

### 1. Unit Tests
- **Purpose**: Test individual functions, logic blocks, or UI components in isolation. For this extension, this primarily means testing JavaScript logic from `popup.js`, `options.js`, `background.js`, and helper functions within content scripts.
- **Scope**: Focus on specific logic, edge cases, and error conditions. Chrome APIs and external dependencies will be mocked.
- **Tools**: `Jest`.
- **Guidelines**:
  - Mock all Chrome APIs (e.g., `chrome.storage.sync`, `chrome.runtime.sendMessage`, `chrome.tabs.create`).
  - Mock `fetch` for API calls (e.g., Claude API in `background.js`).
  - Test helper functions with various inputs.
  - For UI logic in `popup.js` or `options.js` not directly tied to DOM rendering (e.g., state update logic), test separately. UI-heavy logic involving direct DOM manipulation and rendering is often better tested via integration tests (with JSDOM if sufficient) or E2E tests (with Puppeteer).
- **Example (Logic from `popup.js` - Prompt Deletion State Management)**:
  ```javascript
  // __tests__/popup_logic.test.js (Conceptual)
  // Assume 'prompts' and 'selectedPrompts' are managed in a testable way

  describe('Prompt Deletion Logic', () => {
    let prompts;
    let selectedPrompts;

    beforeEach(() => {
      prompts = [
        { title: 'Prompt 1', text: 'Text 1' },
        { title: 'Prompt 2', text: 'Text 2' },
        { title: 'Prompt 3', text: 'Text 3' },
      ];
      selectedPrompts = new Set([0, 2]); // Prompt 1 and Prompt 3 selected
    });

    test('should correctly adjust selectedPrompts after deleting an unselected item', () => {
      const deleteIndex = 1; // Deleting "Prompt 2"
      // Simulate logic that adjusts selectedPrompts
      const newSelectedPrompts = new Set();
      selectedPrompts.forEach(selectedIndex => {
        if (selectedIndex > deleteIndex) {
          newSelectedPrompts.add(selectedIndex - 1);
        } else if (selectedIndex < deleteIndex) {
          newSelectedPrompts.add(selectedIndex);
        }
      });
      expect(newSelectedPrompts).toEqual(new Set([0, 1])); // Expected: Prompt 1 (now 0) and Prompt 3 (now 1)
    });

    test('should correctly adjust selectedPrompts after deleting a selected item', () => {
      const deleteIndex = 0; // Deleting "Prompt 1"
      const newSelectedPrompts = new Set();
      selectedPrompts.forEach(selectedIndex => {
        if (selectedIndex > deleteIndex) {
          newSelectedPrompts.add(selectedIndex - 1);
        } else if (selectedIndex < deleteIndex) {
          newSelectedPrompts.add(selectedIndex);
        }
      });
      expect(newSelectedPrompts).toEqual(new Set([1])); // Expected: Prompt 3 (now 1, was index 2)
    });
  });
  ```
- **Example (Helper function from `content.js`)**:
  ```javascript
  // __tests__/content_helpers.test.js
  // Assuming isValidSelector is extracted or testable
  function isValidSelector(selector) {
      if (typeof selector !== 'string' || selector.trim() === '') return false;
      try {
          document.createDocumentFragment().querySelector(selector);
          return true;
      } catch (e) { return false; }
  }

  describe('isValidSelector', () => {
    test('should return true for valid selectors', () => {
      expect(isValidSelector('div')).toBe(true);
      expect(isValidSelector('#id')).toBe(true);
      expect(isValidSelector('.class[attr="value"]')).toBe(true);
    });
    test('should return false for invalid selectors', () => {
      expect(isValidSelector('###invalid')).toBe(false);
      expect(isValidSelector('')).toBe(false);
      expect(isValidSelector(null)).toBe(false);
    });
  });
  ```

### 2. Integration Tests
- **Purpose**: Verify interactions between different internal components of the extension or with mocked external services/APIs.
- **Types**:
  - **Component-Service Integration**: Test interactions between UI scripts (`popup.js`, `options.js`) and `chrome.storage`.
  - **Inter-Script Communication**: Test message passing between `popup.js`/`content.js` and `background.js`.
  - **Content Script DOM Interaction**: Test content script logic (e.g., finding elements, extracting text) with a controlled DOM (using JSDOM via `jest-environment-jsdom` or `Puppeteer` against static HTML files).
  - **Background API Interaction**: Test `background.js`'s Claude API call logic with a mocked `fetch`.
- **Scope**: Test data flow, message contracts, and interactions with Chrome APIs (mocked).
- **Tools**: `Jest` (with `jest-environment-jsdom` for DOM parts), potentially `Puppeteer` for more complex DOM interactions.
- **Guidelines**:
  - Mock Chrome APIs to simulate their behavior (e.g., `chrome.runtime.sendMessage` response, `chrome.storage.get/set` behavior).
  - For DOM interaction tests in `content.js`, prepare static HTML snippets that mimic parts of ChatGPT or Claude.ai pages.
- **Example (Popup with `chrome.storage.sync` - Conceptual)**:
  ```javascript
  // __tests__/popup_storage.test.js
  // Mock chrome.storage.sync (typically in jest.setup.js)
  global.chrome = {
    storage: {
      sync: {
        get: jest.fn((keys, callback) => callback({ prompts: [{title: 'Test', text: 'Test'}] })),
        set: jest.fn((data, callback) => callback()),
      },
    },
    // ... other needed chrome APIs
  };

  // Simplified representation of popup logic for loading prompts
  async function loadPromptsFromStorage() {
    return new Promise(resolve => {
      chrome.storage.sync.get('prompts', data => resolve(data.prompts || []));
    });
  }

  describe('Popup Storage Interaction', () => {
    test('should load prompts from storage', async () => {
      const prompts = await loadPromptsFromStorage();
      expect(chrome.storage.sync.get).toHaveBeenCalledWith('prompts', expect.any(Function));
      expect(prompts).toEqual([{title: 'Test', text: 'Test'}]);
    });
  });
  ```
- **Example (Content Script DOM Interaction - Conceptual with JSDOM)**:
  ```javascript
  // __tests__/content_dom.test.js
  // Assume findInputField is a function in content.js that takes a document object
  // and uses pre-configured selectors.

  /*
  const { JSDOM } = require('jsdom'); // Needs JSDOM setup in jest.config.js or per test
  const dom = new JSDOM(`<!DOCTYPE html><body><textarea id="prompt-textarea"></textarea></body>`);
  global.document = dom.window.document;

  // Simplified findInputField from content.js
  function findInputFieldForTest(doc, selector) {
    return doc.querySelector(selector);
  }

  describe('findInputField on mock DOM', () => {
    test('should find the input field', () => {
      const CHATGPT_SELECTORS = { inputField: 'textarea#prompt-textarea' }; // Example
      const inputField = findInputFieldForTest(global.document, CHATGPT_SELECTORS.inputField);
      expect(inputField).not.toBeNull();
      expect(inputField.id).toBe('prompt-textarea');
    });
  });
  */
  // Note: Direct JSDOM manipulation like this can be complex to set up correctly for content scripts,
  // especially for scripts expecting a full browser environment.
  // Puppeteer might be more robust for testing content script interactions with a page.
  ```

### 3. End-to-End (E2E) Tests
- **Purpose**: Simulate real user interactions to verify complete application flows within a browser environment.
- **Scope**: Test user journeys like adding a prompt, opening ChatGPT, injecting the prompt, changing options, and verifying Claude API interaction (with a mocked API endpoint if possible via `Puppeteer`'s network interception).
- **Tools**: `Puppeteer` (with `jest-puppeteer`).
- **Guidelines**:
  - Load the extension into a `Puppeteer`-controlled browser instance.
  - Interact with the extension's popup, options page, and overlay.
  - Navigate to mock HTML pages that simulate ChatGPT/Claude.ai structures for content script testing, or carefully interact with live sites if absolutely necessary and stable (generally discouraged for automated tests).
  - Use `Puppeteer`'s network interception to mock the Claude API response to avoid flakiness and external dependencies.
- **Example (Puppeteer - Add and Inject Prompt - Conceptual)**:
  ```javascript
  // e2e/prompt_flow.test.js
  describe('Full Prompt Management and Injection Flow', () => {
    // browser and page are typically provided by jest-puppeteer environment
    // let browser; // Not needed if jest-puppeteer manages it
    // let page; // page is often the default Puppeteer page, need to manage extension pages

    beforeAll(async () => {
      // Example: browser = await puppeteer.launch({ headless: false, args: ['--load-extension=path/to/extension', '--disable-extensions-except=path/to/extension'] });
      // jest-puppeteer typically handles browser launch. Extension loading is configured in jest-puppeteer.config.js or similar.
    });

    // afterAll(async () => { if (browser) await browser.close(); }); // Only if not managed by jest-puppeteer

    test('should add a prompt via popup and inject into a mock ChatGPT page', async () => {
      // 1. Open popup (might need to get extension ID and construct URL, or use jest-puppeteer's methods)
      //    const popupPage = await newExtensionPage(page, 'popup.html'); // Helper function
      // 2. Interact with popup: fill modal to add "Test E2E Prompt", "E2E Text"
      //    await popupPage.click('#addPromptButton');
      //    await popupPage.type('#promptTitle', 'Test E2E Prompt');
      //    await popupPage.type('#promptText', 'E2E Text');
      //    await popupPage.click('#savePromptButton');
      // 3. Navigate to a mock ChatGPT page (e.g., a local HTML file)
      //    const targetPage = await browser.newPage(); // Or use the default page provided by jest-puppeteer
      //    await targetPage.goto('file:///path/to/mock_chatgpt.html'); // Contains a textarea
      // 4. Re-open popup / interact with it again
      //    await popupPage.bringToFront();
      // 5. Select the "Test E2E Prompt" and click "Add Selected Prompts"
      //    await popupPage.click('input[type="checkbox"]'); // find correct one based on title
      //    await popupPage.click('#addSelectedPrompts');
      // 6. Verify text area on mock_chatgpt.html contains "E2E Text"
      //    const textAreaValue = await targetPage.$eval('textarea', el => el.value);
      //    expect(textAreaValue).toBe('E2E Text');
      //    if (targetPage !== page) await targetPage.close();
    });
  });
  ```

### 4. Performance Tests
- **Purpose**: Ensure the extension's UI (popup, options page) is responsive and doesn't negatively impact browser performance.
- **Scope**: Test load times of `popup.html` and `options.html`. Monitor for any noticeable slowdowns during complex operations (e.g., rendering many prompts).
- **Tools**: Chrome DevTools (Performance tab, Lighthouse panel), `performance.now()` for micro-benchmarks.
- **Guidelines**:
  - Manually inspect load times for popup/options using DevTools.
  - For automated checks, Lighthouse can be run via Node CLI on `popup.html` and `options.html` if they are temporarily served or accessed via `file:///` URLs (though some Lighthouse audits work best with HTTP(S) URLs).
  - Focus on smooth UI interactions, especially in the prompt list and modal.
- **Example (Lighthouse CLI - Conceptual for popup)**:
  `lighthouse chrome-extension://<EXTENSION_ID>/popup.html --output=json --output-path=./popup-perf-report.json --only-categories=performance`
  (Note: Running Lighthouse directly on `chrome-extension://` URLs can be tricky; may need to open in a tab via a test utility).

### 5. Accessibility Tests
- **Purpose**: Ensure the extension's UI is usable by people with disabilities.
- **Scope**: Test `popup.html` and `options.html` for WCAG compliance (e.g., ARIA attributes, keyboard navigation, color contrast).
- **Tools**: `axe-core` (can be integrated with `Jest`/`Puppeteer`), Lighthouse (Accessibility panel), manual testing with keyboard and screen readers.
- **Guidelines**:
  - Integrate `axe-core` into E2E tests with `Puppeteer`.
  - Manually verify keyboard navigation for all interactive elements in popup and options.
  - Check color contrast.
- **Example (Jest + Puppeteer + axe-core - Conceptual)**:
  ```javascript
  // e2e/accessibility.test.js
  const { AxePuppeteer } = require('@axe-core/puppeteer');

  describe('Popup Accessibility', () => {
    test('should have no a11y violations on popup page', async () => {
      // const popupUrl = `chrome-extension://<EXTENSION_ID>/popup.html`;
      // const popupPage = await newExtensionPage(page, 'popup.html'); // Helper to get extension page
      // const results = await new AxePuppeteer(popupPage).analyze();
      // expect(results.violations).toHaveLength(0);
    });
  });
  ```

## Running Tests

Assuming `Jest` and `Puppeteer` (via `jest-puppeteer`) are set up with a `package.json`:

Define scripts in `package.json`:
```json
// package.json (example scripts)
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:e2e": "jest --config=jest-e2e.config.js", // Separate config for E2E if needed
  "lint": "eslint . --ext .js"
}
```

Common commands (using `npm`, adapt for `pnpm`/`yarn`):

```bash
# Install dependencies (first time)
npm install

# Run all Jest unit/integration tests (excluding E2E if configured separately)
npm test

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test path/to/your.test.js

# Run tests in watch mode (for development)
npm run test:watch

# Run E2E tests (Puppeteer)
npm run test:e2e

# Run linter
npm run lint
```

## Writing Tests

### File Structure
- **Unit/Integration Tests for Scripts**: Colocate test files with the JavaScript files they are testing.
  - Example: `popup.js` and `popup.test.js` in the same directory.
  - Example: `background.js` and `background.test.js`.
- **E2E Tests**: Place in a dedicated top-level directory, e.g., `tests/e2e/`.
- **Mock HTML Files**: Store any mock HTML pages (for simulating ChatGPT/Claude.ai) in a `tests/fixtures/` directory.
- **File Naming**: Use `.test.js` for `Jest` test files (e.g., `utils.test.js`). E2E tests might also follow this or use `.e2e.test.js`.

### Conventions
- Use descriptive test names (e.g., `it('should correctly update prompt count when a prompt is added')`).
- Follow Arrange-Act-Assert (AAA) pattern.
- Group related tests using `describe` blocks.
- Keep tests independent. Avoid tests relying on the state or outcome of previous tests.
- Use `beforeEach`/`afterEach` (or `beforeAll`/`afterAll`) for setup and cleanup (e.g., resetting mocks, cleaning up storage mocks).
- Mock Chrome APIs consistently. A setup file for `Jest` (`jest.setup.js`) can be used to establish global mocks for `chrome` APIs.

## Mocking

Mocking is essential for isolating tests and simulating browser/external service behaviors.

### Mocking Chrome APIs
- Create a global mock for the `chrome` object in a `Jest` setup file (e.g., `jest.setup.js` configured via `setupFilesAfterEnv` in `jest.config.js`). This is a starting point and should be expanded as needed.
  ```javascript
  // jest.setup.js
  global.chrome = {
    runtime: {
      sendMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
      getURL: jest.fn(path => path), // Simple mock
      openOptionsPage: jest.fn(),
      lastError: null, // Mock lastError
    },
    storage: {
      sync: {
        get: jest.fn((keys, callback) => callback({})),
        set: jest.fn((data, callback) => callback()),
        remove: jest.fn((keys, callback) => callback()),
        clear: jest.fn(callback => callback()),
      },
      local: {
        get: jest.fn((keys, callback) => callback({})),
        set: jest.fn((data, callback) => callback()),
        remove: jest.fn((keys, callback) => callback()),
        clear: jest.fn(callback => callback()),
      },
      onChanged: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
    },
    tabs: {
      query: jest.fn(),
      create: jest.fn(),
      sendMessage: jest.fn(),
      onUpdated: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
    },
    scripting: {
      executeScript: jest.fn(),
    },
    action: {
      onClicked: {
        addListener: jest.fn(),
      },
      setPopup: jest.fn(),
      openPopup: jest.fn(),
    }
    // Add other APIs as needed by the extension
  };
  ```
- In individual tests, you can then spy on these mocks or change their implementation for specific test cases:
  `chrome.storage.sync.get.mockImplementationOnce((keys, callback) => callback({ prompts: [...] }));`

### Mocking `fetch` (for Claude API)
- For unit/integration tests of `background.js`, use `jest.spyOn(global, 'fetch')` or `global.fetch = jest.fn()`.
  ```javascript
  // In a test for background.js calling Claude API
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ content: [{ text: 'Mocked Claude Response' }] }),
    })
  );
  // ... test logic ...
  expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('api.anthropic.com'), expect.any(Object));
  ```
- For E2E tests, `Puppeteer`'s `page.setRequestInterception(true)` and `page.on('request', ...)` can be used to intercept and mock network requests to the Claude API.

### Mocking DOM Elements (for Content Scripts in Jest/JSDOM)
- If using `jest-environment-jsdom`, you can construct HTML snippets and append them to `document.body` to test DOM query logic.
  ```javascript
  // In a content.test.js
  document.body.innerHTML = '<textarea id="prompt-textarea"></textarea>';
  // const inputField = findInputField(document, { inputField: '#prompt-textarea' }); // Assuming findInputField is adapted
  // expect(inputField).not.toBeNull();
  ```

## Code Coverage

- **Goal**: Aim for high coverage (e.g., 80%+) for JavaScript logic in `popup.js`, `options.js`, `background.js`, and critical helper functions. 100% coverage is not always practical or a sign of perfect testing, but it helps identify untested paths.
- **Tools**: `Jest` (`--coverage`) provides coverage reports.
- **Generate Report**:
  ```bash
  npm run test:coverage
  ```
  This usually outputs to a `coverage/` directory. Open `coverage/lcov-report/index.html`.
- **Analyze Report**: Focus on parts of the code with low coverage that are critical or complex.
- **Enforce Coverage (Optional/Future)**: Coverage thresholds can be set in `jest.config.js`.
  ```javascript
  // jest.config.js
  // coverageThreshold: {
  //   global: {
  //     branches: 80,
  //     functions: 80,
  //     lines: 80,
  //     statements: 80,
  //   },
  // },
  ```

## Continuous Integration (CI)

- **Future Goal**: Integrate automated testing into a CI pipeline (e.g., using GitHub Actions).
- **Workflow**:
  - On every push or pull request to the main branch:
    - Checkout code.
    - Install dependencies.
    - Run linters (`ESLint`).
    - Run unit and integration tests (`Jest`).
    - (Optionally) Build and run E2E tests (`Puppeteer`), though E2E can be slower and might run on a less frequent schedule or only before releases.
- **Example (GitHub Actions - Basic for Jest)**:
  ```yaml
  # .github/workflows/ci.yml
  name: CI Tests
  on: [push, pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - name: Setup Node.js
          uses: actions/setup-node@v4
          with:
            node-version: '20' # Or your preferred LTS
        # Add step for caching dependencies (npm, pnpm, yarn) for faster workflows
        - name: Install Dependencies
          run: npm install # Or pnpm install / yarn install
        - name: Run Linter
          run: npm run lint
        - name: Run Unit/Integration Tests
          run: npm test
        # - name: Run E2E Tests (example placeholder)
        #   run: npm run test:e2e
  ```

## Troubleshooting

- **Chrome API Mocks**: Ensure Chrome APIs are thoroughly mocked in the Jest environment. Missing mocks are a common source of errors. Check `jest.setup.js`.
- **Async Operations**: Use `async/await` correctly in tests, especially for `Puppeteer` and mocked async Chrome APIs. Ensure `Jest` waits for promises to resolve.
- **Puppeteer Element Not Found**: Use `waitForSelector` or ensure pages are fully loaded. Debug with `headless: false` locally.
- **Flaky E2E Tests**: Can be due to timing issues, network dependencies (mock these!), or dynamic UI. Add robust selectors and waits.

## Best Practices

- **Keep Tests Fast and Independent**: Especially unit tests.
- **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it (especially for UI tests).
- **Clear Naming and Structure**: Make tests easy to read and understand.
- **One Assertion Per Test (Ideally for Unit Tests)**: Or test one logical concept.
- **Avoid Over-Mocking**: Mock external systems and direct dependencies, not necessarily every internal function call.
- **Review Test Code**: Treat test code with the same importance as production code.
- **Update Tests with Code**: If you change code, update its tests. If you fix a bug, write a test that would have caught it.

## Monitoring and Maintenance

- **Regularly Run Tests**: Especially before making changes or releasing updates.
- **Review Test Coverage**: Periodically check if new code is being tested.
- **Refactor Tests**: As the codebase evolves, tests may also need refactoring to remain effective and maintainable.
- **Address Flaky Tests**: Investigate and fix flaky E2E tests promptly as they undermine confidence in the test suite.
