// 실제 로컬 네트워크 IP 주소를 동적으로 탐지하는 유틸리티
export const getLocalApiUrl = async () => {
  try {
    // 현재 기기의 실제 IP 주소 탐지
    const detectedIPs = await detectLocalIPs();
    
    // 탐지된 IP들과 알려진 IP들을 조합
    const possibleIPs = [
      ...detectedIPs,
      '10.121.217.235',      // 기존에 사용하던 IP
    ];

    console.log('Trying IPs:', possibleIPs);

    // 각 IP에 대해 연결 테스트
    for (const ip of possibleIPs) {
      if (!ip || ip === 'localhost' || ip === '127.0.0.1') continue; // 로컬 주소 스킵
      
      const testUrl = `http://${ip}:8080`;
      
      try {
        // 간단한 연결 테스트 (타임아웃 설정)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5초 타임아웃
        
        const response = await fetch(testUrl, {
          method: 'HEAD',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        // 서버가 응답하면 해당 URL 사용
        console.log(`API server found at: ${testUrl}`);
        return testUrl;
      } catch (error) {
        // 이 IP는 응답하지 않음, 다음 시도
        continue;
      }
    }

    // 모든 시도가 실패하면 기본값 사용
    console.log('Using default API URL');
    return 'http://10.121.217.235:8080';

  } catch (error) {
    console.error('Error detecting local API URL:', error);
    return 'http://10.121.217.235:8080';
  }
};

// 현재 기기의 실제 네트워크 IP 주소들을 탐지하는 함수
const detectLocalIPs = async () => {
  try {
    const ips = [];
    
    // WebRTC를 사용한 IP 탐지 (React Native에서 지원하는 경우)
    try {
      const rtcIps = await getIPsViaWebRTC();
      ips.push(...rtcIps);
    } catch (e) {
      console.log('WebRTC IP detection not available');
    }

    // 네트워크 인터페이스 정보로부터 IP 추출 시도
    try {
      const networkIPs = await getIPsFromNetworkInfo();
      ips.push(...networkIPs);
    } catch (e) {
      console.log('Network interface detection not available');
    }

    // 중복 제거 및 유효한 IP만 반환
    const uniqueIPs = [...new Set(ips)].filter(ip => 
      ip && 
      ip !== '127.0.0.1' && 
      ip !== 'localhost' &&
      /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip) // IPv4 형식 체크
    );

    console.log('Detected local IPs:', uniqueIPs);
    return uniqueIPs;
  } catch (error) {
    console.error('Error detecting local IPs:', error);
    return [];
  }
};

// WebRTC를 통한 IP 탐지 (가능한 경우)
const getIPsViaWebRTC = () => {
  return new Promise((resolve) => {
    const ips = [];
    
    // React Native에서는 WebRTC가 제한적이므로 빈 배열 반환
    // 실제 구현에서는 react-native-webrtc 라이브러리 필요
    setTimeout(() => resolve(ips), 100);
  });
};

// 네트워크 정보로부터 IP 추출 (Expo Constants 활용)
const getIPsFromNetworkInfo = async () => {
  try {
    // Expo에서 제공하는 현재 개발 서버 정보 활용
    const Constants = await import('expo-constants').catch(() => null);
    const ips = [];

    if (Constants?.default?.expoConfig?.hostUri) {
      const hostUri = Constants.default.expoConfig.hostUri;
      const match = hostUri.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
      if (match) {
        ips.push(match[1]);
      }
    }

    // 현재 실행 환경의 manifest에서 IP 정보 추출
    if (Constants?.default?.manifest?.debuggerHost) {
      const debuggerHost = Constants.default.manifest.debuggerHost;
      const match = debuggerHost.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
      if (match) {
        ips.push(match[1]);
      }
    }

    return ips;
  } catch (error) {
    return [];
  }
};

// 수동으로 IP 주소를 설정하는 함수 (개발 중 필요시 사용)
export const setManualApiUrl = (ip, port = 8080) => {
  return `http://${ip}:${port}`;
};