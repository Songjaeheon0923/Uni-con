# Uni-con Backend API

## 개요

Uni-con은 대학생을 위한 룸메이트 매칭 서비스의 백엔드 API입니다. FastAPI를 기반으로 구축되었으며, 사용자 인증, 프로필 관리, 매칭 알고리즘을 제공합니다.

## 기술 스택

- **Framework**: FastAPI
- **Database**: SQLite
- **Authentication**: Session-based (MVP)
- **Password Hashing**: bcrypt
- **CORS**: 모든 도메인 허용 (개발용)

## 프로젝트 구조

```
backend/
├── main.py                 # FastAPI 애플리케이션 진입점
├── requirements.txt        # 의존성 패키지
├── users.db               # SQLite 데이터베이스
├── server.log             # 서버 로그
├── session.py             # 세션 관리 (글로벌)
├── auth/                  # 인증 관련
│   ├── __init__.py
│   └── jwt_handler.py     # JWT 관련 (현재 미사용)
├── database/              # 데이터베이스 관련
│   ├── __init__.py
│   └── connection.py      # 데이터베이스 연결 및 초기화
├── models/                # 데이터 모델
│   ├── __init__.py
│   ├── user.py           # 사용자 모델
│   └── profile.py        # 프로필 모델
├── routers/               # API 라우터
│   ├── __init__.py
│   ├── auth.py           # 인증 API
│   ├── users.py          # 사용자 API
│   └── profile.py        # 프로필 API
└── utils/                 # 유틸리티
    ├── __init__.py
    ├── security.py       # 보안 관련 함수
    └── matching.py       # 매칭 알고리즘
```

## 데이터베이스 스키마

### users 테이블

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    hashed_password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### user_profiles 테이블

```sql
CREATE TABLE user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    sleep_type TEXT,                    -- 'morning' | 'evening'
    home_time TEXT,                     -- 'day' | 'night' | 'irregular'
    cleaning_frequency TEXT,            -- 'daily' | 'weekly' | 'as_needed'
    cleaning_sensitivity TEXT,          -- 'very_sensitive' | 'normal' | 'not_sensitive'
    smoking_status TEXT,                -- 'non_smoker_strict' | 'non_smoker_ok' | 'smoker_indoor_no' | 'smoker_indoor_yes'
    noise_sensitivity TEXT,             -- 'sensitive' | 'normal' | 'not_sensitive'
    is_complete BOOLEAN DEFAULT FALSE,  -- 프로필 완성 여부
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## API 엔드포인트

### 인증 API (`/auth`)

#### POST /auth/signup

사용자 회원가입

- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "name": "홍길동",
    "password": "password123"
  }
  ```
- **Response** (201):
  ```json
  {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동"
  }
  ```
- **Errors**: 400 (이메일 중복)

#### POST /auth/login

사용자 로그인

- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response** (200):
  ```json
  {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동"
  }
  ```
- **Errors**: 401 (잘못된 인증 정보)

#### POST /auth/logout

사용자 로그아웃

- **Response** (200):
  ```json
  {
    "message": "Successfully logged out"
  }
  ```

### 사용자 API (`/users`)

#### GET /users/me

현재 로그인된 사용자 정보 조회

- **Headers**: 세션 기반 인증 필요
- **Response** (200):
  ```json
  {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동"
  }
  ```
- **Errors**: 401 (미로그인)

#### PUT /users/profile/me

현재 사용자의 프로필 업데이트

- **Headers**: 세션 기반 인증 필요
- **Request Body**:
  ```json
  {
    "sleep_type": "evening",
    "home_time": "irregular",
    "cleaning_frequency": "as_needed",
    "cleaning_sensitivity": "not_sensitive",
    "smoking_status": "smoker_indoor_yes",
    "noise_sensitivity": "not_sensitive"
  }
  ```
- **Response** (200):
  ```json
  {
    "message": "Profile updated successfully",
    "profile": {
      "id": 1,
      "user_id": 1,
      "sleep_type": "evening",
      "home_time": "irregular",
      "cleaning_frequency": "as_needed",
      "cleaning_sensitivity": "not_sensitive",
      "smoking_status": "smoker_indoor_yes",
      "noise_sensitivity": "not_sensitive",
      "is_complete": true,
      "updated_at": "2025-08-09T21:41:15"
    }
  }
  ```
- **Errors**: 401 (미로그인), 500 (업데이트 실패)

### 프로필 API (`/profile`)

#### GET /profile/questions

프로필 설정용 질문 목록 조회

- **Response** (200):
  ```json
  {
    "questions": [
      {
        "id": "sleep_type",
        "question": "기상, 취침시간은 어떻게 되시나요?",
        "options": [
          { "value": "morning", "label": "아침형" },
          { "value": "evening", "label": "저녁형" }
        ]
      },
      {
        "id": "home_time",
        "question": "집에 머무는 시간대는 언제인가요?",
        "options": [
          { "value": "day", "label": "낮 시간" },
          { "value": "night", "label": "밤 시간" },
          { "value": "irregular", "label": "일정하지 않아요" }
        ]
      },
      {
        "id": "cleaning_frequency",
        "question": "청소는 얼마나 자주 하시나요?",
        "options": [
          { "value": "daily", "label": "매일 / 이틀에 한번" },
          { "value": "weekly", "label": "주 1~2회" },
          { "value": "as_needed", "label": "필요할 때만" }
        ]
      },
      {
        "id": "cleaning_sensitivity",
        "question": "룸메이트의 청소 상태가 신경 쓰이는 편인가요?",
        "options": [
          { "value": "very_sensitive", "label": "매우 민감함" },
          { "value": "normal", "label": "보통" },
          { "value": "not_sensitive", "label": "크게 상관 없음" }
        ]
      },
      {
        "id": "smoking_status",
        "question": "흡연 관련 선호사항을 선택해주세요",
        "options": [
          {
            "value": "non_smoker_strict",
            "label": "비흡연자 - 흡연자와 함께 지내기 어려움"
          },
          {
            "value": "non_smoker_ok",
            "label": "비흡연자 - 흡연자와 함께 지내기 가능"
          },
          { "value": "smoker_indoor_no", "label": "흡연자 - 실내 금연" },
          { "value": "smoker_indoor_yes", "label": "흡연자 - 실내 흡연" }
        ]
      },
      {
        "id": "noise_sensitivity",
        "question": "생활 소음에 대한 민감도는 어떠신가요?",
        "options": [
          { "value": "sensitive", "label": "민감함" },
          { "value": "normal", "label": "보통" },
          { "value": "not_sensitive", "label": "둔감함" }
        ]
      }
    ]
  }
  ```

