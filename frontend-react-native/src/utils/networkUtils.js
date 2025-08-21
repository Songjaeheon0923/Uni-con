import { Platform } from 'react-native';
import * as Network from 'expo-network';

// 로컬 네트워크에서 API 서버 IP 주소를 자동으로 감지하는 유틸리티
export const getLocalApiUrl = async () => {
  try {
    // 네트워크 상태 확인
    const networkState = await Network.getNetworkStateAsync();
    
    if (!networkState.isConnected) {
      console.warn('Network not connected, using default');
      return 'http://10.121.217.235:8080'; // 기본 IP 주소
    }

    // WiFi 정보 가져오기
    const ipAddress = await Network.getIpAddressAsync();
    
    if (!ipAddress) {
      console.warn('Unable to get IP address, using default');
      return 'http://10.121.217.235:8080'; // 기본 IP 주소
    }

    // 현재 디바이스의 IP 주소를 기반으로 서버 IP 추측
    // 같은 네트워크에 있다고 가정하고, 마지막 옥텟만 다른 서버 찾기
    const networkBase = ipAddress.substring(0, ipAddress.lastIndexOf('.'));
    
    // 개발 서버가 일반적으로 사용하는 IP 주소들 시도
    // .1은 라우터, .235는 현재 사용 중인 서버 IP의 마지막 옥텟
    const serverIPs = [
      `${networkBase}.235`, // 현재 사용 중인 서버 IP 패턴
      `${networkBase}.1`,   // 라우터/게이트웨이
      '10.121.217.235',      // 하드코딩된 기본값
    ];

    for (const serverIP of serverIPs) {
      const testUrl = `http://${serverIP}:8080`;
      
      try {
        // 간단한 연결 테스트
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000); // 1초 타임아웃
        
        const response = await fetch(testUrl, {
          method: 'HEAD',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        // 서버가 응답하면 (상태코드 무관) 해당 URL 사용
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

// 현재 네트워크 정보를 가져오는 함수
export const getNetworkInfo = async () => {
  try {
    const networkState = await Network.getNetworkStateAsync();
    const ipAddress = await Network.getIpAddressAsync();
    
    return {
      isConnected: networkState.isConnected,
      type: networkState.type,
      ipAddress: ipAddress,
    };
  } catch (error) {
    console.error('Error getting network info:', error);
    return null;
  }
};