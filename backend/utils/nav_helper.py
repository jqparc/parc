# backend/utils/nav_helper.py

def get_nav_context(active_top: str = None, active_dtl: str = None):
    # 1. 상위 탭 리스트 정의
    top_tabs = [
        {"id": "economy", "name": "경제", "url": "/economy/indicators"},
        {"id": "asset", "name": "자산", "url": "/asset/portfolio"},
        {"id": "dev", "name": "개발", "url": "/dev/blog"},
    ]

    # 2. 하위 탭 데이터 정의 (상위 ID를 키로 사용)
    dtl_data = {
        "economy": [
            {"id": "indc", "name": "경제 지표", "url": "/economy/indicators"},
            {"id": "news", "name": "경제 뉴스", "url": "/economy/news"},
            {"id": "info", "name": "경제 정보", "url": "/economy/infos"}
        ],
        "asset": [
            {"id": "port", "name": "자산 현황", "url": "/asset/portfolio"},
            {"id": "stck", "name": "투자(증권)", "url": "/asset/stock"}
        ],
        "dev": [
            {"id": "blog", "name": "개발 블로그", "url": "/dev/blog"},
            {"id": "tech", "name": "기술 스택", "url": "/dev/tech"}
        ]
    }

    # 3. 현재 상위 탭에 맞는 하위 탭들 가져오기
    current_dtl_tabs = dtl_data.get(active_top, [])

    return {
        "top_tabs": top_tabs,      # 👈 이제 상위 탭도 리스트로 던집니다!
        "nav_dtl_tabs": current_dtl_tabs,
        "active_top": active_top,
        "active_dtl": active_dtl
    }