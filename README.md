# e:room

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
  <h3>청년을 위한 스마트 룸메이트 매칭 & 부동산 통합 관리 플랫폼</h3>
  <p>저장된 성향을 바탕으로 나와 딱 맞는 룸메이트를 추천해드려요!</p>
</div>

<div align="center">

  
  ## 📱 메인 앱 화면들
  
  <nobr>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/main/splash.png" alt="스플래시" width="200"/>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/main/login.png" alt="로그인" width="200"/>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/main/mainpage.png" alt="메인" width="200"/>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/main/mypage.png" alt="마이페이지" width="200"/>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/map/map.png" alt="지도 검색" width="200"/>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/matching/matching_bytest.png" alt="룸메이트 매칭" width="200"/>
  </nobr>


</div>

## 📱 주요 기능

### 🏡 매물 정보 & 관심 목록
<div align="center">
  <nobr>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/roomitem/roomitem1.png" alt="매물 상세보기" width="180"/>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/roomitem/roomitem2.png" alt="매물 정보" width="180"/>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/roomitem/roomitem_getroommate1.png" alt="룸메이트 구하기" width="180"/>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/interested/interested.png" alt="관심 매물" width="180"/>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/interested/interested_share.png" alt="매물 공유" width="180"/>
  </nobr>
</div>

- **실시간 매물 검색**: 서울 열린데이터 API 연동을 통한 실제 부동산 정보 제공
- **스마트 가격 표시**: 보증금/월세 자동 포맷팅
- **지하철 거리 계산**: 알고리즘 기반 최단거리 지하철역 자동 탐지 및 표시
- **관심매물 시스템**: 실시간 찜하기 기능으로 백엔드 동기화 및 즉시 반영
- **고급 필터링**: 매물 유형, 가격대, 면적, 거래 방식별 다중 조건 검색
- **룸메이트 모집**: 매물별 룸메이트 구인 게시글 작성 및 매칭 연동

### 🗺️ 지도 기반 매물 탐색
<div align="center">
  <nobr>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/map/map.png" alt="지도 검색" width="200"/>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/map/map_big.png" alt="지도 확대" width="200"/>
  </nobr>
</div>

- **하이브리드 지도 시스템**: Native는 react-native-maps, Web은 커스텀 지도 컴포넌트 사용
- **Google API 통합**: Google Geocoding API로 한국어 주소 검색 및 Places API 연동
- **실시간 좌표 매핑**: 실제 lat/lng 좌표를 통한 정확한 매물 위치 표시
- **동적 클러스터링**: 동일 건물 내 여러 매물의 스마트 그룹핑 및 표시
- **뷰포트 기반 로딩**: 지도 영역 변경 시 해당 구역 매물만 효율적 로딩
- **애니메이션 카드**: 매물 선택 시 하단 슬라이드 애니메이션으로 상세 정보 표시

### 👥 AI 룸메이트 매칭 시스템
<div align="center">
  <nobr>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/matching/test_start.png" alt="매칭 테스트 시작" width="200"/>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/matching/test_result.png" alt="테스트 결과" width="200"/>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/matching/matching_bytest.png" alt="룸메이트 매칭" width="200"/>
  </nobr>
</div>

- **6요소 성향 분석**: 수면패턴(20%), 거주시간(15%), 청소빈도(20%), 청소민감도(15%), 흡연여부(25%), 소음민감도(5%) 가중치 적용
- **동적 질문 시스템**: 백엔드 기반 질문 관리로 특별 질문(흡연) 분리 처리
- **고급 호환성 알고리즘**: Python 기반 복합 점수 계산으로 라이프스타일 궁합도 산출
- **시각적 매칭 결과**: 호환성 백분율과 생활패턴 아이콘으로 직관적 결과 표시
- **아이스브레이커**: 호환성 기반 대화 시작 메시지 자동 생성
- **대학 인증 연동**: 대학교 이메일 인증을 통한 신뢰성 있는 매칭 환경 조성

### 💬 실시간 채팅 & 소통
<div align="center">
  <nobr>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/chat/chat_main.png" alt="채팅 목록" width="180"/>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/chat/chat_inchat.png" alt="채팅 화면" width="180"/>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/chat/chat_inchat_modalchange1.png" alt="채팅 설정1" width="180"/>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/chat/chat_inchat_modalchange2.png" alt="채팅 설정2" width="180"/>
  </nobr>
</div>

- **멀티포맷 메시징**: 텍스트, 사용자 프로필, 매물 공유, 호환성 카드 등 다양한 메시지 타입 지원
- **실시간 폴링 시스템**: WebSocket 방식의 실시간 메시지 업데이트로 즉시 소통
- **리치 카드 시스템**: `USER_PROFILE:`, `ROOM_SHARE:`, `COMPATIBILITY_MESSAGE:` 전용 파싱으로 풍부한 콘텐츠 표시
- **임베디드 프로필**: 채팅 내 성향 특성 포함 사용자 프로필 카드 직접 공유
- **매물 추천 기능**: 이미지와 상세 정보가 포함된 부동산 정보 채팅 내 공유

