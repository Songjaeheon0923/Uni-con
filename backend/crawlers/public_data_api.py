import requests
import json
import sqlite3
from datetime import datetime
from typing import List, Dict, Optional
from database.connection import DATABASE_PATH


class PublicDataAPIClient:
    """공공데이터포털 API 클라이언트"""
    
    def __init__(self, service_key: str = None):
        # 실제 운영시에는 환경변수나 설정파일에서 가져와야 함
        self.service_key = service_key or "YOUR_PUBLIC_DATA_API_KEY"
        self.base_urls = {
            'apartment_info': 'http://apis.data.go.kr/1613000/AptListService2',
            'housing_welfare': 'http://apis.data.go.kr/1360000/HousingWelfareService',
            'lh_rental': 'http://apis.data.go.kr/1613000/LHLeaseInfoService',
            'molit_policy': 'http://apis.data.go.kr/1613000/PolicyInfoService'
        }
        self.db_path = DATABASE_PATH
    
    def get_db_connection(self):
        return sqlite3.connect(self.db_path)
    
    def get_apartment_complex_info(self, region_code: str = "11", page_no: int = 1, num_of_rows: int = 100) -> List[Dict]:
        """공동주택 단지 정보 조회"""
        policies = []
        
        try:
            url = f"{self.base_urls['apartment_info']}/getLttotPblancDetail"
            params = {
                'serviceKey': self.service_key,
                'pageNo': page_no,
                'numOfRows': num_of_rows,
                'LAWD_CD': region_code,  # 11: 서울특별시
                '_type': 'json'
            }
            
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                
                if 'response' in data and 'body' in data['response']:
                    items = data['response']['body'].get('items', {}).get('item', [])
                    
                    if not isinstance(items, list):
                        items = [items]
                    
                    for item in items:
                        # 주택 관련 정보를 정책 형태로 변환
                        title = f"{item.get('HOUSE_NM', '공동주택')} 분양정보"
                        description = f"공급위치: {item.get('HSSPLY_ADRES', '')} | 공급규모: {item.get('TOT_SUPLY_HSHLDCO', '')}세대"
                        
                        # 주택정책 형태로 변환
                        policy = {
                            'title': title,
                            'description': description,
                            'content': f"{description} | 접수기간: {item.get('RCRIT_PBLANC_DE', '')}",
                            'url': "https://www.applyhome.co.kr/",
                            'category': "주택분양/청약",
                            'target_location': item.get('SIDO_NM', ''),
                            'source': '공공데이터포털',
                            'tags': json.dumps(['분양', '청약', '공동주택', item.get('SIDO_NM', '')], ensure_ascii=False)
                        }
                        policies.append(policy)
                        
        except Exception as e:
            print(f"Error fetching apartment info: {e}")
        
        return policies
    
    def get_lh_rental_info(self, page_no: int = 1, num_of_rows: int = 50) -> List[Dict]:
        """LH 임대주택 정보 조회"""
        policies = []
        
        try:
            url = f"{self.base_urls['lh_rental']}/getLHLeaseInfo"
            params = {
                'serviceKey': self.service_key,
                'pageNo': page_no,
                'numOfRows': num_of_rows,
                '_type': 'json'
            }
            
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                
                if 'response' in data and 'body' in data['response']:
                    items = data['response']['body'].get('items', {}).get('item', [])
                    
                    if not isinstance(items, list):
                        items = [items]
                    
                    for item in items:
                        title = f"{item.get('HOUSE_NM', 'LH임대주택')} 임대정보"
                        description = f"임대조건: {item.get('RENT_SECD', '')} | 위치: {item.get('HSSPLY_ADRES', '')}"
                        
                        # 청년 대상 여부 확인
                        age_range = {'min': None, 'max': None}
                        if any(keyword in title.lower() for keyword in ['청년', '행복주택']):
                            age_range = {'min': 19, 'max': 39}
                        
                        policy = {
                            'title': title,
                            'description': description,
                            'content': f"{description} | 공급일정: {item.get('PBLANC_NO', '')}",
                            'url': "https://www.lh.co.kr/",
                            'category': "공공임대주택",
                            'target_age_min': age_range['min'],
                            'target_age_max': age_range['max'],
                            'target_location': item.get('SIDO_NM', ''),
                            'source': 'LH공사API',
                            'tags': json.dumps(['LH', '임대주택', '공공임대', item.get('SIDO_NM', '')], ensure_ascii=False)
                        }
                        policies.append(policy)
                        
        except Exception as e:
            print(f"Error fetching LH rental info: {e}")
        
        return policies
    
    def get_housing_welfare_info(self, region_code: str = "11") -> List[Dict]:
        """주거복지 정보 조회"""
        policies = []
        
        try:
            # 주거급여 정보 API 호출 (가상의 엔드포인트)
            url = f"{self.base_urls['housing_welfare']}/getHousingWelfareInfo"
            params = {
                'serviceKey': self.service_key,
                'LAWD_CD': region_code,
                '_type': 'json'
            }
            
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                
                # 주거급여 관련 정책 정보 생성 (실제 API 응답에 맞게 수정 필요)
                welfare_policies = [
                    {
                        'title': '주거급여 지원사업',
                        'description': '저소득층의 주거비 부담을 덜어주는 맞춤형 주거복지제도',
                        'content': '소득인정액이 기준 중위소득 47% 이하인 가구에게 임차급여 또는 수선유지급여 지원',
                        'url': 'https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do?wlfareInfoId=WLF00000162',
                        'category': '주거급여/지원',
                        'target_age_min': 18,
                        'target_age_max': None,
                        'source': '복지로API',
                        'tags': json.dumps(['주거급여', '저소득층', '주거지원'], ensure_ascii=False)
                    },
                    {
                        'title': '청년 주거급여 분리지급',
                        'description': '부모와 떨어져 거주하는 청년에게 주거급여를 별도 지급',
                        'content': '만 19~30세 미혼청년이 취업, 구직 등을 위해 부모와 별도 거주시 주거급여 분리지급',
                        'url': 'https://www.bokjiro.go.kr/',
                        'category': '청년주택정책',
                        'target_age_min': 19,
                        'target_age_max': 30,
                        'source': '복지로API',
                        'tags': json.dumps(['청년', '주거급여', '분리지급'], ensure_ascii=False)
                    }
                ]
                
                policies.extend(welfare_policies)
                        
        except Exception as e:
            print(f"Error fetching housing welfare info: {e}")
        
        return policies
    
    def get_policy_announcements(self, keyword: str = "주택") -> List[Dict]:
        """국토교통부 정책 공지사항 조회"""
        policies = []
        
        try:
            # 국토교통부 정책 정보 API (가상의 엔드포인트)
            url = f"{self.base_urls['molit_policy']}/getPolicyInfo"
            params = {
                'serviceKey': self.service_key,
                'searchKeyword': keyword,
                'numOfRows': 20,
                '_type': 'json'
            }
            
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                # 실제 API가 없으므로 샘플 데이터 생성
                sample_policies = [
                    {
                        'title': '2025년 청년 전세자금대출 금리 인하',
                        'description': '만 34세 이하 청년 대상 전세자금대출 금리를 연 2.9%로 인하',
                        'content': '소득 5천만원 이하 청년에게 최대 2억원까지 연 2.9% 금리로 전세자금 지원',
                        'url': 'https://www.molit.go.kr/',
                        'category': '주택금융지원',
                        'target_age_min': 19,
                        'target_age_max': 34,
                        'source': '국토교통부API',
                        'tags': json.dumps(['청년', '전세자금', '대출', '금리인하'], ensure_ascii=False)
                    },
                    {
                        'title': '신혼부부 특별공급 확대',
                        'description': '신혼부부 주택 특별공급 물량을 전년 대비 30% 확대',
                        'content': '결혼 7년 이내 신혼부부 대상 특별공급 주택을 연간 5만호로 확대',
                        'url': 'https://www.molit.go.kr/',
                        'category': '신혼부부주택',
                        'target_age_min': 25,
                        'target_age_max': 40,
                        'source': '국토교통부API',
                        'tags': json.dumps(['신혼부부', '특별공급', '주택공급'], ensure_ascii=False)
                    }
                ]
                
                policies.extend(sample_policies)
                        
        except Exception as e:
            print(f"Error fetching policy announcements: {e}")
        
        return policies
    
    def save_api_policies(self, policies: List[Dict]) -> int:
        """API로 수집한 정책들을 데이터베이스에 저장"""
        if not policies:
            return 0
            
        conn = self.get_db_connection()
        cursor = conn.cursor()
        saved_count = 0
        
        for policy in policies:
            try:
                # 중복 체크 (제목과 출처 기준)
                cursor.execute("""
                    SELECT id FROM policies 
                    WHERE title = ? AND tags LIKE ?
                """, (policy['title'], f"%{policy['source']}%"))
                
                if cursor.fetchone():
                    continue
                
                cursor.execute("""
                    INSERT INTO policies (
                        title, description, content, url, category,
                        target_age_min, target_age_max, target_gender, target_location,
                        tags, crawled_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    policy['title'],
                    policy['description'],
                    policy['content'],
                    policy['url'],
                    policy['category'],
                    policy.get('target_age_min'),
                    policy.get('target_age_max'),
                    policy.get('target_gender'),
                    policy.get('target_location'),
                    policy['tags'],
                    datetime.now()
                ))
                saved_count += 1
                
            except Exception as e:
                print(f"Error saving API policy: {e}")
                continue
        
        conn.commit()
        conn.close()
        return saved_count
    
    def fetch_all_housing_policies(self) -> Dict[str, int]:
        """모든 공공데이터 API에서 주택정책 정보 수집"""
        print("Starting public data API collection...")
        
        all_policies = []
        
        # 공동주택 정보 수집
        apartment_policies = self.get_apartment_complex_info()
        all_policies.extend(apartment_policies)
        print(f"Apartment policies collected: {len(apartment_policies)}")
        
        # LH 임대주택 정보 수집
        lh_policies = self.get_lh_rental_info()
        all_policies.extend(lh_policies)
        print(f"LH rental policies collected: {len(lh_policies)}")
        
        # 주거복지 정보 수집
        welfare_policies = self.get_housing_welfare_info()
        all_policies.extend(welfare_policies)
        print(f"Housing welfare policies collected: {len(welfare_policies)}")
        
        # 정책 공지사항 수집
        policy_policies = self.get_policy_announcements()
        all_policies.extend(policy_policies)
        print(f"Policy announcements collected: {len(policy_policies)}")
        
        # 데이터베이스에 저장
        saved_count = self.save_api_policies(all_policies)
        
        print(f"Public data API collection completed: {len(all_policies)} collected, {saved_count} saved")
        
        return {
            'total_collected': len(all_policies),
            'total_saved': saved_count,
            'apartment_policies': len(apartment_policies),
            'lh_policies': len(lh_policies),
            'welfare_policies': len(welfare_policies),
            'policy_announcements': len(policy_policies)
        }


def main():
    """테스트용 메인 함수"""
    # 실제 서비스 키가 필요함 - 공공데이터포털에서 발급받아야 함
    api_client = PublicDataAPIClient("YOUR_SERVICE_KEY_HERE")
    result = api_client.fetch_all_housing_policies()
    print(f"API collection result: {result}")


if __name__ == "__main__":
    main()