// frontend/js/economy_infos.js (또는 해당 페이지의 스크립트)

let currentPage = 1;
const pageSize = 10; // 한 페이지에 보여줄 글 수

async function loadEconomyPosts(page = 1) {
    const boardSlug = "economy-info";
    try {
        const response = await fetch(`/api/boards/${boardSlug}/posts?page=${page}&size=${pageSize}`);
        const data = await response.json();

        // data.total_count가 백엔드에서 넘어온다고 가정 (전체 글 개수)
        renderTable(data.posts, page, data.total_count); 
        renderPagination(data.total_pages, data.current_page);
    } catch (error) {
        console.error("데이터를 불러오는데 실패했습니다.", error);
    }
}

function renderTable(posts, page, totalCount) {
    const tbody = document.getElementById('economy-list');
    
    // 데이터가 없을 경우 처리
    if (posts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="padding:50px 0;">등록된 정보가 없습니다.</td></tr>`;
        return;
    }

    tbody.innerHTML = posts.map((post, index) => {
        // 역순 번호 계산: 전체 개수 - ((현재페이지 - 1) * 페이지크기) - 현재 인덱스
        // 예: 전체 35개, 1페이지면 35, 34, 33... / 2페이지면 25, 24, 23...
        const displayNum = totalCount - ((page - 1) * pageSize) - index;
        const dateStr = post.created_at.split('T')[0]; // "YYYY-MM-DD" 포맷팅

        return `
            <tr>
                <td>${displayNum}</td>
                <td class="td-title">
                    <a href="/economy/detail/${post.id}">${post.title}</a>
                </td>
                <td>${dateStr}</td>
            </tr>
        `;
    }).join('');
}

function renderPagination(totalPages, current) {
    const container = document.getElementById('pagination-container');
    let html = '';

    for (let i = 1; i <= totalPages; i++) {
        html += `
            <button class="page-btn ${i === current ? 'active' : ''}" 
                    onclick="loadEconomyPosts(${i})">
                ${i}
            </button>
        `;
    }
    container.innerHTML = html;
}

// 페이지 열릴 때 1페이지 로드
document.addEventListener('DOMContentLoaded', () => {
    loadEconomyPosts(1);
});