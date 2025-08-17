import asyncio
import sqlite3
import json
import re
from datetime import datetime
from typing import List, Dict, Optional
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import requests
from database.connection import DATABASE_PATH


class HousingPolicyCrawler:
    def __init__(self):
        self.db_path = DATABASE_PATH
        self.housing_keywords = [
            '주택', '임대', '전세', '월세', '아파트', '원룸', '투룸', '빌라', 
            '청년주택', '신혼부부', '전세자금', '주택구입', '주택담보대출',
            'LH', '공공임대', '분양', '청약', '주거급여', '주거지원',
            '주택청약', '임대주택', '행복주택', '매입임대', '전세임대'
        ]
        
    def get_db_connection(self):
        return sqlite3.connect(self.db_path)
    
    async def crawl_lh_housing_policies(self) -> List[Dict]:
        """LH 한국토지주택공사 정책 크롤링"""
        policies = []
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            try:
                # LH 청년주택 정책 페이지
                await page.goto("https://www.lh.co.kr/contents/cont.do?sMenuId=LH0000000072")
                await page.wait_for_timeout(3000)
                
                content = await page.content()
                soup = BeautifulSoup(content, 'html.parser')
                
                # 정책 정보 추출
                policy_sections = soup.select(".policy_list li, .cont_area .list_box li")
                
                for section in policy_sections[:15]:
                    try:
                        title_elem = section.select_one("a, .title, h3, h4")
                        if not title_elem:
                            continue
                            
                        title = title_elem.get_text(strip=True)
                        
                        # 주택 관련 키워드 필터링
                        if not self._is_housing_related(title):
                            continue
                            
                        link = title_elem.get('href', '') if title_elem.name == 'a' else ''
                        if link and not link.startswith('http'):
                            link = f"https://www.lh.co.kr{link}"
                        
                        # 설명 추출
                        desc_elem = section.select_one(".summary, .desc, p")
                        description = desc_elem.get_text(strip=True) if desc_elem else title
                        
                        # 카테고리 분류
                        category = self._classify_housing_category(title + " " + description)
                        
                        # 대상 연령 추출
                        age_range = self._extract_age_range(title + " " + description)
                        
                        policies.append({
                            'title': title,
                            'description': description,
                            'content': description,
                            'url': link or "https://www.lh.co.kr/contents/cont.do?sMenuId=LH0000000072",
                            'category': category,
                            'target_age_min': age_range.get('min'),
                            'target_age_max': age_range.get('max'),
                            'source': 'LH공사',
                            'tags': json.dumps(self._extract_housing_tags(title + " " + description), ensure_ascii=False)
                        })
                        
                    except Exception as e:
                        print(f"Error parsing LH policy: {e}")
                        continue
                        
            except Exception as e:
                print(f"Error crawling LH policies: {e}")
            finally:
                await browser.close()
        
        return policies
    
    async def crawl_molit_housing_policies(self) -> List[Dict]:
        """국토교통부 주택정책 크롤링"""
        policies = []
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            try:
                # 국토교통부 주택정책 페이지
                await page.goto("https://www.molit.go.kr/USR/BORD0201/m_69/LST.jsp")
                await page.wait_for_timeout(3000)
                
                content = await page.content()
                soup = BeautifulSoup(content, 'html.parser')
                
                # 정책 공지사항 추출
                news_items = soup.select(".bd_lst tbody tr")
                
                for item in news_items[:20]:
                    try:
                        title_elem = item.select_one("td.title a, .title")
                        if not title_elem:
                            continue
                            
                        title = title_elem.get_text(strip=True)
                        
                        # 주택 관련 키워드 필터링
                        if not self._is_housing_related(title):
                            continue
                            
                        link = title_elem.get('href', '')
                        if link and not link.startswith('http'):
                            link = f"https://www.molit.go.kr{link}"
                        
                        # 날짜 추출
                        date_elem = item.select_one("td.date, .date")
                        date_str = date_elem.get_text(strip=True) if date_elem else ""
                        
                        category = self._classify_housing_category(title)
                        age_range = self._extract_age_range(title)
                        
                        policies.append({
                            'title': title,
                            'description': f"{title} - {date_str}",
                            'content': title,
                            'url': link or "https://www.molit.go.kr/USR/BORD0201/m_69/LST.jsp",
                            'category': category,
                            'target_age_min': age_range.get('min'),
                            'target_age_max': age_range.get('max'),
                            'source': '국토교통부',
                            'tags': json.dumps(self._extract_housing_tags(title), ensure_ascii=False)
                        })
                        
                    except Exception as e:
                        print(f"Error parsing MOLIT policy: {e}")
                        continue
                        
            except Exception as e:
                print(f"Error crawling MOLIT policies: {e}")
            finally:
                await browser.close()
        
        return policies
    
    async def crawl_seoul_housing_policies(self) -> List[Dict]:
        """서울시 주택정책 크롤링"""
        policies = []
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            try:
                # 서울주거포털
                await page.goto("https://housing.seoul.go.kr/site/main/archive/policy")
                await page.wait_for_timeout(3000)
                
                content = await page.content()
                soup = BeautifulSoup(content, 'html.parser')
                
                # 정책 리스트 추출
                policy_items = soup.select(".policy_list li, .news_list li, .board_list tr")
                
                for item in policy_items[:15]:
                    try:
                        title_elem = item.select_one("a, .title, .subject")
                        if not title_elem:
                            continue
                            
                        title = title_elem.get_text(strip=True)
                        
                        # 주택 관련 키워드 필터링
                        if not self._is_housing_related(title):
                            continue
                            
                        link = title_elem.get('href', '')
                        if link and not link.startswith('http'):
                            link = f"https://housing.seoul.go.kr{link}"
                        
                        # 설명 추출
                        desc_elem = item.select_one(".summary, .content, .desc")
                        description = desc_elem.get_text(strip=True) if desc_elem else title
                        
                        category = self._classify_housing_category(title + " " + description)
                        age_range = self._extract_age_range(title + " " + description)
                        
                        policies.append({
                            'title': title,
                            'description': description,
                            'content': description,
                            'url': link or "https://housing.seoul.go.kr/site/main/archive/policy",
                            'category': category,
                            'target_age_min': age_range.get('min'),
                            'target_age_max': age_range.get('max'),
                            'target_location': '서울',
                            'source': '서울시',
                            'tags': json.dumps(self._extract_housing_tags(title + " " + description), ensure_ascii=False)
                        })
                        
                    except Exception as e:
                        print(f"Error parsing Seoul policy: {e}")
                        continue
                        
            except Exception as e:
                print(f"Error crawling Seoul policies: {e}")
            finally:
                await browser.close()
        
        return policies
    
    def crawl_myhome_portal(self) -> List[Dict]:
        """마이홈포털 주택정책 크롤링"""
        policies = []
        
        try:
            # 마이홈포털 정책정보
            url = "https://www.myhome.go.kr/hws/portal/cont/selectPolicyListAjax.do"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            data = {
                'pageIndex': '1',
                'pageUnit': '20',
                'searchType': 'all',
                'searchKeyword': '청년'
            }
            
            response = requests.post(url, headers=headers, data=data, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # 정책 리스트 추출
                policy_items = soup.select(".policy_item, .list_item")
                
                for item in policy_items:
                    try:
                        title_elem = item.select_one(".title, h3, h4")
                        if not title_elem:
                            continue
                            
                        title = title_elem.get_text(strip=True)
                        
                        if not self._is_housing_related(title):
                            continue
                            
                        # 설명 추출
                        desc_elem = item.select_one(".summary, .content")
                        description = desc_elem.get_text(strip=True) if desc_elem else title
                        
                        category = self._classify_housing_category(title + " " + description)
                        age_range = self._extract_age_range(title + " " + description)
                        
                        policies.append({
                            'title': title,
                            'description': description,
                            'content': description,
                            'url': "https://www.myhome.go.kr/hws/portal/main/getMgtMainView.do",
                            'category': category,
                            'target_age_min': age_range.get('min'),
                            'target_age_max': age_range.get('max'),
                            'source': '마이홈포털',
                            'tags': json.dumps(self._extract_housing_tags(title + " " + description), ensure_ascii=False)
                        })
                        
                    except Exception as e:
                        print(f"Error parsing MyHome policy: {e}")
                        continue
                        
        except Exception as e:
            print(f"Error crawling MyHome policies: {e}")
        
        return policies
    
    def _is_housing_related(self, text: str) -> bool:
        """텍스트가 주택 관련인지 확인"""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.housing_keywords)
    
    def _classify_housing_category(self, text: str) -> str:
        """주택정책 세부 카테고리 분류"""
        text_lower = text.lower()
        
        if any(keyword in text_lower for keyword in ['전세자금', '주택구입', '주택담보대출', '대출']):
            return "주택금융지원"
        elif any(keyword in text_lower for keyword in ['청년주택', '행복주택', '매입임대', '전세임대', '공공임대']):
            return "공공임대주택"
        elif any(keyword in text_lower for keyword in ['분양', '청약', '주택청약']):
            return "주택분양/청약"
        elif any(keyword in text_lower for keyword in ['주거급여', '주거지원', '임대료지원']):
            return "주거급여/지원"
        elif any(keyword in text_lower for keyword in ['신혼부부', '신혼', '결혼']):
            return "신혼부부주택"
        elif any(keyword in text_lower for keyword in ['청년', '대학생']):
            return "청년주택정책"
        else:
            return "기타주택정책"
    
    def _extract_age_range(self, text: str) -> Dict[str, Optional[int]]:
        """텍스트에서 대상 연령 추출"""
        age_patterns = {
            '청년': {'min': 19, 'max': 39},
            '신혼부부': {'min': 25, 'max': 40},
            '대학생': {'min': 18, 'max': 26},
            '사회초년생': {'min': 22, 'max': 30},
        }
        
        for keyword, age_range in age_patterns.items():
            if keyword in text:
                return age_range
        
        # 숫자로 된 연령 범위 추출
        age_match = re.search(r'(\d{2})세?\s*[~-]\s*(\d{2})세?', text)
        if age_match:
            return {'min': int(age_match.group(1)), 'max': int(age_match.group(2))}
        
        return {'min': None, 'max': None}
    
    def _extract_housing_tags(self, text: str) -> List[str]:
        """주택 관련 태그 추출"""
        tags = []
        
        # 주택 유형
        if any(keyword in text for keyword in ['아파트', 'APT']):
            tags.append('아파트')
        if any(keyword in text for keyword in ['원룸', '1룸']):
            tags.append('원룸')
        if any(keyword in text for keyword in ['투룸', '2룸']):
            tags.append('투룸')
        if any(keyword in text for keyword in ['빌라', '다세대']):
            tags.append('빌라')
        
        # 지원 유형
        if any(keyword in text for keyword in ['대출', '금융']):
            tags.append('대출지원')
        if any(keyword in text for keyword in ['임대', '렌탈']):
            tags.append('임대주택')
        if any(keyword in text for keyword in ['분양', '청약']):
            tags.append('분양')
        if any(keyword in text for keyword in ['지원금', '보조금', '급여']):
            tags.append('지원금')
        
        # 대상자
        if '청년' in text:
            tags.append('청년')
        if any(keyword in text for keyword in ['신혼부부', '신혼']):
            tags.append('신혼부부')
        if '대학생' in text:
            tags.append('대학생')
        
        # 지역
        if '서울' in text:
            tags.append('서울')
        if 'LH' in text:
            tags.append('LH')
        
        return tags if tags else ['주택정책']
    
    def save_housing_policies(self, policies: List[Dict]) -> int:
        """주택정책들을 데이터베이스에 저장"""
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
                print(f"Error saving housing policy: {e}")
                continue
        
        conn.commit()
        conn.close()
        return saved_count
    
    async def run_housing_policy_crawling(self) -> Dict[str, int]:
        """전체 주택정책 크롤링 실행"""
        print("Starting housing policy crawling...")
        
        # LH 공사 크롤링
        lh_policies = await self.crawl_lh_housing_policies()
        lh_saved = self.save_housing_policies(lh_policies)
        print(f"LH policies crawled: {len(lh_policies)}, saved: {lh_saved}")
        
        # 국토교통부 크롤링
        molit_policies = await self.crawl_molit_housing_policies()
        molit_saved = self.save_housing_policies(molit_policies)
        print(f"MOLIT policies crawled: {len(molit_policies)}, saved: {molit_saved}")
        
        # 서울시 크롤링
        seoul_policies = await self.crawl_seoul_housing_policies()
        seoul_saved = self.save_housing_policies(seoul_policies)
        print(f"Seoul policies crawled: {len(seoul_policies)}, saved: {seoul_saved}")
        
        # 마이홈포털 크롤링
        myhome_policies = self.crawl_myhome_portal()
        myhome_saved = self.save_housing_policies(myhome_policies)
        print(f"MyHome policies crawled: {len(myhome_policies)}, saved: {myhome_saved}")
        
        total_crawled = len(lh_policies) + len(molit_policies) + len(seoul_policies) + len(myhome_policies)
        total_saved = lh_saved + molit_saved + seoul_saved + myhome_saved
        
        print(f"Housing policy crawling completed: {total_crawled} crawled, {total_saved} saved")
        
        return {
            'total_crawled': total_crawled,
            'total_saved': total_saved,
            'lh_crawled': len(lh_policies),
            'lh_saved': lh_saved,
            'molit_crawled': len(molit_policies),
            'molit_saved': molit_saved,
            'seoul_crawled': len(seoul_policies),
            'seoul_saved': seoul_saved,
            'myhome_crawled': len(myhome_policies),
            'myhome_saved': myhome_saved
        }


async def main():
    """테스트용 메인 함수"""
    crawler = HousingPolicyCrawler()
    result = await crawler.run_housing_policy_crawling()
    print(f"Housing policy crawling result: {result}")


if __name__ == "__main__":
    asyncio.run(main())