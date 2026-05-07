import { fetchAPI } from '/js/api.js';
import { navigateTo } from '/js/router.js';

const state = {
    category: 'all',
    limit: 20,
    offset: 0,
    total: 0,
    items: [],
};

const DOM = {
    filter: () => document.querySelector('#news-category-filter'),
    grid: () => document.querySelector('#news-card-grid'),
    loadMore: () => document.querySelector('#news-load-more'),
    listView: () => document.querySelector('#news-list-view'),
    detailView: () => document.querySelector('#news-detail-view'),
};

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[char]));
}

function formatDate(value) {
    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function currentNewsId() {
    const match = window.location.pathname.match(/^\/economy\/news\/(\d+)$/);
    return match ? Number(match[1]) : null;
}

function renderCategories(categories) {
    const filter = DOM.filter();
    if (!filter) return;

    const options = ['all', ...categories];
    filter.innerHTML = options.map(category => `
        <option value="${escapeHTML(category)}"${category === state.category ? ' selected' : ''}>
            ${category === 'all' ? '전체' : escapeHTML(category)}
        </option>
    `).join('');
}

function newsCard(news) {
    const thumbnail = news.thumbnail
        ? `<img src="${escapeHTML(news.thumbnail)}" alt="" loading="lazy">`
        : '<div class="news-thumb-placeholder"></div>';

    return `
        <button class="news-card" type="button" data-news-id="${news.id}">
            <div class="news-thumb">${thumbnail}</div>
            <div class="news-card-body">
                <div class="news-meta">
                    <span>${escapeHTML(news.category)}</span>
                    <span>${escapeHTML(news.source)}</span>
                </div>
                <h3>${escapeHTML(news.title)}</h3>
                <p>${escapeHTML(news.summary || '요약이 제공되지 않았습니다.')}</p>
                <time>${formatDate(news.published_at)}</time>
            </div>
        </button>
    `;
}

function renderList() {
    const grid = DOM.grid();
    if (!grid) return;

    if (state.items.length === 0) {
        grid.innerHTML = '<p class="news-empty">수집된 뉴스가 없습니다.</p>';
    } else {
        grid.innerHTML = state.items.map(newsCard).join('');
    }

    const loadMore = DOM.loadMore();
    if (loadMore) {
        loadMore.hidden = state.items.length >= state.total;
    }
}

async function loadNews({ reset = false } = {}) {
    if (reset) {
        state.offset = 0;
        state.items = [];
    }

    const params = new URLSearchParams({
        limit: String(state.limit),
        offset: String(state.offset),
    });
    if (state.category !== 'all') params.set('category', state.category);

    const data = await fetchAPI(`/economic-news?${params.toString()}`);
    state.total = data.total;
    state.items = reset ? data.items : [...state.items, ...data.items];
    renderCategories(data.categories || []);
    renderList();
}

async function renderDetail(newsId) {
    const detailView = DOM.detailView();
    const listView = DOM.listView();
    if (!detailView || !listView) return;

    const news = await fetchAPI(`/economic-news/${newsId}`);
    listView.hidden = true;
    detailView.hidden = false;
    detailView.innerHTML = `
        <button class="news-back" type="button" data-news-back>목록</button>
        ${news.thumbnail ? `<img class="news-detail-image" src="${escapeHTML(news.thumbnail)}" alt="">` : ''}
        <div class="news-detail-meta">
            <span>${escapeHTML(news.category)}</span>
            <span>${escapeHTML(news.source)}</span>
            <time>${formatDate(news.published_at)}</time>
        </div>
        <h2>${escapeHTML(news.title)}</h2>
        <p class="news-detail-summary">${escapeHTML(news.summary || '')}</p>
        ${news.content ? `<p class="news-detail-content">${escapeHTML(news.content)}</p>` : ''}
        <a class="news-original-link" href="${escapeHTML(news.original_url)}" target="_blank" rel="noopener noreferrer">
            원문 보기
        </a>
    `;
}

function showList() {
    DOM.detailView().hidden = true;
    DOM.listView().hidden = false;
}

function bindEvents() {
    DOM.filter()?.addEventListener('change', async event => {
        state.category = event.target.value;
        await loadNews({ reset: true });
    });

    DOM.grid()?.addEventListener('click', event => {
        const card = event.target.closest('.news-card');
        if (card) navigateTo(`/economy/news/${card.dataset.newsId}`);
    });

    DOM.loadMore()?.addEventListener('click', async () => {
        state.offset += state.limit;
        await loadNews();
    });

    DOM.detailView()?.addEventListener('click', event => {
        if (event.target.closest('[data-news-back]')) {
            navigateTo('/economy/news');
        }
    });
}

export async function init() {
    bindEvents();
    await loadNews({ reset: true });

    const newsId = currentNewsId();
    if (newsId) {
        await renderDetail(newsId);
    } else {
        showList();
    }
}

export function cleanup() {}
