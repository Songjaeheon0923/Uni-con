/**
 * 사용자의 생활패턴 데이터를 기반으로 개성 유형을 생성하는 유틸리티
 */

/**
 * 사용자 프로필 기반 개성 유형 생성
 * @param {Object} profile - 사용자 프로필 데이터
 * @param {string} profile.sleep_type - 'morning' | 'evening'
 * @param {string} profile.cleaning_sensitivity - 'very_sensitive' | 'normal' | 'not_sensitive'
 * @param {string} profile.noise_sensitivity - 'sensitive' | 'normal' | 'not_sensitive'
 * @returns {string} 생성된 개성 유형 텍스트
 */
export const generatePersonalityType = (profile) => {
  if (!profile) {
    return '개성 유형 분석 중...';
  }

  // 기본값 설정
  const sleepType = profile.sleep_type || 'evening';
  const cleaningSensitivity = profile.cleaning_sensitivity || 'normal';
  const noiseSensitivity = profile.noise_sensitivity || 'normal';

  // 1. 생활리듬 매핑
  const lifestyleMap = {
    'morning': '종달새',
    'evening': '올빼미'
  };

  // 2. 청소 성향 매핑
  const cleanlinessMap = {
    'very_sensitive': '청결중시',
    'normal': '보통청소',
    'not_sensitive': '자유청소'
  };

  // 3. 소음 성향 매핑
  const noiseMap = {
    'sensitive': '소음민감',
    'normal': '소음보통',
    'not_sensitive': '소음둔감'
  };

  // 4. 유형 네이밍 생성 로직
  const lifestyle = lifestyleMap[sleepType];
  const cleanliness = cleanlinessMap[cleaningSensitivity];
  const noise = noiseMap[noiseSensitivity];

  // 5. 조합에 따른 최종 네이밍
  return generateTypeName(lifestyle, cleanliness, noise);
};

/**
 * 생활리듬, 청소성향, 소음성향 조합으로 유형명 생성
 * @param {string} lifestyle - '종달새' | '올빼미'
 * @param {string} cleanliness - '청결중시' | '보통청소' | '자유청소'
 * @param {string} noise - '소음민감' | '소음보통' | '소음둔감'
 * @returns {string} 최종 유형명
 */
const generateTypeName = (lifestyle, cleanliness, noise) => {
  let prefix = '';
  let middle = '';
  let suffix = lifestyle;

  // 소음 성향에 따른 접두어
  switch (noise) {
    case '소음민감':
      prefix = '조용한 ';
      break;
    case '소음보통':
      prefix = '';
      break;
    case '소음둔감':
      prefix = '태평한 ';
      break;
    default:
      prefix = '';
  }

  // 청소 성향에 따른 중간어
  switch (cleanliness) {
    case '청결중시':
      middle = '청결 ';
      break;
    case '보통청소':
      middle = '깔끔 ';
      break;
    case '자유청소':
      // 자유청소의 경우 특별 케이스 처리
      if (noise === '소음보통') {
        middle = '자유로운 ';
      } else {
        middle = '';
      }
      break;
    default:
      middle = '';
  }

  return `${prefix}${middle}${suffix}`;
};

/**
 * 개성 유형에 따른 서브 태그 생성 (알고리즘 기반)
 * @param {Object} profile - 사용자 프로필 데이터
 * @returns {Array<string>} 서브 태그 배열
 */
export const generateSubTags = (profile) => {
  if (!profile) {
    return ['분석 중...'];
  }

  const tags = [];
  
  // 1. 수면 패턴 기반 키워드
  switch (profile.sleep_type) {
    case 'morning':
      tags.push('아침에 활동하는 갓생러');
      break;
    case 'evening':
      tags.push('밤에 활동하는 천재형');
      break;
  }

  // 2. 집에 머무는 시간대 기반 키워드
  switch (profile.home_time) {
    case 'day':
      tags.push('낮집형');
      break;
    case 'night':
      tags.push('밤집형');
      break;
    case 'irregular':
      // 일정하지 않은 경우는 키워드 없음
      break;
  }

  // 3. 청소 빈도 기반 키워드
  switch (profile.cleaning_frequency) {
    case 'daily':
      tags.push('청소는 매일매일!');
      break;
    case 'weekly':
      tags.push('청소는 주기적으로!');
      break;
    case 'as_needed':
      tags.push('청소는 필요할 때에만!');
      break;
  }

  // 4. 청소 민감도 기반 키워드
  switch (profile.cleaning_sensitivity) {
    case 'very_sensitive':
      tags.push('청결 민감 깔끔형');
      break;
    case 'normal':
      // 보통은 키워드 없음
      break;
    case 'not_sensitive':
      tags.push('청결 둔감 자유형');
      break;
  }

  // 5. 소음 민감도 기반 키워드
  switch (profile.noise_sensitivity) {
    case 'sensitive':
      tags.push('소음 민감형');
      break;
    case 'normal':
      // 보통은 키워드 없음
      break;
    case 'not_sensitive':
      tags.push('소음 둔감형');
      break;
  }

  // 6. 흡연 상태 기반 키워드
  switch (profile.smoking_status) {
    case 'non_smoker_strict':
      tags.push('완전 금연주의자');
      break;
    case 'non_smoker_ok':
      tags.push('비흡연자(흡연자 OK)');
      break;
    case 'smoker_indoor_no':
      tags.push('흡연자(실내금연)');
      break;
    case 'smoker_indoor_yes':
      tags.push('흡연자(실내흡연)');
      break;
  }

  // 태그가 없으면 기본 태그 추가
  if (tags.length === 0) {
    tags.push('개성 파악 중...');
  }

  // 최대 6개 태그로 제한하고 중복 제거
  return [...new Set(tags)].slice(0, 6);
};

/**
 * 기본 하드코딩된 데이터 (프로필 데이터가 없을 때 사용)
 */
export const getDefaultPersonalityData = () => {
  return {
    mainType: '청결을 중시하는 올빼미',
    subTags: ['밤에 활동하는 천재형', '밤집형', '청소는 주기적으로!', '청결 민감 깔끔형', '소음 민감형', '완전 금연주의자']
  };
};

/**
 * 프로필 완성도 체크
 * @param {Object} profile - 사용자 프로필 데이터
 * @returns {boolean} 프로필이 완성되었는지 여부
 */
export const isProfileComplete = (profile) => {
  if (!profile) return false;
  
  const requiredFields = ['sleep_type', 'cleaning_sensitivity', 'noise_sensitivity'];
  return requiredFields.every(field => profile[field] != null);
};