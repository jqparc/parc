import { fetchAPI } from '/js/api.js';
import { navigateTo } from '/js/router.js';

const API_PATH = '/assets/domestic-stocks';

const DOM = {
    queryForm: () => document.getElementById('stock-trade-query-form'),
    queryDate: () => document.querySelector('#stock-trade-query-form input[name="proc_date"]'),
    saveButton: () => document.getElementById('stock-trade-save-button'),
    addButton: () => document.getElementById('stock-row-add-button'),
    deleteButton: () => document.getElementById('stock-row-delete-button'),
    copyButton: () => document.getElementById('stock-row-copy-button'),
    checkAll: () => document.getElementById('stock-row-check-all'),
    tbody: () => document.getElementById('stock-trade-edit-rows'),
    status: () => document.getElementById('stock-form-status'),
    error: () => document.getElementById('stock-form-error'),
};

let deletedTradeKeys = [];

function todayText() {
    return new Date().toISOString().slice(0, 10);
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[char]));
}

function setError(message) {
    const errorEl = DOM.error();
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = !message;
}

function setStatus(message) {
    const statusEl = DOM.status();
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.hidden = !message;
}

function setBusy(isBusy) {
    [DOM.saveButton(), DOM.addButton(), DOM.deleteButton(), DOM.copyButton()].forEach(button => {
        if (button) button.disabled = isBusy;
    });
}

function rowHTML(item = {}) {
    const procDate = item.proc_date || DOM.queryDate()?.value || todayText();
    const tradeKey = item.trade_key || '';
    const transactionCode = item.trns_code || 'B';

    return `
        <tr data-trade-key="${escapeHTML(tradeKey)}">
            <td><input type="checkbox" class="stock-row-check" aria-label="행 선택"></td>
            <td><input name="proc_date" type="date" value="${escapeHTML(procDate)}" required></td>
            <td><input name="itms_code" type="text" value="${escapeHTML(item.itms_code || '')}" placeholder="005930" required></td>
            <td>
                <select name="trns_code" required>
                    <option value="B" ${transactionCode === 'B' ? 'selected' : ''}>매수(B)</option>
                    <option value="S" ${transactionCode === 'S' ? 'selected' : ''}>매도(S)</option>
                </select>
            </td>
            <td><input name="qnty" type="number" min="1" step="1" value="${escapeHTML(item.qnty ?? '')}" required></td>
            <td><input name="prc" type="number" min="0" step="1" value="${escapeHTML(item.prc ?? '')}" required></td>
        </tr>
    `;
}

function addRows(items) {
    const tbody = DOM.tbody();
    if (!tbody) return;
    tbody.insertAdjacentHTML('beforeend', items.map(rowHTML).join(''));
}

function resetRows(items = []) {
    const tbody = DOM.tbody();
    if (!tbody) return;
    deletedTradeKeys = [];
    tbody.innerHTML = '';
    addRows(items.length ? items : [{ proc_date: DOM.queryDate()?.value || todayText() }]);
    const checkAll = DOM.checkAll();
    if (checkAll) checkAll.checked = false;
}

function selectedRows() {
    return Array.from(DOM.tbody()?.querySelectorAll('tr') || [])
        .filter(row => row.querySelector('.stock-row-check')?.checked);
}

function getRowPayload(row) {
    const procDate = row.querySelector('input[name="proc_date"]')?.value;
    const itemCode = row.querySelector('input[name="itms_code"]')?.value.trim();
    const transactionCode = row.querySelector('select[name="trns_code"]')?.value || 'B';
    const quantity = Number(row.querySelector('input[name="qnty"]')?.value);
    const price = Number(row.querySelector('input[name="prc"]')?.value);

    if (!procDate || !itemCode || !quantity || quantity < 1 || Number.isNaN(price) || price < 0) {
        throw new Error('거래일자, 종목코드, 거래구분, 수량, 거래단가를 확인해주세요.');
    }

    return {
        proc_date: procDate,
        itms_code: itemCode,
        trns_code: transactionCode,
        qnty: quantity,
        prc: price,
    };
}

