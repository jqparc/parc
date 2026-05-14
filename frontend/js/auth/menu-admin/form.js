export function getUpdatePayload(row) {
    const seq = row.querySelector('[data-field="seq"]')?.value;
    const useYn = row.querySelector('[data-field="use_yn"]')?.value;
    return {
        seq: Number(seq || 0),
        use_yn: useYn || 'Y',
    };
}

export function getFormPayload(form) {
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.seq = Number(payload.seq || 0);
    return payload;
}
