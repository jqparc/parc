import { fetchAPI } from '/js/api.js';

const API_PATH = '/assets/business-types';
const EDITABLE_FIELDS = ['dtl_code', 'dtl_code_name'];

const DOM = {
    tbody: () => document.getElementById('setting-business-type-list'),
    summary: () => document.getElementById('setting-business-type-summary'),
    error: () => document.getElementById('setting-business-type-error'),
    saveButton: () => document.getElementById('setting-business-type-save-button'),
    addButton: () => document.getElementById('setting-business-type-add-button'),
    copyButton: () => document.getElementById('setting-business-type-copy-button'),
    deleteButton: () => document.getElementById('setting-business-type-delete-button'),
    checkAll: () => document.getElementById('setting-business-type-check-all'),
};

let businessTypes = [];
let dirty = false;
let nextRowId = 1;

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
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

function setSummary() {
    const summaryEl = DOM.summary();
    if (!summaryEl) return;
    const selectedCount = businessTypes.filter(item => item.selected).length;
    summaryEl.textContent = selectedCount > 0
        ? `조회 ${businessTypes.length.toLocaleString('ko-KR')}건 · 선택 ${selectedCount.toLocaleString('ko-KR')}건`
        : `조회 ${businessTypes.length.toLocaleString('ko-KR')}건`;
}

function setDirty(isDirty = true) {
    dirty = isDirty;
    const saveButton = DOM.saveButton();
    if (saveButton) saveButton.disabled = !dirty;
}

function updateToolbarState() {
    const selectedCount = businessTypes.filter(item => item.selected).length;
    const copyButton = DOM.copyButton();
    const deleteButton = DOM.deleteButton();
    const checkAll = DOM.checkAll();

    if (copyButton) copyButton.disabled = selectedCount === 0;
    if (deleteButton) deleteButton.disabled = selectedCount === 0;
    if (checkAll) {
        checkAll.checked = businessTypes.length > 0 && selectedCount === businessTypes.length;
        checkAll.indeterminate = selectedCount > 0 && selectedCount < businessTypes.length;
    }
    setSummary();
}

function getRow(rowId) {
    return businessTypes.find(item => item._rowId === rowId);
}

function renderEditableCell(item, field) {
    return `
        <td class="asset-setting-editable-cell" data-row-id="${item._rowId}" data-field="${field}" tabindex="0">
            ${escapeHTML(item[field] || '-')}
        </td>
    `;
}

function renderBusinessTypes() {
    const tbody = DOM.tbody();
    if (!tbody) return;

    if (businessTypes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-cell">조회된 업종이 없습니다.</td></tr>';
        updateToolbarState();
        return;
    }

    tbody.innerHTML = businessTypes.map(item => `
        <tr class="${dirty ? 'asset-setting-dirty-row' : ''}" data-row-id="${item._rowId}">
            <td>
                <input type="checkbox" class="asset-setting-row-check" data-row-id="${item._rowId}" ${item.selected ? 'checked' : ''} aria-label="행 선택">
            </td>
            ${renderEditableCell(item, 'dtl_code')}
            ${renderEditableCell(item, 'dtl_code_name')}
        </tr>
    `).join('');
    updateToolbarState();
}

function openCellEditor(cell) {
    if (cell.classList.contains('asset-setting-cell-editing')) return;

    const item = getRow(Number(cell.dataset.rowId));
    const field = cell.dataset.field;
    if (!item || !EDITABLE_FIELDS.includes(field)) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = item[field] || '';
    input.className = 'asset-setting-cell-input';

    cell.classList.add('asset-setting-cell-editing');
    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();
    input.select();

    const finish = () => {
        cell.classList.remove('asset-setting-cell-editing');
        cell.innerHTML = escapeHTML(item[field] || '-');
    };

    input.oninput = () => {
        item[field] = input.value;
        setDirty(true);
    };
    input.onkeydown = event => {
        if (event.key === 'Enter') input.blur();
        if (event.key === 'Escape') {
            input.blur();
        }
    };
    input.onblur = finish;
}

function handleTableClick(event) {
    const checkbox = event.target.closest('.asset-setting-row-check');
    if (checkbox) {
        const item = getRow(Number(checkbox.dataset.rowId));
        if (item) item.selected = checkbox.checked;
        updateToolbarState();
        return;
    }

    const cell = event.target.closest('.asset-setting-editable-cell');
    if (cell) openCellEditor(cell);
}

