import requests
import json
import os
from datetime import datetime
from database.connection import get_db_connection
import time
import logging

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class YouthCenterCrawler:
    def __init__(self):
        self.api_key = os.getenv('YOUTH_CENTER_API_KEY')
        if not self.api_key:
            raise ValueError("YOUTH_CENTER_API_KEY 환경변수가 설정되지 않았습니다.")
        self.base_url = "https://www.youthcenter.go.kr/go/ythip/getPlcy"
        
    def fetch_policies(self, page_num=1, page_size=50):
        """온통청년 API에서 정책 데이터 가져오기"""
        params = {
            'apiKeyNm': self.api_key,
            'pageNum': page_num,
            'pageSize': page_size,
            'rtnType': 'json',
            'pageType': '1'  # 목록 형식
        }
        
        try:
            response = requests.get(self.base_url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            # API 응답 구조 확인
            if 'result' in data:
                result = data['result']
                if 'youthPolicyList' in result:
                    policies = result['youthPolicyList']
                    if isinstance(policies, list):
                        return policies
                    elif isinstance(policies, dict):
                        # 단일 정책인 경우 리스트로 변환
                        return [policies]
            elif 'youthPolicyList' in data:
                policies = data['youthPolicyList']
                if isinstance(policies, list):
                    return policies
                elif isinstance(policies, dict):
                    return [policies]
            
            logger.warning(f"Unexpected API response structure: {data}")
            return []
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching policies: {e}")
            return []
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing JSON response: {e}")
            return []
    
    def save_to_database(self, policies):
        """정책 데이터를 데이터베이스에 저장"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        saved_count = 0
        updated_count = 0
        
        for policy in policies:
            try:
                # 필수 필드 확인
                policy_id = policy.get('plcyNo', '')
                if not policy_id:
                    continue
                
                # 데이터 매핑
                title = policy.get('plcyNm', '제목 없음')
                organization = policy.get('sprvsnInstCdNm', '')
                target = self._format_target(policy)
                content = policy.get('plcySprtCn', '')
                application_period = policy.get('aplyYmd', '')
                
                # 날짜 처리
                start_date = policy.get('bizPrdBgngYmd', '')
                end_date = policy.get('bizPrdEndYmd', '')
                
                # URL 처리
                application_url = policy.get('aplyUrlAddr', '')
                reference_url = policy.get('refUrlAddr1', '')
                
                # 카테고리 처리
                category = policy.get('lclsfNm', '')
                sub_category = policy.get('mclsfNm', '')
                
                # 지역 처리
                region_code = policy.get('zipCd', '')
                region = self._get_region_name(region_code)
                
                # 기타 정보
                details = {
                    'explanation': policy.get('plcyExplnCn', ''),
                    'application_method': policy.get('plcyAplyMthdCn', ''),
                    'selection_method': policy.get('srngMthdCn', ''),
                    'required_documents': policy.get('sbmsnDcmntCn', ''),
                    'etc_matters': policy.get('etcMttrCn', ''),
                    'income_condition': policy.get('earnEtcCn', ''),
                    'additional_qualification': policy.get('addAplyQlfcCndCn', ''),
                    'sub_category': sub_category,
                    'region_code': region_code,
                    'min_age': policy.get('sprtTrgtMinAge', ''),
                    'max_age': policy.get('sprtTrgtMaxAge', ''),
                    'view_count': policy.get('inqCnt', 0)
                }
                
                # 중복 확인
                cursor.execute("""
                    SELECT id FROM policies WHERE source_id = ? AND source = 'youth_center'
                """, (policy_id,))
                
                existing = cursor.fetchone()
                
                if existing:
                    # 업데이트
                    cursor.execute("""
                        UPDATE policies SET
                            title = ?, organization = ?, target = ?, content = ?,
                            application_period = ?, start_date = ?, end_date = ?,
                            application_url = ?, reference_url = ?, category = ?,
                            region = ?, details = ?, last_updated = ?
                        WHERE source_id = ? AND source = 'youth_center'
                    """, (
                        title, organization, target, content,
                        application_period, start_date, end_date,
                        application_url, reference_url, category,
                        region, json.dumps(details, ensure_ascii=False),
                        datetime.now().isoformat(),
                        policy_id
                    ))
                    updated_count += 1
                else:
                    # 신규 저장
                    cursor.execute("""
                        INSERT INTO policies (
                            source, source_id, title, organization, target,
                            content, application_period, start_date, end_date,
                            application_url, reference_url, category, region,
                            details, created_at, last_updated
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        'youth_center', policy_id, title, organization, target,
                        content, application_period, start_date, end_date,
                        application_url, reference_url, category, region,
                        json.dumps(details, ensure_ascii=False),
                        datetime.now().isoformat(),
                        datetime.now().isoformat()
                    ))
                    saved_count += 1
                    
            except Exception as e:
                logger.error(f"Error saving policy {policy.get('plcyNo', 'unknown')}: {e}")
                continue
        
        conn.commit()
        conn.close()
        
        logger.info(f"Saved {saved_count} new policies, updated {updated_count} existing policies")
        return saved_count, updated_count
    
    def _format_target(self, policy):
        """대상 정보 포맷팅"""
        parts = []
        
        # 연령
        min_age = policy.get('sprtTrgtMinAge', '')
        max_age = policy.get('sprtTrgtMaxAge', '')
        if min_age and max_age:
            parts.append(f"만 {min_age}~{max_age}세")
        elif min_age:
            parts.append(f"만 {min_age}세 이상")
        elif max_age:
            parts.append(f"만 {max_age}세 이하")
        
        # 결혼 상태
        marriage_status = policy.get('mrgSttsCd', '')
        if marriage_status:
            parts.append(marriage_status)
        
        # 소득 조건
        income_condition = policy.get('earnCndSeCd', '')
        if income_condition:
            parts.append(income_condition)
        
        return ', '.join(parts) if parts else '제한 없음'
    
    def _get_region_name(self, region_code):
        """지역 코드를 지역명으로 변환"""
        if not region_code:
            return '전국'
        
        # 주요 지역 코드 매핑
        region_map = {
            '11': '서울특별시',
            '26': '부산광역시',
            '27': '대구광역시',
            '28': '인천광역시',
            '29': '광주광역시',
            '30': '대전광역시',
            '31': '울산광역시',
            '36': '세종특별자치시',
            '41': '경기도',
            '42': '강원도',
            '43': '충청북도',
            '44': '충청남도',
            '45': '전라북도',
            '46': '전라남도',
            '47': '경상북도',
            '48': '경상남도',
            '50': '제주특별자치도'
        }
        
        # 앞 2자리로 시도 판별
        if len(region_code) >= 2:
            sido_code = region_code[:2]
            return region_map.get(sido_code, '전국')
        
        return '전국'
    
    def crawl_all_policies(self, max_pages=10):
        """모든 정책 크롤링"""
        all_saved = 0
        all_updated = 0
        
        for page in range(1, max_pages + 1):
            logger.info(f"Fetching page {page}")
            
            policies = self.fetch_policies(page_num=page, page_size=100)
            
            if not policies:
                logger.info(f"No more policies found at page {page}")
                break
            
            saved, updated = self.save_to_database(policies)
            all_saved += saved
            all_updated += updated
            
            # API 부하 방지를 위한 대기
            time.sleep(1)
        
        logger.info(f"Total: Saved {all_saved} new policies, updated {all_updated} existing policies")
        return all_saved, all_updated

def main():
    """메인 실행 함수"""
    crawler = YouthCenterCrawler()
    saved, updated = crawler.crawl_all_policies(max_pages=5)
    print(f"크롤링 완료: {saved}개 신규 저장, {updated}개 업데이트")

if __name__ == "__main__":
    main()