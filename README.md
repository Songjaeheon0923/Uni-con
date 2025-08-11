# Uni-con - 대학생 룸메이트 매칭 서비스

> 🏠 대학생을 위한 똑똑한 룸메이트 매칭 플랫폼

Uni-con은 대학생들이 생활 패턴과 성향을 기반으로 최적의 룸메이트를 찾을 수 있도록 도와주는 모바일 앱입니다.

## 🌟 주요 기능

- **🔐 사용자 인증**: 안전한 회원가입 및 로그인 시스템
- **🏠 방 탐색**: 서울 지역 부동산 매물 검색 및 지도 보기
- **❤️ 찜하기**: 관심 있는 방을 찜 목록에 추가/삭제
- **📋 프로필 설정**: 6개 카테고리의 생활 패턴 질문지
- **🤝 스마트 매칭**: 호환성 기반 룸메이트 추천 알고리즘
- **💬 실시간 채팅**: 매칭된 룸메이트와 즉시 소통
- **📍 현재 위치**: GPS 기반 현재 지역 매물 표시
- **📱 크로스 플랫폼**: React Native로 iOS/Android 지원
- **🗺️ 인터랙티브 맵**: 매물 위치를 지도에서 확인 및 현재 위치 버튼

## 🛠️ 기술 스택

### Backend

- **FastAPI** - 고성능 Python 웹 프레임워크
- **SQLite** - 경량 데이터베이스
- **bcrypt** - 보안 비밀번호 해싱
- **Pydantic** - 데이터 검증 및 설정 관리

### Frontend

#### Web (frontend-test)
- **Vanilla JavaScript** - 순수 자바스크립트 SPA
- **Bootstrap 5** - 모던 UI 컴포넌트
- **CSS3** - 커스텀 스타일링
- **HTML5** - 시맨틱 마크업

#### Mobile (frontend-react-native)
- **React Native** - 크로스 플랫폼 모바일 개발
- **Expo** - React Native 개발 플랫폼
- **React Navigation** - 네비게이션 라이브러리
- **React Native Maps** - 지도 및 위치 서비스

## 🚀 빠른 시작

### 사전 요구사항

- Python 3.8 이상
- pip (Python 패키지 매니저)

### 🔥 한 번에 실행하기

```bash
# 1. 프로젝트 클론 및 이동
git clone https://github.com/Songjaeheon0923/Uni-con.git
cd Uni-con

# 2. 백엔드 설정 및 실행
cd backend
pip install -r requirements.txt
python main.py

# 새 터미널을 열고:
# 3-A. 웹 프론트엔드 실행
cd frontend-test
python serve.py

# 또는
# 3-B. 모바일 앱 실행
cd frontend-react-native
npm install
cp .env.example .env  # 환경변수 설정 후 IP 주소 수정 필요
npx expo start

# 4. 웹: http://localhost:3000 또는 모바일: Expo Go 앱으로 접속
```

### 단계별 실행 (상세)

### 1. 프로젝트 클론 및 이동

```bash
git clone https://github.com/Songjaeheon0923/Uni-con.git
cd Uni-con
```

### 2. 백엔드 서버 실행

```bash
# 백엔드 디렉토리로 이동
cd backend

# Python 의존성 설치
pip install -r requirements.txt

# 서버 실행 (모바일 접근을 위해 0.0.0.0으로 바인딩)
python main.py
```

✅ 백엔드 서버가 **http://0.0.0.0:8080** (모든 인터페이스)에서 실행되어 모바일에서도 접근 가능합니다.

### 3. 프론트엔드 서버 실행 (새 터미널)

#### Option A: 웹 버전 실행

```bash
# 웹 프론트엔드 디렉토리로 이동
cd frontend-test

# 웹 프론트엔드 서버 실행
python serve.py
```

✅ 웹 프론트엔드가 **http://localhost:3000**에서 실행됩니다.

#### Option B: 모바일 앱 실행

```bash
# React Native 디렉토리로 이동
cd frontend-react-native

# 의존성 설치
npm install

# 환경변수 설정 (중요!)
cp .env.example .env
# .env 파일을 열어서 YOUR_LOCAL_IP를 본인의 IP 주소로 변경
# 예: EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8080

# Expo 개발 서버 실행
npx expo start
```

✅ Expo 개발 서버가 실행되며, QR 코드로 모바일에서 접속 가능합니다.

**🚨 중요**: 모바일에서 접근하려면 `.env` 파일의 `EXPO_PUBLIC_API_BASE_URL`을 본인의 실제 IP 주소로 설정해야 합니다.

### 4. 서비스 접속

- **웹**: 브라우저에서 **http://localhost:3000**으로 접속
- **모바일**: Expo Go 앱으로 QR 코드 스캔하여 접속

