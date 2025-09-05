# Uni-con 웹 배포 방식

## Railway 배포 (권장)
현재 프로덕션 환경에서 사용하는 안정적인 배포 방식입니다.

### 배포된 URL
- **Frontend**: Railway에서 자동 배포
- **Backend**: Railway에서 자동 배포

### 배포 방식
1. `web-version-improvements` 브랜치에 코드 푸시
2. Railway가 자동으로 웹 빌드 및 배포 실행
3. `nixpacks.toml`과 `railway.json` 설정에 따라 Expo 웹 Export 진행

### 로컬 웹 개발
```bash
cd frontend-react-native
npm install
npm run web  # http://localhost:19006
```

## Cloudflare Tunnel (개발용)
빠른 테스트나 임시 배포가 필요한 경우 사용할 수 있습니다.

### 설치 및 실행
```bash
# 1. Cloudflared 설치
# macOS
brew install cloudflared

# 다른 OS는 https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

# 2. 웹 앱 실행
cd frontend-react-native
npm run web

# 3. 다른 터미널에서 Cloudflare Tunnel 실행
cloudflared tunnel --url http://localhost:19006
```

생성된 URL 예시: https://recent-academics-language-reliance.trycloudflare.com/

### 팀원 공유 방법
1. 프로젝트 클론 후 `npm install`
2. `npm run web`으로 로컬 서버 실행
3. 새 터미널에서 `cloudflared tunnel --url http://localhost:19006`
4. 생성된 URL을 팀원들과 공유

## 주의사항
* 실시간 리로드는 지원 안함
* 코드 수정되면 새로고침 해야함

## 수정 필요사항
* 룸메이트 매칭, 룸메이트 찾기 창 상단 여백 너무 큼
* 지도에서 현 위치로 이동하기 버튼 작동안함
* 지도에서 초기에 서울 전체가 보이게 포커싱되는 로직 있는데, 이거 작동안함
* 로그인/회원가입 UI 자잘한 수정사항들
* roomdetail 스크린에서 스크롤이 안됨(매물 계약서 검증하기도 안됨)
* 홈에서 계약서 안전성 검증하기 누르면 나오는 스크린에서 스크롤이 안됨, 버튼 못누름
* 웹에서 카메라는 켜지는데 셔터가 작동을 안함
* 홈에서 룸메이트 매칭 들어가서 안녕하세요 혹시 룸메 구하시나요? 메시지 전송하면 채팅방에 전체적인 메시지들 배치가 이상함
* 그리고 모든 스크린에서 메시지 전송할 때, "전송되었습니다" 클릭해서 채팅방으로 이동해보면 사용자 이름이 무조건 반짝이는 스케이트임(사용자 정보 전달이 잘 안되는듯).
* 주요 정책 뉴스 상세 페이지에서도 스크롤이 안됨
