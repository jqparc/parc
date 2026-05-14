export const ECONOMY_INFO_BOARD = {
    boardCode: 'economy-info',
    pageSize: 10,
    selectors: {
        container: '.table-container',
        listBody: '#economy-list',
        pagination: '#pagination-container',
        writeButton: '.write-btn',
    },
    paths: {
        list: '/economy/info',
        write: '/board/write?board=economy-info&return=/economy/info',
        detail: (post) => `/economy/info/${post.id}`,
    },
    columns: ['number', 'title', 'created_at'],
    canWrite: (user) => user?.role === 'ADMIN',
    messages: {
        empty: '등록된 경제 정보가 없습니다.',
        loadError: '경제 정보를 불러오지 못했습니다.',
    },
};
