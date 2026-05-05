// frontend/js/boards/post-write.js
import { fetchAPI } from '/js/api.js';
import { navigateTo } from '/js/router.js';
import { authService } from '/js/auth/authService.js'; // 🔥 추가: 인증 서비스 임포트

const DEFAULT_BOARD_CODE = 'economy-info';
const DEFAULT_RETURN_PATH = '/economy/infos';

let boards = [];

// --- 💡 [DOM 캐싱] 매번 요소를 찾지 않도록 중앙화 ---
const DOM = {
    form: () => document.getElementById('post-write-form'),
    title: () => document.getElementById('post-title'),
    content: () => document.getElementById('post-content'),
    isNotice: () => document.getElementById('post-is-notice'),
    boardSelect: () => document.getElementById('post-board-id'),
    boardLabel: () => document.getElementById('post-write-board'),
    cancelLink: () => document.getElementById('post-write-cancel'),
    backBtn: () => document.getElementById('post-write-back'),
    submitBtn: () => document.getElementById('post-write-submit'),
    error: () => document.getElementById('post-write-error'),
};

function getPageParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        boardCode: params.get('board') || params.get('board_code') || DEFAULT_BOARD_CODE,
        returnPath: params.get('return') || DEFAULT_RETURN_PATH,
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
    submitBtn.textContent = isSubmitting ? '등록 중...' : '등록';
}

// --- 💡 [API 로직] 게시판 목록 가져오기 ---
async function loadBoards(defaultBoardCode) {
    boards = await fetchAPI('/boards');
    if (!Array.isArray(boards) || boards.length === 0) {
        throw new Error('선택할 수 있는 게시판이 없습니다.');
    }

    const boardSelect = DOM.boardSelect();
    if (!boardSelect) return;

    boardSelect.innerHTML = boards.map(board => `
        <option value="${board.id}" data-code="${board.code}" ${board.code === defaultBoardCode ? 'selected' : ''}>
            ${board.name} (${board.id})
        </option>
    `).join('');

    if (!boardSelect.value) {
        boardSelect.selectedIndex = 0;
    }
}

function getSelectedBoard() {
    const boardSelect = DOM.boardSelect();
    if (!boardSelect) return null;
    const selectedId = Number(boardSelect.value);
    return boards.find(board => board.id === selectedId) || null;
}

function updateBoardLabel() {
    const boardLabel = DOM.boardLabel();
    const selectedBoard = getSelectedBoard();
    if (boardLabel && selectedBoard) {
        boardLabel.textContent = `${selectedBoard.name} / board_id: ${selectedBoard.id}`;
    }
}

// --- 💡 [이벤트 로직] 폼 제출 ---
async function handleSubmit(event, returnPath) {
    event.preventDefault();
    setError('');

    const title = DOM.title()?.value.trim();
    const content = DOM.content()?.value.trim();
    const isNotice = DOM.isNotice()?.checked || false;
    const selectedBoard = getSelectedBoard();

    if (!selectedBoard) {
        setError('게시판을 선택해 주세요.');
        return;
    }

    if (!title || !content) {
        setError('제목과 내용을 입력해 주세요.');
        return;
    }

    try {
        setSubmitting(true);
        await fetchAPI(`/boards/${encodeURIComponent(selectedBoard.code)}/posts`, {
            method: 'POST',
            body: JSON.stringify({
                title,
                content,
                is_notice: isNotice,
                board_id: selectedBoard.id,
            }),
        });
        navigateTo(returnPath);
    } catch (error) {
        setError(error.message || '게시글 등록에 실패했습니다.');
    } finally {
        setSubmitting(false);
    }
}

// --- 💡 [메인 초기화 로직] ---
export async function init() {
    const { boardCode, returnPath } = getPageParams();

    try {
        // 🔥 속도 개선: 유저 정보 조회와 게시판 목록 조회를 동시에 병렬로 실행합니다.
        const [user] = await Promise.all([
            authService.verifySession(),
            loadBoards(boardCode)
        ]);

        // 🔥 직접 API 호출(fetchAPI('/users/me')) 대신 캐싱된 authService 활용
        if (user?.role !== 'ADMIN') {
            alert('관리자만 글을 작성할 수 있습니다.');
            navigateTo(returnPath);
            return;
        }

        updateBoardLabel();
    } catch (error) {
        setError(error.message || '글쓰기 화면을 불러오지 못했습니다.');
        return;
    }

    if (DOM.cancelLink()) DOM.cancelLink().setAttribute('href', returnPath);

    // 🔥 SPA 이벤트 중복 바인딩을 막기 위해 addEventListener 대신 onclick / onchange 할당
    if (DOM.backBtn()) {
        DOM.backBtn().onclick = (e) => {
            e.preventDefault();
            navigateTo(returnPath);
        };
    }

    if (DOM.boardSelect()) {
        DOM.boardSelect().onchange = updateBoardLabel;
    }

    if (DOM.form()) {
        DOM.form().onsubmit = (e) => handleSubmit(e, returnPath);
    }
}

// --- 💡 [라우터 클린업] 메모리 누수 방지 ---
export function cleanup() {
    // 사용자가 다른 화면으로 넘어갈 때 이벤트 리스너를 깔끔하게 지워줍니다.
    if (DOM.backBtn()) DOM.backBtn().onclick = null;
    if (DOM.boardSelect()) DOM.boardSelect().onchange = null;
    if (DOM.form()) DOM.form().onsubmit = null;
}