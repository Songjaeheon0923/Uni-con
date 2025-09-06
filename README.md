# Uni-con 🏠

<div align="center">
  <table style="border: none;">
    <tr>
      <td align="center" style="vertical-align: middle; padding-right: 20px; border: none;">
        <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/logo.svg" alt="Uni-con Logo" width="200" style="background-color: white; border-radius: 8px; padding: 10px; border: none;"/>
      </td>
      <td align="center" style="vertical-align: middle; padding-left: 20px; border: none;">
        <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/icon.png" alt="Uni-con Icon" width="100" style="border: none;"/>
      </td>
    </tr>
  </table>
  <h3>청년을 위한 스마트 방 찾기 & 룸메이트 매칭 플랫폼</h3>
  <p>저장된 성향을 바탕으로 나와 딱 맞는 룸메이트를 추천해드려요!</p>
</div>

<div align="center">

  
  <!-- 앱 스크린샷 슬라이더 -->
  <div style="max-width: 600px; margin: 0 auto; position: relative;">
    <input type="radio" name="carousel" id="slide1" checked style="display: none;">
    <input type="radio" name="carousel" id="slide2" style="display: none;">
    <input type="radio" name="carousel" id="slide3" style="display: none;">
    <input type="radio" name="carousel" id="slide4" style="display: none;">
    <input type="radio" name="carousel" id="slide5" style="display: none;">
    <input type="radio" name="carousel" id="slide6" style="display: none;">

    <div style="overflow: hidden; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
      <div style="display: flex; transition: transform 0.5s ease;">
        <div style="min-width: 100%; text-align: center; padding: 20px;">
          <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/main/login.png" alt="로그인 화면" width="250"/>
          <br/><br/>
          <strong>로그인 화면</strong>
          <br/>
          <sub>간편한 이메일 로그인</sub>
        </div>
        <div style="min-width: 100%; text-align: center; padding: 20px;">
          <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/main/mainpage.png" alt="메인 화면" width="250"/>
          <br/><br/>
          <strong>메인 화면</strong>
          <br/>
          <sub>모든 기능이 한눈에</sub>
        </div>
        <div style="min-width: 100%; text-align: center; padding: 20px;">
          <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/map/map.png" alt="지도 화면" width="250"/>
          <br/><br/>
          <strong>지도 검색</strong>
          <br/>
          <sub>위치 기반 매물 탐색</sub>
        </div>
        <div style="min-width: 100%; text-align: center; padding: 20px;">
          <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/matching/matching_bytest.png" alt="룸메이트 매칭" width="250"/>
          <br/><br/>
          <strong>룸메이트 매칭</strong>
          <br/>
          <sub>AI 기반 맞춤 매칭</sub>
        </div>
        <div style="min-width: 100%; text-align: center; padding: 20px;">
          <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/chat/chat_main.png" alt="채팅 화면" width="250"/>
          <br/><br/>
          <strong>실시간 채팅</strong>
          <br/>
          <sub>안전한 소통 공간</sub>
        </div>
        <div style="min-width: 100%; text-align: center; padding: 20px;">
          <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/contract/contract_start.png" alt="계약서 분석" width="250"/>
          <br/><br/>
          <strong>계약서 분석</strong>
          <br/>
          <sub>AI 계약서 검토</sub>
        </div>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div style="text-align: center; margin-top: 15px;">
      <label for="slide1" style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #ddd; margin: 0 5px; cursor: pointer; transition: background 0.3s;"></label>
      <label for="slide2" style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #ddd; margin: 0 5px; cursor: pointer; transition: background 0.3s;"></label>
      <label for="slide3" style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #ddd; margin: 0 5px; cursor: pointer; transition: background 0.3s;"></label>
      <label for="slide4" style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #ddd; margin: 0 5px; cursor: pointer; transition: background 0.3s;"></label>
      <label for="slide5" style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #ddd; margin: 0 5px; cursor: pointer; transition: background 0.3s;"></label>
      <label for="slide6" style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #ddd; margin: 0 5px; cursor: pointer; transition: background 0.3s;"></label>
    </div>

    <!-- Left Arrow - Previous -->
    <label for="slide6" id="prev1" style="position: absolute; top: 50%; left: 15px; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 50%; font-size: 18px; user-select: none; display: none;">❮</label>
    <label for="slide1" id="prev2" style="position: absolute; top: 50%; left: 15px; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 50%; font-size: 18px; user-select: none; display: none;">❮</label>
    <label for="slide2" id="prev3" style="position: absolute; top: 50%; left: 15px; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 50%; font-size: 18px; user-select: none; display: none;">❮</label>
    <label for="slide3" id="prev4" style="position: absolute; top: 50%; left: 15px; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 50%; font-size: 18px; user-select: none; display: none;">❮</label>
    <label for="slide4" id="prev5" style="position: absolute; top: 50%; left: 15px; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 50%; font-size: 18px; user-select: none; display: none;">❮</label>
    <label for="slide5" id="prev6" style="position: absolute; top: 50%; left: 15px; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 50%; font-size: 18px; user-select: none; display: none;">❮</label>

    <!-- Right Arrow - Next -->
    <label for="slide2" id="next1" style="position: absolute; top: 50%; right: 15px; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 50%; font-size: 18px; user-select: none; display: none;">❯</label>
    <label for="slide3" id="next2" style="position: absolute; top: 50%; right: 15px; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 50%; font-size: 18px; user-select: none; display: none;">❯</label>
    <label for="slide4" id="next3" style="position: absolute; top: 50%; right: 15px; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 50%; font-size: 18px; user-select: none; display: none;">❯</label>
    <label for="slide5" id="next4" style="position: absolute; top: 50%; right: 15px; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 50%; font-size: 18px; user-select: none; display: none;">❯</label>
    <label for="slide6" id="next5" style="position: absolute; top: 50%; right: 15px; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 50%; font-size: 18px; user-select: none; display: none;">❯</label>
    <label for="slide1" id="next6" style="position: absolute; top: 50%; right: 15px; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 50%; font-size: 18px; user-select: none; display: none;">❯</label>
  </div>

  <style>
    /* Slide positioning */
    #slide1:checked ~ div div { transform: translateX(0%); }
    #slide2:checked ~ div div { transform: translateX(-100%); }
    #slide3:checked ~ div div { transform: translateX(-200%); }
    #slide4:checked ~ div div { transform: translateX(-300%); }
    #slide5:checked ~ div div { transform: translateX(-400%); }
    #slide6:checked ~ div div { transform: translateX(-500%); }
    
    /* Dot indicators */
    #slide1:checked ~ div:nth-of-type(2) label:nth-of-type(1) { background: #333; }
    #slide2:checked ~ div:nth-of-type(2) label:nth-of-type(2) { background: #333; }
    #slide3:checked ~ div:nth-of-type(2) label:nth-of-type(3) { background: #333; }
    #slide4:checked ~ div:nth-of-type(2) label:nth-of-type(4) { background: #333; }
    #slide5:checked ~ div:nth-of-type(2) label:nth-of-type(5) { background: #333; }
    #slide6:checked ~ div:nth-of-type(2) label:nth-of-type(6) { background: #333; }

    /* Arrow visibility */
    #slide1:checked ~ #prev1 { display: block; }
    #slide1:checked ~ #next1 { display: block; }
    #slide2:checked ~ #prev2 { display: block; }
    #slide2:checked ~ #next2 { display: block; }
    #slide3:checked ~ #prev3 { display: block; }
    #slide3:checked ~ #next3 { display: block; }
    #slide4:checked ~ #prev4 { display: block; }
    #slide4:checked ~ #next4 { display: block; }
    #slide5:checked ~ #prev5 { display: block; }
    #slide5:checked ~ #next5 { display: block; }
    #slide6:checked ~ #prev6 { display: block; }
    #slide6:checked ~ #next6 { display: block; }
  </style>


