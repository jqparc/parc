import { fetchAPI } from '/js/api.js';

const API_PATH = '/assets/domestic-stocks';

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

function setError(message) {
    const errorEl = document.getElementById('stock-form-error');
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

async function loadHoldings() {
    const holdings = await fetchAPI(API_PATH);
    renderHoldings(Array.isArray(holdings) ? holdings : []);
}

function renderSummary(holdings) {
    const summaryEl = document.getElementById('stock-summary');
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
    const tbody = document.getElementById('stock-list');
    if (!tbody) return;

    renderSummary(holdings);

    if (holdings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="empty-cell">추가된 국내주식이 없습니다.</td></tr>';
        return;
    }

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
                <td>${item.market}</td>
                <td>${formatNumber(item.quantity)}</td>
                <td>${formatWon(item.purchase_price)}</td>
                <td>${item.purchase_date}</td>
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

    tbody.querySelectorAll('.stock-delete-btn').forEach(button => {
        button.addEventListener('click', async () => {
            if (!confirm('이 보유 종목을 삭제할까요?')) return;
            await fetchAPI(`${API_PATH}/${button.dataset.id}`, { method: 'DELETE' });
            await loadHoldings();
        });
    });
}

export function init() {
    const form = document.getElementById('stock-form');
    if (form) {
        const dateInput = form.querySelector('input[name="purchase_date"]');
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().slice(0, 10);
        }

        form.addEventListener('submit', async event => {
            event.preventDefault();
            setError('');

            try {
                await fetchAPI(API_PATH, {
                    method: 'POST',
                    body: JSON.stringify(getPayload(form)),
                });
                form.reset();
                if (dateInput) {
                    dateInput.value = new Date().toISOString().slice(0, 10);
                }
                await loadHoldings();
            } catch (error) {
                setError(error.message || '국내주식을 추가하지 못했습니다.');
            }
        });
    }

    loadHoldings().catch(error => {
        console.error('Failed to load domestic stock holdings:', error);
        const tbody = document.getElementById('stock-list');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="11" class="empty-cell">보유 종목을 불러오지 못했습니다.</td></tr>';
        }
    });
}
