# AI Prompt Manager - Test Status Tracking

## Introduction

This Test Status Tracking document serves as a centralized, living record of testing progress for the AI Prompt Manager Chrome Extension. It monitors the status of unit, integration, end-to-end (E2E), performance, and accessibility tests for various extension components, ensuring alignment with the project's testing strategy outlined in `TESTING_STRATEGY.md`. The goal is to track test coverage, identify gaps, and document challenges to deliver a reliable, maintainable, and high-quality extension.

Each section contains a table tailored to a specific area of the extension (e.g., UI & Logic Scripts, Background & Content Scripts), with columns for priority, test status, coverage metrics (where applicable), PR/ticket links, and detailed notes. This document is designed for regular updates as testing progresses.

## Objectives

- Track test implementation status for all key areas of the AI Prompt Manager.
- Aim for high test coverage (e.g., 80%+) for critical JavaScript logic and user flows.
- Identify and document testing gaps, limitations, and resolutions specific to Chrome extension testing.
- Provide transparency for any contributors or stakeholders on testing progress.
- Support continuous improvement of the test suite through regular updates.

## Test File Structure

Test files are organized according to the project’s testing strategy (`TESTING_STRATEGY.md`):

- **Unit/Integration Tests**: Colocated with the source JavaScript files they test (e.g., `popup.js` and `popup.test.js` in the same directory).
- **E2E Tests**: Placed in a dedicated top-level directory (e.g., `tests/e2e/`).
- **Mock/Fixture Files**: Any mock HTML pages or data fixtures will be stored in `tests/fixtures/`.

**Note**: HTML files (`popup.html`, `options.html`) and CSS files are primarily tested implicitly via E2E and integration tests that cover their corresponding JavaScript logic and UI behavior. Configuration files like `manifest.json` are validated by loading the extension.

## Note on Scale and Automation

For this extension, this single document should suffice. While the **Coverage** column is useful for tracking goals, manual updates can be tedious. If automated testing is implemented, link to the live, auto-generated coverage report from a CI/CD pipeline (if set up) as the primary source of truth. This column can then be used to note specific coverage goals or highlight significant gaps.

**Live Coverage Report**: `[Placeholder: Link to CI coverage report dashboard if/when available]`

## Test Status Tables

The following tables track the testing status for each project area. Update these tables as tests are written, executed, and reviewed.

## Status Definitions

- 🔴 **Not Started**: No tests written for the component/file/flow.
- 🟡 **In Progress**: Tests are being written but not yet complete.
- 🔵 **To Review**: Tests written, passing, and ready for PR review (if applicable).
- ✅ **Tested**: Tests reviewed, passing, and merged/completed.
- 🚧 **Blocked**: Tests cannot be completed due to external issues (e.g., limitations in mocking Chrome APIs, complex external dependencies).

## Priority Definitions

- **High**: Critical extension functionalities, core logic, and primary user interactions (e.g., prompt management, injection into ChatGPT, API key handling, core background processing).
- **Medium**: Important but less critical features or UI elements (e.g., dark mode, secondary UI elements in options/popup, non-critical content script interactions).
- **Low**: Non-critical functionalities or helper utilities with minimal impact on core user experience.

**Assignment Guidance**: Prioritize `High` items first, followed by `Medium`, then `Low`. Consider usage frequency, user impact, and risk when assigning priorities.

### Extension UI & Logic Scripts

