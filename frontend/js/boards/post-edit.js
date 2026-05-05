import { fetchAPI } from '/js/api.js';
import { navigateTo } from '/js/router.js';

const DEFAULT_BOARD_CODE = 'economy-info';

function getPageParams() {
    const params = new URLSearchParams(window.location.search);
    const pathParts = window.location.pathname.split('/').filter(Boolean);

    return {
        boardCode: params.get('board') || params.get('board_code') || DEFAULT_BOARD_CODE,
        postId: params.get('post_id') || pathParts[pathParts.length - 2],
        returnPath: params.get('return') || `/economy/infos/${pathParts[pathParts.length - 2]}`,
    };
}

function setError(message) {
    const errorEl = document.getElementById('post-edit-error');
    if (!errorEl) return;

    errorEl.textContent = message;
    errorEl.hidden = !message;
}

function setSubmitting(isSubmitting) {
    const submitBtn = document.getElementById('post-edit-submit');
    if (!submitBtn) return;

    submitBtn.disabled = isSubmitting;
    submitBtn.textContent = isSubmitting ? '저장 중...' : '저장';
}

function fillForm(post) {
    document.getElementById('post-edit-title').value = post.title || '';
    document.getElementById('post-edit-content').value = post.content || '';
    document.getElementById('post-edit-is-notice').checked = Boolean(post.is_notice);
}

export async function init() {
    const { boardCode, postId, returnPath } = getPageParams();
    const form = document.getElementById('post-edit-form');
    const boardLabel = document.getElementById('post-edit-board');
    const backLink = document.getElementById('post-edit-back');
    const cancelBtn = document.getElementById('post-edit-cancel');

    if (boardLabel) boardLabel.textContent = boardCode;
    if (backLink) backLink.setAttribute('href', returnPath);
    if (cancelBtn) cancelBtn.addEventListener('click', () => navigateTo(returnPath));

    try {
        const post = await fetchAPI(`/boards/${encodeURIComponent(boardCode)}/posts/${encodeURIComponent(postId)}`);
        fillForm(post);
    } catch (error) {
        setError(error.message || '게시글을 불러오지 못했습니다.');
        setSubmitting(true);
        return;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        setError('');

        const title = document.getElementById('post-edit-title').value.trim();
        const content = document.getElementById('post-edit-content').value.trim();
        const isNotice = document.getElementById('post-edit-is-notice').checked;

        if (!title || !content) {
            setError('제목과 내용을 입력해 주세요.');
            return;
        }

        try {
            setSubmitting(true);
            await fetchAPI(`/boards/${encodeURIComponent(boardCode)}/posts/${encodeURIComponent(postId)}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    title,
                    content,
                    is_notice: isNotice,
                }),
            });

            navigateTo(returnPath);
        } catch (error) {
            setError(error.message || '게시글 수정에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    });
}