async function loadTrades(event) {
    if (event) event.preventDefault();
    setError('');
    setStatus('');

    const procDate = DOM.queryDate()?.value || todayText();
    try {
        setBusy(true);
        const rows = await fetchAPI(`${API_PATH}?proc_date=${encodeURIComponent(procDate)}`);
        resetRows(Array.isArray(rows) ? rows : []);
        setStatus(`${procDate} 거래 ${Array.isArray(rows) ? rows.length : 0}건을 조회했습니다.`);
    } catch (error) {
        setError(error.message || '국내주식 거래 데이터를 조회하지 못했습니다.');
    } finally {
        setBusy(false);
    }
}

function handleAddRow() {
    setError('');
    addRows([{ proc_date: DOM.queryDate()?.value || todayText() }]);
}

function handleDeleteRows() {
    setError('');
    const rows = selectedRows();
    if (rows.length === 0) {
        setError('삭제할 행을 선택해주세요.');
        return;
    }

    rows.forEach(row => {
        const tradeKey = row.dataset.tradeKey;
        if (tradeKey) deletedTradeKeys.push(tradeKey);
        row.remove();
    });

    if (!DOM.tbody()?.querySelector('tr')) {
        addRows([{ proc_date: DOM.queryDate()?.value || todayText() }]);
    }
    const checkAll = DOM.checkAll();
    if (checkAll) checkAll.checked = false;
}

function handleCopyRows() {
    setError('');
    const rows = selectedRows();
    if (rows.length === 0) {
        setError('복사할 행을 선택해주세요.');
        return;
    }

    const copies = rows.map(row => {
        const payload = getRowPayload(row);
        return { ...payload, trade_key: '' };
    });
    addRows(copies);
}

function handleCheckAll() {
    const checked = Boolean(DOM.checkAll()?.checked);
    DOM.tbody()?.querySelectorAll('.stock-row-check').forEach(checkbox => {
        checkbox.checked = checked;
    });
}

async function handleSave() {
    setError('');
    setStatus('');

    const rows = Array.from(DOM.tbody()?.querySelectorAll('tr') || []);
    if (rows.length === 0) {
        setError('저장할 거래 행이 없습니다.');
        return;
    }

    try {
        setBusy(true);
        for (const tradeKey of deletedTradeKeys) {
            await fetchAPI(`${API_PATH}/key/${encodeURIComponent(tradeKey)}`, { method: 'DELETE' });
        }

        for (const row of rows) {
            const payload = getRowPayload(row);
            const tradeKey = row.dataset.tradeKey;
            if (tradeKey) {
                await fetchAPI(`${API_PATH}/key/${encodeURIComponent(tradeKey)}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
            } else {
                await fetchAPI(API_PATH, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
            }
        }

        setStatus('국내주식 거래를 저장했습니다.');
        navigateTo('/asset/stck');
    } catch (error) {
        setError(error.message || '국내주식 거래를 저장하지 못했습니다.');
    } finally {
        setBusy(false);
    }
}

export function init() {
    const queryDate = DOM.queryDate();
    if (queryDate && !queryDate.value) queryDate.value = todayText();

    DOM.queryForm()?.addEventListener('submit', loadTrades);
    DOM.saveButton()?.addEventListener('click', handleSave);
    DOM.addButton()?.addEventListener('click', handleAddRow);
    DOM.deleteButton()?.addEventListener('click', handleDeleteRows);
    DOM.copyButton()?.addEventListener('click', handleCopyRows);
    DOM.checkAll()?.addEventListener('change', handleCheckAll);

    resetRows([{ proc_date: queryDate?.value || todayText() }]);
}

export function cleanup() {
    DOM.queryForm()?.removeEventListener('submit', loadTrades);
    DOM.saveButton()?.removeEventListener('click', handleSave);
    DOM.addButton()?.removeEventListener('click', handleAddRow);
    DOM.deleteButton()?.removeEventListener('click', handleDeleteRows);
    DOM.copyButton()?.removeEventListener('click', handleCopyRows);
    DOM.checkAll()?.removeEventListener('change', handleCheckAll);
}
