'use strict';

const ACGME_INSERT_URL = 'https://apps.acgme.org/ads/CaseLogs/CaseEntry/Insert';
const INSERT_PATH_LC   = '/caselogs/caseentry/insert';

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'FILL_CASE') {
    handleFillCase(msg.caseData, msg.autoSubmit)
      .then(sendResponse)
      .catch(err => sendResponse({ success: false, reason: err.message }));
    return true;
  }
  if (msg.type === 'SUBMIT_CURRENT') {
    handleSubmitCurrent()
      .then(sendResponse)
      .catch(err => sendResponse({ success: false, reason: err.message }));
    return true;
  }
});

async function handleFillCase(caseData, autoSubmit) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) throw new Error('No active tab');

  // Navigate to Insert page and wait for it to load
  const loadPromise = waitForTabLoad(tab.id);
  await chrome.tabs.update(tab.id, { url: ACGME_INSERT_URL });
  await loadPromise;

  // Tell content.js to fill the form
  const fillRes = await chrome.tabs.sendMessage(tab.id, {
    type: 'FILL_FORM',
    caseData,
    autoSubmit,
  });

  if (!autoSubmit) {
    return fillRes; // { filled: true } — popup will handle submit separately
  }

  // If fill itself failed (e.g. not_logged_in, form_not_found), propagate immediately
  if (fillRes && fillRes.success === false) return fillRes;

  // autoSubmit: content.js clicked submit and returned immediately.
  // Now monitor the tab for the page reload that signals success/failure.
  return await waitForSubmissionResult(tab.id);
}

async function handleSubmitCurrent() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) throw new Error('No active tab');

  // content.js clicks submit synchronously; we detect result via tab navigation
  await chrome.tabs.sendMessage(tab.id, { type: 'SUBMIT_FORM' });
  return await waitForSubmissionResult(tab.id);
}

// Watch the tab for the Insert page reload ACGME does after submission.
// When it completes, run executeScript to check #server-success in the DOM.
function waitForSubmissionResult(tabId) {
  return new Promise(resolve => {
    const navTimeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve({ success: false, reason: 'navigation_timeout' });
    }, 15000);

    function listener(id, changeInfo, tab) {
      if (id !== tabId) return;
      if (changeInfo.status !== 'complete') return;
      const url = (tab.url || '').toLowerCase();
      if (!url.includes(INSERT_PATH_LC)) return;

      clearTimeout(navTimeout);
      chrome.tabs.onUpdated.removeListener(listener);

      // Allow 3 seconds for DOM to fully render success/error elements
      setTimeout(async () => {
        try {
          const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => {
              const successEl = document.getElementById('server-success');
              if (successEl && successEl.textContent.includes('successfully')) {
                return { success: true };
              }
              const errorEl = document.getElementById('clienterrors');
              if (errorEl && errorEl.textContent.trim()) {
                return { success: false, reason: errorEl.textContent.trim().slice(0, 200) };
              }
              return { success: false, reason: 'timeout' };
            },
          });
          resolve(result);
        } catch (e) {
          resolve({ success: false, reason: e.message });
        }
      }, 3000);
    }

    chrome.tabs.onUpdated.addListener(listener);
  });
}

function waitForTabLoad(tabId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error('Tab load timeout'));
    }, 15000);

    function listener(id, info) {
      if (id === tabId && info.status === 'complete') {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        setTimeout(resolve, 600);
      }
    }

    chrome.tabs.onUpdated.addListener(listener);
  });
}
