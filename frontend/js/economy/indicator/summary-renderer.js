import { escapeHTML } from '/js/board/page-util.js';
import { formatChangeRate, formatIndicatorValue, getChangePresentation } from '/js/economy/indicator/format.js';

export function renderSummaryTable(container, summaries) {
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
                ${summaries.map(renderSummaryRow).join('')}
            </tbody>
        </table>
    `;
}

function renderSummaryRow(item) {
    const { change, color, sign } = getChangePresentation(item.change);
    const changeRate = formatChangeRate(item.change_rate);

    return `
        <tr>
            <td style="text-align:left;">
                ${escapeHTML(item.name || '-')}
                <small>${escapeHTML(item.symbol || '')} / ${escapeHTML(item.unit || '')}</small>
            </td>
            <td>
                ${formatIndicatorValue(item.current_value)}
                <small>${escapeHTML(item.current_date || '')}</small>
            </td>
            <td>
                ${formatIndicatorValue(item.previous_value)}
                <small>${escapeHTML(item.previous_date || '')}</small>
            </td>
            <td style="color:${color};">
                ${sign} ${formatIndicatorValue(Math.abs(change))}
                <small style="color:${color};">(${changeRate}%)</small>
            </td>
        </tr>
    `;
}
