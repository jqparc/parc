// frontend/js/auth/login.js

// 이벤트 핸들러 함수는 반드시 밖으로 빼두어야 나중에 removeEventListener로 지울 수 있습니다.
const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    // 이메일과 비밀번호 값을 가져와 api.js의 fetch 로직을 태우는 코드가 들어갑니다.
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    console.log("로그인 시도:", email);
    // await apiRequest('/api/v1/auth/login', { method: 'POST', ... })
};

/**
 * 라우터가 페이지 HTML을 그린 직후 자동으로 호출하는 초기화 함수입니다.
 * DOM 요소를 찾고 이벤트를 등록하는 역할을 합니다.
 */
export function init() {
    console.log("로그인 페이지 로드됨");
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", handleLoginSubmit);
    }
}

/**
 * 다른 페이지로 이동하기 직전에 라우터가 호출하는 정리 함수입니다.
 * 화면이 사라지기 전에 등록했던 이벤트를 모두 해제하여 메모리 누수를 막습니다.
 */
export function cleanup() {
    console.log("로그인 페이지 이벤트 정리됨");
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.removeEventListener("submit", handleLoginSubmit);
    }
}