## 🚨 모바일 개발 환경 설정

### IP 주소 확인 및 설정

모바일에서 백엔드 서버에 접속하려면 `localhost` 대신 실제 IP 주소를 사용해야 합니다.

```bash
# 맥에서 IP 주소 확인
ifconfig | grep "inet " | grep -v 127.0.0.1

# 예시 출력: inet 192.168.1.100 netmask 0xffffff00 broadcast 192.168.1.255
```

`.env` 파일 설정:
```bash
# frontend-react-native/.env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8080  # 본인의 IP로 변경
```

### 네트워크 문제 해결

**"Network request failed" 오류 시 확인사항:**

1. ✅ 백엔드 서버가 `0.0.0.0:8080`에서 실행 중인지 확인
2. ✅ `.env` 파일의 IP 주소가 올바른지 확인  
3. ✅ 모바일과 컴퓨터가 같은 Wi-Fi에 연결되어 있는지 확인
4. ✅ 방화벽이 8080 포트를 차단하지 않는지 확인

## 📱 사용법

### 1. 회원가입 및 로그인

- 이메일, 이름, 비밀번호로 간편 회원가입
- 로그인 후 개인 대시보드 접근

### 2. 프로필 설정

6개 카테고리의 질문에 답변하여 나만의 프로필을 완성하세요:

- 🕐 **수면 패턴**: 아침형 vs 저녁형
- 🏠 **집 머무는 시간**: 낮/밤/불규칙
- 🧹 **청소 빈도**: 매일/주간/필요시
- 🔍 **청소 민감도**: 민감함/보통/둔감함
- 🚭 **흡연 상태**: 4가지 세부 옵션
- 🔊 **소음 민감도**: 민감함/보통/둔감함

### 3. 룸메이트 매칭 및 채팅

- 완성된 프로필을 바탕으로 호환성 점수 계산
- 0.0~1.0 범위의 상세한 매칭 점수 표시  
- 찜한 방에서 매칭된 룸메이트 목록 조회
- 실시간 채팅으로 즉시 소통 가능

## 🏗️ 프로젝트 구조

```
Uni-con/
├── 📁 backend/                     # 백엔드 FastAPI 애플리케이션
│   ├── 🐍 main.py                 # 서버 진입점
│   ├── 📄 requirements.txt        # Python 의존성
│   ├── 🗄️ users.db               # SQLite 데이터베이스
│   ├── 📂 routers/               # API 라우터들
│   │   ├── auth.py               # 인증 API
│   │   ├── users.py              # 사용자 API
│   │   └── profile.py            # 프로필 API
│   ├── 📂 models/                # 데이터 모델
│   ├── 📂 database/              # DB 연결 관리
│   └── 📂 utils/                 # 유틸리티 함수
├── 📁 frontend-test/               # 웹 프론트엔드 (테스트)
│   ├── 🌐 index.html             # 메인 페이지
│   ├── ⚡ script.js              # JavaScript 로직
│   ├── 🎨 style.css              # 커스텀 스타일
│   └── 🐍 serve.py               # 개발 서버
├── 📁 frontend-react-native/       # 모바일 앱 (React Native)
│   ├── 📱 App.js                 # 메인 앱 컴포넌트
│   ├── 📄 package.json           # 의존성 관리
│   ├── 🔧 .env.example          # 환경변수 예시
│   ├── 📂 src/                   # 소스 코드
│   │   ├── 📂 components/        # 재사용 가능한 컴포넌트
│   │   ├── 📂 screens/           # 화면 컴포넌트 (Home, Map, Profile, Login, Signup 등)
│   │   ├── 📂 services/          # API 서비스
│   │   └── 📂 data/              # 더미 데이터
│   └── 🎨 app.json              # Expo 설정
├── 📄 README.md                  # 이 파일
├── 📄 CLAUDE.md                  # 개발 가이드
└── 📄 package.json               # 프로젝트 메타데이터
```

## 🔧 API 엔드포인트

### 인증 (`/auth`)

- `POST /auth/signup` - 회원가입
- `POST /auth/login` - 로그인
- `POST /auth/logout` - 로그아웃

### 사용자 (`/users`)

- `GET /users/me` - 내 정보 조회
- `PUT /users/profile/me` - 프로필 업데이트

### 방/매물 (`/rooms`)

- `GET /rooms/search` - 매물 검색 (경계 좌표 기반)
- `GET /rooms/{id}` - 특정 매물 상세 정보
- `GET /rooms/{id}/market-price` - 시세 정보
- `POST /rooms/` - 새 매물 등록

### 찜하기 (`/favorites`)

