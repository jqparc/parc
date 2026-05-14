export function escapeHTML(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

export function selected(value, expected) {
    return value === expected ? 'selected' : '';
}

export function disabledUnless(isEnabled) {
    return isEnabled ? '' : 'disabled';
}
