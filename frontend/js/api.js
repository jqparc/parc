// frontend/js/api.js
import { CONFIG } from '/js/config.js';

export async function fetchAPI(endpoint, options = {}) {
    const url = `${CONFIG.BASE_URL}${endpoint}`;
    
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        credentials: 'include' 
    };

    try {
        const response = await fetch(url, config);
        
        // 🔥 수정된 부분: 401 에러 처리 로직
        if (response.status === 401) {
            // 만약 지금 요청한 주소가 '/login'을 포함하고 있다면?
            if (endpoint.includes('/login')) {
                // 세션 만료가 아니라 '로그인 실패(비번 틀림 등)'이므로 에러를 뱉어냅니다.
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "아이디 또는 비밀번호가 올바르지 않습니다.");
            }
            
            if (endpoint.includes('/users/me') || endpoint.includes('/logout') || endpoint.includes('/menus')) {
                return null; // 에러를 발생시키지 않고 빈 값을 돌려줍니다.
            }
            
            // 로그인 이외의 통신에서 401이 나면 진짜 세션 만료!
            alert("세션이 만료되었습니다. 다시 로그인해 주세요.");
            window.location.href = '/pages/auth/login.html';
            return null; 
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            let errorMessage = `서버 에러 발생: ${response.status}`;
            try {
                // 백엔드에서 보내준 에러 JSON 데이터를 읽어옵니다.
                const errorData = await response.json();
                // FastAPI는 에러 메시지를 주로 'detail' 이라는 키워드에 담아 보냅니다.
                if (errorData && errorData.detail) {
                    errorMessage = errorData.detail;
                }
            } catch (e) {
                // JSON 파싱 실패 시 기본 에러 메시지 유지
            }
            
            // 최종적으로 알아듣기 쉬운 에러 메시지를 던집니다.
            throw new Error(errorMessage);
        }

        return data; 

    } catch (error) {
        console.error(`[API 통신 에러 - ${endpoint}]:`, error.message);
        throw error; 
    }
}