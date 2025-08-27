import requests
from bs4 import BeautifulSoup
import re
import time
import sqlite3
import logging
from urllib.parse import urljoin, urlparse
import json
from typing import Optional, List, Dict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PolicyURLCrawler:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # 주요 정책 사이트 목록
        self.policy_sites = {
            '고용노동부': [
                'https://www.moel.go.kr',
                'https://www.work.go.kr'
            ],
            '국토교통부': [
                'https://www.molit.go.kr',
                'https://www.lh.or.kr'
            ],
            '교육부': [
                'https://www.moe.go.kr'
            ],
            '여성가족부': [
                'https://www.mogef.go.kr'
            ],
            '중소벤처기업부': [
                'https://www.mss.go.kr'
            ],
            '보건복지부': [
                'https://www.mohw.go.kr'
            ],
            '서울특별시': [
                'https://www.seoul.go.kr',
                'https://youth.seoul.go.kr'
            ]
        }

    def search_policy_on_site(self, site_url: str, policy_title: str, organization: str) -> Optional[str]:
        """특정 사이트에서 정책 검색"""
        try:
            # 사이트별 검색 URL 패턴
            search_patterns = {
                'moel.go.kr': '/policy/policydata/list.do',
                'work.go.kr': '/empPolicy/empPolicyList.do',
                'lh.or.kr': '/contents/cont.do?sMenuId=LH0402020000',
                'seoul.go.kr': '/main/policy/youngPolicyLst.do',
                'youth.seoul.go.kr': '/site/main/archive/youth_policy',
                'moe.go.kr': '/main.do?s=moe',
                'mogef.go.kr': '/sp/yth/sp_yth_f001.do',
                'mss.go.kr': '/site/smba/main.do'
            }
            
            domain = urlparse(site_url).netloc
            search_path = None
            
            for site_key, path in search_patterns.items():
                if site_key in domain:
                    search_path = path
                    break
            
            if not search_path:
                return None
            
            search_url = urljoin(site_url, search_path)
            
            # 검색 요청
            params = {
                'searchWord': policy_title,
                'searchType': 'title'
            }
            
            response = self.session.get(search_url, params=params, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 제목과 매칭되는 링크 찾기
            links = soup.find_all('a', href=True)
            
            for link in links:
                link_text = link.get_text(strip=True)
                # 제목 유사도 검사
                if self.is_similar_title(policy_title, link_text):
                    href = link['href']
                    if href.startswith('/'):
                        return urljoin(site_url, href)
                    elif href.startswith('http'):
                        return href
            
            return None
            
        except Exception as e:
            logger.error(f"Error searching {site_url}: {e}")
            return None

    def is_similar_title(self, original: str, candidate: str) -> bool:
        """제목 유사도 검사"""
        # 특수문자 제거 후 비교
        original_clean = re.sub(r'[^\w\s]', '', original).strip()
        candidate_clean = re.sub(r'[^\w\s]', '', candidate).strip()
        
        # 핵심 키워드 추출
        original_words = set(original_clean.split())
        candidate_words = set(candidate_clean.split())
        
        # 교집합이 원본의 50% 이상이면 유사하다고 판단
        if len(original_words) == 0:
            return False
        
        intersection = original_words.intersection(candidate_words)
        similarity = len(intersection) / len(original_words)
        
        return similarity >= 0.5

    def search_on_google(self, policy_title: str, organization: str) -> List[str]:
        """구글 검색으로 정책 관련 URL 찾기"""
        try:
            query = f"{policy_title} {organization} site:go.kr OR site:or.kr"
            search_url = f"https://www.google.com/search"
            
            params = {
                'q': query,
                'num': 10
            }
            
            response = self.session.get(search_url, params=params, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            urls = []
            # 구글 검색 결과에서 링크 추출
            for link in soup.find_all('a', href=True):
                href = link['href']
                if '/url?q=' in href:
                    # 구글 리다이렉트 URL에서 실제 URL 추출
                    actual_url = href.split('/url?q=')[1].split('&')[0]
                    if actual_url.startswith('http') and ('go.kr' in actual_url or 'or.kr' in actual_url):
                        urls.append(actual_url)
            
            return urls[:5]  # 상위 5개만 반환
            
        except Exception as e:
            logger.error(f"Google search error: {e}")
            return []

    def verify_url_contains_policy(self, url: str, policy_title: str) -> bool:
        """URL이 실제로 해당 정책에 대한 내용을 포함하는지 검증"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            page_text = soup.get_text()
            
            # 정책 제목의 핵심 키워드가 페이지에 포함되어 있는지 확인
            title_words = re.sub(r'[^\w\s]', '', policy_title).split()
            keyword_count = 0
            
            for word in title_words:
                if len(word) > 1 and word in page_text:
                    keyword_count += 1
            
            # 키워드의 절반 이상이 포함되어 있으면 관련 페이지로 판단
            return keyword_count >= len(title_words) / 2
            
        except Exception as e:
            logger.error(f"URL verification error for {url}: {e}")
            return False

    def find_policy_url(self, policy_title: str, organization: str) -> Optional[str]:
        """정책에 대한 실제 URL 찾기"""
        logger.info(f"Searching for policy: {policy_title} by {organization}")
        
        # 1. 해당 기관의 사이트에서 검색
        if organization in self.policy_sites:
            for site_url in self.policy_sites[organization]:
                found_url = self.search_policy_on_site(site_url, policy_title, organization)
                if found_url and self.verify_url_contains_policy(found_url, policy_title):
                    logger.info(f"Found URL on official site: {found_url}")
                    return found_url
                time.sleep(1)  # 요청 간격 조정
        
        # 2. 구글 검색으로 관련 URL 찾기
        google_urls = self.search_on_google(policy_title, organization)
        for url in google_urls:
            if self.verify_url_contains_policy(url, policy_title):
                logger.info(f"Found URL via Google: {url}")
                return url
            time.sleep(1)
        
        logger.warning(f"No URL found for policy: {policy_title}")
        return None

    def update_policy_urls_in_db(self, db_path: str = 'users.db'):
        """데이터베이스의 정책 URL 업데이트"""
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # 정책 데이터 조회 (URL이 없거나 기본 URL인 경우)
            cursor.execute("""
                SELECT id, title, organization, application_url, reference_url 
                FROM policies 
                WHERE (application_url IS NULL OR application_url = '' 
                      OR application_url LIKE '%example.com%'
                      OR reference_url LIKE '%gov.go.kr%')
                LIMIT 50
            """)
            
            policies = cursor.fetchall()
            
            for policy_id, title, organization, app_url, ref_url in policies:
                logger.info(f"Processing policy ID {policy_id}: {title}")
                
                # 새로운 URL 찾기
                new_url = self.find_policy_url(title, organization)
                
                if new_url:
                    # DB 업데이트
                    cursor.execute("""
                        UPDATE policies 
                        SET application_url = ?, updated_at = datetime('now')
                        WHERE id = ?
                    """, (new_url, policy_id))
                    
                    logger.info(f"Updated policy {policy_id} with URL: {new_url}")
                
                # 과도한 요청 방지를 위한 지연
                time.sleep(2)
            
            conn.commit()
            conn.close()
            
            logger.info(f"Processed {len(policies)} policies")
            
        except Exception as e:
            logger.error(f"Database update error: {e}")

def main():
    """크롤러 실행"""
    crawler = PolicyURLCrawler()
    
    # 데이터베이스 URL 업데이트
    crawler.update_policy_urls_in_db()
    
    print("정책 URL 크롤링 완료!")

if __name__ == "__main__":
    main()