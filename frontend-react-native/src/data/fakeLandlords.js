// 가짜 집주인 데이터 (30명)
const fakeLandlords = [
  { name: '김민수', safetyNumber: '0504-123-4567' },
  { name: '이정희', safetyNumber: '0504-234-5678' },
  { name: '박서준', safetyNumber: '0504-345-6789' },
  { name: '최유진', safetyNumber: '0504-456-7890' },
  { name: '정하늘', safetyNumber: '0504-567-8901' },
  { name: '강민지', safetyNumber: '0504-678-9012' },
  { name: '조현우', safetyNumber: '0504-789-0123' },
  { name: '윤서연', safetyNumber: '0504-890-1234' },
  { name: '임도현', safetyNumber: '0504-901-2345' },
  { name: '한지민', safetyNumber: '0504-012-3456' },
  { name: '송재현', safetyNumber: '0504-123-4568' },
  { name: '김나영', safetyNumber: '0504-234-5679' },
  { name: '이동욱', safetyNumber: '0504-345-6780' },
  { name: '박미선', safetyNumber: '0504-456-7891' },
  { name: '최준호', safetyNumber: '0504-567-8902' },
  { name: '정수빈', safetyNumber: '0504-678-9013' },
  { name: '강태양', safetyNumber: '0504-789-0124' },
  { name: '조은지', safetyNumber: '0504-890-1235' },
  { name: '윤재영', safetyNumber: '0504-901-2346' },
  { name: '임서하', safetyNumber: '0504-012-3457' },
  { name: '한동규', safetyNumber: '0504-123-4569' },
  { name: '송유리', safetyNumber: '0504-234-5670' },
  { name: '김태현', safetyNumber: '0504-345-6781' },
  { name: '이소영', safetyNumber: '0504-456-7892' },
  { name: '박진우', safetyNumber: '0504-567-8903' },
  { name: '최혜진', safetyNumber: '0504-678-9014' },
  { name: '정민규', safetyNumber: '0504-789-0125' },
  { name: '강서윤', safetyNumber: '0504-890-1236' },
  { name: '조대현', safetyNumber: '0504-901-2347' },
  { name: '윤지아', safetyNumber: '0504-012-3458' }
];

// 이름 마스킹 함수 (중간 글자를 *로 처리)
export const maskLandlordName = (name) => {
  if (!name || name.length < 2) return name;
  
  if (name.length === 2) {
    return name[0] + '*';
  } else if (name.length === 3) {
    return name[0] + '*' + name[2];
  } else {
    // 4자 이상인 경우 중간 글자들을 모두 *로
    return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
  }
};

// roomId 기반으로 랜덤한 집주인 선택
export const getLandlordInfo = (roomId) => {
  // roomId를 숫자로 변환하여 인덱스로 사용
  const idStr = String(roomId || '');
  let hash = 0;
  
  // 간단한 해시 함수로 roomId를 인덱스로 변환
  for (let i = 0; i < idStr.length; i++) {
    hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % fakeLandlords.length;
  const landlord = fakeLandlords[index];
  
  return {
    fullName: landlord.name,
    maskedName: maskLandlordName(landlord.name),
    safetyNumber: landlord.safetyNumber
  };
};

export default fakeLandlords;