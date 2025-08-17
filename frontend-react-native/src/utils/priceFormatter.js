// 가격 포맷팅 유틸리티
export const formatPrice = (price) => {
  if (!price) return '0원';
  
  const numPrice = typeof price === 'string' ? parseInt(price) : price;
  
  if (numPrice >= 100000000) { // 1억 이상
    const eok = Math.floor(numPrice / 100000000);
    const remainder = numPrice % 100000000;
    
    if (remainder === 0) {
      return `${eok}억원`;
    } else if (remainder >= 10000000) { // 천만원 이상
      const cheonman = Math.floor(remainder / 10000000);
      const finalRemainder = remainder % 10000000;
      
      if (finalRemainder === 0) {
        return `${eok}억${cheonman}천만원`;
      } else {
        const man = Math.floor(finalRemainder / 10000);
        return man > 0 ? `${eok}억${cheonman}천${man}만원` : `${eok}억${cheonman}천만원`;
      }
    } else if (remainder >= 10000) { // 만원 이상
      const man = Math.floor(remainder / 10000);
      return `${eok}억${man}만원`;
    } else {
      return `${eok}억원`;
    }
  } else if (numPrice >= 10000) { // 만원 이상
    const man = Math.floor(numPrice / 10000);
    const remainder = numPrice % 10000;
    
    if (remainder === 0) {
      return `${man}만원`;
    } else {
      return `${man}만${remainder}원`;
    }
  } else {
    return `${numPrice}원`;
  }
};

// 월세 형식 포맷팅
export const formatRentPrice = (deposit, monthly) => {
  if (!monthly || monthly === 0) {
    return `전세 ${formatPrice(deposit)}`;
  } else {
    return `월세 ${formatPrice(deposit)}/${formatPrice(monthly)}`;
  }
};

// 간단한 만원 단위 표시
export const formatPriceSimple = (price) => {
  if (!price) return '0만원';
  
  const numPrice = typeof price === 'string' ? parseInt(price) : price;
  
  if (numPrice >= 10000) {
    return `${Math.floor(numPrice / 10000)}억${numPrice % 10000 > 0 ? Math.floor((numPrice % 10000) / 100) + '천' : ''}만원`;
  } else {
    return `${numPrice}만원`;
  }
};