import { navigateTo } from '/js/router.js';
import { authService } from '/js/auth/authService.js';
import { createPost, fetchBoards } from '/js/board/post-api.js';

const DEFAULT_BOARD_CODE = 'economy-info';
const DEFAULT_RETURN_PATH = '/economy/info';

let boards = [];

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

async function loadBoards(defaultBoardCode) {
    boards = await fetchBoards();
    if (!Array.isArray(boards) || boards.length === 0) {
        throw new Error('선택 가능한 게시판이 없습니다.');
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
        await createPost(selectedBoard.code, {
            title,
            content,
            is_notice: isNotice,
            board_id: selectedBoard.id,
        });
        navigateTo(returnPath);
    } catch (error) {
        setError(error.message || '게시글 등록에 실패했습니다.');
    } finally {
        setSubmitting(false);
    }
}

export async function init() {
    const { boardCode, returnPath } = getPageParams();

    try {
        const [user] = await Promise.all([
            authService.verifySession(),
            loadBoards(boardCode),
        ]);

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

    DOM.cancelLink()?.setAttribute('href', returnPath);

    const backBtn = DOM.backBtn();
    if (backBtn) {
        backBtn.onclick = (event) => {
            event.preventDefault();
            navigateTo(returnPath);
        };
    }

    const boardSelect = DOM.boardSelect();
    if (boardSelect) {
        boardSelect.onchange = updateBoardLabel;
    }

    const form = DOM.form();
    if (form) {
        form.onsubmit = (event) => handleSubmit(event, returnPath);
    }
}

export function cleanup() {
    if (DOM.backBtn()) DOM.backBtn().onclick = null;
    if (DOM.boardSelect()) DOM.boardSelect().onchange = null;
    if (DOM.form()) DOM.form().onsubmit = null;
}
