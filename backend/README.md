# Uni-con Backend API

FastAPI 기반의 사용자 관리 시스템입니다. JWT 인증을 통한 회원가입, 로그인, 사용자 정보 조회 기능을 제공합니다.

## 서버 실행

```bash
pip install -r requirements.txt
python main.py
```

서버는 `http://localhost:8080`에서 실행됩니다.
API 문서: http://localhost:8080/docs

## API 명세

### GET `/`

서버 상태 확인

**응답**

```json
{
  "message": "Uni-con API is running"
}
```

### POST `/signup`

사용자 회원가입

**요청**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동"
}
```

**응답 (201)**

```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "홍길동"
}
```

**오류**

- 400: 이메일 중복
- 422: 입력값 검증 실패

### POST `/login`

사용자 로그인

**요청**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답 (200)**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**오류**

- 401: 잘못된 이메일 또는 비밀번호
- 422: 입력값 검증 실패

### GET `/me`

사용자 정보 조회 (인증 필요)

**헤더**

```
Authorization: Bearer {access_token}
```

**응답 (200)**

```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "홍길동"
}
```

**오류**

- 401: 유효하지 않은 토큰

## 기술 스택

- FastAPI 0.104.1
- SQLite (users.db)
- JWT (HS256 알고리즘)
- bcrypt 패스워드 해싱

**POST** `/signup`

새로운 사용자 계정을 생성합니다.

**요청 본문**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동"
}
```

**응답 (201 Created)**

```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "홍길동"
}
```

**오류 응답**

- `400 Bad Request`: 이메일 중복
- `422 Validation Error`: 입력값 검증 실패

### 3. 로그인

**POST** `/login`

사용자 인증 후 JWT 토큰을 발급합니다.

**요청 본문**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답 (200 OK)**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**오류 응답**

- `401 Unauthorized`: 잘못된 이메일 또는 비밀번호
- `422 Validation Error`: 입력값 검증 실패

### 4. 사용자 정보 조회

**GET** `/me`

현재 인증된 사용자의 정보를 조회합니다.

**헤더**

```
Authorization: Bearer {access_token}
```

**응답 (200 OK)**

```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "홍길동"
}
```

**오류 응답**

- `401 Unauthorized`: 유효하지 않은 토큰

## 🔐 인증 방식

1. 사용자가 이메일과 비밀번호로 로그인
2. 서버가 JWT 토큰 발급 (만료시간: 30분)
3. 보호된 엔드포인트 접근 시 `Authorization: Bearer {token}` 헤더 필요
4. 토큰 검증 후 사용자 정보 제공

## 📊 데이터베이스 스키마

### Users 테이블

| 컬럼            | 타입    | 설명               |
| --------------- | ------- | ------------------ |
| id              | INTEGER | 기본키 (자동 증가) |
| email           | TEXT    | 이메일 (고유)      |
| hashed_password | TEXT    | 해시된 비밀번호    |
| name            | TEXT    | 사용자 이름        |

## 🛠️ 프로젝트 구조

```
backend/
├── main.py                    # FastAPI 애플리케이션 메인 파일
├── requirements.txt           # Python 의존성
├── users.db                   # SQLite 데이터베이스 (gitignored)
├── server.log                 # 서버 로그 (gitignored)
├── api_spec.json             # 기본 API 명세서
├── detailed_api_spec.json    # 상세 API 명세서
└── README.md                 # 이 파일
```

## 🔍 API 테스트 예시

### curl을 사용한 테스트

**1. 회원가입**

```bash
curl -X POST "http://localhost:8080/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "테스트 사용자"
  }'
```

**2. 로그인**

```bash
curl -X POST "http://localhost:8080/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**3. 사용자 정보 조회**

```bash
curl -X GET "http://localhost:8080/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🐛 로그 및 디버깅

- 서버 로그는 `server.log` 파일에 기록
- 데이터베이스 파일(`users.db`)은 SQLite 브라우저로 확인 가능
