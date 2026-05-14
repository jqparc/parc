export function formatDate(value) {
    return value ? value.split('T')[0] : '';
}

export function escapeHTML(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

export function setText(element, value) {
    if (element) {
        element.textContent = value;
    }
}

export function setHidden(element, hidden) {
    if (element) {
        element.hidden = hidden;
        element.style.display = hidden ? 'none' : '';
    }
}
