// 페이지 로드 시 내 정보 채우기
async function fetchProfile() {
    try {
        const response = await fetch('/api/users/profile');
        if (response.ok) {
            const data = await response.json();
            document.getElementById('username').value = data.username;
        } else {
            alert("로그인이 필요합니다.");
            location.href = "/login";
        }
    } catch (error) {
        console.error("프로필 로드 실패:", error);
    }
}

// 정보 수정 요청
async function updateProfile() {
    const password = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-password').value;

    if (password !== confirm) {
        alert("비밀번호가 일치하지 않습니다.");
        return;
    }

    const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password })
    });

    if (response.ok) {
        alert("정보가 수정되었습니다. 다시 로그인 해주세요.");
        // 비밀번호 변경 후엔 보통 로그아웃 처리
        location.href = "/logout"; 
    } else {
        alert("수정에 실패했습니다.");
    }
}

document.addEventListener('DOMContentLoaded', fetchProfile);