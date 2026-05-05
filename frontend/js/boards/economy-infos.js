import { fetchAPI } from '/js/api.js';
import { navigateTo } from '/js/router.js';
import { checkAuthStatus } from '/js/auth/check_auth.js';

const BOARD_CODE = 'economy-info';
const PAGE_SIZE = 10;

async function loadEconomyPosts(page = 1) {
    try {
        const data = await fetchAPI(`/boards/${BOARD_CODE}/posts?page=${page}&size=${PAGE_SIZE}`);
        renderTable(data.posts || [], data.current_page || page, data.total_count || 0);
        renderPagination(data.total_pages || 0, data.current_page || page);
    } catch (error) {
        const tbody = document.getElementById('economy-list');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="3" class="empty-cell">게시글을 불러오지 못했습니다.</td></tr>';
        }
        console.error('Failed to load posts:', error);
    }
}

async function setupWriteButton() {
    const writeButton = document.querySelector('.write-btn');
    if (!writeButton) return;

    writeButton.hidden = true;
    writeButton.style.display = 'none';

    const user = await checkAuthStatus();
    if (user?.role !== 'ADMIN') {
        return;
    }

    writeButton.hidden = false;
    writeButton.style.display = '';
    writeButton.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo(writeButton.getAttribute('href'));
    });
}

function renderTable(posts, page, totalCount) {
    const tbody = document.getElementById('economy-list');
    if (!tbody) return;

    if (posts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-cell">등록된 게시글이 없습니다.</td></tr>';
        return;
    }

    tbody.innerHTML = posts.map((post, index) => {
        const displayNum = totalCount - ((page - 1) * PAGE_SIZE) - index;
        const dateStr = post.created_at ? post.created_at.split('T')[0] : '';

        return `
            <tr>
                <td>${displayNum}</td>
                <td class="td-title">
                    <a href="/economy/infos/${post.id}" data-link>${post.title}</a>
                </td>
                <td>${dateStr}</td>
            </tr>
        `;
    }).join('');
}

function renderPagination(totalPages, currentPage) {
    const container = document.getElementById('pagination-container');
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1;
        return `
            <button type="button" class="page-btn ${page === currentPage ? 'active' : ''}" data-page="${page}">
                ${page}
            </button>
        `;
    }).join('');

    container.querySelectorAll('button[data-page]').forEach((button) => {
        button.addEventListener('click', () => {
            loadEconomyPosts(Number(button.dataset.page));
        });
    });
}

export function init() {
    setupWriteButton();
    loadEconomyPosts(1);
}
