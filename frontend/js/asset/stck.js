// frontend/js/assets/domestic-stocks.js
import { fetchAPI } from '/js/api.js';

const API_PATH = '/assets/domestic-stocks';

// --- 💡 [DOM 캐싱] 문서 전체 탐색 최소화 ---
const DOM = {
    form: () => document.getElementById('stock-form'),
    dateInput: () => document.querySelector('#stock-form input[name="purchase_date"]'),
    error: () => document.getElementById('stock-form-error'),
    summary: () => document.getElementById('stock-summary'),
    tbody: () => document.getElementById('stock-list')
};

// --- 💡 [포맷팅 유틸리티] ---
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

function getProfitClass(value) {
    const numberValue = Number(value);
    if (numberValue > 0) return 'stock-profit-plus';
    if (numberValue < 0) return 'stock-profit-minus';
    return '';
}

// --- 💡 [UI 헬퍼] ---
function setError(message) {
    const errorEl = DOM.error();
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = !message;
}

function getPayload(form) {
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    payload.stock_code = payload.stock_code.trim();
    payload.stock_name = payload.stock_name.trim();
    payload.quantity = Number(payload.quantity);
    payload.purchase_price = Number(payload.purchase_price);
    payload.current_price = payload.current_price ? Number(payload.current_price) : null;
    payload.memo = payload.memo?.trim() || null;

    return payload;
}

// --- 💡 [데이터 렌더링 로직] ---
function renderSummary(holdings) {
    const summaryEl = DOM.summary();
    if (!summaryEl) return;

    const invested = holdings.reduce((sum, item) => sum + Number(item.invested_amount || 0), 0);
    const valuation = holdings.reduce((sum, item) => sum + Number(item.valuation_amount || 0), 0);
    const hasValuation = holdings.some(item => item.valuation_amount !== null && item.valuation_amount !== undefined);
    const profit = hasValuation ? valuation - invested : null;

    summaryEl.innerHTML = `
        <span>종목 ${holdings.length}개</span>
        <span>투자 ${formatWon(invested)}</span>
        <span>평가 ${hasValuation ? formatWon(valuation) : '-'}</span>
        <span class="${getProfitClass(profit)}">손익 ${profit === null ? '-' : formatWon(profit)}</span>
    `;
}

function renderHoldings(holdings) {
    const tbody = DOM.tbody();
    if (!tbody) return;

    renderSummary(holdings);

    if (holdings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="empty-cell">추가된 국내주식이 없습니다.</td></tr>';
        return;
    }

    // 🔥 더 이상 여기서 버튼마다 이벤트를 달지 않습니다! 순수하게 HTML 문자열만 생성합니다.
    tbody.innerHTML = holdings.map(item => {
        const profitText = item.profit_loss === null || item.profit_loss === undefined
            ? '-'
            : `${formatWon(item.profit_loss)} (${formatNumber(item.profit_rate, 2)}%)`;

        return `
            <tr>
                <td class="stock-name-cell">
                    <strong>${item.stock_name}</strong>
                    <small>${item.stock_code}</small>
                </td>
                <td>${item.market || '-'}</td>
                <td>${formatNumber(item.quantity)}</td>
                <td>${formatWon(item.purchase_price)}</td>
                <td>${item.purchase_date || '-'}</td>
                <td>${formatWon(item.invested_amount)}</td>
                <td>${formatWon(item.current_price)}</td>
                <td>${formatWon(item.valuation_amount)}</td>
                <td class="${getProfitClass(item.profit_loss)}">${profitText}</td>
                <td class="stock-memo-cell">${item.memo || '-'}</td>
                <td>
                    <button type="button" class="stock-delete-btn" data-id="${item.id}">삭제</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function loadHoldings() {
    try {
        const holdings = await fetchAPI(API_PATH);
        renderHoldings(Array.isArray(holdings) ? holdings : []);
    } catch (error) {
        console.error('Failed to load domestic stock holdings:', error);
        const tbody = DOM.tbody();
        if (tbody) tbody.innerHTML = '<tr><td colspan="11" class="empty-cell">보유 종목을 불러오지 못했습니다.</td></tr>';
    }
}

// --- 💡 [이벤트 핸들러] 폼 제출 및 테이블 클릭 위임 ---
async function handleFormSubmit(event) {
    event.preventDefault();
    setError('');

    const form = DOM.form();
    try {
        await fetchAPI(API_PATH, {
            method: 'POST',
            body: JSON.stringify(getPayload(form)),
        });
        
        form.reset(); // 입력 폼 초기화
        const dateInput = DOM.dateInput();
        if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
        
        await loadHoldings(); // 목록 새로고침
    } catch (error) {
        setError(error.message || '국내주식을 추가하지 못했습니다.');
    }
}

async function handleTableClick(event) {
    // 🔥 핵심: 이벤트 위임(Event Delegation)
    // tbody 전체에서 발생하는 클릭 중, 삭제 버튼에서 발생한 클릭만 낚아챕니다.
    const deleteBtn = event.target.closest('.stock-delete-btn');
    if (!deleteBtn) return;

    if (!confirm('이 보유 종목을 삭제할까요?')) return;
    
    try {
        await fetchAPI(`${API_PATH}/${deleteBtn.dataset.id}`, { method: 'DELETE' });
        await loadHoldings();
    } catch (error) {
        alert(error.message || '삭제에 실패했습니다.');
    }
}

// --- 💡 [메인 로직] 초기화 및 클린업 ---
export function init() {
    const form = DOM.form();
    const tbody = DOM.tbody();
    const dateInput = DOM.dateInput();

    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().slice(0, 10);
    }

    // SPA 환경 최적화: 중복 등록 방지를 위해 onclick/onsubmit 활용
    if (form) form.onsubmit = handleFormSubmit;
    if (tbody) tbody.onclick = handleTableClick;

    loadHoldings();
}

export function cleanup() {
    // 메모리 누수 방지: 화면 이탈 시 이벤트 핸들러 제거
    if (DOM.form()) DOM.form().onsubmit = null;
    if (DOM.tbody()) DOM.tbody().onclick = null;
}