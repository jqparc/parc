// frontend/js/auth/profile.js
import { navigateTo } from "/js/router.js";
import { fetchAPI } from '/js/api.js';
import { CONFIG } from '/js/config.js';


export async function init() {
    try {
        const user = await fetchAPI('/users/me'); 

        // 1. 메뉴 데이터를 먼저 가져옵니다.
        const menuData = await fetchAPI('/menus');
        let tabData = [];
// 🔥 핵심 1: 메뉴 데이터가 아예 없거나 빈 배열일 경우 화면을 그리지 않고 index.html로 보냅니다.
        if (!menuData || !Array.isArray(menuData) || menuData.length === 0) {
            console.warn("표시할 메뉴 데이터가 없습니다. 메인 화면에 머뭅니다.");
            navigateTo('/'); 
            return; // 여기서 함수를 완전히 종료하여 아래 render 함수들이 실행되지 않게 막습니다.
        }
        // 2. 메뉴 데이터가 하나라도 존재한다면, 첫 번째 메뉴의 ID로 탭을 가져옵니다.
        if (menuData && menuData.length > 0) {
            const firstMenuId = menuData[0].menu_id; 
            tabData = await fetchAPI(`/tabs?menu_id=${firstMenuId}`);
        }

        // 3. 화면에 데이터 그리기
        renderMenuTable(menuData);
        renderTabTable(tabData);


    } catch (error) {
        console.error("데이터 로드 실패:", error);
        alert("로그인 세션이 만료되었거나 접근 권한이 없습니다. 다시 로그인해주세요.");
        navigateTo('/');
    }
}

function renderMenuTable(menus) {
    const tbody = document.getElementById('tbody-menu'); 
    if (!tbody) return;

    tbody.innerHTML = ''; 

    menus.forEach((menu, index) => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer'; // 클릭 가능한 요소임을 마우스 커서로 표시
        
        tr.innerHTML = `
            <td class="col-num">${menu.seq}</td>
            <td>${menu.menu_name}</td>
            <td>${menu.use_yn}</td>
        `;

        // 🔥 핵심: 각 행(tr)을 클릭했을 때의 동작을 정의합니다.
        tr.addEventListener('click', async () => {
            try {
                // 1. 클릭한 메뉴의 menu_id로 탭 데이터를 가져옵니다.
                const newTabData = await fetchAPI(`/tabs?menu_id=${menu.menu_id}`);
                
                // 2. 가져온 탭 데이터로 하단 탭 테이블을 다시 그립니다.
                renderTabTable(newTabData);

                // 3. (선택사항) 클릭한 메뉴가 무엇인지 시각적으로 표시 (하이라이트)
                Array.from(tbody.children).forEach(row => row.classList.remove('selected-row'));
                tr.classList.add('selected-row');

            } catch (error) {
                console.error("탭 데이터 로드 실패:", error);
                alert("탭 데이터를 불러오는데 실패했습니다.");
            }
        });

        // 처음 화면이 켜졌을 때 첫 번째 행에 하이라이트 클래스를 미리 넣어줍니다.
        if (index === 0) {
            tr.classList.add('selected-row');
        }

        tbody.appendChild(tr);
    });
}

// 하단 nav-tab (탭) 영역 렌더링
function renderTabTable(tabs) {
    // HTML에 작성된 <tbody> id를 가져옵니다. (오타 주의: infos가 아닌 inofs-list로 되어 있습니다)
    const tbody = document.getElementById('tbody-tab'); 
    if (!tbody) return;

    tbody.innerHTML = ''; // 기존 정적 내용 초기화

    tabs.forEach((tab) => {
        const tr = document.createElement('tr');
        // 백엔드 스키마 필드명(menu.name, menu.is_active 등)에 맞게 수정하세요.
        tr.innerHTML = `
            <td class="col-num">${tab.seq}</td>
            <td>${tab.tab_name}</td>
            <td>${tab.use_yn}</td>
        `;
        tbody.appendChild(tr);
    });
}