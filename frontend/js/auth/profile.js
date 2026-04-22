// frontend/js/auth/profile.js

// 1. 페이지가 로드될 때 내 정보를 불러와서 화면에 채워 넣습니다.
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/users/me'); // 백엔드에 내 정보 요청
        const result = await response.json();

        if (result.loggedIn) {
            // 가져온 정보를 화면의 입력칸에 꽂아 넣습니다.
            document.getElementById('user_id').value = result.user_id || '';
            document.getElementById('nickname').value = result.nickname || '';
            
            // 💡 백엔드 /me 라우터에서 phone 값을 반환해주어야 여기에 표시됩니다.
            if (result.phone) {
                document.getElementById('phone').value = result.phone;
            }
        } else {
            // 로그인이 안 되어 있다면 로그인 페이지로 돌려보냅니다.
            alert("로그인이 필요한 서비스입니다.");
            window.location.href = "/pages/auth/login"; 
        }
    } catch (error) {
        console.error("정보를 불러오는 중 에러 발생:", error);
    }
});

// 2. '저장하기' 버튼 클릭 시 정보 수정 요청을 보냅니다.
document.getElementById('update-btn').addEventListener('click', async () => {
    // 입력된 값 가져오기 (양쪽 공백 제거)
    const nicknameInput = document.getElementById('nickname').value.trim();
    const phoneInput = document.getElementById('phone').value.trim();

    // 빈 칸 방지 (DB에 필수값으로 설정했으므로 프론트에서도 막아줍니다)
    if (!nicknameInput) {
        alert("닉네임을 입력해주세요.");
        return;
    }
    if (!phoneInput) {
        alert("전화번호를 입력해주세요.");
        return;
    }

    // 서버로 보낼 데이터 포장 (UserUpdate 스키마 형태)
    const updateData = {
        nickname: nicknameInput,
        phone: phoneInput
    };

    try {
        // PUT 메서드로 수정 요청 보내기
        const response = await fetch('/api/users/me', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            // 성공 시 새로고침하여 바뀐 정보를 다시 화면에 깔끔하게 반영합니다.
            window.location.reload(); 
        } else {
            alert("수정 실패: " + result.message);
        }
    } catch (error) {
        console.error("수정 요청 중 에러 발생:", error);
        alert("서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
    }
});