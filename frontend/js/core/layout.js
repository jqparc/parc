import { loadComponent } from '/js/util/loader.js';

export async function loadAppLayout() {
    await loadComponent(
        'header-container',
        '/component/system/header.html',
        null,
        '/js/system/user/check-auth.js',
    );

    await loadComponent(
        'nav-container',
        '/component/system/navigation.html',
        null,
    );
}

export function notifyLayoutReady() {
    document.dispatchEvent(new Event('layoutLoaded'));
}
