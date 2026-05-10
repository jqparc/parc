import { fetchAPI } from '/js/api.js';
import { navigateTo } from '/js/router.js';

const API_PATH = '/assets/domestic-stocks';

const DOM = {
    form: () => document.getElementById('stock-form'),
    error: () => document.getElementById('stock-form-error'),
};

function setError(message) {
    const errorEl = DOM.error();
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = !message;
}

function getTradeKey() {
    return window.location.pathname.split('/').at(-2);
}

function fillForm(item) {
    const form = DOM.form();
    if (!form) return;

    form.elements.proc_date.value = item.proc_date || '';
    form.elements.itms_code.value = item.itms_code || '';
    form.elements.trns_code.value = item.trns_code || 'B';
    form.elements.qnty.value = item.qnty ?? '';
    form.elements.prc.value = item.prc ?? '';
}

function getPayload(form) {
    const formData = new FormData(form);
    return {
        proc_date: formData.get('proc_date'),
        itms_code: formData.get('itms_code')?.trim(),
        trns_code: formData.get('trns_code') || 'B',
        qnty: Number(formData.get('qnty')),
        prc: Number(formData.get('prc')),
    };
}

async function loadTrade() {
    const tradeKey = getTradeKey();
    try {
        const item = await fetchAPI(`${API_PATH}/key/${encodeURIComponent(tradeKey)}`);
        fillForm(item);
    } catch (error) {
        setError(error.message || '국내주식 거래 정보를 불러오지 못했습니다.');
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const tradeKey = getTradeKey();
    const form = DOM.form();
    try {
        const updated = await fetchAPI(`${API_PATH}/key/${encodeURIComponent(tradeKey)}`, {
            method: 'PUT',
            body: JSON.stringify(getPayload(form)),
        });
        navigateTo(`/asset/stck/${encodeURIComponent(updated.trade_key)}`);
    } catch (error) {
        setError(error.message || '국내주식 거래 정보를 수정하지 못했습니다.');
    }
}

export function init() {
    const form = DOM.form();
    if (form) form.onsubmit = handleSubmit;
    loadTrade();
}

export function cleanup() {
    if (DOM.form()) DOM.form().onsubmit = null;
}
