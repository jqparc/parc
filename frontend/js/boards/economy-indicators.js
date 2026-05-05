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
let initPromise = null;

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

function renderSingleChart(container, history, symbol) {
    const config = INDICATORS_CONFIG[symbol];
    if (!config) return;

    const chartWrapper = document.createElement('div');
    chartWrapper.className = 'chart-item';
    chartWrapper.innerHTML = `<h3>${config.name} (${config.unit})</h3><canvas></canvas>`;
    container.appendChild(chartWrapper);

    const chart = new Chart(chartWrapper.querySelector('canvas').getContext('2d'), {
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
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    ticks: {
                        font: { size: 9 },
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 6
                    }
                },
                y: {
                    afterFit(axis) {
                        axis.width = 45;
                    },
                    ticks: {
                        font: { size: 9 },
                        callback(value) {
                            return Number(value).toLocaleString();
                        }
                    }
                }
            }
        }
    });

    chartInstances.push(chart);
}

async function renderIndicators() {
    const container = document.getElementById('indicators-container');
    const gridContainer = document.getElementById('charts-container');
    if (!container) return;

    container.innerHTML = '<p class="loading">경제 지표 데이터를 불러오는 중입니다...</p>';

    const summaries = await fetchEconomySummaries();
    if (!summaries || summaries.length === 0) {
        container.innerHTML = '<p>표시할 경제 지표 데이터가 없습니다.</p>';
        return;
    }

    renderSummaryTable(container, summaries);

    if (!gridContainer) return;

    destroyCharts();
    gridContainer.innerHTML = '';

    for (const symbol of Object.keys(INDICATORS_CONFIG)) {
        const history = await fetchEconomyHistory(symbol);
        if (history && history.length > 0) {
            renderSingleChart(gridContainer, history, symbol);
        }
    }
}

export function init() {
    if (!initPromise) {
        initPromise = renderIndicators().finally(() => {
            initPromise = null;
        });
    }

    return initPromise;
}

export function cleanup() {
    destroyCharts();
    initPromise = null;
}
