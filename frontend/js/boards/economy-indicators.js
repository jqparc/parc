// frontend/js/boards/economy-indicators.js
import { fetchEconomySummaries, fetchEconomyHistory } from '/js/api/economy.js';
import Chart from 'https://cdn.jsdelivr.net/npm/chart.js/auto/+esm';

const INDICATORS_CONFIG = {
    "^GSPC": { name: "S&P 500", unit: "pt" },
    "^IXIC": { name: "NASDAQ", unit: "pt" },
    "^DJI": { name: "Dow Jones", unit: "pt" },
    "^VIX": { name: "VIX", unit: "pt" },
    "^KS11": { name: "KOSPI", unit: "pt" },
    "^KQ11": { name: "KOSDAQ", unit: "pt" },
    "KRW=X": { name: "USD/KRW", unit: "KRW" },
    "DX-Y.NYB": { name: "Dollar Index", unit: "pt" },
    "EURUSD=X": { name: "EUR/USD", unit: "USD" },
    "JPY=X": { name: "USD/JPY", unit: "JPY" },
    "^TNX": { name: "US 10Y Yield", unit: "%" },
    "^IRX": { name: "US 3M Yield", unit: "%" },
    "GC=F": { name: "Gold", unit: "USD" },
    "CL=F": { name: "WTI Oil", unit: "USD" },
    "SI=F": { name: "Silver", unit: "USD" }
};

let chartInstances = [];
// 🔥 메모리 누수 방지용 플래그: 화면이 살아있는지 확인
let isComponentActive = false; 

const DOM = {
    summaryContainer: () => document.getElementById('indicators-container'),
    chartsContainer: () => document.getElementById('charts-container')
};

function destroyCharts() {
    chartInstances.forEach(chart => chart.destroy());
    chartInstances = [];
}

function formatValue(value) {
    return value === null || value === undefined ? '-' : Number(value).toLocaleString();
}

function renderSummaryTable(container, summaries) {
    container.innerHTML = `
        <table class="common-table">
            <thead>
                <tr>
                    <th>지표명</th>
                    <th>현재가</th>
                    <th>전일가</th>
                    <th>등락</th>
                </tr>
            </thead>
            <tbody>
                ${summaries.map(item => {
                    const change = Number(item.change || 0);
                    const color = change > 0 ? '#e74c3c' : change < 0 ? '#2980b9' : '#7f8c8d';
                    const sign = change > 0 ? '+' : change < 0 ? '-' : '';
                    const changeRate = item.change_rate === null || item.change_rate === undefined
                        ? '0.00'
                        : Number(item.change_rate).toFixed(2);

                    return `
                        <tr>
                            <td style="text-align:left;">
                                ${item.name || '-'}
                                <small>${item.symbol || ''} / ${item.unit || ''}</small>
                            </td>
                            <td>
                                ${formatValue(item.current_value)}
                                <small>${item.current_date || ''}</small>
                            </td>
                            <td>
                                ${formatValue(item.previous_value)}
                                <small>${item.previous_date || ''}</small>
                            </td>
                            <td style="color:${color};">
                                ${sign} ${formatValue(Math.abs(change))}
                                <small style="color:${color};">(${changeRate}%)</small>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function renderSingleChart(wrapper, history, symbol) {
    const config = INDICATORS_CONFIG[symbol];
    if (!config) return;

    // 미리 만들어둔 박스 안에 차트 캔버스 삽입
    wrapper.innerHTML = `<h3>${config.name} (${config.unit})</h3><canvas></canvas>`;

    const chart = new Chart(wrapper.querySelector('canvas').getContext('2d'), {
        type: 'line',
        data: {
            labels: history.map(item => item.date),
            datasets: [{
                label: config.name,
                data: history.map(item => item.value),
                borderColor: '#3498db',
                fill: false,
                tension: 0.1,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    ticks: { font: { size: 9 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }
                },
                y: {
                    afterFit(axis) { axis.width = 45; },
                    ticks: {
                        font: { size: 9 },
                        callback(value) { return Number(value).toLocaleString(); }
                    }
                }
            }
        }
    });

    chartInstances.push(chart);
}

// 🔥 병렬 차트 렌더링 로직
async function loadAndRenderCharts() {
    const gridContainer = DOM.chartsContainer();
    if (!gridContainer) return;

    destroyCharts();
    gridContainer.innerHTML = '';

    // 1. INDICATORS_CONFIG에 정의된 '순서대로' 빈 박스(Placeholder)를 먼저 DOM에 그립니다.
    const wrappers = {};
    for (const symbol of Object.keys(INDICATORS_CONFIG)) {
        const wrapper = document.createElement('div');
        wrapper.className = 'chart-item';
        wrapper.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%; color:#999; font-size:12px;">데이터 로딩 중...</div>`;
        gridContainer.appendChild(wrapper);
        wrappers[symbol] = wrapper; // 각 지표별 자기 자리를 기억해둡니다.
    }

    // 2. 15개의 차트 데이터를 병렬(동시)에 요청합니다. (속도 유지)
    const fetchPromises = Object.keys(INDICATORS_CONFIG).map(async (symbol) => {
        try {
            const history = await fetchEconomyHistory(symbol);
            
            // 데이터를 기다리는 동안 유저가 페이지를 나갔다면 중지
            if (!isComponentActive) return;
            
            if (!history || history.length === 0) {
                wrappers[symbol].innerHTML = `<div style="padding: 20px; text-align: center; color: #999;">데이터 없음</div>`;
                return;
            }
            
            // 3. 데이터가 도착하면, 순서에 상관없이 '자기 자리에 배정된 빈 박스' 안에 차트를 그립니다.
            renderSingleChart(wrappers[symbol], history, symbol);
        } catch (error) {
            console.warn(`[Chart Load Error - ${symbol}]:`, error);
            wrappers[symbol].innerHTML = `<div style="padding: 20px; text-align: center; color: #e74c3c;">로드 실패</div>`;
        }
    });

    // 모든 비동기 작업이 끝날 때까지 대기
    await Promise.allSettled(fetchPromises);
}

export async function init() {
    isComponentActive = true; // 컴포넌트 활성화 플래그 ON

    const container = DOM.summaryContainer();
    if (container) {
        container.innerHTML = '<p class="loading">경제 지표 데이터를 불러오는 중입니다...</p>';
    }

    try {
        const summaries = await fetchEconomySummaries();
        
        // 통신이 끝났는데 유저가 다른 메뉴로 갔으면 렌더링 중단
        if (!isComponentActive) return;

        if (!summaries || summaries.length === 0) {
            if (container) container.innerHTML = '<p>표시할 경제 지표 데이터가 없습니다.</p>';
            return;
        }

        if (container) renderSummaryTable(container, summaries);

        // 표를 먼저 보여주고, 아래쪽 차트들은 백그라운드에서 동시에 불러와서 그려줍니다.
        await loadAndRenderCharts();

    } catch (error) {
        if (!isComponentActive) return;
        console.error('Failed to load economy indicators:', error);
        if (container) container.innerHTML = '<p>데이터를 불러오는 데 실패했습니다.</p>';
    }
}

export function cleanup() {
    isComponentActive = false; // 진행 중인 모든 비동기 렌더링 강제 종료
    destroyCharts(); // 이미 그려진 Chart.js 인스턴스 소멸 및 캔버스 비우기
}