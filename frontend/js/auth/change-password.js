// frontend/js/auth/change-password.js

document.getElementById('change-pw-btn').addEventListener('click', async () => {
    const currentPassword = document.getElementById('current_password').value;
    const newPassword = document.getElementById('new_password').value;
    const confirmPassword = document.getElementById('confirm_password').value;

    // 1. 유효성 검사
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert("모든 빈칸을 입력해주세요.");
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("새 비밀번호가 일치하지 않습니다. 다시 확인해주세요.");
        return;
    }

    if (newPassword.length < 4) {
        alert("새 비밀번호는 4글자 이상이어야 합니다.");
        return;
    }

    // 2. 서버로 전송할 데이터 포장
    const requestData = {
        current_password: currentPassword,
        new_password: newPassword
    };

    try {
        const response = await fetch('/api/users/me/password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message + "\n다시 로그인해주세요.");
            // 비밀번호가 바뀌었으므로 보안을 위해 로그아웃 처리하거나 메인으로 이동
            window.location.href = "/"; 
        } else {
            alert("변경 실패: " + result.message);
        }
    } catch (error) {
        console.error("오류 발생:", error);
        alert("서버와 통신 중 에러가 발생했습니다.");
    }
});