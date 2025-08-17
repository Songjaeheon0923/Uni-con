import asyncio
import sqlite3
import json
import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Set
from dataclasses import dataclass
from crawlers.housing_policy_crawler import HousingPolicyCrawler
from crawlers.public_data_api import PublicDataAPIClient
from database.connection import DATABASE_PATH


@dataclass
class PolicyFilter:
    """정책 필터링 설정"""
    housing_keywords: Set[str]
    exclude_keywords: Set[str]
    min_content_length: int
    max_age_days: int


class AdvancedPolicyCrawler:
    """고도화된 주택정책 크롤러"""
    
    def __init__(self, service_key: str = None):
        self.db_path = DATABASE_PATH
        self.housing_crawler = HousingPolicyCrawler()
        self.api_client = PublicDataAPIClient(service_key)
        
        # 고도화된 필터링 설정
        self.filter_config = PolicyFilter(
            housing_keywords={
                # 주택 유형
                '주택', '아파트', '원룸', '투룸', '빌라', '오피스텔', '다세대',
                '단독주택', '연립주택', '상가주택', '도시형생활주택',
                
                # 주거 관련
                '임대', '전세', '월세', '보증금', '임차', '거주', '주거',
                '입주', '분양', '청약', '계약', '임대료', '관리비',
                
                # 지원 정책
                '주거급여', '주거지원', '전세자금', '주택구입', '주택담보',
                '주택청약', '주택자금', '주택금융', '대출', '융자',
                
                # 대상자
                '청년', '신혼부부', '대학생', '사회초년생', '무주택',
                '저소득', '기초생활', '한부모', '다자녀',
                
                # 공공주택
                'LH', '공공임대', '영구임대', '국민임대', '행복주택',
                '매입임대', '전세임대', '장기전세', 'SH공사',
                
                # 정책 키워드
                '주택정책', '주거복지', '주택공급', '주택시장', '부동산'
            },
            exclude_keywords={
                '상업용', '업무용', '점포', '사무실', '창고', '공장',
                '토지', '개발', '건설', '시공', '인허가', '설계',
                '교통', '도로', '주차', '조경', '환경영향평가'
            },
            min_content_length=20,
            max_age_days=90
        )
    
    def get_db_connection(self):
        return sqlite3.connect(self.db_path)
    
    def is_housing_policy_relevant(self, title: str, description: str, content: str = "") -> bool:
        """주택정책 관련성 정밀 검사"""
        full_text = f"{title} {description} {content}".lower()
        
        # 제외 키워드 체크 (우선순위)
        if any(keyword in full_text for keyword in self.filter_config.exclude_keywords):
            return False
        
        # 주택 관련 키워드 점수 계산
        housing_score = 0
        for keyword in self.filter_config.housing_keywords:
            if keyword in full_text:
                # 제목에 있으면 가중치 2배
                if keyword in title.lower():
                    housing_score += 2
                else:
                    housing_score += 1
        
        # 최소 점수 기준
        return housing_score >= 2
    
    def extract_policy_metadata(self, policy: Dict) -> Dict:
        """정책 메타데이터 고도화 추출"""
        title = policy.get('title', '')
        description = policy.get('description', '')
        content = policy.get('content', '')
        full_text = f"{title} {description} {content}"
        
        # 대상 연령 정밀 추출
        age_info = self._extract_detailed_age_info(full_text)
        
        # 소득 조건 추출
        income_info = self._extract_income_conditions(full_text)
        
        # 지역 정보 정밀 추출
        location_info = self._extract_location_info(full_text)
        
        # 주택 유형 추출
        housing_types = self._extract_housing_types(full_text)
        
        # 지원 규모 추출
        support_amount = self._extract_support_amount(full_text)
        
        # 신청 기간 추출
        application_period = self._extract_application_period(full_text)
        
        # 우선순위 점수 계산
        priority_score = self._calculate_priority_score(policy, age_info, income_info)
        
        return {
            **policy,
            'target_age_min': age_info.get('min_age'),
            'target_age_max': age_info.get('max_age'),
            'income_condition': income_info,
            'target_location': location_info,
            'housing_types': housing_types,
            'support_amount': support_amount,
            'application_period': application_period,
            'priority_score': priority_score,
            'extracted_at': datetime.now().isoformat()
        }
    
    def _extract_detailed_age_info(self, text: str) -> Dict:
        """정밀한 연령 정보 추출"""
        age_patterns = [
            # 구체적 나이 범위
            (r'(\d{2})세\s*[~\-부터]\s*(\d{2})세', lambda m: {'min_age': int(m.group(1)), 'max_age': int(m.group(2))}),
            (r'(\d{2})세\s*이상\s*(\d{2})세\s*이하', lambda m: {'min_age': int(m.group(1)), 'max_age': int(m.group(2))}),
            (r'(\d{2})세\s*이상', lambda m: {'min_age': int(m.group(1)), 'max_age': None}),
            (r'(\d{2})세\s*이하', lambda m: {'min_age': None, 'max_age': int(m.group(1))}),
            (r'(\d{2})세\s*미만', lambda m: {'min_age': None, 'max_age': int(m.group(1)) - 1}),
            
            # 그룹별 연령
            (r'청년', lambda m: {'min_age': 19, 'max_age': 39}),
            (r'신혼부부', lambda m: {'min_age': 25, 'max_age': 40}),
            (r'대학생', lambda m: {'min_age': 18, 'max_age': 26}),
            (r'사회초년생', lambda m: {'min_age': 22, 'max_age': 30}),
        ]
        
        for pattern, extractor in age_patterns:
            match = re.search(pattern, text)
            if match:
                return extractor(match)
        
        return {'min_age': None, 'max_age': None}
    
    def _extract_income_conditions(self, text: str) -> Optional[str]:
        """소득 조건 추출"""
        income_patterns = [
            r'(\d+)천만원\s*이하',
            r'(\d+)만원\s*이하', 
            r'기준\s*중위소득\s*(\d+)%\s*이하',
            r'전년도\s*도시근로자\s*가구당\s*월평균소득\s*(\d+)%\s*이하',
            r'소득\s*(\d+)분위\s*이하'
        ]
        
        for pattern in income_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(0)
        
        return None
    
    def _extract_location_info(self, text: str) -> Optional[str]:
        """지역 정보 추출"""
        location_patterns = [
            r'서울특별시|서울시|서울',
            r'부산광역시|부산시|부산',
            r'인천광역시|인천시|인천',
            r'대구광역시|대구시|대구',
            r'대전광역시|대전시|대전',
            r'광주광역시|광주시|광주',
            r'울산광역시|울산시|울산',
            r'세종특별자치시|세종시|세종',
            r'경기도|경기',
            r'강원도|강원',
            r'충청북도|충북',
            r'충청남도|충남',
            r'전라북도|전북',
            r'전라남도|전남',
            r'경상북도|경북',
            r'경상남도|경남',
            r'제주특별자치도|제주도|제주'
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(0)
        
        return None
    
    def _extract_housing_types(self, text: str) -> List[str]:
        """주택 유형 추출"""
        housing_types = []
        type_patterns = {
            '아파트': ['아파트', 'APT'],
            '원룸': ['원룸', '1룸'],
            '투룸': ['투룸', '2룸'],
            '빌라': ['빌라', '다세대', '연립'],
            '오피스텔': ['오피스텔'],
            '단독주택': ['단독주택', '단독'],
            '도시형생활주택': ['도시형생활주택']
        }
        
        for housing_type, keywords in type_patterns.items():
            if any(keyword in text for keyword in keywords):
                housing_types.append(housing_type)
        
        return housing_types
    
    def _extract_support_amount(self, text: str) -> Optional[str]:
        """지원 금액 추출"""
        amount_patterns = [
            r'최대\s*(\d+)억\s*원?',
            r'(\d+)억\s*원?\s*이내',
            r'(\d+)억\s*원?\s*한도',
            r'최대\s*(\d+)천만\s*원?',
            r'(\d+)천만\s*원?\s*이내',
            r'월\s*(\d+)만\s*원?\s*지원'
        ]
        
        for pattern in amount_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(0)
        
        return None
    
    def _extract_application_period(self, text: str) -> Optional[str]:
        """신청 기간 추출"""
        period_patterns = [
            r'\d{4}[년\.]\s*\d{1,2}[월\.]\s*\d{1,2}일?\s*[~\-부터까지]\s*\d{4}[년\.]\s*\d{1,2}[월\.]\s*\d{1,2}일?',
            r'\d{1,2}[월\.]\s*\d{1,2}일?\s*[~\-부터까지]\s*\d{1,2}[월\.]\s*\d{1,2}일?',
            r'접수기간[:\s]*\d{4}[년\.]\s*\d{1,2}[월\.]\s*\d{1,2}일?',
            r'신청기간[:\s]*\d{4}[년\.]\s*\d{1,2}[월\.]\s*\d{1,2}일?'
        ]
        
        for pattern in period_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(0)
        
        return None
    
    def _calculate_priority_score(self, policy: Dict, age_info: Dict, income_info: Optional[str]) -> float:
        """정책 우선순위 점수 계산"""
        score = 0.0
        title = policy.get('title', '').lower()
        description = policy.get('description', '').lower()
        
        # 카테고리별 기본 점수
        category_scores = {
            '청년주택정책': 10.0,
            '주택금융지원': 8.5,
            '공공임대주택': 8.0,
            '신혼부부주택': 7.5,
            '주거급여/지원': 7.0,
            '주택분양/청약': 6.0
        }
        
        category = policy.get('category', '기타주택정책')
        score += category_scores.get(category, 5.0)
        
        # 대상 연령이 청년층인 경우 가점
        if age_info.get('min_age') and age_info.get('max_age'):
            if age_info['min_age'] <= 30 and age_info['max_age'] <= 40:
                score += 3.0
        
        # 소득 조건이 있는 경우 가점
        if income_info:
            score += 2.0
        
        # 긴급성 키워드 가점
        urgent_keywords = ['긴급', '한시', '특별', '확대', '신규', '추가']
        if any(keyword in title or keyword in description for keyword in urgent_keywords):
            score += 1.5
        
        # 최신성 가점 (크롤링 시점 기준)
        crawled_at = policy.get('crawled_at')
        if crawled_at:
            try:
                crawl_date = datetime.fromisoformat(crawled_at.replace('Z', '+00:00'))
                days_old = (datetime.now() - crawl_date).days
                if days_old <= 7:
                    score += 2.0
                elif days_old <= 30:
                    score += 1.0
            except:
                pass
        
        return min(score, 20.0)  # 최대 20점
    
    def clean_and_deduplicate_policies(self) -> int:
        """정책 데이터 정제 및 중복 제거"""
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        # 1. 너무 짧은 내용 삭제
        cursor.execute("""
            DELETE FROM policies 
            WHERE LENGTH(description) < ? AND LENGTH(content) < ?
        """, (self.filter_config.min_content_length, self.filter_config.min_content_length))
        
        # 2. 오래된 정책 삭제
        cutoff_date = datetime.now() - timedelta(days=self.filter_config.max_age_days)
        cursor.execute("""
            DELETE FROM policies 
            WHERE crawled_at < ?
        """, (cutoff_date,))
        
        # 3. 중복 정책 찾기 및 통합
        cursor.execute("""
            SELECT title, COUNT(*) as cnt, GROUP_CONCAT(id) as ids
            FROM policies 
            GROUP BY LOWER(TRIM(title))
            HAVING cnt > 1
        """)
        
        duplicates = cursor.fetchall()
        removed_count = 0
        
        for title, count, ids_str in duplicates:
            ids = [int(id_str) for id_str in ids_str.split(',')]
            
            # 가장 최신 것을 제외하고 삭제
            ids.sort()
            for policy_id in ids[:-1]:
                cursor.execute("DELETE FROM policies WHERE id = ?", (policy_id,))
                removed_count += 1
        
        conn.commit()
        conn.close()
        
        print(f"Data cleaning completed: {removed_count} duplicates removed")
        return removed_count
    
    def update_policy_scores(self) -> int:
        """모든 정책의 점수 업데이트"""
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, title, description, content, category, 
                   target_age_min, target_age_max, tags, crawled_at
            FROM policies 
            WHERE is_active = 1
        """)
        
        policies = cursor.fetchall()
        updated_count = 0
        
        for policy_data in policies:
            policy_dict = {
                'title': policy_data[1],
                'description': policy_data[2],
                'content': policy_data[3],
                'category': policy_data[4],
                'crawled_at': policy_data[8]
            }
            
            age_info = {
                'min_age': policy_data[5],
                'max_age': policy_data[6]
            }
            
            # 소득 조건 추출
            full_text = f"{policy_data[1]} {policy_data[2]} {policy_data[3]}"
            income_info = self._extract_income_conditions(full_text)
            
            # 새 점수 계산
            new_score = self._calculate_priority_score(policy_dict, age_info, income_info)
            
            # 점수 업데이트
            cursor.execute("""
                UPDATE policies 
                SET relevance_score = ? 
                WHERE id = ?
            """, (new_score, policy_data[0]))
            
            updated_count += 1
        
        conn.commit()
        conn.close()
        
        print(f"Policy scores updated: {updated_count} policies")
        return updated_count
    
    async def run_advanced_crawling(self) -> Dict[str, int]:
        """고도화된 크롤링 실행"""
        print("Starting advanced housing policy crawling...")
        
        # 1. 기존 크롤러로 데이터 수집
        housing_result = await self.housing_crawler.run_housing_policy_crawling()
        
        # 2. 공공데이터 API로 데이터 수집
        api_result = self.api_client.fetch_all_housing_policies()
        
        # 3. 데이터 정제 및 중복 제거
        removed_count = self.clean_and_deduplicate_policies()
        
        # 4. 정책 점수 업데이트
        updated_count = self.update_policy_scores()
        
        # 5. 주택정책 관련성이 낮은 정책 비활성화
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, title, description, content FROM policies 
            WHERE is_active = 1
        """)
        
        all_policies = cursor.fetchall()
        deactivated_count = 0
        
        for policy_id, title, description, content in all_policies:
            if not self.is_housing_policy_relevant(title, description, content):
                cursor.execute("""
                    UPDATE policies SET is_active = 0 WHERE id = ?
                """, (policy_id,))
                deactivated_count += 1
        
        conn.commit()
        conn.close()
        
        total_crawled = housing_result['total_crawled'] + api_result['total_collected']
        total_saved = housing_result['total_saved'] + api_result['total_saved']
        
        result = {
            'total_crawled': total_crawled,
            'total_saved': total_saved,
            'housing_crawler': housing_result,
            'api_crawler': api_result,
            'removed_duplicates': removed_count,
            'updated_scores': updated_count,
            'deactivated_irrelevant': deactivated_count
        }
        
        print(f"Advanced crawling completed: {result}")
        return result


async def main():
    """테스트용 메인 함수"""
    # 실제 서비스 키 필요
    crawler = AdvancedPolicyCrawler("YOUR_SERVICE_KEY_HERE")
    result = await crawler.run_advanced_crawling()
    print(f"Advanced crawling result: {result}")


if __name__ == "__main__":
    asyncio.run(main())