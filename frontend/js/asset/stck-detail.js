import { fetchAPI } from '/js/api.js';

const API_PATH = '/assets/domestic-stocks';

const DOM = {
    title: () => document.getElementById('stock-detail-title'),
    summary: () => document.getElementById('stock-detail-summary'),
    detail: () => document.getElementById('stock-detail'),
    error: () => document.getElementById('stock-detail-error'),
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

function formatMarket(value) {
    if (value === 'A') return 'KOSPI';
    if (value === 'B') return 'KOSDAQ';
    if (value === 'C') return 'KONEX';
    return '-';
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

function setError(message) {
    const errorEl = DOM.error();
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = !message;
}

function getTradeKey() {
    return window.location.pathname.split('/').pop();
}

function renderSummary(lots) {
    const summary = DOM.summary();
    if (!summary) return;

    const buyQuantity = lots
        .filter(item => item.trns_code === 'B')
        .reduce((sum, item) => sum + Number(item.qnty || 0), 0);
    const sellQuantity = lots
        .filter(item => item.trns_code === 'S')
        .reduce((sum, item) => sum + Number(item.qnty || 0), 0);
    const totalAmount = lots.reduce((sum, item) => sum + Number(item.invested_amount || 0), 0);
    const first = lots[0];

    summary.innerHTML = `
        <span>${escapeHTML(first?.itms_code || '-')}</span>
        <span>${formatMarket(first?.shtg_code)}</span>
        <span>거래 ${lots.length}건</span>
        <span>매수 ${formatNumber(buyQuantity)}주</span>
        <span>매도 ${formatNumber(sellQuantity)}주</span>
        <span>거래금액 ${formatWon(totalAmount)}</span>
    `;
}

function renderDetail(lots) {
    const title = DOM.title();
    const detail = DOM.detail();

    if (!detail) return;

    if (lots.length === 0) {
        if (title) title.textContent = '국내주식 거래 상세';
        detail.innerHTML = '<p class="stock-error">거래 기록이 없습니다.</p>';
        renderSummary([]);
        return;
    }

    const first = lots[0];
    if (title) title.textContent = first.itms_name || first.itms_code || '국내주식 거래 상세';
    renderSummary(lots);

    detail.innerHTML = `
        <div class="stock-table-wrap">
            <table class="common-table stock-table stock-lot-table">
                <thead>
                    <tr>
                        <th>거래일자</th>
                        <th>순번</th>
                        <th>종목코드</th>
                        <th>종목명</th>
                        <th>시장</th>
                        <th>업종</th>
                        <th>구분</th>
                        <th>수량</th>
                        <th>단가</th>
                        <th>거래금액</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody>
                    ${lots.map(item => `
                        <tr>
                            <td>${item.proc_date || '-'}</td>
                            <td>${item.seq || '-'}</td>
                            <td>${escapeHTML(item.itms_code || '-')}</td>
                            <td class="stock-name-cell"><strong>${escapeHTML(item.itms_name || item.itms_code || '-')}</strong></td>
                            <td>${formatMarket(item.shtg_code)}(${escapeHTML(item.shtg_code || '-')})</td>
                            <td>${escapeHTML(item.bzty_code || '-')}</td>
                            <td>${formatTradeType(item.trns_code)}</td>
                            <td>${formatNumber(item.qnty)}주</td>
                            <td>${formatWon(item.prc)}</td>
                            <td>${formatWon(item.invested_amount)}</td>
                            <td>
                                <div class="stock-row-actions">
                                    <a href="/asset/stck/${encodeURIComponent(item.trade_key)}/edit" class="stock-back-link" data-link>수정</a>
                                    <button type="button" class="stock-danger-button stock-delete-button" data-key="${escapeHTML(item.trade_key)}">삭제</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function handleDelete(event) {
    const button = event.target.closest('.stock-delete-button');
    if (!button) return;

    if (!confirm('이 거래 기록을 삭제할까요?')) return;

    try {
        await fetchAPI(`${API_PATH}/key/${encodeURIComponent(button.dataset.key)}`, { method: 'DELETE' });
        await loadDetail();
    } catch (error) {
        setError(error.message || '거래 기록을 삭제하지 못했습니다.');
    }
}

async function loadDetail() {
    const tradeKey = getTradeKey();
    try {
        const lots = await fetchAPI(`${API_PATH}/key/${encodeURIComponent(tradeKey)}/lots`);
        renderDetail(Array.isArray(lots) ? lots : []);
    } catch (error) {
        setError(error.message || '국내주식 상세 정보를 불러오지 못했습니다.');
    }
}

export function init() {
    setError('');
    const detail = DOM.detail();
    if (detail) detail.onclick = handleDelete;
    loadDetail();
}

export function cleanup() {
    const detail = DOM.detail();
    if (detail) detail.onclick = null;
}
