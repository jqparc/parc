// frontend/js/auth/login.js
document.getElementById('login-btn').addEventListener('click', async () => {
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    if (!usernameInput || !passwordInput) return;

    const loginData = { username: usernameInput, password: passwordInput };

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();

        if (result.success) {
            // ⭐ 변경된 부분: LocalStorage에 저장하는 코드를 완전히 지웠습니다! ⭐
            // 브라우저가 헤더를 읽고 알아서 쿠키를 저장했으므로, 우리는 그냥 성공 화면만 띄우면 됩니다.
            
            alert(result.message);
            window.location.href = "/"; 
        } else {
            alert("로그인 실패: " + result.message);
        }
    } catch (error) {
        console.error(error);
    }
});