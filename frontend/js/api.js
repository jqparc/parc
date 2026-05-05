// frontend/js/api.js
import { CONFIG } from '/js/config.js';

// 💡 추가된 부분: 인증 관련 커스텀 에러 클래스
export class AuthError extends Error {
    constructor(message, status = 401) {
        super(message);
        this.name = "AuthError";
        this.status = status;
    }
}

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
            if (endpoint.includes(CONFIG.API_ENDPOINTS.LOGIN)) {
                const errorData = await response.json().catch(() => ({}));
                throw new AuthError(errorData.detail || "아이디 또는 비밀번호가 올바르지 않습니다.");
            }
            
            if (endpoint.includes(CONFIG.API_ENDPOINTS.USERS_ME) || 
                endpoint.includes(CONFIG.API_ENDPOINTS.LOGOUT) || 
                endpoint.includes(CONFIG.API_ENDPOINTS.MENUS)) {
                return null; // 에러를 발생시키지 않고 빈 값을 돌려줍니다.
            }
            
            // 💡 수정됨: alert 창과 navigateTo를 제거하고, 에러를 던져서 호출부에서 처리하도록 위임[cite: 1]
            throw new AuthError("SessionExpired");
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            let errorMessage = `서버 에러 발생: ${response.status}`;
            try {
                if (data && data.detail) {
                    errorMessage = data.detail; //[cite: 1]
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