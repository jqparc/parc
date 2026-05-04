// frontend/js/api/economy.js
import { fetchAPI } from '/js/api.js'; 

/**
 * [표 렌더링용] 모든 지표의 요약 데이터(현재가, 등락폭 등)를 가져옵니다.
 */
export async function fetchEconomySummaries() {
    try {
        const data = await fetchAPI('/economy/indicators/summary');
        return data && data.summaries ? data.summaries : [];
    } catch (error) {
        console.error('요약 데이터 로딩 오류:', error.message);
        return [];
    }
}

/**
 * [차트 렌더링용] 특정 지표의 1년 치 히스토리 데이터를 가져옵니다.
 */
export async function fetchEconomyHistory(symbol) {
    try {
        // 심볼(예: ^GSPC)이 URL에 포함되므로 인코딩 처리
        const encodedSymbol = encodeURIComponent(symbol);
        const data = await fetchAPI(`/economy/indicators/${encodedSymbol}/history`);
        return data && data.history ? data.history : [];
    } catch (error) {
        console.error(`${symbol} 히스토리 로딩 오류:`, error.message);
        return [];
    }
}