import { fetchAPI } from '/js/api.js';
import { navigateTo } from '/js/router.js';

const DEFAULT_BOARD_CODE = 'economy-info';
const DEFAULT_RETURN_PATH = '/economy/infos';

let boards = [];

function getPageParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        boardCode: params.get('board') || params.get('board_code') || DEFAULT_BOARD_CODE,
        returnPath: params.get('return') || DEFAULT_RETURN_PATH,
    };
}

function setError(message) {
    const errorEl = document.getElementById('post-write-error');
    if (!errorEl) return;

    errorEl.textContent = message;
    errorEl.hidden = !message;
}

function setSubmitting(isSubmitting) {
    const submitBtn = document.getElementById('post-write-submit');
    if (!submitBtn) return;

    submitBtn.disabled = isSubmitting;
    submitBtn.textContent = isSubmitting ? '등록 중...' : '등록';
}

async function loadBoards(defaultBoardCode) {
    boards = await fetchAPI('/boards');
    if (!Array.isArray(boards) || boards.length === 0) {
        throw new Error('선택할 수 있는 게시판이 없습니다.');
    }

    const boardSelect = document.getElementById('post-board-id');
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
    const boardSelect = document.getElementById('post-board-id');
    if (!boardSelect) return null;

    const selectedId = Number(boardSelect.value);
    return boards.find(board => board.id === selectedId) || null;
}

function updateBoardLabel() {
    const boardLabel = document.getElementById('post-write-board');
    const selectedBoard = getSelectedBoard();
    if (boardLabel && selectedBoard) {
        boardLabel.textContent = `${selectedBoard.name} / board_id: ${selectedBoard.id}`;
    }
}

export async function init() {
    const { boardCode, returnPath } = getPageParams();
    const form = document.getElementById('post-write-form');
    const cancelLink = document.getElementById('post-write-cancel');
    const backBtn = document.getElementById('post-write-back');
    const boardSelect = document.getElementById('post-board-id');

    try {
        const user = await fetchAPI('/users/me');
        if (user?.role !== 'ADMIN') {
            alert('관리자만 글을 작성할 수 있습니다.');
            navigateTo(returnPath);
            return;
        }

        await loadBoards(boardCode);
        updateBoardLabel();
    } catch (error) {
        setError(error.message || '글쓰기 화면을 불러오지 못했습니다.');
        return;
    }

    if (cancelLink) {
        cancelLink.setAttribute('href', returnPath);
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => navigateTo(returnPath));
    }

    if (boardSelect) {
        boardSelect.addEventListener('change', updateBoardLabel);
    }

    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        setError('');

        const title = document.getElementById('post-title').value.trim();
        const content = document.getElementById('post-content').value.trim();
        const isNotice = document.getElementById('post-is-notice').checked;
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
    });
}
