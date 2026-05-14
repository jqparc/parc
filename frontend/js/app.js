import { injectGlobalStyles } from '/js/util/loader.js';
import { loadAppLayout, notifyLayoutReady } from '/js/core/layout.js';
import { bindAuthErrorHandler, bindSessionKeepAlive } from '/js/core/session.js';

async function initializeApp() {
    injectGlobalStyles();
    bindAuthErrorHandler();

    await loadAppLayout();

    bindSessionKeepAlive();
    notifyLayoutReady();
}

document.addEventListener('DOMContentLoaded', initializeApp);
