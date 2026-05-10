import { fetchAPI } from '/js/api.js';

const MASTER_PATH = '/assets/stock-masters/item';
const TRADE_PATH = '/assets/domestic-stocks/item';

const DOM = {
    title: () => document.getElementById('stock-item-detail-title'),
    summary: () => document.getElementById('stock-item-detail-summary'),
    form: () => document.getElementById('stock-item-search-form'),
    fromDate: () => document.querySelector('#stock-item-search-form input[name="from_date"]'),
    toDate: () => document.querySelector('#stock-item-search-form input[name="to_date"]'),
    error: () => document.getElementById('stock-item-detail-error'),
    holdingBody: () => document.getElementById('stock-holding-history'),
    tradeBody: () => document.getElementById('stock-trade-history'),
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

function formatTradeType(value) {
    if (value === 'B') return '매수';
    if (value === 'S') return '매도';
    return '-';
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

function getItemCode() {
    const parts = window.location.pathname.split('/');
    return decodeURIComponent(parts.at(-1) || '');
}

function setError(message) {
    const errorEl = DOM.error();
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = !message;
}

function getDateQuery() {
    const fromDate = DOM.fromDate()?.value;
    const toDate = DOM.toDate()?.value;
    return `?from_date=${encodeURIComponent(fromDate)}&to_date=${encodeURIComponent(toDate)}`;
}

function renderSummary(itemCode, holdings, trades) {
    const title = DOM.title();
    const summary = DOM.summary();
    const first = holdings[0] || trades[0];

    if (title) title.textContent = first?.itms_name || itemCode || '국내주식 종목 상세';
    if (!summary) return;

    summary.innerHTML = `
        <span>${escapeHTML(itemCode || '-')}</span>
        <span>보유 ${holdings.length}건</span>
        <span>매매 ${trades.length}건</span>
    `;
}

function renderHoldings(holdings) {
    const tbody = DOM.holdingBody();
    if (!tbody) return;

    if (holdings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" class="empty-cell">조회된 보유 데이터가 없습니다.</td></tr>';
        return;
    }

    tbody.innerHTML = holdings.map(item => `
        <tr>
            <td>${escapeHTML(item.proc_date_text || item.proc_date || '-')}</td>
            <td>${formatNumber(item.prdy_stcn)}주</td>
            <td>${formatNumber(item.incr_stcn)}주</td>
            <td>${formatNumber(item.dcrs_stcn)}주</td>
            <td>${formatNumber(item.holding_quantity)}주</td>
            <td>${formatWon(item.prdy_acqs_amt)}</td>
            <td>${formatWon(item.incr_acqs_amt)}</td>
            <td>${formatWon(item.dcrs_acqs_amt)}</td>
            <td>${formatWon(item.acquisition_amount)}</td>
            <td>${formatWon(item.valuation_amount)}</td>
            <td class="${getProfitClass(item.profit_loss_amount)}">${formatWon(item.profit_loss_amount)}</td>
            <td class="${getProfitClass(item.slby_prls_amt)}">${formatWon(item.slby_prls_amt)}</td>
        </tr>
    `).join('');
}

function renderTrades(trades) {
    const tbody = DOM.tradeBody();
    if (!tbody) return;

    if (trades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">조회된 매매 데이터가 없습니다.</td></tr>';
        return;
    }

    tbody.innerHTML = trades.map(item => `
        <tr>
            <td>${escapeHTML(item.proc_date || '-')}</td>
            <td>${item.seq || '-'}</td>
            <td>${formatTradeType(item.trns_code)}</td>
            <td>${formatNumber(item.qnty)}주</td>
            <td>${formatWon(item.prc)}</td>
            <td>${formatWon(item.invested_amount)}</td>
        </tr>
    `).join('');
}

async function loadDetail() {
    const itemCode = getItemCode();
    const query = getDateQuery();

    setError('');
    try {
        const [holdings, trades] = await Promise.all([
            fetchAPI(`${MASTER_PATH}/${encodeURIComponent(itemCode)}${query}`),
            fetchAPI(`${TRADE_PATH}/${encodeURIComponent(itemCode)}${query}`),
        ]);
        const holdingRows = Array.isArray(holdings) ? holdings : [];
        const tradeRows = Array.isArray(trades) ? trades : [];
        renderSummary(itemCode, holdingRows, tradeRows);
        renderHoldings(holdingRows);
        renderTrades(tradeRows);
    } catch (error) {
        setError(error.message || '국내주식 종목 상세 데이터를 불러오지 못했습니다.');
    }
}

function handleSearch(event) {
    event.preventDefault();
    loadDetail();
}

export function init() {
    const today = new Date().toISOString().slice(0, 10);
    const fromDate = DOM.fromDate();
    const toDate = DOM.toDate();
    const form = DOM.form();

    if (fromDate && !fromDate.value) fromDate.value = today;
    if (toDate && !toDate.value) toDate.value = today;
    if (form) form.onsubmit = handleSearch;

    loadDetail();
}

export function cleanup() {
    const form = DOM.form();
    if (form) form.onsubmit = null;
}
