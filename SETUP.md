# 🚀 개발환경 설정 가이드

프로젝트를 로컬에서 실행하거나 배포하는 방법입니다.

## 📋 사전 요구사항

### 1. 필수 설치
- **Node.js** (v16 이상): [https://nodejs.org](https://nodejs.org)
- **Python** (v3.8 이상): [https://python.org](https://python.org)
- **Git**: [https://git-scm.com](https://git-scm.com)
- **Expo Go 앱**: 모바일에서 앱스토어/플레이스토어에서 설치

### 2. 선택 설치 (권장)
- **Expo CLI**: `npm install -g @expo/cli`

## 🛠️ 설정 단계

### 1️⃣ 프로젝트 Clone

```bash
git clone https://github.com/Songjaeheon0923/Uni-con.git
cd Uni-con
```

### 2️⃣ 백엔드 서버 설정

```bash
# 백엔드 폴더로 이동
cd backend

# Python 패키지 설치
pip install -r requirements.txt

# PyJWT 설치 (requirements.txt에 있지만 명시적 설치)
pip install PyJWT==2.8.0
```

### 3️⃣ 프론트엔드 설정

```bash
# React Native 폴더로 이동
cd ../frontend-react-native

# Node.js 패키지 설치
npm install
```

### 4️⃣ 환경변수 설정 (중요! 🚨)

```bash
# .env 파일 생성
cp .env.example .env
```

**⚠️ 중요**: `.env` 파일을 열어서 `YOUR_LOCAL_IP`를 본인의 실제 IP 주소로 변경해야 합니다.

#### IP 주소 확인 방법:

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# 출력 예: inet 192.168.1.100 netmask 0xffffff00
```

**Windows:**
```cmd
ipconfig
# "무선 LAN 어댑터 Wi-Fi" 섹션의 IPv4 주소 확인
```

#### .env 파일 수정 예시:
```bash
# .env 파일 내용
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8080  # 본인 IP로 변경!
```

## 🏃‍♂️ 서버 실행

### 1️⃣ 백엔드 서버 실행 (터미널 1)

```bash
cd backend
python main.py
```

✅ 서버가 `http://0.0.0.0:8080`에서 실행됩니다.

### 2️⃣ React Native 앱 실행 (터미널 2)

```bash
cd frontend-react-native
npx expo start
```

✅ QR 코드가 나타납니다.

### 3️⃣ 모바일에서 접속

1. **Expo Go 앱** 실행
2. **QR 코드 스캔** 또는 **같은 네트워크에서 자동 감지**
3. 앱이 로드됩니다!

## 🔧 문제 해결

### "Network request failed" 오류

1. ✅ **IP 주소 확인**: `.env`의 IP가 정확한지 확인
2. ✅ **같은 Wi-Fi**: 컴퓨터와 모바일이 같은 Wi-Fi에 연결
3. ✅ **백엔드 실행**: `python main.py`가 실행 중인지 확인
4. ✅ **방화벽 확인**: 8080 포트 허용

### 백엔드 서버가 안 켜져요

```bash
# 의존성 다시 설치
cd backend
pip install -r requirements.txt

# 수동으로 필요한 패키지 설치
pip install fastapi uvicorn pydantic passlib bcrypt PyJWT sqlite3
```

### React Native 빌드 오류

```bash
# node_modules 삭제 후 재설치
cd frontend-react-native
rm -rf node_modules package-lock.json
npm install

# Expo CLI 재설치 (글로벌)
npm install -g @expo/cli
```

### 정책 데이터베이스 정보

✅ **정책 데이터 포함**: 이미 200개의 실제 청년 정책 데이터가 `users.db`에 포함되어 있습니다!
- 온통청년 API에서 크롤링한 실제 정책 데이터
- 별도 설정 없이 바로 정책 추천 기능 사용 가능
- 홈 화면에서 정책 뉴스 확인 가능

### 데이터베이스 초기화가 필요할 때

```bash
cd backend
rm users.db  # 기존 데이터베이스 삭제
python main.py  # 서버 실행하면 자동으로 다시 생성됩니다
```

⚠️ **주의**: 데이터베이스를 삭제하면 정책 데이터도 함께 삭제됩니다.

## 📱 테스트 계정

앱에서 바로 테스트할 수 있는 계정들:

```
이메일: testuser@example.com
비밀번호: testpass
```

또는 회원가입으로 새 계정을 만드세요!

## 🌐 Railway 배포 (프로덕션)

### 백엔드 배포 상태
✅ **배포 완료**: https://uni-con-production.up.railway.app
- FastAPI 백엔드가 Railway에 배포되어 실행 중
- 자동 HTTPS 제공
- GitHub main 브랜치와 자동 연동

### 프론트엔드 웹 배포
✅ **배포 완료**: Railway에서 웹 버전 실행 가능

#### 웹 버전 빌드 및 배포
```bash
cd frontend-react-native
npm run build:web  # dist 폴더에 웹 빌드 생성
```

#### Railway 배포 설정 파일
- `nixpacks.toml`: Railway 빌드 시스템 설정
- `railway.json`: Railway 서비스 설정
- 웹 빌드 의존성 자동 설치 (`react-dom`, `react-native-web`, `@expo/metro-runtime`)

### 환경변수 설정 (프로덕션)
Railway 대시보드에서 설정:
```
# 프론트엔드
EXPO_PUBLIC_API_BASE_URL=https://uni-con-production.up.railway.app

# 백엔드 (자동 설정됨)
DATABASE_URL=파일 경로 자동 설정
```

## 📱 플랫폼별 지도 컴포넌트

프로젝트는 플랫폼에 따라 자동으로 적절한 지도 컴포넌트를 사용합니다:

### 파일 구조
```
src/components/
├── MapView.js          # 메인 컴포넌트 (자동 플랫폼 감지)
├── MapView.native.js   # 모바일용 (iOS, Android)
└── MapView.web.js      # 웹용
```

### 사용되는 라이브러리
- **모바일**: `react-native-maps` (Google Maps)
- **웹**: `react-native-web-maps` (웹 호환 지도)

Expo가 자동으로 플랫폼을 감지하여 적절한 파일을 로드합니다.

## 🆘 도움이 필요할 때

1. **GitHub Issues**: 버그나 문제 보고
2. **Discord/Slack**: 실시간 도움 요청
3. **README.md**: 자세한 프로젝트 정보

---

**💡 팁**: 
- 개발 중에는 백엔드 서버와 Expo 서버를 항상 켜두세요!
- Railway 배포는 GitHub main 브랜치에 push하면 자동으로 업데이트됩니다!