// frontend/js/api.js
import { CONFIG } from './config.js';

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
            
            if (endpoint.includes('/users/me') || endpoint.includes('/logout')) {
                return null; // 에러를 발생시키지 않고 빈 값을 돌려줍니다.
            }
            
            // 로그인 이외의 통신에서 401이 나면 진짜 세션 만료!
            alert("세션이 만료되었습니다. 다시 로그인해 주세요.");
            window.location.href = '/pages/auth/login.html';
            return null; 
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.detail || `서버 에러 발생: ${response.status}`);
        }

        return data; 

    } catch (error) {
        console.error(`[API 통신 에러 - ${endpoint}]:`, error.message);
        throw error; 
    }
}