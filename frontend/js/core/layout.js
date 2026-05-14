import { loadComponent } from '/js/util/loader.js';

export async function loadAppLayout() {
    await loadComponent(
        'header-container',
        '/component/header.html',
        null,
        '/js/auth/check_auth.js',
    );

    await loadComponent(
        'nav-container',
        '/component/navigation.html',
        null,
    );
}

export function notifyLayoutReady() {
    document.dispatchEvent(new Event('layoutLoaded'));
}