- `POST /favorites/` - 찜 추가
- `DELETE /favorites/{room_id}` - 찜 삭제
- `GET /favorites/user/{user_id}` - 사용자 찜 목록
- `GET /favorites/{room_id}/users` - 특정 방을 찜한 사용자들
- `GET /favorites/{room_id}/check` - 찜 상태 확인
- `GET /favorites/{room_id}/matched-roommates` - 매칭된 룸메이트 조회 (궁합점수 포함)

### 프로필 (`/profile`)

- `GET /profile/questions` - 질문지 조회
- `GET /profile/me` - 내 프로필 조회
- `GET /profile/matches` - 매칭 결과 조회

📖 **상세 API 문서**: http://0.0.0.0:8080/docs (Swagger UI)

## 🧠 매칭 알고리즘

Uni-con은 과학적인 호환성 평가 시스템을 사용합니다:

### 호환성 점수 계산

- **Compatible** (1.0) - 완벽한 매치
- **Neutral** (0.5) - 수용 가능한 차이
- **Incompatible** (0.0) - 호환성 부족

### 가중치 시스템

1. **흡연 상태** (가중치: 매우 높음) - 건강과 직결
2. **청소 민감도** (가중치: 높음) - 갈등 방지 핵심
3. **수면 패턴** (가중치: 높음) - 생활 리듬 조화
4. **소음 민감도** (가중치: 높음) - 평화로운 공존
5. **청소 빈도** (가중치: 보통) - 생활 습관 조화
6. **집 머무는 시간** (가중치: 보통) - 개인 공간 배려

## 💾 데이터베이스

### Users 테이블

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    hashed_password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### User Profiles 테이블

```sql
CREATE TABLE user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    sleep_type TEXT,
    home_time TEXT,
    cleaning_frequency TEXT,
    cleaning_sensitivity TEXT,
    smoking_status TEXT,
    noise_sensitivity TEXT,
    is_complete BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Rooms 테이블

```sql
CREATE TABLE rooms (
    room_id TEXT PRIMARY KEY,
    address TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    price_deposit INTEGER NOT NULL,
    price_monthly INTEGER DEFAULT 0,
    area REAL NOT NULL,
    rooms INTEGER NOT NULL,
    bathrooms INTEGER NOT NULL,
    floor_info TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    risk_score INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Favorites 테이블

```sql
CREATE TABLE favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, room_id)
);
```

## 🔒 보안 특징

- **bcrypt 해싱**: 안전한 비밀번호 저장
- **세션 기반 인증**: 간단하고 안전한 로그인 관리
- **입력 검증**: Pydantic을 통한 데이터 유효성 검사
- **CORS 설정**: 안전한 크로스 오리진 요청 처리

## 🧪 테스트

### 수동 테스트 완료 ✅

- 사용자 등록 및 로그인 플로우
- 프로필 질문지 완성
- 데이터베이스 저장 확인
- API 엔드포인트 기능성
- 프론트엔드-백엔드 통합
- 모바일 반응형 디자인

### 데이터베이스 확인

```bash
# 백엔드 디렉토리에서
cd backend

# 사용자 데이터 확인
sqlite3 users.db "SELECT * FROM users;"

# 프로필 데이터 확인
sqlite3 users.db "SELECT * FROM user_profiles;"
```

## 🚧 현재 제한사항 (MVP)

- **단일 세션**: 서버 재시작시 로그인 해제
- **SQLite 사용**: 개발용 데이터베이스
- **목 상태 채팅**: 실제 메시징 기능 없음
- **부동산 더미 데이터**: 실제 API 연동 안됨

## 🎯 향후 개발 계획

### Phase 1: 프로덕션 준비

- [ ] JWT 토큰 인증 시스템
- [ ] PostgreSQL 데이터베이스 마이그레이션
- [ ] Docker 컨테이너화
- [ ] 환경 변수 설정
- [ ] 로깅 시스템 구축

### Phase 2: 기능 확장

- [ ] 사용자 프로필 사진
- [ ] 고급 매칭 필터
- [ ] 인앱 메시징 시스템
- [ ] 룸메이트 요청/승인 워크플로우
- [ ] 관리자 대시보드

### Phase 3: 스케일링

- [ ] 캐싱 레이어 구현
- [ ] 데이터베이스 최적화
- [ ] CDN 정적 자산 배포
- [ ] 성능 모니터링
- [ ] 로드 테스팅

## 🤝 기여하기

1. 프로젝트 포크
2. 기능 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치 푸시 (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

## 📞 문의 및 지원

- **개발자**: Songjaeheon0923
- **GitHub**: https://github.com/Songjaeheon0923/Uni-con
- **이슈 제보**: GitHub Issues 탭 이용

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

---

**⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!**

대학생활의 새로운 시작을 Uni-con과 함께하세요! 🎓✨
