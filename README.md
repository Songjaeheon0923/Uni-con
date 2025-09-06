# Uni-con 🏠

<div align="center">
  <img src="frontend-react-native/assets/logo.svg" alt="Uni-con Logo" width="200"/>
  <h3>청년을 위한 스마트 방 찾기 & 룸메이트 매칭 플랫폼</h3>
  <p>저장된 성향을 바탕으로 나와 딱 맞는 룸메이트를 추천해드려요!</p>
</div>

<div align="center">
  <img src="frontend-react-native/assets/mainpage.png" alt="Uni-con Main Page" width="300"/>
</div>

## 📱 주요 기능

### 🏡 스마트 매물 검색
- **실시간 매물 정보**: 최신 원룸, 투룸, 오피스텔, 아파트 정보 제공
- **지도 기반 검색**: 직관적인 위치 기반 매물 탐색
- **상세 필터링**: 가격, 면적, 교통, 옵션별 맞춤 검색
- **관심 매물 저장**: 마음에 드는 매물을 북마크하여 쉽게 관리

### 👥 AI 룸메이트 매칭
- **성향 분석**: 생활 패턴, 청소 습관, 수면 패턴 등 다양한 요소 분석
- **맞춤형 추천**: AI 알고리즘을 통한 최적의 룸메이트 매칭
- **매칭률 표시**: 나와의 궁합도를 퍼센트로 확인
- **안전한 연결**: 대학교 이메일 인증을 통한 신뢰할 수 있는 매칭

### 💬 실시간 채팅
- **매물 공유**: 채팅창에서 바로 매물 정보 공유
- **빠른 액션**: 규칙/가이드, 정산/결제 등 편의 기능
- **안전한 소통**: 본인 인증 완료된 사용자들과의 안전한 대화

### 🤖 AI 정책 챗봇
- **맞춤형 정책 안내**: 청년 주택 정책, 전세 대출 등 개인별 추천
- **실시간 상담**: 복잡한 부동산 정책을 쉽게 설명
- **최신 정보**: 정부 정책 업데이트 실시간 반영

### 📋 계약서 AI 분석
- **위험 조항 탐지**: AI가 계약서의 불리한 조항 자동 분석
- **체크리스트 제공**: 놓치기 쉬운 중요 사항 확인
- **법적 조언**: 전문가 수준의 계약서 검토 서비스

## 🏗️ 기술 스택

### Frontend (React Native + Expo)
- **React Native 0.79.5**: 크로스 플랫폼 모바일 앱 개발
- **Expo 53.0.22**: 빠른 개발과 배포를 위한 플랫폼
- **React Navigation**: 네비게이션 관리
- **AsyncStorage**: 로컬 데이터 저장
- **React Native Maps**: 지도 기능 구현
- **React Native Web**: 웹 플랫폼 지원
- **Expo EAS**: 앱 빌드 및 배포 자동화

### Backend (FastAPI + Python)
- **FastAPI**: 고성능 웹 API 프레임워크
- **SQLAlchemy**: ORM을 통한 데이터베이스 관리
- **PyJWT 2.8.0**: 안전한 사용자 인증
- **Pydantic**: 데이터 검증 및 직렬화
- **Uvicorn**: ASGI 서버

### AI & Data
- **OpenAI API**: GPT를 활용한 자연어 처리
- **Gemini API**: Google의 AI 모델 활용
- **FAISS**: 벡터 유사도 검색
- **OCR**: 계약서 텍스트 추출
- **크롤링**: 실시간 매물/정책 데이터 수집

### Database & Storage
- **SQLite**: 경량 관계형 데이터베이스
- **Vector Database**: AI 임베딩 저장소


## 🚀 설치 및 실행

### 필수 요구사항
- Node.js 18.x 이상
- Python 3.8 이상
- Git
- Expo Go 앱 (모바일 테스트용)

### 설치 방법

1. **저장소 클론**
```bash
git clone https://github.com/Songjaeheon0923/Uni-con.git
cd Uni-con
```

2. **백엔드 설정**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# .env 파일에서 API 키 설정
python main.py  # 서버가 http://localhost:8080 에서 실행됩니다
```

3. **프론트엔드 설정**
```bash
cd frontend-react-native
npm install
cp .env.example .env
# .env 파일에서 EXPO_PUBLIC_API_BASE_URL을 실제 IP 주소로 설정
# 예: EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8080
npx expo start
```

4. **앱 실행**
- **모바일**: Expo Go 앱을 설치하고 QR 코드 스캔
- **웹**: `w` 키를 눌러 웹 브라우저에서 실행
- **Android**: `a` 키를 눌러 Android 에뮬레이터에서 실행
- **iOS**: `i` 키를 눌러 iOS 시뮬레이터에서 실행 (Mac only)

### 빌드 및 배포

**APK 빌드**
```bash
cd frontend-react-native
eas build --platform android --profile production-apk
```

**웹 배포**
```bash
cd frontend-react-native
npm run build
npm run serve
```

## 📁 프로젝트 구조

```
Uni-con/
├── 📱 frontend-react-native/        # React Native 앱
│   ├── src/
│   │   ├── components/             # 재사용 컴포넌트
│   │   ├── screens/               # 화면 컴포넌트
│   │   ├── contexts/              # React Context
│   │   ├── services/              # API 통신
│   │   └── utils/                 # 유틸리티 함수
│   └── assets/                    # 이미지, 아이콘 등
├── 🖥️ backend/                     # FastAPI 서버
│   ├── auth/                      # 인증 관리
│   ├── database/                  # DB 연결 및 설정
│   ├── models/                    # 데이터 모델
│   ├── routers/                   # API 라우터
│   ├── ai/                        # AI 관련 모듈
│   ├── crawlers/                  # 데이터 크롤링
│   └── utils/                     # 백엔드 유틸리티
└── 📚 docs/                        # 문서
```

## 📱 주요 화면

### 회원가입 & 인증
- 📧 이메일 인증
- 📱 휴대폰 인증 (MVP: 0000 입력으로 테스트)
- 🆔 신분증 인증 (카메라 촬영)
- 🎓 학교 이메일 인증

### 메인 기능
- 🏠 매물 검색 및 상세보기
- 🗺️ 지도 기반 탐색 (Google Maps API)
- 👥 룸메이트 추천 및 매칭
- 💬 실시간 채팅
- 📋 계약서 분석

## 🔧 개발 가이드

### 브랜치 전략
- `main`: 프로덕션 배포용
- `develop`: 개발 통합 브랜치
- `web-version-improvements`: 웹 버전 개선 작업

### 테스트 계정
```
이메일: testuser@example.com
비밀번호: testpass
```

### 환경 변수 설정

**Backend (.env)**
```env
DATABASE_URL=sqlite:///./users.db
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Frontend (.env)**
```env
EXPO_PUBLIC_API_BASE_URL=http://your-ip:8080
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```


## 👥 Team

- **이성민** - *PM & Developer* - [@danlee-dev](https://github.com/danlee-dev)
- **송재헌** - *Developer* - [@Songjaeheon0923](https://github.com/Songjaeheon0923)
- **문유빈** - *Designer*


<div align="center">
  <p>Made with ❤️ for university students</p>
  <p>© 2025 Uni-con Team. All rights reserved.</p>
</div>