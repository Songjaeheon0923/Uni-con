// 로컬 네트워크에서 API 서버 IP 주소를 자동으로 감지하는 유틸리티
export const getLocalApiUrl = async () => {
  try {
    // 개발 서버가 일반적으로 사용하는 IP 주소들 시도
    const possibleIPs = [
      '10.121.217.235',      // 현재 사용 중인 서버 IP
      'localhost',           // 로컬 개발
      '127.0.0.1',          // 로컬 개발 대체
    ];

    // 각 IP에 대해 연결 테스트
    for (const ip of possibleIPs) {
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

// 수동으로 IP 주소를 설정하는 함수 (개발 중 필요시 사용)
export const setManualApiUrl = (ip, port = 8080) => {
  return `http://${ip}:${port}`;
};