import { authService } from '/js/system/user/auth-service.js';
import { navigateTo } from '/js/router.js';
import { fetchPostList } from '/js/board/post-api.js';
import { escapeHTML, formatDate, setHidden } from '/js/board/page-util.js';

const DEFAULT_MESSAGES = {
    empty: '등록된 게시글이 없습니다.',
    loadError: '게시글을 불러오지 못했습니다.',
};

export function createBoardListPage(config) {
    let currentPage = 1;
    const messages = { ...DEFAULT_MESSAGES, ...(config.messages || {}) };
    const pageSize = config.pageSize || 10;

    const find = (selector) => document.querySelector(selector);

    function renderEmpty(message) {
        const tbody = find(config.selectors.listBody);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="${config.columns?.length || 3}" class="empty-cell">${escapeHTML(message)}</td></tr>`;
        }
    }

    function renderRows(posts, page, totalCount) {
        const tbody = find(config.selectors.listBody);
        if (!tbody) return;

        if (!posts.length) {
            renderEmpty(messages.empty);
            return;
        }

        tbody.innerHTML = posts.map((post, index) => {
            const displayNum = totalCount - ((page - 1) * pageSize) - index;
            const detailPath = config.paths.detail(post);
            return `
                <tr>
                    <td>${displayNum}</td>
                    <td class="td-title">
                        <a href="${detailPath}" data-link>${escapeHTML(post.title)}</a>
                    </td>
                    <td>${formatDate(post.created_at)}</td>
                </tr>
            `;
        }).join('');
    }

    function getVisiblePages(totalPages, page) {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, index) => index + 1);
        }

        const pages = new Set([1, totalPages, page - 1, page, page + 1]);
        const sortedPages = [...pages]
            .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
            .sort((a, b) => a - b);

        return sortedPages.flatMap((pageNumber, index) => {
            const previous = sortedPages[index - 1];
            if (index > 0 && pageNumber - previous > 1) {
                return ['ellipsis', pageNumber];
            }
            return [pageNumber];
        });
    }

    function renderPagination(totalPages, page) {
        const container = find(config.selectors.pagination);
        if (!container) return;

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = getVisiblePages(totalPages, page).map((pageNumber) => {
            if (pageNumber === 'ellipsis') {
                return '<span class="page-ellipsis" aria-hidden="true">...</span>';
            }

            const activeClass = pageNumber === page ? 'active' : '';
            return `
                <button type="button" class="page-btn ${activeClass}" data-page="${pageNumber}">
                    ${pageNumber}
                </button>
            `;
        }).join('');
    }

    async function loadPage(page = 1) {
        currentPage = page;
        try {
            const data = await fetchPostList(config.boardCode, { page, size: pageSize });
            renderRows(data.posts || [], data.current_page || page, data.total_count || 0);
            renderPagination(data.total_pages || 0, data.current_page || page);
        } catch (error) {
            renderEmpty(messages.loadError);
            console.error(`Failed to load ${config.boardCode} posts:`, error);
        }
    }

    async function setupWriteButton() {
        const writeButton = find(config.selectors.writeButton);
        if (!writeButton) return;

        setHidden(writeButton, true);

        try {
            const user = await authService.verifySession();
            const canWrite = config.canWrite ? config.canWrite(user) : user?.role === 'ADMIN';
            if (!canWrite) return;

            writeButton.setAttribute('href', config.paths.write);
            setHidden(writeButton, false);

            if (!writeButton.dataset.bound) {
                writeButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    navigateTo(writeButton.getAttribute('href'));
                });
                writeButton.dataset.bound = 'true';
            }
        } catch (error) {
            setHidden(writeButton, true);
            console.error(`Failed to verify write permission for ${config.boardCode}:`, error);
        }
    }

    function handleEvents(event) {
        const button = event.target.closest('button[data-page]');
        if (!button) return;

        const page = Number(button.dataset.page);
        if (page && page !== currentPage) {
            loadPage(page);
        }
    }

    return {
        async init() {
            const container = find(config.selectors.container) || document.body;
            container.addEventListener('click', handleEvents);

            setupWriteButton();
            await loadPage(1);
        },
        cleanup() {
            const container = find(config.selectors.container) || document.body;
            container.removeEventListener('click', handleEvents);
        },
    };
}