function handleTableKeydown(event) {
    if (event.key !== 'Enter') return;
    const cell = event.target.closest('.asset-setting-editable-cell');
    if (!cell) return;
    event.preventDefault();
    openCellEditor(cell);
}

function handleCheckAllChange(event) {
    businessTypes.forEach(item => {
        item.selected = event.target.checked;
    });
    renderBusinessTypes();
}

function handleAdd() {
    businessTypes.push({
        _rowId: nextRowId++,
        dtl_code: '',
        dtl_code_name: '',
        selected: false,
    });
    setDirty(true);
    renderBusinessTypes();
}

function handleCopy() {
    const selectedItems = businessTypes.filter(item => item.selected);
    selectedItems.forEach(item => {
        businessTypes.push({
            _rowId: nextRowId++,
            dtl_code: '',
            dtl_code_name: item.dtl_code_name,
            selected: false,
        });
    });
    if (selectedItems.length > 0) {
        setDirty(true);
        renderBusinessTypes();
    }
}

function handleDelete() {
    const beforeCount = businessTypes.length;
    businessTypes = businessTypes.filter(item => !item.selected);
    if (businessTypes.length !== beforeCount) {
        setDirty(true);
        renderBusinessTypes();
    }
}

function validateRows() {
    const seenCodes = new Set();
    for (const item of businessTypes) {
        const code = String(item.dtl_code || '').trim();
        const name = String(item.dtl_code_name || '').trim();
        if (!code || !name) return '업종코드와 업종명은 필수입니다.';
        if (seenCodes.has(code)) return `중복된 업종코드가 있습니다: ${code}`;
        seenCodes.add(code);
    }
    return '';
}

async function handleSave() {
    const validationMessage = validateRows();
    if (validationMessage) {
        setError(validationMessage);
        return;
    }

    const saveButton = DOM.saveButton();
    if (saveButton) saveButton.disabled = true;
    setError('');

    try {
        await fetchAPI(API_PATH, {
            method: 'PUT',
            body: JSON.stringify({
                codes: businessTypes.map(item => ({
                    dtl_code: String(item.dtl_code || '').trim(),
                    dtl_code_name: String(item.dtl_code_name || '').trim(),
                })),
            }),
        });
        await loadBusinessTypes();
    } catch (error) {
        setError(error.message || '업종 정보를 저장하지 못했습니다.');
        if (saveButton) saveButton.disabled = !dirty;
    }
}

async function loadBusinessTypes() {
    setError('');
    try {
        const items = await fetchAPI(API_PATH);
        businessTypes = (Array.isArray(items) ? items : []).map(item => ({
            ...item,
            _rowId: nextRowId++,
            selected: false,
        }));
        setDirty(false);
        renderBusinessTypes();
    } catch (error) {
        setError(error.message || '업종 정보를 불러오지 못했습니다.');
        businessTypes = [];
        setDirty(false);
        renderBusinessTypes();
    }
}

export function init() {
    const tbody = DOM.tbody();
    if (tbody) {
        tbody.onclick = handleTableClick;
        tbody.onkeydown = handleTableKeydown;
    }
    if (DOM.checkAll()) DOM.checkAll().onchange = handleCheckAllChange;
    if (DOM.saveButton()) DOM.saveButton().onclick = handleSave;
    if (DOM.addButton()) DOM.addButton().onclick = handleAdd;
    if (DOM.copyButton()) DOM.copyButton().onclick = handleCopy;
    if (DOM.deleteButton()) DOM.deleteButton().onclick = handleDelete;
    updateToolbarState();
    loadBusinessTypes();
}

export function cleanup() {
    const tbody = DOM.tbody();
    if (tbody) {
        tbody.onclick = null;
        tbody.onkeydown = null;
    }
    if (DOM.checkAll()) DOM.checkAll().onchange = null;
    if (DOM.saveButton()) DOM.saveButton().onclick = null;
    if (DOM.addButton()) DOM.addButton().onclick = null;
    if (DOM.copyButton()) DOM.copyButton().onclick = null;
    if (DOM.deleteButton()) DOM.deleteButton().onclick = null;
}
