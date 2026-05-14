import { fetchEconomyHistory, fetchEconomySummaries } from '/js/api/economy.js';
import { createChartPlaceholders, destroyCharts, renderChart, renderChartMessage } from '/js/economy/indicator/chart-renderer.js';
import { indicatorSymbols } from '/js/economy/indicator/config.js';
import { indicatorDom } from '/js/economy/indicator/dom.js';
import { renderSummaryTable } from '/js/economy/indicator/summary-renderer.js';

let isComponentActive = false;

async function loadAndRenderCharts() {
    const container = indicatorDom.chartsContainer();
    if (!container) return;

    const wrappers = createChartPlaceholders(container);
    const jobs = indicatorSymbols.map(async (symbol) => {
        try {
            const history = await fetchEconomyHistory(symbol);
            if (!isComponentActive) return;

            if (!history || history.length === 0) {
                renderChartMessage(wrappers[symbol], '데이터 없음');
                return;
            }

            renderChart(wrappers[symbol], history, symbol);
        } catch (error) {
            console.warn(`[Chart Load Error - ${symbol}]:`, error);
            renderChartMessage(wrappers[symbol], '로드 실패', '#e74c3c');
        }
    });

    await Promise.allSettled(jobs);
}

export async function init() {
    isComponentActive = true;

    const container = indicatorDom.summaryContainer();
    if (container) {
        container.innerHTML = '<p class="loading">경제 지표 데이터를 불러오는 중입니다...</p>';
    }

    try {
        const summaries = await fetchEconomySummaries();
        if (!isComponentActive) return;

        if (!summaries || summaries.length === 0) {
            if (container) container.innerHTML = '<p>표시할 경제 지표 데이터가 없습니다.</p>';
            return;
        }

        if (container) renderSummaryTable(container, summaries);
        await loadAndRenderCharts();
    } catch (error) {
        if (!isComponentActive) return;
        console.error('Failed to load economy indicators:', error);
        if (container) container.innerHTML = '<p>데이터를 불러오는 데 실패했습니다.</p>';
    }
}

export function cleanup() {
    isComponentActive = false;
    destroyCharts();
}