</div>

## 📱 주요 기능

### 🏡 스마트 매물 검색
<div align="center">
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/roomitem/roomitem1.png" alt="매물 상세보기" width="200"/>
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/roomitem/roomitem2.png" alt="매물 정보" width="200"/>
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/interested/interested.png" alt="관심 매물" width="200"/>
</div>

- **실시간 매물 정보**: 최신 원룸, 투룸, 오피스텔, 아파트 정보 제공
- **상세 매물 보기**: 풍부한 이미지와 상세 정보로 매물 파악
- **관심 매물 저장**: 마음에 드는 매물을 북마크하여 쉽게 관리
- **매물 공유 기능**: SNS나 채팅으로 매물 정보 간편 공유

### 🗺️ 지도 기반 탐색
<div align="center">
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/map/map.png" alt="지도 검색" width="200"/>
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/map/map_big.png" alt="지도 확대" width="200"/>
</div>

- **직관적인 위치 검색**: Google Maps 기반 실시간 매물 위치 표시
- **상세 필터링**: 가격, 면적, 교통, 옵션별 맞춤 검색
- **주변 정보**: 대학교, 지하철역, 편의시설 거리 정보 제공

### 👥 AI 룸메이트 매칭
<div align="center">
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/matching/test_start.png" alt="매칭 테스트" width="200"/>
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/matching/test_result.png" alt="테스트 결과" width="200"/>
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/matching/matching_bytest.png" alt="룸메이트 매칭" width="200"/>
</div>

