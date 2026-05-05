// frontend/js/boards/post-detail.js
import { fetchAPI } from '/js/api.js';
import { navigateTo } from '/js/router.js';
import { authService } from '/js/auth/authService.js';

// --- 💡 [상수 및 DOM 캐싱] ---
const DEFAULT_BOARD_CODE = 'economy-info';
const DEFAULT_RETURN_PATH = '/economy/infos';

// 화면에 있는 요소들을 매번 찾지 않도록 객체에 모아둡니다.
const DOM = {
    title: () => document.getElementById('post-detail-title'),
    date: () => document.getElementById('post-detail-date'),
    views: () => document.getElementById('post-detail-views'),
    content: () => document.getElementById('post-detail-content'),
    board: () => document.getElementById('post-detail-board'),
    backBtn: () => document.getElementById('post-detail-back'),
    editBtn: () => document.getElementById('post-edit-btn'),
    deleteBtn: () => document.getElementById('post-delete-btn'),
    error: () => document.getElementById('post-detail-error'),
};

// --- 💡 [유틸리티] URL 파라미터 파싱 ---
function getPageParams() {
    const params = new URLSearchParams(window.location.search);
    const pathParts = window.location.pathname.split('/').filter(Boolean);

    return {
        boardCode: params.get('board') || params.get('board_code') || DEFAULT_BOARD_CODE,
        postId: params.get('post_id') || pathParts[pathParts.length - 1],
        returnPath: params.get('return') || DEFAULT_RETURN_PATH,
    };
}

// --- 💡 [유틸리티] 상태 UI 제어 ---
function setError(message) {
    const errorEl = DOM.error();
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = !message;
}

function setBusy(isBusy) {
    if (DOM.editBtn()) DOM.editBtn().disabled = isBusy;
    if (DOM.deleteBtn()) DOM.deleteBtn().disabled = isBusy;
}

// --- 💡 [UI 렌더링] ---
function renderPost(post) {
    if (DOM.title()) DOM.title().textContent = post.title || '제목 없음';
    if (DOM.date()) DOM.date().textContent = post.created_at ? post.created_at.split('T')[0] : '';
    if (DOM.views()) DOM.views().textContent = `조회 ${post.views ?? 0}`;
    if (DOM.content()) DOM.content().textContent = post.content || '';
}

// --- 💡 [권한 및 이벤트 설정] 작성자만 수정/삭제 버튼 노출 ---
function setupActionButtons(post, user, boardCode, postId, returnPath) {
    const editBtn = DOM.editBtn();
    const deleteBtn = DOM.deleteBtn();
    
    if (!editBtn || !deleteBtn) return;

    // 현재 로그인한 유저가 이 글의 작성자인지, 혹은 관리자인지 확인합니다.
    // ⚠️ 주의: 백엔드에서 내려주는 게시글 작성자 필드명(user_id 등)에 맞게 변경하세요.
    const isAuthor = user && post && (user.user_id === post.user_id || user.role === 'ADMIN');

    if (!isAuthor) {
        // 권한이 없으면 버튼을 아예 화면에서 숨깁니다.
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
        return;
    }

    // 권한이 있으면 버튼을 보여주고 클릭 이벤트를 연결합니다.
    editBtn.style.display = '';
    deleteBtn.style.display = '';

    const detailPath = `/economy/infos/${postId}`;

    // SPA 환경에서 중복 이벤트 방지를 위해 onclick을 사용
    editBtn.onclick = () => {
        navigateTo(`${detailPath}/edit?board=${encodeURIComponent(boardCode)}&return=${encodeURIComponent(detailPath)}`);
    };

    deleteBtn.onclick = async () => {
        if (!window.confirm('게시글을 삭제할까요?')) return;
        setBusy(true);
        try {
            await fetchAPI(`/boards/${encodeURIComponent(boardCode)}/posts/${encodeURIComponent(postId)}`, {
                method: 'DELETE',
            });
            alert('게시글이 삭제되었습니다.');
            navigateTo(returnPath);
        } catch (error) {
            setError(error.message || '게시글 삭제에 실패했습니다.');
        } finally {
            setBusy(false);
        }
    };
}

// --- 💡 [메인 초기화 로직] ---
export async function init() {
    const { boardCode, postId, returnPath } = getPageParams();

    if (DOM.board()) DOM.board().textContent = boardCode;
    if (DOM.backBtn()) DOM.backBtn().setAttribute('href', returnPath);

    try {
        // 🔥 속도 개선: 게시글 정보와 유저 인증 정보를 동시에 병렬로 가져옵니다.
        const [post, user] = await Promise.all([
            fetchAPI(`/boards/${encodeURIComponent(boardCode)}/posts/${encodeURIComponent(postId)}`),
            authService.verifySession()
        ]);

        renderPost(post);
        setupActionButtons(post, user, boardCode, postId, returnPath);

    } catch (error) {
        setError(error.message || '게시글을 불러오지 못했습니다.');
        setBusy(true);
    }
}

// --- 💡 [라우터 클린업] ---
export function cleanup() {
    // 다른 화면으로 넘어갈 때 이벤트 초기화
    if (DOM.editBtn()) DOM.editBtn().onclick = null;
    if (DOM.deleteBtn()) DOM.deleteBtn().onclick = null;
}