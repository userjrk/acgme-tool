'use strict';

const ACGME_INSERT_URL = 'https://apps.acgme.org/ads/CaseLogs/CaseEntry/Insert';

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

  // Register load listener BEFORE navigating to avoid race condition
  const loadPromise = waitForTabLoad(tab.id);
  await chrome.tabs.update(tab.id, { url: ACGME_INSERT_URL });
  await loadPromise;

  return await chrome.tabs.sendMessage(tab.id, {
    type: 'FILL_FORM',
    caseData,
    autoSubmit,
  });
}

async function handleSubmitCurrent() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) throw new Error('No active tab');
  return await chrome.tabs.sendMessage(tab.id, { type: 'SUBMIT_FORM' });
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
        // Brief delay to let page scripts initialize
        setTimeout(resolve, 600);
      }
    }

    chrome.tabs.onUpdated.addListener(listener);
  });
}
