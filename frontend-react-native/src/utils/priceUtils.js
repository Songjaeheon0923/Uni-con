/**
 * 외부 API별 가격 단위 통일 및 포맷팅 유틸리티
 */

/**
 * 데이터 소스별 가격을 만원 단위로 정규화
 * @param {number} price - 원본 가격
 * @param {string} roomId - 매물 ID (데이터 소스 구분용)
 * @param {string} transactionType - 거래 유형
 * @returns {number} 만원 단위로 정규화된 가격
 */
export const normalizePrice = (price, roomId, transactionType) => {
  if (!price || !roomId) return price;
  
  // 국토교통부 실거래가 API 데이터 (real_api_로 시작)
  if (roomId.startsWith('real_api_')) {
    if (transactionType === '매매') {
      // 매매는 원 단위로 저장됨 → 만원 단위로 변환
      return Math.floor(price / 10000);
    } else {
      // 전세/월세는 이미 만원 단위
      return price;
    }
  }
  
  // 기타 모든 API 데이터는 이미 만원 단위로 저장됨
  return price;
};

/**
 * 가격을 사용자 친화적인 형태로 포맷팅
 * @param {number} price - 보증금 (만원 단위)
 * @param {string} transactionType - 거래 유형
 * @param {number} monthlyPrice - 월세 (만원 단위, 월세인 경우만)
 * @param {string} roomId - 매물 ID (데이터 소스 구분용)
 * @returns {string} 포맷팅된 가격 문자열
 */
export const formatPrice = (price, transactionType, monthlyPrice = 0, roomId = '') => {
  if (!price || isNaN(price)) return '가격 정보 없음';
  
  const numericPrice = parseFloat(price);
  if (isNaN(numericPrice)) return '가격 정보 없음';
  
  // 데이터 소스별 단위 정규화
  const normalizedPrice = normalizePrice(numericPrice, roomId, transactionType);
  
  if (transactionType === '월세') {
    const normalizedMonthly = normalizePrice(monthlyPrice, roomId, transactionType);
    const deposit = Math.floor(normalizedPrice);
    const monthly = Math.floor(normalizedMonthly);
    return `${deposit}/${monthly}만원`;
  } else {
    // 전세나 매매의 경우
    if (normalizedPrice >= 10000) {
      const eok = Math.floor(normalizedPrice / 10000);
      const man = Math.floor(normalizedPrice % 10000);
      if (eok > 0 && man > 0) {
        return `${eok}억${man}만원`;
      } else if (eok > 0) {
        return `${eok}억원`;
      } else {
        return `${man}만원`;
      }
    } else {
      return `${normalizedPrice}만원`;
    }
  }
};

/**
 * 면적을 평수로 변환하여 표시
 * @param {number|string} area - 면적 (㎡)
 * @returns {string} 평수 문자열 (예: "25평")
 */
export const formatArea = (area) => {
  if (!area) return '';
  
  // 이미 단위가 포함된 문자열인 경우 (예: "29.82㎡")
  if (typeof area === 'string' && area.includes('㎡')) {
    const numericArea = parseFloat(area);
    if (isNaN(numericArea) || numericArea <= 0) return '';
    const pyeong = Math.round(numericArea * 0.3025);
    return `${pyeong}평`;
  }
  
  // 숫자인 경우
  if (isNaN(area)) return '';
  const numericArea = parseFloat(area);
  if (isNaN(numericArea) || numericArea <= 0) return '';
  const pyeong = Math.round(numericArea * 0.3025);
  return `${pyeong}평`;
};

/**
 * 방 개수 기반 방 유형 추정
 * @param {number} area - 면적 (㎡)
 * @param {number} rooms - 방 개수
 * @returns {string} 방 유형 (예: "원룸", "투룸")
 */
export const getRoomType = (area, rooms) => {
  // rooms 데이터가 있는 경우 우선 사용
  if (rooms !== undefined && rooms !== null) {
    if (rooms === 1) return '원룸';
    if (rooms === 2) return '투룸';
    if (rooms === 3) return '쓰리룸';
    return `${rooms}룸`;
  }
  
  // rooms 데이터가 없는 경우 면적을 기준으로 추정
  const numericArea = typeof area === 'string' && area.includes('㎡') 
    ? parseFloat(area) 
    : parseFloat(area);
  
  if (numericArea && numericArea <= 35) {
    return '원룸';
  } else if (numericArea && numericArea <= 50) {
    return '투룸';
  } else if (numericArea && numericArea <= 70) {
    return '쓰리룸';
  } else {
    return '원룸'; // 기본값
  }
};

/**
 * 층수 포맷팅
 * @param {number} floor - 층수
 * @returns {string} 포맷팅된 층수 (예: "1층", "지하1층")
 */
export const formatFloor = (floor) => {
  if (!floor) return '';
  if (floor === 1) return '1층';
  if (floor < 0) return `지하${Math.abs(floor)}층`;
  return `${floor}층`;
};