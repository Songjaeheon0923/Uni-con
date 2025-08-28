import requests
from bs4 import BeautifulSoup
import json
import time
import sqlite3
from datetime import datetime
import re
from urllib.parse import urljoin, urlparse
import logging
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class YouthHousingPolicyCrawler:
    def __init__(self, use_selenium=True):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        
        self.use_selenium = use_selenium
        self.driver = None
        
        if use_selenium:
            self.setup_selenium_driver()
    
    def setup_selenium_driver(self):
        """Selenium 드라이버 설정"""
        try:
            chrome_options = Options()
            chrome_options.add_argument('--headless')  # 백그라운드 실행
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            chrome_options.add_argument('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
            
            self.driver = webdriver.Chrome(options=chrome_options)
            logger.info("Selenium 드라이버가 성공적으로 설정되었습니다.")
        except Exception as e:
            logger.error(f"Selenium 드라이버 설정 실패: {e}")
            self.use_selenium = False
    
    def crawl_lh_housing_policies(self):
        """LH 청년 주거 정책 크롤링"""
        policies = []
        
        if not self.use_selenium:
            logger.warning("Selenium을 사용할 수 없어 LH 크롤링을 건너뜁니다.")
            return policies
        
        try:
            # LH 청약플러스 공고문 페이지
            url = "https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancList.do?mi=1026"
            
            self.driver.get(url)
            time.sleep(3)
            
            # 청년 관련 키워드로 필터링
            youth_keywords = ['청년', '대학생', '사회초년생', '신혼부부']
            
            # 공고문 목록 찾기
            announcements = self.driver.find_elements(By.CSS_SELECTOR, "tr")
            
            for announcement in announcements:
                try:
                    # 공고명 추출
                    title_element = announcement.find_element(By.CSS_SELECTOR, ".wrtancInfoBtn, a")
                    title = title_element.text.strip()
                    
                    # 청년 관련 키워드가 포함된 공고만 선택
                    if not any(keyword in title for keyword in youth_keywords):
                        continue
                    
                    # 상세 링크 추출
                    detail_url = title_element.get_attribute("href") or title_element.get_attribute("onclick")
                    
                    # 기간 정보 추출
                    cells = announcement.find_elements(By.CSS_SELECTOR, "td")
                    if len(cells) >= 6:
                        region = cells[3].text.strip() if len(cells) > 3 else ""
                        start_date = cells[5].text.strip() if len(cells) > 5 else ""
                        end_date = cells[6].text.strip() if len(cells) > 6 else ""
                        status = cells[7].text.strip() if len(cells) > 7 else ""
                        
                        policy = {
                            'source': 'LH',
                            'title': title,
                            'region': region,
                            'application_start': start_date,
                            'application_end': end_date,
                            'status': status,
                            'url': f"https://apply.lh.or.kr{detail_url}" if detail_url and detail_url.startswith('/') else detail_url,
                            'category': '주거지원',
                            'target_age': '청년',
                            'crawled_at': datetime.now().isoformat()
                        }
                        
                        policies.append(policy)
                        logger.info(f"LH 정책 발견: {title}")
                
                except Exception as e:
                    logger.debug(f"공고문 파싱 오류: {e}")
                    continue
        
        except Exception as e:
            logger.error(f"LH 크롤링 오류: {e}")
        
        return policies
    
    def crawl_seoul_housing_policies(self):
        """서울시 청년 주거 정책 크롤링"""
        policies = []
        
        try:
            url = "https://housing.seoul.go.kr/site/main/content/sh01_060500"
            
            if self.use_selenium:
                self.driver.get(url)
                time.sleep(2)
                
                # 청년 지원 메뉴 항목들 찾기
                menu_items = self.driver.find_elements(By.CSS_SELECTOR, ".menu-item, .policy-list a, .support-list a")
                
                for item in menu_items:
                    try:
                        title = item.text.strip()
                        href = item.get_attribute("href")
                        
                        if '청년' in title and href:
                            policy = {
                                'source': '서울시',
                                'title': title,
                                'region': '서울특별시',
                                'url': href,
                                'category': '주거지원',
                                'target_age': '청년',
                                'status': '상시',
                                'crawled_at': datetime.now().isoformat()
                            }
                            
                            policies.append(policy)
                            logger.info(f"서울시 정책 발견: {title}")
                    
                    except Exception as e:
                        logger.debug(f"서울시 정책 파싱 오류: {e}")
                        continue
            else:
                # requests를 이용한 기본 크롤링
                response = self.session.get(url)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # 청년 관련 링크 찾기
                    links = soup.find_all('a', href=True)
                    for link in links:
                        text = link.get_text(strip=True)
                        if '청년' in text and len(text) > 5:
                            policy = {
                                'source': '서울시',
                                'title': text,
                                'region': '서울특별시',
                                'url': urljoin(url, link['href']),
                                'category': '주거지원',
                                'target_age': '청년',
                                'status': '상시',
                                'crawled_at': datetime.now().isoformat()
                            }
                            
                            policies.append(policy)
                            logger.info(f"서울시 정책 발견: {text}")
        
        except Exception as e:
            logger.error(f"서울시 크롤링 오류: {e}")
        
        return policies
    
    def crawl_government_policies(self):
        """정부24 및 기타 정부 사이트에서 청년 주거 정책 크롤링"""
        policies = []
        
        # 정부24는 접근이 어려우므로 알려진 청년 주거 정책들을 수동으로 추가
        known_policies = [
            {
                'source': '국토교통부',
                'title': '청년 전세임대주택',
                'region': '전국',
                'url': 'https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancList.do?mi=1026',
                'category': '주거지원',
                'target_age': '청년',
                'status': '상시모집',
                'description': '만 19세~39세 청년의 주거비 부담 완화를 위한 전세임대주택',
                'crawled_at': datetime.now().isoformat()
            },
            {
                'source': '국토교통부',
                'title': '청년 매입임대주택',
                'region': '전국',
                'url': 'https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancList.do?mi=1026',
                'category': '주거지원',
                'target_age': '청년',
                'status': '수시모집',
                'description': '청년층 대상 장기 임대주택 공급',
                'crawled_at': datetime.now().isoformat()
            },
            {
                'source': '국토교통부',
                'title': '행복주택 (청년·대학생)',
                'region': '전국',
                'url': 'https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancList.do?mi=1026',
                'category': '주거지원',
                'target_age': '청년',
                'status': '수시모집',
                'description': '대학생, 사회초년생, 신혼부부 등을 위한 공공임대주택',
                'crawled_at': datetime.now().isoformat()
            }
        ]
        
        policies.extend(known_policies)
        
        return policies
    
    def save_to_database(self, policies, db_path='users.db'):
        """크롤링한 정책 데이터를 데이터베이스에 저장"""
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # 청년 주거 정책 테이블 생성 (없으면)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS youth_housing_policies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source TEXT,
                    title TEXT,
                    region TEXT,
                    url TEXT,
                    category TEXT,
                    target_age TEXT,
                    status TEXT,
                    application_start TEXT,
                    application_end TEXT,
                    description TEXT,
                    crawled_at TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(source, title, region)
                )
            ''')
            
            saved_count = 0
            
            for policy in policies:
                try:
                    cursor.execute('''
                        INSERT OR REPLACE INTO youth_housing_policies 
                        (source, title, region, url, category, target_age, status, 
                         application_start, application_end, description, crawled_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        policy.get('source', ''),
                        policy.get('title', ''),
                        policy.get('region', ''),
                        policy.get('url', ''),
                        policy.get('category', ''),
                        policy.get('target_age', ''),
                        policy.get('status', ''),
                        policy.get('application_start', ''),
                        policy.get('application_end', ''),
                        policy.get('description', ''),
                        policy.get('crawled_at', '')
                    ))
                    
                    saved_count += 1
                    
                except sqlite3.IntegrityError:
                    logger.debug(f"중복된 정책: {policy.get('title', '')}")
                
            conn.commit()
            conn.close()
            
            logger.info(f"{saved_count}개의 청년 주거 정책을 데이터베이스에 저장했습니다.")
            return saved_count
            
        except Exception as e:
            logger.error(f"데이터베이스 저장 오류: {e}")
            return 0
    
    def crawl_all_youth_housing_policies(self):
        """모든 청년 주거 정책 크롤링"""
        logger.info("청년 주거 정책 크롤링을 시작합니다...")
        
        all_policies = []
        
        # 1. LH 정책 크롤링
        logger.info("LH 청년 주거 정책 크롤링 중...")
        lh_policies = self.crawl_lh_housing_policies()
        all_policies.extend(lh_policies)
        
        # 2. 서울시 정책 크롤링
        logger.info("서울시 청년 주거 정책 크롤링 중...")
        seoul_policies = self.crawl_seoul_housing_policies()
        all_policies.extend(seoul_policies)
        
        # 3. 기타 정부 정책 추가
        logger.info("기타 정부 청년 주거 정책 추가 중...")
        gov_policies = self.crawl_government_policies()
        all_policies.extend(gov_policies)
        
        # 4. 데이터베이스에 저장
        saved_count = self.save_to_database(all_policies)
        
        logger.info(f"총 {len(all_policies)}개의 청년 주거 정책을 발견했고, {saved_count}개를 저장했습니다.")
        
        return all_policies
    
    def close(self):
        """리소스 정리"""
        if self.driver:
            self.driver.quit()

def main():
    """메인 실행 함수"""
    crawler = YouthHousingPolicyCrawler()
    
    try:
        policies = crawler.crawl_all_youth_housing_policies()
        
        # 결과 출력
        print("\n=== 크롤링 결과 ===")
        for policy in policies:
            print(f"- {policy['source']}: {policy['title']}")
            print(f"  URL: {policy['url']}")
            print(f"  지역: {policy['region']}")
            print(f"  상태: {policy['status']}")
            print()
        
    finally:
        crawler.close()

if __name__ == "__main__":
    main()