import { ECONOMY_INFO_BOARD } from '/js/economy/info-board.js';

const BOARD_ROUTE_CONFIGS = {
    [ECONOMY_INFO_BOARD.boardCode]: {
        list: ECONOMY_INFO_BOARD.paths.list,
        write: ECONOMY_INFO_BOARD.paths.write,
        detail: (postId) => `/economy/info/${postId}`,
        edit: (postId) => `/economy/info/${postId}/edit`,
    },
};

export function getBoardRouteConfig(boardCode) {
    return BOARD_ROUTE_CONFIGS[boardCode] || {
        list: '/',
        write: `/board/write?board=${encodeURIComponent(boardCode)}`,
        detail: (postId) => `/board/${encodeURIComponent(boardCode)}/post/${encodeURIComponent(postId)}`,
        edit: (postId) => `/board/${encodeURIComponent(boardCode)}/post/${encodeURIComponent(postId)}/edit`,
    };
}
