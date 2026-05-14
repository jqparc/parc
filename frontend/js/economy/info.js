import { createBoardListPage } from '/js/board/list-page.js';
import { ECONOMY_INFO_BOARD } from '/js/economy/info-board.js';

const page = createBoardListPage(ECONOMY_INFO_BOARD);

export const init = () => page.init();
export const cleanup = () => page.cleanup();