- **성향 분석 테스트**: 생활 패턴, 청소 습관, 수면 패턴 등 다양한 요소 분석
- **맞춤형 추천**: AI 알고리즘을 통한 최적의 룸메이트 매칭
- **매칭률 표시**: 나와의 궁합도를 퍼센트로 확인
- **안전한 연결**: 대학교 이메일 인증을 통한 신뢰할 수 있는 매칭

### 💬 실시간 채팅
<div align="center">
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/chat/chat_main.png" alt="채팅 목록" width="200"/>
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/chat/chat_inchat.png" alt="채팅 화면" width="200"/>
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/chat/chat_inchat_modalchange1.png" alt="채팅 기능" width="200"/>
</div>

- **매물 공유**: 채팅창에서 바로 매물 정보 공유
- **빠른 액션**: 규칙/가이드, 정산/결제 등 편의 기능
- **안전한 소통**: 본인 인증 완료된 사용자들과의 안전한 대화
- **채팅 관리**: 차단, 신고 등 안전 기능 제공

### 🤖 AI 정책 챗봇
<div align="center">
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/notice/notice_main.png" alt="정책 메인" width="200"/>
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/notice/notice_ai.png" alt="AI 챗봇" width="200"/>
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/notice/notice_detail.png" alt="정책 상세" width="200"/>
</div>

- **맞춤형 정책 안내**: 청년 주택 정책, 전세 대출 등 개인별 추천
- **실시간 AI 상담**: 복잡한 부동산 정책을 쉽게 설명
- **최신 정보**: 정부 정책 업데이트 실시간 반영
- **정책 상세보기**: 신청 방법, 조건 등 자세한 정보 제공

### 📋 계약서 AI 분석
<div align="center">
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/contract/contract_start.png" alt="계약서 분석 시작" width="200"/>
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/contract/contract_ing.png" alt="분석 중" width="200"/>
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/contract/contract_result_1.png" alt="분석 결과" width="200"/>
</div>

- **위험 조항 탐지**: AI가 계약서의 불리한 조항 자동 분석
- **체크리스트 제공**: 놓치기 쉬운 중요 사항 확인
- **법적 조언**: 전문가 수준의 계약서 검토 서비스
- **분석 리포트**: 상세한 계약서 분석 결과 제공

### 🏠 매물 찾기 도우미
<div align="center">
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/roomitem/roomitem_getroommate1.png" alt="룸메이트 찾기" width="200"/>
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/roomitem/roomitem_getroommate2.png" alt="함께 찾기" width="200"/>
</div>

- **함께 찾기**: 룸메이트와 함께 매물을 찾는 기능
- **조건 공유**: 서로의 조건을 맞춰 최적의 매물 추천
- **공동 관심 목록**: 둘 다 관심 있는 매물 자동 필터링

### 📱 기본 앱 기능
<div align="center">
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/main/splash.png" alt="스플래시" width="200"/>
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/main/login.png" alt="로그인" width="200"/>
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/main/mainpage.png" alt="메인 페이지" width="200"/>
  <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/main/mypage.png" alt="마이 페이지" width="200"/>
</div>

- **직관적인 UI/UX**: 깔끔하고 사용하기 쉬운 인터페이스
- **개인 정보 관리**: 프로필, 관심사, 매칭 기록 관리
- **다양한 로그인 방식**: 이메일, 소셜 로그인 지원

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
- 🆔 신분증 인증 (실제 로직 x)
- 🎓 학교 이메일 인증(MVP: 0000 입력으로 테스트)

### 메인 기능
- 🏠 매물 검색 및 상세보기
- 🗺️ 지도 기반 매물 탐색 (Google Maps API)
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
  <p>© 2025 Uni-con Team. All rights reserved.</p>
</div>