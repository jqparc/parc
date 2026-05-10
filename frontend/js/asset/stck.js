import { fetchAPI } from '/js/api.js';

const MASTER_PATH = '/assets/stock-masters';
const MASTER_GENERATE_PATH = '/assets/stock-masters/generate';
const ITEM_GENERATE_PATH = '/assets/stock-items/generate';

const DOM = {
    summary: () => document.getElementById('stock-summary'),
    tbody: () => document.getElementById('stock-list'),
    generateForm: () => document.getElementById('stock-data-generate-form'),
    generateStatus: () => document.getElementById('stock-generate-status'),
    generateDate: () => document.querySelector('#stock-data-generate-form input[name="proc_date"]'),
    itemGenerateButton: () => document.getElementById('stock-item-generate-button'),
};

function formatNumber(value, fractionDigits = 0) {
    if (value === null || value === undefined || value === '') return '-';
    return Number(value).toLocaleString('ko-KR', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    });
}

function formatWon(value) {
    if (value === null || value === undefined || value === '') return '-';
    return `${formatNumber(value)}원`;
}

function formatPercent(value) {
    if (value === null || value === undefined || value === '') return '-';
    return `${formatNumber(value, 2)}%`;
}

function getProfitClass(value) {
    const numberValue = Number(value);
    if (numberValue > 0) return 'stock-profit-plus';
    if (numberValue < 0) return 'stock-profit-minus';
    return '';
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[char]));
}

function setGenerateStatus(message, isError = false) {
    const status = DOM.generateStatus();
    if (!status) return;
    status.textContent = message;
    status.hidden = !message;
    status.classList.toggle('stock-error', Boolean(isError));
}

function getSelectedDate() {
    const dateInput = DOM.generateDate();
    return dateInput?.value || new Date().toISOString().slice(0, 10);
}

function setGenerateButtonsDisabled(disabled) {
    const itemButton = DOM.itemGenerateButton();
    const submitButton = DOM.generateForm()?.querySelector('button[type="submit"]');
    if (itemButton) itemButton.disabled = disabled;
    if (submitButton) submitButton.disabled = disabled;
}

function renderSummary(holdings) {
    const summaryEl = DOM.summary();
    if (!summaryEl) return;

    const valuation = holdings.reduce((sum, item) => sum + Number(item.valuation_amount || 0), 0);
    const profitLoss = holdings.reduce((sum, item) => sum + Number(item.profit_loss_amount || 0), 0);
    const procDate = holdings[0]?.proc_date_text || '-';

    summaryEl.innerHTML = `
        <span>기준일 ${procDate}</span>
        <span>종목 ${holdings.length}개</span>
        <span>평가액 ${formatWon(valuation)}</span>
        <span class="${getProfitClass(profitLoss)}">평가손익 ${formatWon(profitLoss)}</span>
    `;
}

function renderHoldings(holdings) {
    const tbody = DOM.tbody();
    if (!tbody) return;

    renderSummary(holdings);

    if (holdings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-cell">생성된 국내주식 보유 데이터가 없습니다.</td></tr>';
        return;
    }

    tbody.innerHTML = holdings.map(item => `
        <tr class="stock-row">
            <td>${escapeHTML(item.proc_date_text || '-')}</td>
            <td class="stock-name-cell">
                <a href="/asset/stck/item/${encodeURIComponent(item.itms_code)}" class="stock-item-link" data-link>
                    <strong>${escapeHTML(item.itms_name || item.itms_code || '-')}</strong>
                    <small>${escapeHTML(item.itms_code || '-')}</small>
                </a>
            </td>
            <td>${formatNumber(item.holding_quantity)}주</td>
            <td>${formatWon(item.acquisition_amount)}</td>
            <td>${formatWon(item.valuation_amount)}</td>
            <td class="${getProfitClass(item.profit_loss_amount)}">${formatWon(item.profit_loss_amount)}</td>
            <td>${formatPercent(item.profit_rate)}</td>
        </tr>
    `).join('');
}

async function handleItemGenerateClick() {
    setGenerateStatus('');
    const procDate = getSelectedDate();

    try {
        setGenerateButtonsDisabled(true);
        const generated = await fetchAPI(ITEM_GENERATE_PATH, {
            method: 'POST',
            body: JSON.stringify({ proc_date: procDate }),
        });
        const count = Array.isArray(generated) ? generated.length : 0;
        setGenerateStatus(`${procDate} 종목데이터 ${count}건을 생성했습니다.`);
    } catch (error) {
        setGenerateStatus(error.message || '종목데이터를 생성하지 못했습니다.', true);
    } finally {
        setGenerateButtonsDisabled(false);
    }
}

async function handleMasterGenerateSubmit(event) {
    event.preventDefault();
    setGenerateStatus('');
    const procDate = getSelectedDate();

    try {
        setGenerateButtonsDisabled(true);
        const generated = await fetchAPI(MASTER_GENERATE_PATH, {
            method: 'POST',
            body: JSON.stringify({ proc_date: procDate }),
        });
        const count = Array.isArray(generated) ? generated.length : 0;
        setGenerateStatus(`${procDate} 보유데이터 ${count}건을 생성했습니다.`);
        await loadHoldings(procDate);
    } catch (error) {
        setGenerateStatus(error.message || '보유데이터를 생성하지 못했습니다.', true);
    } finally {
        setGenerateButtonsDisabled(false);
    }
}

async function loadHoldings(procDate = '') {
    const query = procDate ? `?proc_date=${encodeURIComponent(procDate)}` : '';
    try {
        const holdings = await fetchAPI(`${MASTER_PATH}${query}`);
        renderHoldings(Array.isArray(holdings) ? holdings : []);
    } catch (error) {
        console.error('Failed to load domestic stock holdings:', error);
        const tbody = DOM.tbody();
        if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="empty-cell">국내주식 보유 데이터를 불러오지 못했습니다.</td></tr>';
    }
}

export function init() {
    const form = DOM.generateForm();
    const dateInput = DOM.generateDate();
    const itemButton = DOM.itemGenerateButton();

    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().slice(0, 10);
    }

    if (form) form.onsubmit = handleMasterGenerateSubmit;
    if (itemButton) itemButton.onclick = handleItemGenerateClick;
    loadHoldings();
}

export function cleanup() {
    const form = DOM.generateForm();
    const itemButton = DOM.itemGenerateButton();
    if (form) form.onsubmit = null;
    if (itemButton) itemButton.onclick = null;
}
