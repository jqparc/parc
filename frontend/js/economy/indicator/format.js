export function formatIndicatorValue(value) {
    return value === null || value === undefined ? '-' : Number(value).toLocaleString();
}

export function formatChangeRate(value) {
    return value === null || value === undefined ? '0.00' : Number(value).toFixed(2);
}

export function getChangePresentation(changeValue) {
    const change = Number(changeValue || 0);

    return {
        change,
        color: change > 0 ? '#e74c3c' : change < 0 ? '#2980b9' : '#7f8c8d',
        sign: change > 0 ? '+' : change < 0 ? '-' : '',
    };
}
