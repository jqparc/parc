import Chart from 'https://cdn.jsdelivr.net/npm/chart.js/auto/+esm';

import { INDICATORS_CONFIG, indicatorSymbols } from '/js/economy/indicator/config.js';

let chartInstances = [];

export function destroyCharts() {
    chartInstances.forEach((chart) => chart.destroy());
    chartInstances = [];
}

export function createChartPlaceholders(container) {
    destroyCharts();
    container.innerHTML = '';

    return indicatorSymbols.reduce((wrappers, symbol) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'chart-item';
        wrapper.innerHTML = '<div class="loading">데이터 로딩 중...</div>';
        container.appendChild(wrapper);
        return { ...wrappers, [symbol]: wrapper };
    }, {});
}

export function renderChart(wrapper, history, symbol) {
    const config = INDICATORS_CONFIG[symbol];
    if (!config) return;

    wrapper.replaceChildren();

    const title = document.createElement('h3');
    title.textContent = `${config.name} (${config.unit})`;

    const canvas = document.createElement('canvas');
    wrapper.append(title, canvas);

    const chart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: history.map((item) => item.date),
            datasets: [{
                label: config.name,
                data: history.map((item) => item.value),
                borderColor: '#3498db',
                fill: false,
                tension: 0.1,
                pointRadius: 0,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    ticks: { font: { size: 9 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
                },
                y: {
                    afterFit(axis) {
                        axis.width = 45;
                    },
                    ticks: {
                        font: { size: 9 },
                        callback(value) {
                            return Number(value).toLocaleString();
                        },
                    },
                },
            },
        },
    });

    chartInstances.push(chart);
}

export function renderChartMessage(wrapper, message, color = '#999') {
    wrapper.innerHTML = `<div style="padding: 20px; text-align: center; color: ${color};">${message}</div>`;
}