#### GET /profile/me

현재 사용자의 프로필 조회

- **Headers**: 세션 기반 인증 필요
- **Response** (200):
  ```json
  {
    "user_id": 1,
    "sleep_type": "evening",
    "home_time": "irregular",
    "cleaning_frequency": "as_needed",
    "cleaning_sensitivity": "not_sensitive",
    "smoking_status": "smoker_indoor_yes",
    "noise_sensitivity": "not_sensitive",
    "is_complete": true
  }
  ```
- **Note**: 프로필이 없으면 자동으로 빈 프로필을 생성
- **Errors**: 401 (미로그인)

#### GET /profile/matches

현재 사용자와 호환되는 룸메이트 목록 조회

- **Headers**: 세션 기반 인증 필요
- **Response** (200):
  ```json
  [
    {
      "user_id": 2,
      "email": "roommate@example.com",
      "name": "김철수",
      "compatibility_score": 0.85,
      "matching_details": {
        "sleep_type": "compatible",
        "home_time": "compatible",
        "cleaning_frequency": "neutral",
        "cleaning_sensitivity": "compatible",
        "smoking_status": "incompatible",
        "noise_sensitivity": "compatible"
      }
    }
  ]
  ```
- **Errors**: 401 (미로그인), 400 (프로필 미완성)

## 인증 시스템

현재 MVP 단계에서는 간단한 세션 기반 인증을 사용합니다:

- 로그인 시 `session.current_user_session`에 사용자 정보 저장
- 서버 재시작 시 세션 초기화
- 단일 사용자만 로그인 가능 (동시 로그인 미지원)

## 매칭 알고리즘

프로필 기반 호환성 점수 계산:

- **가중치 기반 점수 계산**
- **호환성 카테고리**: compatible (1.0), neutral (0.5), incompatible (0.0)
- **최종 점수**: 0.0 ~ 1.0 범위

### 호환성 규칙

1. **수면 패턴** (가중치: 높음)

   - 같은 타입: compatible
   - 다른 타입: incompatible

2. **집 머무는 시간** (가중치: 보통)

   - 같은 시간대: compatible
   - irregular 포함: neutral
   - 완전히 다름: incompatible

3. **청소 빈도** (가중치: 보통)

   - 비슷한 빈도: compatible
   - 약간 다름: neutral
   - 매우 다름: incompatible

4. **청소 민감도** (가중치: 높음)

   - 비슷한 민감도: compatible
   - 약간 다름: neutral
   - 매우 다름: incompatible

5. **흡연 상태** (가중치: 매우 높음)

   - 호환 가능 조합: compatible
   - 불가능 조합: incompatible

6. **소음 민감도** (가중치: 높음)
   - 비슷한 민감도: compatible
   - 약간 다름: neutral
   - 매우 다름: incompatible

## 설치 및 실행

### 요구사항

- Python 3.8+
- pip

### 설치

```bash
cd backend
pip install -r requirements.txt
```

### 실행

```bash
python main.py
```

서버는 `http://127.0.0.1:8080`에서 실행됩니다.

### 개발 모드

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8080
```

## 환경 설정

현재 모든 설정은 코드에 하드코딩되어 있습니다 (MVP):

- Database: `users.db` (SQLite)
- CORS: 모든 도메인 허용
- Session: 인메모리 글로벌 변수

## 로깅

- 서버 로그: `server.log`
- 콘솔 출력: uvicorn 기본 로깅
- 디버그 모드: 프로필 업데이트 시 상세 로그

## 보안 고려사항

**현재 구현 (MVP)**:

- 세션 기반 인증 (인메모리)
- bcrypt 비밀번호 해싱
- CORS 모든 도메인 허용

**프로덕션 고려사항**:

- JWT 토큰 기반 인증
- Redis 세션 스토어
- 환경 변수 기반 설정
- HTTPS 강제
- Rate limiting
- 입력 값 검증 강화

## API 테스트

Swagger UI: `http://127.0.0.1:8080/docs`
ReDoc: `http://127.0.0.1:8080/redoc`

## 에러 처리

모든 API는 일관된 에러 응답 형식을 사용합니다:

```json
{
  "detail": "Error message"
}
```

### 주요 에러 코드

- `400`: Bad Request (잘못된 요청)
- `401`: Unauthorized (인증 필요)
- `404`: Not Found (리소스 없음)
- `500`: Internal Server Error (서버 오류)

## 향후 개선사항

1. **인증 시스템**: JWT 토큰 기반으로 변경
2. **데이터베이스**: PostgreSQL로 마이그레이션
3. **캐싱**: Redis 도입
4. **배포**: Docker 컨테이너화
5. **모니터링**: 로깅 및 메트릭 시스템
6. **테스트**: 단위 테스트 및 통합 테스트
7. **문서**: OpenAPI 스펙 자동 생성
