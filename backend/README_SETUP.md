# 백엔드 초기 설정 가이드

## 빠른 시작 (팀원용)

### 1. 환경 설정
```bash
cd backend
pip install -r requirements.txt
```

### 2. 환경 변수 설정
`.env` 파일 생성:
```
SEOUL_REAL_ESTATE_API_KEY=4a6c715a48686e313736737a59454b
KAKAO_REST_API_KEY=12c4923e5dee52a81fbf8bc840892f31
```

### 3. 데이터베이스 초기화 (중요!)
```bash
python setup_database.py
```
이 명령어로 2000+ 매물 데이터가 자동 생성됩니다.

### 4. 서버 실행
```bash
python main.py
```

## 문제 해결

### "매물이 5개밖에 없어요"
- `setup_database.py`를 실행하지 않았거나
- 데이터베이스 파일(`users.db`)이 없는 경우입니다
- 해결: `python setup_database.py` 실행

### 데이터베이스 파일 직접 받기
팀 리더에게 `users.db` 파일을 요청하여 `backend/` 폴더에 넣으세요.

## 데이터 구성
- 총 2102개 매물
- 서울 25개 구 전체 커버리지
- 실제 부동산 API 데이터 (가짜 데이터 없음)
- OpenStreetMap 지오코딩으로 정확한 좌표