### 📢 정책 공지 & AI 챗봇
<div align="center">
  <nobr>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/notice/notice_main.png" alt="공지사항 메인" width="200"/>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/notice/notice_detail.png" alt="공지사항 상세" width="200"/>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/notice/notice_ai.png" alt="AI 추천 정보" width="200"/>
  </nobr>
</div>

- **RAG 기반 AI 챗봇**: 벡터 검색과 정책 임베딩을 활용한 의미 기반 정책 정보 검색
- **멀티 에이전트 시스템**: 의도 분류 → 인사말 처리 → RAG 답변 생성의 3단계 에이전트 협업
- **실시간 정책 크롤링**: 한국주택정책포털, 청년정책 사이트 자동 데이터 수집 및 업데이트
- **개인화 추천**: 사용자 나이/지역 기반 맞춤형 청년 주택 정책 및 전세대출 정보 제공
- **마크다운 렌더링**: 정책 내용의 풍부한 텍스트 포맷팅으로 가독성 향상
- **벡터 캐싱**: 정책 임베딩 캐시를 통한 고속 검색 성능 최적화

### 📋 AI 계약서 분석 서비스
<div align="center">
  <nobr>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/contract/contract_start.png" alt="계약서 업로드" width="180"/>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/contract/contract_ing.png" alt="분석 진행 중" width="180"/>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/contract/contract_result_1.png" alt="분석 결과1" width="180"/>
    <img src="https://raw.githubusercontent.com/Songjaeheon0923/Uni-con/main/frontend-react-native/assets/screenshots/contract/contract_result_2.png" alt="분석 결과2" width="180"/>
  </nobr>
</div>

- **OCR 기반 문서 처리**: 카메라 촬영을 통한 계약서 이미지 캡처 및 전처리 자동화
- **AI 위험도 분석**: Google Gemini API 활용하여 계약 조항별 위험 요소 자동 탐지
- **0-100 안전도 점수**: 계약서 전체 안전도를 수치화하여 색상 코드로 직관적 표시
- **의심 조항 하이라이팅**: 불리한 조항의 심각도별 분류 및 상세 설명 제공
- **집주인 질문 자동 생성**: 계약 전 확인해야 할 질문들을 AI가 자동으로 생성하여 제시
- **다단계 진행 표시**: 문서 분석의 각 단계별 실시간 프로그레스 시각화




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

### 🗺️ 이성민 - *PM & 개발자* - [@danlee-dev](https://github.com/danlee-dev)
**담당 영역:**
- **프로젝트 매니지먼트**: 전체 프로젝트 기획
- **지도 시스템**: Google Maps API 연동 및 하이브리드 지도 페이지 구현
- **매물 데이터**: 서울 열린데이터 API 크롤링, 매물 상세 페이지 및 데이터베이스 구축
- **정책 정보 시스템**: RAG 기반 AI 챗봇, 정책 크롤링 및 벡터 검색 시스템 개발
- **상세 UI 수정**: figma 디자인에 맞춰 상세 디자인 수정
- **보고서 작성**: 프로젝트 문서화 및 최종 보고서 작성


### 🔧 송재헌 - *개발자* - [@Songjaeheon0923](https://github.com/Songjaeheon0923)
**담당 영역:**
- **사용자 인증 시스템**: JWT 기반 로그인/회원가입 페이지 및 백엔드 인증 로직 구현
- **마이페이지**: 사용자 프로필 관리 및 설정 페이지 전반적인 개발
- **AI 룸메이트 매칭**: 6요소 성향 분석 알고리즘 설계 및 매칭 화면 구현
- **AI 계약서 분석**: OCR 및 LLM을 활용한 계약서 위험도 분석 시스템 개발
- **실시간 채팅 시스템**: WebSocket 기반 채팅 로직, UI/UX 및 기능별 네비게이션 구현
- **배포**: railway와 expo를 활용하여 BE와 FE 별도로 서버 구축 


### 🎨 문유빈 - *UI/UX 디자이너*
**담당 영역:**
- **브랜딩**: 로고 및 앱 아이콘 디자인
- **UI/UX 디자인**: Figma를 통한 전체 앱 인터페이스 및 사용자 경험 설계
- **보고서 디자인**: 프로젝트 보고서 레이아웃 및 시각적 디자인
- **PPT 디자인**: 프레젠테이션 슬라이드 및 시각 자료 제작


<div align="center">
  <p>© 2025 Uni-con Team. All rights reserved.</p>
</div>