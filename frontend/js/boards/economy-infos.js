// frontend/js/boards/economy-infos.js
import { fetchAPI } from '/js/api.js';
import { authService } from '/js/auth/authService.js';
import { navigateTo } from '/js/router.js';

const BOARD_CODE = 'economy-info';
const PAGE_SIZE = 10;
let currentPage = 1;

async function loadEconomyPosts(page = 1) {
    currentPage = page;
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

    // checkAuthStatus 대신 authService의 캐시된 세션 확인 메서드 사용
    const user = await authService.verifySession();
    if (user?.role !== 'ADMIN') {
        return;
    }

    writeButton.hidden = false;
    writeButton.style.display = '';
    
    // 이전에 등록된 이벤트 리스너가 중복 실행되지 않도록 처리
    if (!writeButton.dataset.bound) {
        writeButton.addEventListener('click', (event) => {
            event.preventDefault();
            navigateTo(writeButton.getAttribute('href'));
        });
        writeButton.dataset.bound = "true";
    }
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
}

// --- 💡 [이벤트 위임] 메모리 누수 및 중복 호출 방지 ---
function handleBoardEvents(event) {
    const button = event.target.closest('button[data-page]');
    if (button) {
        const page = Number(button.dataset.page);
        if (page !== currentPage) {
            loadEconomyPosts(page);
        }
    }
}

export async function init() {
    // 1. 이벤트 리스너 위임 (컨테이너에 한 번만 등록하여 중복 이벤트 방지)
    const container = document.querySelector('.table-container') || document.body;
    container.addEventListener('click', handleBoardEvents);

    // 2. 권한 체크 및 데이터 로드 순차 실행
    await setupWriteButton();
    await loadEconomyPosts(1);
}

export function cleanup() {
    // SPA 라우터가 다른 화면으로 넘어갈 때 이벤트 리스너를 제거하여 메모리 최적화
    const container = document.querySelector('.table-container') || document.body;
    container.removeEventListener('click', handleBoardEvents);
}