'use strict';

const ACGME_INSERT_URL = 'https://apps.acgme.org/ads/CaseLogs/CaseEntry/Insert';
const INSERT_PATH_LC   = '/caselogs/caseentry/insert';

// Cancellation token for the persistent manual-submit watcher
let manualWatchCancel = null;

function cancelManualWatch() {
  if (manualWatchCancel) { manualWatchCancel(); manualWatchCancel = null; }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'FILL_CASE') {
    handleFillCase(msg.caseData, msg.autoSubmit, msg.detectManual)
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
  if (msg.type === 'CANCEL_WATCH') {
    cancelManualWatch();
    sendResponse({ ok: true });
  }
});

async function handleFillCase(caseData, autoSubmit, detectManual) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) throw new Error('No active tab');

  // Cancel any existing manual watcher before navigating
  cancelManualWatch();

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
    // Start a persistent watcher so manual page submission advances the popup
    if (detectManual && fillRes && fillRes.filled) {
      startManualWatch(tab.id);
    }
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

  // Cancel manual watcher before clicking submit to prevent double-fire
  cancelManualWatch();

  // content.js clicks submit synchronously; we detect result via tab navigation
  await chrome.tabs.sendMessage(tab.id, { type: 'SUBMIT_FORM' });
  return await waitForSubmissionResult(tab.id);
}

// Persistent watcher for manual submissions in review mode.
// Fires chrome.runtime.sendMessage({type:'MANUAL_SUBMITTED'}) to the popup.
function startManualWatch(tabId) {
  cancelManualWatch();
  let cancelled = false;

  // Auto-expire after 2 minutes so the listener doesn't leak indefinitely
  const expiry = setTimeout(() => { cancelled = true; }, 120000);

  manualWatchCancel = () => {
    cancelled = true;
    clearTimeout(expiry);
    chrome.tabs.onUpdated.removeListener(listener);
  };

  function listener(id, changeInfo, tab) {
    if (cancelled || id !== tabId) return;
    if (changeInfo.status !== 'complete') return;
    const url = (tab.url || '').toLowerCase();
    if (!url.includes(INSERT_PATH_LC)) return;

    // Remove immediately and mark done so it only fires once
    manualWatchCancel = null;
    cancelled = true;
    clearTimeout(expiry);
    chrome.tabs.onUpdated.removeListener(listener);

    // Poll every 500ms for up to 5 seconds for #server-success to render
    const pollDeadline = Date.now() + 5000;
    let polling = true;
    const pollInterval = setInterval(async () => {
      if (!polling) return;
      try {
        const [{ result }] = await chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            const successEl = document.getElementById('server-success');
            if (successEl && successEl.textContent.includes('successfully')) {
              return { found: true };
            }
            const errorEl = document.getElementById('clienterrors');
            if (errorEl && errorEl.textContent.trim()) {
              return { found: false };
            }
            return null;
          },
        });
        if (result !== null) {
          polling = false;
          clearInterval(pollInterval);
          if (result.found) {
            chrome.runtime.sendMessage({ type: 'MANUAL_SUBMITTED' });
          }
        } else if (Date.now() >= pollDeadline) {
          polling = false;
          clearInterval(pollInterval);
        }
      } catch (e) {
        polling = false;
        clearInterval(pollInterval);
        /* popup may be closed — ignore */
      }
    }, 500);
  }

  chrome.tabs.onUpdated.addListener(listener);
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

      // Poll every 500ms for up to 5 seconds for #server-success to render
      const pollDeadline = Date.now() + 5000;
      let polling = true;
      const pollInterval = setInterval(async () => {
        if (!polling) return;
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
              return null;
            },
          });
          if (result !== null) {
            polling = false;
            clearInterval(pollInterval);
            resolve(result);
          } else if (Date.now() >= pollDeadline) {
            polling = false;
            clearInterval(pollInterval);
            resolve({ success: false, reason: 'timeout' });
          }
        } catch (e) {
          polling = false;
          clearInterval(pollInterval);
          resolve({ success: false, reason: e.message });
        }
      }, 500);
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
