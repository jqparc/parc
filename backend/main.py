from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles # 정적 파일(CSS, JS) 설정을 위해 필요
from fastapi.responses import FileResponse # HTML 파일을 보내주기 위해 필요
from fastapi.middleware.cors import CORSMiddleware
import os

# FastAPI 앱 생성
app = FastAPI()

# CORS 설정 (프론트엔드와 백엔드가 다른 폴더/포트에서 실행될 때 통신을 허용해줍니다)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 주의: 실제 배포할 때는 "*" 대신 프론트엔드 주소를 명시해야 합니다.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. 정적 파일 설정 (중요!)
# frontend 폴더 안에 있는 css, js, 이미지 파일들을 브라우저가 읽을 수 있게 길을 열어줍니다.
# 경로가 '../frontend'인 이유는 main.py가 backend 폴더 안에 있기 때문입니다.
app.mount("/static", StaticFiles(directory="../frontend"), name="static")

# 3. 메인 페이지 연결
@app.get("/")
async def read_index():
    # 사용자가 http://127.0.0.1:8000 에 접속하면 index.html을 보내줍니다.
    return FileResponse("../frontend/pages/index.html")

# 4. 다른 페이지(예: 로그인) 연결
@app.get("/login")
async def read_login():
    # 사용자가 http://127.0.0.1:8000/login 에 접속하면 pages 폴더의 파일을 보내줍니다.
    return FileResponse("../frontend/pages/login.html")

# 5. 기존의 데이터 API (이전과 동일)
@app.get("/api/fruits")
def get_fruits():
    return {
        "title": "오늘의 과일 목록",
        "items": ["🍎 사과", "🍌 바나나", "🍇 포도"]
    }