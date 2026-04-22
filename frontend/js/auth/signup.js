// frontend/js/auth/signup.js
document.getElementById('signup-btn').addEventListener('click', async () => {
    // 1. username -> user_id로 변경 및 phone 추가
    const userIdInput = document.getElementById('user_id').value;
    const passwordInput = document.getElementById('password').value;
    const nicknameInput = document.getElementById('nickname').value;
    const phoneInput = document.getElementById('phone').value;

    // 빈칸 및 길이 검사
    if (userIdInput.length < 3) {
        alert("아이디는 3글자 이상 입력해주세요!");
        return;
    }
    if (passwordInput.length < 4) {
        alert("비밀번호는 4글자 이상 입력해주세요!");
        return; 
    }
    if (nickname.length == 0) {
        alert("닉네임을 입력하세요");
        return; 
    }
    if (passwordInput.length == 0) {
        alert("전화번호를 입력하세요");
        return; 
    }

    // ⭐ 2. 백엔드 스키마(UserCreate)와 동일한 이름표(key)로 데이터 포장하기
    const userData = {
        user_id: userIdInput,
        password: passwordInput,
        nickname: nicknameInput,
        // 전화번호를 입력하지 않았다면 null을 보내서 백엔드의 nullable=True 조건을 만족시킵니다.
        phone: phoneInput
    };

    try {
        const response = await fetch('/api/users/signup', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(userData) 
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            window.location.href = "/"; 
        } else {
            alert("가입 실패: " + result.message);
        }
    } catch (error) {
        console.error("서버와 통신 중 오류 발생:", error);
        alert("서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
    }
});