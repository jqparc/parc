// frontend/js/boards/post-edit.js
import { fetchAPI } from '/js/api.js';
import { navigateTo } from '/js/router.js';
import { authService } from '/js/auth/authService.js';

const DEFAULT_BOARD_CODE = 'economy-info';

// --- 💡 [DOM 캐싱] 문서 전체 탐색 최소화 ---
const DOM = {
    form: () => document.getElementById('post-edit-form'),
    title: () => document.getElementById('post-edit-title'),
    content: () => document.getElementById('post-edit-content'),
    isNotice: () => document.getElementById('post-edit-is-notice'),
    boardLabel: () => document.getElementById('post-edit-board'),
    backLink: () => document.getElementById('post-edit-back'),
    cancelBtn: () => document.getElementById('post-edit-cancel'),
    submitBtn: () => document.getElementById('post-edit-submit'),
    error: () => document.getElementById('post-edit-error'),
};

function getPageParams() {
    const params = new URLSearchParams(window.location.search);
    const pathParts = window.location.pathname.split('/').filter(Boolean);

    return {
        boardCode: params.get('board') || params.get('board_code') || DEFAULT_BOARD_CODE,
        postId: params.get('post_id') || pathParts[pathParts.length - 2],
        returnPath: params.get('return') || `/economy/infos/${pathParts[pathParts.length - 2]}`,
    };
}

// --- 💡 [UI 헬퍼] ---
function setError(message) {
    const errorEl = DOM.error();
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = !message;
}

function setSubmitting(isSubmitting) {
    const submitBtn = DOM.submitBtn();
    if (!submitBtn) return;
    submitBtn.disabled = isSubmitting;
    submitBtn.textContent = isSubmitting ? '저장 중...' : '저장';
}

function fillForm(post) {
    if (DOM.title()) DOM.title().value = post.title || '';
    if (DOM.content()) DOM.content().value = post.content || '';
    if (DOM.isNotice()) DOM.isNotice().checked = Boolean(post.is_notice);
}

// --- 💡 [이벤트 핸들러] 폼 제출 로직 ---
async function handleSubmit(event, boardCode, postId, returnPath) {
    event.preventDefault();
    setError('');

    const title = DOM.title()?.value.trim();
    const content = DOM.content()?.value.trim();
    const isNotice = DOM.isNotice()?.checked || false;

    if (!title || !content) {
        setError('제목과 내용을 입력해 주세요.');
        return;
    }

    try {
        setSubmitting(true);
        await fetchAPI(`/boards/${encodeURIComponent(boardCode)}/posts/${encodeURIComponent(postId)}`, {
            method: 'PATCH',
            body: JSON.stringify({ title, content, is_notice: isNotice }),
        });
        navigateTo(returnPath);
    } catch (error) {
        setError(error.message || '게시글 수정에 실패했습니다.');
    } finally {
        setSubmitting(false);
    }
}

// --- 💡 [메인 초기화 로직] ---
export async function init() {
    const { boardCode, postId, returnPath } = getPageParams();

    if (DOM.boardLabel()) DOM.boardLabel().textContent = boardCode;
    if (DOM.backLink()) DOM.backLink().setAttribute('href', returnPath);
    
    // 취소 버튼 이벤트 연결 (SPA 중복 렌더링 방지를 위해 onclick 사용)
    if (DOM.cancelBtn()) {
        DOM.cancelBtn().onclick = (e) => {
            e.preventDefault();
            navigateTo(returnPath);
        };
    }

    try {
        // 🔥 핵심: 게시글을 불러옴과 동시에 유저 인증 세션도 가져옵니다.
        const [post, user] = await Promise.all([
            fetchAPI(`/boards/${encodeURIComponent(boardCode)}/posts/${encodeURIComponent(postId)}`),
            authService.verifySession()
        ]);

        // 🔥 URL 쳐서 강제 접속하는 비정상 접근 완벽 차단
        // 백엔드 명세에 맞게 user_id를 비교하세요. (예: post.author_id)
        const isAuthor = user && post && (user.user_id === post.user_id || user.role === 'ADMIN');
        if (!isAuthor) {
            alert('게시글을 수정할 권한이 없습니다.');
            navigateTo(returnPath);
            return;
        }

        fillForm(post);

        // 폼 제출 이벤트 연결
        if (DOM.form()) {
            DOM.form().onsubmit = (e) => handleSubmit(e, boardCode, postId, returnPath);
        }

    } catch (error) {
        setError(error.message || '게시글을 불러오지 못했습니다.');
        setSubmitting(true); // 에러 발생 시 더 이상 조작하지 못하도록 버튼 비활성화
    }
}

// --- 💡 [라우터 클린업] 메모리 누수 방지 ---
export function cleanup() {
    if (DOM.cancelBtn()) DOM.cancelBtn().onclick = null;
    if (DOM.form()) DOM.form().onsubmit = null;
}