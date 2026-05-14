import { fetchAPI } from '/js/api.js';

const BOARDS_PATH = '/economy/info/board';
const postsPath = (boardCode) => `${BOARDS_PATH}/${encodeURIComponent(boardCode)}/post`;

export function fetchPostList(boardCode, { page = 1, size = 10 } = {}) {
    const params = new URLSearchParams({
        page: String(page),
        size: String(size),
    });
    return fetchAPI(`${postsPath(boardCode)}?${params.toString()}`);
}

export function fetchPost(boardCode, postId) {
    return fetchAPI(`${postsPath(boardCode)}/${encodeURIComponent(postId)}`);
}

export function createPost(boardCode, postData) {
    return fetchAPI(postsPath(boardCode), {
        method: 'POST',
        body: JSON.stringify(postData),
    });
}

export function updatePost(boardCode, postId, postData) {
    return fetchAPI(`${postsPath(boardCode)}/${encodeURIComponent(postId)}`, {
        method: 'PATCH',
        body: JSON.stringify(postData),
    });
}

export function deletePost(boardCode, postId) {
    return fetchAPI(`${postsPath(boardCode)}/${encodeURIComponent(postId)}`, {
        method: 'DELETE',
    });
}

export function fetchBoards() {
    return fetchAPI(BOARDS_PATH);
}
