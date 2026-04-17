// 버튼을 누르면 백엔드(FastAPI)에서 데이터를 가져오는 함수
async function fetchFruits() {
    try {
        const response = await fetch('http://127.0.0.1:8000/api/fruits');
        const data = await response.json();

        // 제목 바꾸기
        document.getElementById('list-title').innerText = data.title;

        // 리스트 초기화 후 데이터 넣기
        const listElement = document.getElementById('fruit-list');
        listElement.innerHTML = ''; 
        
        data.items.forEach(fruit => {
            const li = document.createElement('li');
            li.innerText = fruit;
            listElement.appendChild(li);
        });
    } catch (error) {
        console.error("데이터를 가져오는데 실패했어요:", error);
    }
}

// 버튼 클릭 이벤트 연결
document.getElementById('fetch-btn').addEventListener('click', fetchFruits);

// 페이지 로드 시 바로 실행
fetchFruits();