| File / Component      | Priority | Test Type        | Status | Test File Location          | Coverage (Lines/Branches/Functions) | PR/Ticket Link | Notes                                                                                                                                |
|-----------------------|----------|------------------|--------|-----------------------------|-------------------------------------|----------------|--------------------------------------------------------------------------------------------------------------------------------------|
| `popup.js`            | High     | Unit/Integration | 🔴     | `popup.test.js`             |                                     |                | Test prompt CRUD, modal logic, selections, dark mode, storage interaction, messaging to content script.                               |
| `options.js`          | Medium   | Unit/Integration | 🔴     | `options.test.js`           |                                     |                | Test loading/saving selectors & API key, default values, storage interaction (`sync` & `local`).                                   |
| `overlay.js`          | Medium   | Integration/E2E  | 🔴     | `overlay.test.js` (or E2E)  |                                     |                | Test Web Component rendering, event dispatch, methods called by `content.js`, UI interactions (drag, close). Needs browser-like env (Puppeteer for E2E, or JSDOM with care for integration if feasible). |
| `popup.html` (UI)     | High     | E2E              | 🔴     | `tests/e2e/popup.e2e.test.js` | (N/A for HTML)                      |                | Test overall layout, modal display, dark mode appearance, form interactions via E2E.                                                 |
| `options.html` (UI)   | Medium   | E2E              | 🔴     | `tests/e2e/options.e2e.test.js`| (N/A for HTML)                      |                | Test layout, form inputs, saving/resetting values via E2E.                                                                           |

### Background & Content Scripts

| File / Component            | Priority | Test Type        | Status | Test File Location                | Coverage (Lines/Branches/Functions) | PR/Ticket Link | Notes                                                                                                                               |
|-----------------------------|----------|------------------|--------|-----------------------------------|-------------------------------------|----------------|-------------------------------------------------------------------------------------------------------------------------------------|
| `background.js`             | High     | Unit/Integration | 🔴     | `background.test.js`              |                                     |                | Test message handlers (`sendToClaudeTab`, `sendToClaudeAPI`, `toggleOverlay`), API key retrieval, Claude API call logic (mocked `fetch`), script injection. |
| `content.js` (ChatGPT)      | High     | Unit/Integration | 🔴     | `content.test.js`                 |                                     |                | Test DOM interactions (finding elements, extracting text based on configurable selectors), `isValidSelector`, overlay event handling, messaging. |
| `claude-content-script.js`  | Medium   | Unit/Integration | 🔴     | `claude-content-script.test.js`   |                                     |                | Test DOM interaction (pasting text based on configurable selector), `isValidSelector`, messaging.                                        |

### End-to-End (E2E) Tests

| User Flow                             | Priority | Test Type | Status | Test File Location                             | Coverage (Flows) | PR/Ticket Link | Notes                                                                                                     |
|---------------------------------------|----------|-----------|--------|------------------------------------------------|------------------|----------------|-----------------------------------------------------------------------------------------------------------|
| Full Prompt Management Cycle          | High     | E2E       | 🔴     | `tests/e2e/prompt_management.e2e.test.js`      |                  |                | Add prompt via popup modal, edit it, verify changes, delete it. Check list updates and storage.           |
| Inject Prompt into ChatGPT            | High     | E2E       | 🔴     | `tests/e2e/inject_chatgpt.e2e.test.js`         |                  |                | Select prompt in popup, open mock ChatGPT page, click "Add Selected Prompts", verify text area content. |
| Overlay: Copy Conversation/Last Answer| High     | E2E       | 🔴     | `tests/e2e/overlay_copy.e2e.test.js`           |                  |                | On mock ChatGPT page, trigger copy features from overlay, verify clipboard content (if testable).         |
| Overlay: Send to Claude Tab           | Medium   | E2E       | 🔴     | `tests/e2e/overlay_send_claude_tab.e2e.test.js`|                  |                | Use overlay on mock ChatGPT, send to Claude, verify new mock Claude tab opens and text is pasted.       |
| Configure Selectors via Options       | Medium   | E2E       | 🔴     | `tests/e2e/options_selectors.e2e.test.js`      |                  |                | Change a selector in Options, save, then test its effect on relevant content script on a mock page.     |
| Configure & Use Claude API            | High     | E2E       | 🔴     | `tests/e2e/options_claude_api.e2e.test.js`     |                  |                | Set API key in Options. Use "Send to Claude API" in overlay. Mock API response, verify display.         |
| Dark Mode Toggle                      | Low      | E2E       | 🔴     | `tests/e2e/dark_mode.e2e.test.js`              |                  |                | Toggle dark mode in popup, verify UI changes and storage persistence.                                   |

### Performance and Accessibility Tests

