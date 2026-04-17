document.getElementById('signup-btn').addEventListener('click', async () => {
    // 1. 사용자가 입력한 값 가져오기
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    // 빈칸 및 길이 검사 (프론트엔드 1차 검문소)
    if (usernameInput.length < 3) {
        alert("아이디는 3글자 이상 입력해주세요!");
        return;
    }
    if (passwordInput.length < 4) {
        alert("비밀번호는 4글자 이상 입력해주세요!");
        return; 
    }

    // 2. 백엔드로 보낼 데이터를 JSON(보따리) 형태로 예쁘게 포장하기
    const userData = {
        username: usernameInput,
        password: passwordInput
    };

    try {
        // 3. 백엔드 주방 창구(/api/signup)로 데이터 쏘기 (POST 요청)
        const response = await fetch('/api/signup', {
            method: 'POST', // "데이터를 새로 만들겠다!"는 뜻
            headers: {
                'Content-Type': 'application/json' // "내가 보내는 보따리는 JSON 형식이야!"라고 알려줌
            },
            body: JSON.stringify(userData) // 자바스크립트 데이터를 진짜 JSON 문자열로 변환해서 본문에 담음
        });

        // 4. 백엔드 주방장(서버)이 일 처리를 끝내고 보낸 대답(결과) 받기
        const result = await response.json();

        // 5. 결과에 따라 사용자에게 알림창 띄우기
        if (result.success) {
            // 성공했을 때 (서버에서 보낸 성공 메시지 띄우고 메인 화면으로 이동)
            alert(result.message);
            window.location.href = "/"; 
        } else {
            // 실패했을 때 (예: 이미 존재하는 아이디 등 서버에서 보낸 에러 메시지 띄우기)
            alert("가입 실패: " + result.message);
        }
    } catch (error) {
        // 네트워크가 끊겼거나 서버가 꺼져있을 때
        console.error("서버와 통신 중 오류 발생:", error);
        alert("서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
    }
});