import { fetchAPI } from '/js/api.js';

const API_PATH = '/asset/stock-item/search';
const ITEM_PATH = '/asset/stock-item/key';
const EDITABLE_FIELDS = ['proc_date', 'itms_code', 'itms_name', 'shtg_code', 'bzty_code', 'clpr'];

const DOM = {
    form: () => document.getElementById('setting-stock-item-search-form'),
    tbody: () => document.getElementById('setting-stock-item-list'),
    summary: () => document.getElementById('setting-stock-item-summary'),
    error: () => document.getElementById('setting-stock-item-error'),
    saveButton: () => document.getElementById('setting-stock-item-save-button'),
};

let stockItems = [];
let originalItems = new Map();
let dirtyKeys = new Set();

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[char]));
}

function formatNumber(value, fractionDigits = 0) {
    if (value === null || value === undefined || value === '') return '-';
    return Number(value).toLocaleString('ko-KR', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    });
}

function formatCellValue(item, field) {
    if (field === 'clpr') return formatNumber(item[field], 2);
    return escapeHTML(item[field] || '-');
}

function formatDateTime(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function setError(message) {
    const errorEl = DOM.error();
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = !message;
}

function setSummary(items) {
    const summaryEl = DOM.summary();
    if (!summaryEl) return;
    const dirtyCount = dirtyKeys.size;
    summaryEl.textContent = dirtyCount > 0
        ? `조회 ${items.length.toLocaleString('ko-KR')}건 · 수정 ${dirtyCount.toLocaleString('ko-KR')}건`
        : `조회 ${items.length.toLocaleString('ko-KR')}건`;
}

function normalizeComparableValue(field, value) {
    if (value === null || value === undefined) return '';
    if (field === 'clpr') {
        if (value === '') return '';
        const numberValue = Number(value);
        return Number.isNaN(numberValue) ? String(value) : numberValue.toFixed(2);
    }
    return String(value).trim();
}

function isItemDirty(item) {
    const original = originalItems.get(item._originalKey);
    if (!original) return false;

    return EDITABLE_FIELDS.some(field => (
        normalizeComparableValue(field, item[field]) !== normalizeComparableValue(field, original[field])
    ));
}

function updateDirtyState(item) {
    if (isItemDirty(item)) {
        dirtyKeys.add(item._originalKey);
    } else {
        dirtyKeys.delete(item._originalKey);
    }

    const saveButton = DOM.saveButton();
    if (saveButton) saveButton.disabled = dirtyKeys.size === 0;
    setSummary(stockItems);
}

function getItemByOriginalKey(originalKey) {
    return stockItems.find(item => item._originalKey === originalKey);
}

function getInputType(field) {
    if (field === 'proc_date') return 'date';
    if (field === 'clpr') return 'number';
    return 'text';
}

function renderEditableCell(item, field) {
    return `
        <td class="asset-setting-editable-cell" data-key="${escapeHTML(item._originalKey)}" data-field="${field}" tabindex="0">
            ${formatCellValue(item, field)}
        </td>
    `;
}

function renderItems(items) {
    const tbody = DOM.tbody();
    if (!tbody) return;

    setSummary(items);

    if (items.length === 0) {
        dirtyKeys.clear();
        updateDirtyState({ _originalKey: '' });
        tbody.innerHTML = '<tr><td colspan="10" class="empty-cell">조회된 종목이 없습니다.</td></tr>';
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr class="${dirtyKeys.has(item._originalKey) ? 'asset-setting-dirty-row' : ''}" data-key="${escapeHTML(item._originalKey)}">
            ${renderEditableCell(item, 'proc_date')}
            ${renderEditableCell(item, 'itms_code')}
            ${renderEditableCell(item, 'itms_name')}
            ${renderEditableCell(item, 'shtg_code')}
            <td>${escapeHTML(item.shtg_name || '-')}</td>
            ${renderEditableCell(item, 'bzty_code')}
            <td>${escapeHTML(item.bzty_name || '-')}</td>
            ${renderEditableCell(item, 'clpr')}
            <td>${formatDateTime(item.created_at)}</td>
            <td>${formatDateTime(item.updated_at)}</td>
        </tr>
    `).join('');
}

function buildQuery() {
    const form = DOM.form();
    const params = new URLSearchParams();
    if (!form) return '';

    const formData = new FormData(form);
    const fromDate = String(formData.get('from_date') || '').trim();
    const toDate = String(formData.get('to_date') || '').trim();
    const itemCode = String(formData.get('itms_code') || '').trim();

    if (fromDate) params.set('from_date', fromDate);
    if (toDate) params.set('to_date', toDate);
    if (itemCode && itemCode !== '전체') params.set('itms_code', itemCode);

    const query = params.toString();
    return query ? `?${query}` : '';
}

async function loadItems() {
    setError('');
    try {
        const items = await fetchAPI(`${API_PATH}${buildQuery()}`);
        stockItems = (Array.isArray(items) ? items : []).map(item => ({
            ...item,
            _originalKey: item.item_key,
        }));
        originalItems = new Map(stockItems.map(item => [item._originalKey, { ...item }]));
        dirtyKeys.clear();
        renderItems(stockItems);
        const saveButton = DOM.saveButton();
        if (saveButton) saveButton.disabled = true;
    } catch (error) {
        setError(error.message || '종목 정보를 불러오지 못했습니다.');
        stockItems = [];
        originalItems = new Map();
        dirtyKeys.clear();
        renderItems([]);
    }
}

function handleSubmit(event) {
    event.preventDefault();
    loadItems();
}

function finishCellEdit(cell, item, field) {
    cell.classList.remove('asset-setting-cell-editing');
    cell.innerHTML = formatCellValue(item, field);
    cell.closest('tr')?.classList.toggle('asset-setting-dirty-row', dirtyKeys.has(item._originalKey));
}

function openCellEditor(cell) {
    if (cell.classList.contains('asset-setting-cell-editing')) return;

    const item = getItemByOriginalKey(cell.dataset.key);
    const field = cell.dataset.field;
    if (!item || !EDITABLE_FIELDS.includes(field)) return;

    const input = document.createElement('input');
    input.type = getInputType(field);
    input.value = item[field] ?? '';
    input.className = 'asset-setting-cell-input';
    if (field === 'clpr') {
        input.step = '0.01';
        input.min = '0';
    }

    cell.classList.add('asset-setting-cell-editing');
    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();
    input.select();

    input.oninput = () => {
        item[field] = input.value;
        updateDirtyState(item);
        cell.closest('tr')?.classList.toggle('asset-setting-dirty-row', dirtyKeys.has(item._originalKey));
    };
    input.onkeydown = event => {
        if (event.key === 'Enter') input.blur();
        if (event.key === 'Escape') {
            const original = originalItems.get(item._originalKey);
            item[field] = original?.[field] ?? '';
            updateDirtyState(item);
            finishCellEdit(cell, item, field);
        }
    };
    input.onblur = () => finishCellEdit(cell, item, field);
}

function handleTableClick(event) {
    const cell = event.target.closest('.asset-setting-editable-cell');
    if (!cell) return;
    openCellEditor(cell);
}

function handleTableKeydown(event) {
    if (event.key !== 'Enter') return;
    const cell = event.target.closest('.asset-setting-editable-cell');
    if (!cell) return;
    event.preventDefault();
    openCellEditor(cell);
}

function buildSavePayload(item) {
    return {
        proc_date: String(item.proc_date || '').trim(),
        itms_code: String(item.itms_code || '').trim(),
        itms_name: String(item.itms_name || '').trim(),
        shtg_code: String(item.shtg_code || '').trim(),
        bzty_code: String(item.bzty_code || '').trim() || null,
        clpr: item.clpr === null || item.clpr === undefined || item.clpr === '' ? null : Number(item.clpr),
    };
}

function validatePayload(payload) {
    if (!payload.proc_date || !payload.itms_code || !payload.itms_name || !payload.shtg_code) {
        return '일자, 종목코드, 종목명, 시장구분은 필수입니다.';
    }
    if (payload.clpr !== null && Number.isNaN(payload.clpr)) {
        return '종가는 숫자로 입력해 주세요.';
    }
    return '';
}

async function handleSave() {
    const saveButton = DOM.saveButton();
    const changedItems = stockItems.filter(item => dirtyKeys.has(item._originalKey));
    if (changedItems.length === 0) return;

    setError('');
    if (saveButton) saveButton.disabled = true;

    try {
        for (const item of changedItems) {
            const payload = buildSavePayload(item);
            const validationMessage = validatePayload(payload);
            if (validationMessage) throw new Error(validationMessage);

            await fetchAPI(`${ITEM_PATH}/${encodeURIComponent(item._originalKey)}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
        }
        await loadItems();
    } catch (error) {
        setError(error.message || '종목 정보를 저장하지 못했습니다.');
        if (saveButton) saveButton.disabled = dirtyKeys.size === 0;
    }
}

export function init() {
    const form = DOM.form();
    const tbody = DOM.tbody();
    const saveButton = DOM.saveButton();
    if (form) form.onsubmit = handleSubmit;
    if (tbody) {
        tbody.onclick = handleTableClick;
        tbody.onkeydown = handleTableKeydown;
    }
    if (saveButton) saveButton.onclick = handleSave;
    loadItems();
}

export function cleanup() {
    const form = DOM.form();
    const tbody = DOM.tbody();
    const saveButton = DOM.saveButton();
    if (form) form.onsubmit = null;
    if (tbody) {
        tbody.onclick = null;
        tbody.onkeydown = null;
    }
    if (saveButton) saveButton.onclick = null;
}
