import asyncio
import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import requests
from database.connection import DATABASE_PATH


class PolicyCrawler:
    def __init__(self):
        self.db_path = DATABASE_PATH
        
    def get_db_connection(self):
        return sqlite3.connect(self.db_path)
    
    async def crawl_youth_policy(self) -> List[Dict]:
        """청년정책포털에서 정책 정보 크롤링"""
        policies = []
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            try:
                await page.goto("https://www.youthcenter.go.kr/youngPlcyUnif/youngPlcyUnifList.do")
                await page.wait_for_selector(".result_list", timeout=10000)
                
                content = await page.content()
                soup = BeautifulSoup(content, 'html.parser')
                
                # 정책 리스트 추출
                policy_items = soup.select(".result_list .result_item")
                
                for item in policy_items[:10]:  # 최대 10개
                    try:
                        title_elem = item.select_one(".title a")
                        if not title_elem:
                            continue
                            
                        title = title_elem.get_text(strip=True)
                        link = title_elem.get('href', '')
                        
                        if link and not link.startswith('http'):
                            link = f"https://www.youthcenter.go.kr{link}"
                        
                        # 상세 정보 추출
                        description_elem = item.select_one(".summary")
                        description = description_elem.get_text(strip=True) if description_elem else ""
                        
                        # 카테고리 추출
                        category_elem = item.select_one(".category")
                        category = category_elem.get_text(strip=True) if category_elem else "청년정책"
                        
                        # 태그 추출
                        tags = ["청년", "정책", category]
                        
                        policies.append({
                            'title': title,
                            'description': description,
                            'content': description,
                            'url': link,
                            'category': category,
                            'target_age_min': 19,
                            'target_age_max': 34,
                            'tags': json.dumps(tags, ensure_ascii=False)
                        })
                        
                    except Exception as e:
                        print(f"Error parsing policy item: {e}")
                        continue
                        
            except Exception as e:
                print(f"Error crawling youth policy: {e}")
            finally:
                await browser.close()
        
        return policies
    
    def crawl_korea_policy(self) -> List[Dict]:
        """온나라정책뉴스에서 정책 정보 크롤링"""
        policies = []
        
        try:
            url = "https://www.korea.kr/news/policyNews.do"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # 정책뉴스 리스트 추출
                news_items = soup.select(".news_list li")
                
                for item in news_items[:10]:  # 최대 10개
                    try:
                        title_elem = item.select_one("a")
                        if not title_elem:
                            continue
                            
                        title = title_elem.get_text(strip=True)
                        link = title_elem.get('href', '')
                        
                        if link and not link.startswith('http'):
                            link = f"https://www.korea.kr{link}"
                        
                        # 설명 추출
                        description_elem = item.select_one(".summary")
                        description = description_elem.get_text(strip=True) if description_elem else title
                        
                        # 정책 키워드 기반 분류
                        category = self._classify_policy_category(title + " " + description)
                        tags = self._extract_tags(title + " " + description)
                        
                        policies.append({
                            'title': title,
                            'description': description,
                            'content': description,
                            'url': link,
                            'category': category,
                            'target_age_min': None,
                            'target_age_max': None,
                            'tags': json.dumps(tags, ensure_ascii=False)
                        })
                        
                    except Exception as e:
                        print(f"Error parsing korea policy item: {e}")
                        continue
                        
        except Exception as e:
            print(f"Error crawling korea policy: {e}")
        
        return policies
    
    def _classify_policy_category(self, text: str) -> str:
        """텍스트 기반으로 정책 카테고리 분류"""
        text_lower = text.lower()
        
        if any(keyword in text_lower for keyword in ['청년', '대학생', '취업', '창업']):
            return "청년정책"
        elif any(keyword in text_lower for keyword in ['주택', '임대', '전세', '월세', '부동산']):
            return "주거정책"
        elif any(keyword in text_lower for keyword in ['대출', '금융', '지원금', '보조금']):
            return "금융지원"
        elif any(keyword in text_lower for keyword in ['복지', '의료', '건강']):
            return "복지정책"
        elif any(keyword in text_lower for keyword in ['교육', '학습', '연수']):
            return "교육정책"
        else:
            return "기타정책"
    
    def _extract_tags(self, text: str) -> List[str]:
        """텍스트에서 태그 추출"""
        tags = []
        
        # 기본 태그
        if '청년' in text:
            tags.append('청년')
        if '대학생' in text:
            tags.append('대학생')
        if '주택' in text or '임대' in text:
            tags.append('주택')
        if '대출' in text:
            tags.append('대출')
        if '지원' in text:
            tags.append('지원')
        if '서울' in text:
            tags.append('서울')
        
        return tags if tags else ['정책']
    
    def save_policies(self, policies: List[Dict]) -> int:
        """크롤링한 정책들을 데이터베이스에 저장"""
        if not policies:
            return 0
            
        conn = self.get_db_connection()
        cursor = conn.cursor()
        saved_count = 0
        
        for policy in policies:
            try:
                # 중복 체크 (URL 기준)
                cursor.execute("SELECT id FROM policies WHERE url = ?", (policy['url'],))
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
                print(f"Error saving policy: {e}")
                continue
        
        conn.commit()
        conn.close()
        return saved_count
    
    async def run_crawling(self) -> Dict[str, int]:
        """전체 크롤링 실행"""
        print("Starting policy crawling...")
        
        # 청년정책포털 크롤링
        youth_policies = await self.crawl_youth_policy()
        youth_saved = self.save_policies(youth_policies)
        print(f"Youth policies crawled: {len(youth_policies)}, saved: {youth_saved}")
        
        # 온나라정책뉴스 크롤링
        korea_policies = self.crawl_korea_policy()
        korea_saved = self.save_policies(korea_policies)
        print(f"Korea policies crawled: {len(korea_policies)}, saved: {korea_saved}")
        
        total_crawled = len(youth_policies) + len(korea_policies)
        total_saved = youth_saved + korea_saved
        
        print(f"Total crawling completed: {total_crawled} crawled, {total_saved} saved")
        
        return {
            'total_crawled': total_crawled,
            'total_saved': total_saved,
            'youth_crawled': len(youth_policies),
            'youth_saved': youth_saved,
            'korea_crawled': len(korea_policies),
            'korea_saved': korea_saved
        }


async def main():
    """테스트용 메인 함수"""
    crawler = PolicyCrawler()
    result = await crawler.run_crawling()
    print(f"Crawling result: {result}")


if __name__ == "__main__":
    asyncio.run(main())