| Test Area / Type              | Priority | Test Scope      | Status | Test File/Tool Location             | Metrics / Checks                    | PR/Ticket Link | Notes                                                                                                |
|-------------------------------|----------|-----------------|--------|-------------------------------------|-------------------------------------|----------------|------------------------------------------------------------------------------------------------------|
| Performance: Popup Load Time  | Medium   | Performance     | 🔴     | Chrome DevTools / Lighthouse        | Load time, FCP, TTI                 |                | Test with varying numbers of prompts. Ensure quick popup rendering.                                  |
| Performance: Options Page Load| Low      | Performance     | 🔴     | Chrome DevTools / Lighthouse        | Load time, FCP, TTI                 |                | Ensure options page loads efficiently.                                                               |
| Accessibility: Popup UI       | High     | Accessibility   | 🔴     | `tests/e2e/a11y_popup.e2e.test.js` (with `axe-core`) / Manual | WCAG Violations, Keyboard Nav, ARIA |                | Test keyboard navigation, ARIA attributes, color contrast, screen reader compatibility for `popup.html`. |
| Accessibility: Options Page UI| Medium   | Accessibility   | 🔴     | `tests/e2e/a11y_options.e2e.test.js` (with `axe-core`) / Manual | WCAG Violations, Keyboard Nav, ARIA |                | Test keyboard navigation, ARIA attributes, color contrast for `options.html`.                        |
| Accessibility: Overlay UI     | Medium   | Accessibility   | 🔴     | `tests/e2e/a11y_overlay.e2e.test.js` (with `axe-core`) / Manual | WCAG Violations, Keyboard Nav, ARIA |                | Test overlay elements for accessibility when active on a page.                                       |

## Notes Guidelines

- **Document Limitations**: Note specific challenges in testing the Chrome extension (e.g., difficulty in fully mocking `chrome.tabs.create` and then interacting with the new tab in unit tests, JSDOM limitations for complex DOM events or content script environments).
- **Workarounds**: Describe solutions or alternative testing approaches (e.g., using `Puppeteer` for scenarios hard to unit test, focusing on message passing contracts for inter-script communication).
- **Coverage Gaps**: Explain any intentional or unavoidable gaps in test coverage (e.g., parts of Chrome API interactions that are too complex to mock reliably, UI aspects best verified manually).
- **Dependencies**: List mocked dependencies (e.g., `fetch` for Claude API, specific `chrome.*` API behaviors).
- **Bugs Fixed**: If tests lead to bug discoveries, note the bug and its resolution.
- **Context**: Include relevant details if tests are assigned or linked to specific issues/PRs.

## Monitoring and Reporting

- **Regular Updates**: This document should be updated as tests are implemented, statuses change, or new test cases are identified.
- **Coverage Reports**: If `Jest` (or similar) is used with coverage enabled, generate and review reports periodically (e.g., after significant changes). Link to the `coverage/lcov-report/index.html` locally or the CI dashboard if available.
- **Test Failure Analysis**: Log and analyze any consistent test failures, prioritize fixes, and update the **Notes** column in the tables with resolutions or findings.
- **Stakeholder Communication**: This document can be shared to communicate testing progress and identify areas needing more focus.

## Tools and Configuration

Refer to the `TESTING_STRATEGY.md` document for a detailed list of testing frameworks, tools, and recommended configurations. Key tools include:

- **Testing Frameworks**: `Jest` (for unit/integration).
- **E2E Testing**: `Puppeteer` (with `jest-puppeteer`).
- **Performance Testing**: `Lighthouse`, Chrome DevTools.
- **Accessibility Testing**: `axe-core`.
- **Mocking**: `Jest` mocks, `Puppeteer` network interception.
- **Coverage Tools**: `Jest` (`--coverage`).

## Final Notes

- **Prioritization**: Focus on `High` priority items first to maximize quality impact. Update priorities as the extension evolves.
- **Scannability**: Use status emojis consistently for quick assessment. Keep PR/Ticket Links updated.
- **Adaptability**: This document is a living guide. Add new rows to tables as new features are added or specific test cases are identified. Remove or update entries as the codebase changes.
- **Alignment**: Ensure that the tests implemented align with the overall goals described in `TESTING_STRATEGY.md`.
