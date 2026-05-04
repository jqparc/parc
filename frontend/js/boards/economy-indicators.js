// frontend/js/boards/economy-indicators.js
import { fetchEconomySummaries, fetchEconomyHistory } from '/js/api/economy.js';
import Chart from 'https://cdn.jsdelivr.net/npm/chart.js/auto/+esm';

let economyChartInstance = null; // SPA 구조에서 기존 차트 인스턴스를 파기하기 위한 변수

const INDICATORS_CONFIG = {
    "^GSPC": { name: "S&P 500", unit: "pt" },
    "^IXIC": { name: "나스닥", unit: "pt" },
    "^DJI": { name: "다우존스", unit: "pt" },
    "^VIX": { name: "공포지수(VIX)", unit: "pt" },
    "^KS11": { name: "KOSPI", unit: "pt" },
    "^KQ11": { name: "KOSDAQ", unit: "pt" },
    "KRW=X": { name: "원/달러 환율", unit: "KRW" },
    "DX-Y.NYB": { name: "달러 인덱스", unit: "pt" },
    "EURUSD=X": { name: "유로/달러", unit: "USD" },
    "JPY=X": { name: "엔/달러", unit: "JPY" },
    "^TNX": { name: "미국 10년 국채금리", unit: "%" },
    "^IRX": { name: "미국 3개월 국채금리", unit: "%" },
    "GC=F": { name: "금", unit: "USD" },
    "CL=F": { name: "WTI 원유", unit: "USD" },
    "SI=F": { name: "은", unit: "USD" }
};

// SPA 라우터에 의해 실행될 진입점
export async function init() {

    const container = document.getElementById('indicators-container');
    if (!container) return;

    container.innerHTML = '<p class="loading">경제 지표 요약 데이터를 불러오는 중입니다...</p>';

    try {
        const summaries = await fetchEconomySummaries();
        
        if (!summaries || summaries.length === 0) {
            container.innerHTML = '<p>표시할 경제 지표 데이터가 없습니다.</p>';
            return;
        }

        renderSummaryTable(container, summaries);

    } catch (error) {
        console.error("초기화 중 오류:", error);
        container.innerHTML = '<p class="error">데이터를 불러오는 데 실패했습니다.</p>';
    }

const gridContainer = document.getElementById('charts-container');
    if (!gridContainer) return;

    gridContainer.innerHTML = ''; // 초기화
    chartInstances.forEach(chart => chart.destroy()); // 기존 인스턴스 파기
    chartInstances = [];

    // INDICATORS_CONFIG에 등록된 모든 심볼을 순서대로 처리
    const symbols = Object.keys(INDICATORS_CONFIG);

    for (const symbol of symbols) {
        try {
            const history = await fetchEconomyHistory(symbol);
            if (history && history.length > 0) {
                renderSingleChart(gridContainer, history, symbol);
            }
        } catch (error) {
            console.error(`${symbol} 데이터를 불러오는 중 오류 발생:`, error);
        }
    }
}

/**
 * 받아온 요약 데이터를 HTML 표(Table) 형태로 렌더링합니다.
 */
function renderSummaryTable(container, summaries) {
    let html = `
        <table class="common-table">
            <thead>
                <tr">
                    <th>지표명</th>
                    <th>현재가</th>
                    <th>전일가</th>
                    <th>등락</th>
                </tr>
            </thead>
            <tbody>
    `;

    summaries.forEach(item => {
        // 등락 양수/음수 판별을 통한 색상 및 기호 분기
        const isPositive = item.change > 0;
        const isNegative = item.change < 0;
        const colorClass = isPositive ? 'color: #e74c3c;' : (isNegative ? 'color: #2980b9;' : 'color: #7f8c8d;');
        const sign = isPositive ? '▲' : (isNegative ? '▼' : '-');

        html += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="text-align: left;">
                        ${item.name} 
                        <small style="text-align: right">${item.symbol} / (${item.unit})</small>
                    </td>
                    <td>
                        ${item.current_value.toLocaleString()}
                        <small>${item.current_date}</small>
                    </td>
                    <td style="color: #50969b;">
                        ${item.previous_value.toLocaleString()}
                        <small>${item.previous_date}</small>
                    </td>
                    <td style="${colorClass}">
                        ${sign} ${Math.abs(item.change).toLocaleString()}
                        <small style="color: #95a5a6; display: block; font-weight: normal; ${colorClass}">(${Math.abs(item.change_rate).toFixed(2)}%)</small>
                    </td>
                </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

let chartInstances = [];

function renderSingleChart(container, history, symbol) {
    const config = INDICATORS_CONFIG[symbol];
    
    const chartWrapper = document.createElement('div');
    chartWrapper.className = 'chart-item';
    chartWrapper.innerHTML = `<h3>${config.name} (${config.unit})</h3><canvas></canvas>`;
    container.appendChild(chartWrapper);

    const ctx = chartWrapper.querySelector('canvas').getContext('2d');

    const newChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: history.map(d => d.date),
            datasets: [{
                label: config.name,
                data: history.map(d => d.value),
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
                legend: {
                    display: false // 상단 카테고리(범례)를 보이지 않게 설정합니다
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 9 // x축 폰트 사이즈를 9로 무조건 고정
                        },
                        maxRotation: 0, // 레이블이 회전하여 레이아웃이 깨지는 것을 방지
                        autoSkip: false, // 데이터가 많을 경우 자동으로 건너뛰어 겹침 방지
                        callback: function(val, index) {
                            // history 데이터에 접근하기 위해 차트 인스턴스의 레이블을 가져옴
                            const labels = this.chart.data.labels;
                            if (index === 0) return labels[0]; // 시작 데이터는 무조건 표시[cite: 3]

                            // 시작 날짜와 현재 날짜 객체 생성
                            const startDate = new Date(labels[0]);
                            const currentDate = new Date(labels[index]);

                            // 개월 수 차이 계산
                            const monthDiff = (currentDate.getFullYear() - startDate.getFullYear()) * 12 
                                            + (currentDate.getMonth() - startDate.getMonth());

                            // 시작 데이터 이후 정확히 3개월 단위인 경우만 표시 (3, 6, 9...)
                            if (monthDiff > 0 && monthDiff % 3 === 0) {
                                // 이전 날짜와 같은 달이면 중복 표시 방지 (데이터가 일별인 경우 대응)
                                const prevDate = new Date(labels[index - 1]);
                                if (currentDate.getMonth() !== prevDate.getMonth()) {
                                    return labels[index];
                                }
                            }
                            return null; // 그 외에는 레이블을 숨김[cite: 3]
                        }
                    }
                },
                y: {
                    afterFit: function(axis) {
                        axis.width = 45; 
                    },
                    ticks: {
                            // 폰트 사이즈를 8로 무조건 고정합니다.[cite: 3]
                            font: {
                                size: 9
                            },
                            // 숫자가 왼쪽 끝에 붙도록 정렬하여 가독성을 높입니다.
                            align: 'end',
                            crossAlign: 'center',
                            // 천 단위 콤마 포맷팅을 적용합니다.[cite: 3]
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                }
            }
        }
    });
    chartInstances.push(newChart);
}