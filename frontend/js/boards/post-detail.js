import { fetchAPI } from '/js/api.js';
import { navigateTo } from '/js/router.js';

const DEFAULT_BOARD_CODE = 'economy-info';
const DEFAULT_RETURN_PATH = '/economy/infos';

function getPageParams() {
    const params = new URLSearchParams(window.location.search);
    const pathParts = window.location.pathname.split('/').filter(Boolean);

    return {
        boardCode: params.get('board') || params.get('board_code') || DEFAULT_BOARD_CODE,
        postId: params.get('post_id') || pathParts[pathParts.length - 1],
        returnPath: params.get('return') || DEFAULT_RETURN_PATH,
    };
}

function setError(message) {
    const errorEl = document.getElementById('post-detail-error');
    if (!errorEl) return;

    errorEl.textContent = message;
    errorEl.hidden = !message;
}

function setBusy(isBusy) {
    document.getElementById('post-edit-btn').disabled = isBusy;
    document.getElementById('post-delete-btn').disabled = isBusy;
}

function formatDate(value) {
    if (!value) return '';
    return value.split('T')[0];
}

function renderPost(post) {
    document.getElementById('post-detail-title').textContent = post.title;
    document.getElementById('post-detail-date').textContent = formatDate(post.created_at);
    document.getElementById('post-detail-views').textContent = `조회 ${post.views ?? 0}`;
    document.getElementById('post-detail-content').textContent = post.content;
}

async function deletePost(boardCode, postId, returnPath) {
    if (!window.confirm('게시글을 삭제할까요?')) return;

    setBusy(true);
    try {
        await fetchAPI(`/boards/${encodeURIComponent(boardCode)}/posts/${encodeURIComponent(postId)}`, {
            method: 'DELETE',
        });
        navigateTo(returnPath);
    } catch (error) {
        setError(error.message || '게시글 삭제에 실패했습니다.');
    } finally {
        setBusy(false);
    }
}

export async function init() {
    const { boardCode, postId, returnPath } = getPageParams();
    const detailPath = `/economy/infos/${postId}`;

    document.getElementById('post-detail-board').textContent = boardCode;
    document.getElementById('post-detail-back').setAttribute('href', returnPath);

    document.getElementById('post-edit-btn').addEventListener('click', () => {
        navigateTo(`${detailPath}/edit?board=${encodeURIComponent(boardCode)}&return=${encodeURIComponent(detailPath)}`);
    });

    document.getElementById('post-delete-btn').addEventListener('click', () => {
        deletePost(boardCode, postId, returnPath);
    });

    try {
        const post = await fetchAPI(`/boards/${encodeURIComponent(boardCode)}/posts/${encodeURIComponent(postId)}`);
        renderPost(post);
    } catch (error) {
        setError(error.message || '게시글을 불러오지 못했습니다.');
        setBusy(true);
    }
}
