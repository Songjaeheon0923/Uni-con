import requests
import json
import time
import sqlite3
import os
from datetime import datetime
from typing import List, Dict, Optional
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

DATABASE_PATH = "users.db"

class YouthPolicyCrawler:
    """청년센터 주택 관련 정책 API 크롤러"""
    
    def __init__(self):
        self.db_path = os.getenv('DATABASE_PATH', DATABASE_PATH)
        # 환경 변수에서 API 키 로드
        self.api_key = os.getenv('YOUTH_CENTER_API_KEY')
        
        if not self.api_key:
            raise ValueError("""
YOUTH_CENTER_API_KEY가 .env 파일에 설정되지 않았습니다.

해결 방법:
1. https://www.youthcenter.go.kr 에서 회원가입 후 API 키를 발급받으세요
2. 마이페이지 > OPEN API에서 키를 확인하세요
3. 발급받은 키를 .env 파일의 YOUTH_CENTER_API_KEY에 입력하세요
            """)
        
        # 주택 관련 정책 키워드
        self.housing_keywords = [
            "주택", "임대", "전세", "월세", "주거", "거주", "아파트", 
            "원룸", "쉐어하우스", "기숙사", "매입임대", "전세자금",
            "주택구입", "주택자금", "주거비", "주거급여", "임대료",
            "보증금", "신혼부부", "청년주택", "행복주택", "공공임대"
        ]
        
        # 정책 대분류 (주택 관련)
        self.housing_categories = [
            "주거", "일자리", "창업", "생활복지", "교육", "참여권리"
        ]
        
    def fetch_youth_policies(self, keyword: str = None, page_num: int = 1, page_size: int = 100):
        """청년센터 정책 API 호출"""
        url = "https://www.youthcenter.go.kr/go/ythip/getPlcy"
        
        params = {
            'apiKeyNm': self.api_key,
            'pageNum': page_num,
            'pageSize': page_size,
            'rtnType': 'json'
        }
        
        # 키워드가 있으면 추가
        if keyword:
            params['plcyKywdNm'] = keyword
            
        # 주거 관련 대분류 추가
        params['lclsfNm'] = '주거,생활복지'
        
        try:
            print(f"🏛️ 청년센터 정책 API 호출... (키워드: {keyword or '전체'})")
            response = requests.get(url, params=params, timeout=30)
            
            print(f"📡 응답 상태: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    
                    # 에러 체크
                    if 'youthPolicyList' in data:
                        policies = data['youthPolicyList']
                        print(f"📦 정책 수: {len(policies)}개")
                        return policies
                    else:
                        print(f"❌ API 응답 형식 오류: {list(data.keys())}")
                        return []
                        
                except json.JSONDecodeError as e:
                    print(f"❌ JSON 파싱 오류: {e}")
                    print(f"📄 응답 내용 (처음 500자): {response.text[:500]}")
                    return []
                    
            else:
                print(f"❌ API 호출 실패: {response.status_code}")
                print(f"📄 응답 내용: {response.text[:500]}")
                return []
                
        except Exception as e:
            print(f"❌ API 호출 오류: {e}")
            return []
    
    def filter_housing_policies(self, policies: List[Dict]) -> List[Dict]:
        """주택 관련 정책 필터링"""
        housing_policies = []
        
        for policy in policies:
            # 정책명, 키워드, 설명에서 주택 관련 키워드 검색
            policy_text = f"{policy.get('plcyNm', '')} {policy.get('plcyKywdNm', '')} {policy.get('plcyExplnCn', '')} {policy.get('plcySprtCn', '')}"
            policy_text = policy_text.lower()
            
            # 주택 관련 키워드가 포함되어 있는지 확인
            is_housing_related = any(keyword in policy_text for keyword in self.housing_keywords)
            
            # 대분류가 주거 관련인지 확인
            category = policy.get('lclsfNm', '').lower()
            is_housing_category = any(cat in category for cat in ['주거', '주택', '생활복지'])
            
            if is_housing_related or is_housing_category:
                housing_policies.append(policy)
                
        print(f"🏠 주택 관련 정책 필터링: {len(housing_policies)}개")
        return housing_policies
    
    def save_policies_to_db(self, policies: List[Dict]) -> int:
        """정책 데이터를 데이터베이스에 저장"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        saved_count = 0
        
        for policy in policies:
            try:
                # 정책 데이터 추출
                policy_id = policy.get('plcyNo', '')
                title = policy.get('plcyNm', '')
                description = policy.get('plcyExplnCn', '')
                content = policy.get('plcySprtCn', '')
                url = policy.get('aplyUrlAddr') or policy.get('refUrlAddr1', '')
                category = policy.get('lclsfNm', '청년정책')
                subcategory = policy.get('mclsfNm', '')
                keywords = policy.get('plcyKywdNm', '')
                
                # 대상 연령 추출
                min_age = self.safe_int(policy.get('sprtTrgtMinAge'))
                max_age = self.safe_int(policy.get('sprtTrgtMaxAge'))
                
                # 소득 조건 추출
                income_min = self.safe_int(policy.get('earnMinAmt'))
                income_max = self.safe_int(policy.get('earnMaxAmt'))
                
                # 지역 코드
                region_code = policy.get('zipCd', '')
                
                # 기관 정보
                organization = policy.get('sprvsnInstCdNm', '')
                
                # 신청 기간
                apply_period = policy.get('aplyYmd', '')
                business_start = policy.get('bizPrdBgngYmd', '')
                business_end = policy.get('bizPrdEndYmd', '')
                
                # 태그 생성
                tags = []
                if keywords:
                    tags.extend([k.strip() for k in keywords.split(',') if k.strip()])
                if subcategory:
                    tags.append(subcategory)
                tags.append('청년정책')
                
                # 중복 확인 후 저장
                cursor.execute('''
                    SELECT id FROM policies WHERE title = ? AND url = ?
                ''', (title, url))
                
                existing = cursor.fetchone()
                if not existing:
                    cursor.execute('''
                        INSERT INTO policies (
                            title, description, content, url, category,
                            target_age_min, target_age_max, target_gender, target_location,
                            tags, view_count, relevance_score, is_active, crawled_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        title, description, content, url, category,
                        min_age, max_age, None, region_code,
                        json.dumps(tags, ensure_ascii=False), 0, 0.0, True, datetime.now()
                    ))
                    saved_count += 1
                    print(f"💾 저장: {title[:50]}...")
                else:
                    print(f"⚠️ 중복: {title[:50]}...")
                    
            except Exception as e:
                print(f"❌ 저장 실패: {e}")
                continue
        
        conn.commit()
        conn.close()
        
        return saved_count
    
    def safe_int(self, value):
        """안전한 정수 변환"""
        try:
            if value and str(value).strip():
                return int(value)
        except (ValueError, TypeError):
            pass
        return None
    
    def get_personalized_policies(self, user_id: int, limit: int = 10) -> List[Dict]:
        """사용자 맞춤 정책 추천"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 사용자 정보 조회
        cursor.execute("""
            SELECT u.gender, EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.birth_date)) as age,
                   p.budget_range, p.preferred_locations
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE u.id = ?
        """, (user_id,))
        
        user_info = cursor.fetchone()
        
        # 기본 쿼리
        query = """
            SELECT id, title, description, content, url, category,
                   target_age_min, target_age_max, tags, crawled_at
            FROM policies
            WHERE is_active = 1 AND category LIKE '%청년%'
        """
        params = []
        
        # 사용자 정보가 있으면 맞춤 필터링
        if user_info:
            gender, age, budget_range, preferred_locations = user_info
            
            # 연령 조건
            if age:
                query += " AND (target_age_min IS NULL OR target_age_min <= ?)"
                query += " AND (target_age_max IS NULL OR target_age_max >= ?)"
                params.extend([age, age])
            
            # 지역 조건 (선호 지역이 있으면)
            if preferred_locations:
                locations = preferred_locations.split(',')
                location_conditions = " OR ".join(["target_location LIKE ?" for _ in locations])
                query += f" AND ({location_conditions})"
                params.extend([f"%{loc.strip()}%" for loc in locations])
        
        query += " ORDER BY crawled_at DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        policies = cursor.fetchall()
        
        conn.close()
        
        # 결과 포맷팅
        result = []
        for policy in policies:
            result.append({
                'id': policy[0],
                'title': policy[1],
                'description': policy[2],
                'content': policy[3],
                'url': policy[4],
                'category': policy[5],
                'target_age_min': policy[6],
                'target_age_max': policy[7],
                'tags': json.loads(policy[8]) if policy[8] else [],
                'crawled_at': policy[9]
            })
        
        return result
    
    async def run_youth_policy_crawling(self):
        """청년 정책 크롤링 실행"""
        print("=== 청년센터 주택 관련 정책 크롤링 시작 ===")
        
        all_policies = []
        
        try:
            # 1. 주택 키워드별 크롤링
            for keyword in self.housing_keywords[:5]:  # 주요 키워드 5개만
                policies = self.fetch_youth_policies(keyword=keyword, page_size=50)
                if policies:
                    housing_policies = self.filter_housing_policies(policies)
                    all_policies.extend(housing_policies)
                
                # API 요청 간격
                time.sleep(1)
            
            # 2. 전체 주거 카테고리 크롤링
            policies = self.fetch_youth_policies(page_size=100)
            if policies:
                housing_policies = self.filter_housing_policies(policies)
                all_policies.extend(housing_policies)
            
            # 중복 제거
            unique_policies = []
            seen_titles = set()
            
            for policy in all_policies:
                title = policy.get('plcyNm', '')
                if title not in seen_titles:
                    unique_policies.append(policy)
                    seen_titles.add(title)
            
            print(f"\n📊 중복 제거 후: {len(unique_policies)}개 정책")
            
            # 데이터베이스에 저장
            if unique_policies:
                saved_count = self.save_policies_to_db(unique_policies)
                
                print(f"✅ 청년 정책 크롤링 완료!")
                print(f"📊 수집: {len(unique_policies)}개 | 저장: {saved_count}개")
                
                return {
                    'total_crawled': len(unique_policies),
                    'total_saved': saved_count,
                    'success_rate': f"{(saved_count/len(unique_policies)*100):.1f}%" if unique_policies else "0%",
                    'source': '청년센터 정책 API'
                }
            else:
                print("❌ 수집된 청년 정책이 없습니다.")
                return {'total_crawled': 0, 'total_saved': 0, 'success_rate': '0%'}
                
        except Exception as e:
            print(f"❌ 청년 정책 크롤링 실패: {e}")
            return {'total_crawled': 0, 'total_saved': 0, 'success_rate': '0%', 'error': str(e)}

if __name__ == "__main__":
    import asyncio
    
    async def main():
        try:
            crawler = YouthPolicyCrawler()
            result = await crawler.run_youth_policy_crawling()
            print("\n📈 청년 정책 크롤링 결과:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
        except ValueError as e:
            print(f"❌ 설정 오류: {e}")
        except Exception as e:
            print(f"❌ 실행 오류: {e}")
    
    asyncio.run(main())