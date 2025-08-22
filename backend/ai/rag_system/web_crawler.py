"""
RAG 시스템용 웹 크롤러 모듈
"""
import requests
from bs4 import BeautifulSoup
import time
import os
from pathlib import Path
from typing import List, Dict, Optional
from urllib.parse import urljoin, urlparse
import logging

# 로거 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class WebCrawler:
    """웹사이트에서 문서를 크롤링하는 클래스"""
    
    def __init__(self, documents_path: str = "rag_documents", delay: float = 1.0):
        self.documents_path = Path(documents_path)
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def crawl_legal_document(self, url: str, title: str, category: str, subcategory: str) -> bool:
        """법률 문서 크롤링"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 본문 추출 (사이트별 선택자 조정 필요)
            content_selectors = [
                '.law_content', '.content', '.article-content', 
                '.post-content', 'main', '#content'
            ]
            
            content = None
            for selector in content_selectors:
                element = soup.select_one(selector)
                if element:
                    content = element.get_text(strip=True)
                    break
            
            if not content:
                content = soup.get_text(strip=True)
            
            # 파일 저장
            file_path = self.documents_path / "legal" / subcategory / f"{title}.md"
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(f"# {title}\n\n")
                f.write(f"**출처**: {url}\n")
                f.write(f"**수집일**: {time.strftime('%Y-%m-%d')}\n\n")
                f.write(content)
            
            logger.info(f"Successfully crawled: {title}")
            time.sleep(self.delay)
            return True
            
        except Exception as e:
            logger.error(f"Error crawling {url}: {e}")
            return False
    
    def crawl_government_guideline(self, url: str, title: str, organization: str) -> bool:
        """정부 가이드라인 크롤링"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # PDF 다운로드 링크 찾기
            pdf_links = soup.find_all('a', href=lambda x: x and x.endswith('.pdf'))
            
            if pdf_links:
                # PDF 파일 다운로드 (첫 번째 PDF)
                pdf_url = urljoin(url, pdf_links[0]['href'])
                return self.download_pdf(pdf_url, title, organization)
            
            # HTML 콘텐츠 추출
            content_selectors = [
                '.content', '.article-content', '.post-content', 
                'main', '#content', '.view_content'
            ]
            
            content = None
            for selector in content_selectors:
                element = soup.select_one(selector)
                if element:
                    content = element.get_text(strip=True)
                    break
            
            if not content:
                content = soup.get_text(strip=True)
            
            # 파일 저장
            file_path = self.documents_path / "guidelines" / organization / f"{title}.md"
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(f"# {title}\n\n")
                f.write(f"**기관**: {organization}\n")
                f.write(f"**출처**: {url}\n")
                f.write(f"**수집일**: {time.strftime('%Y-%m-%d')}\n\n")
                f.write(content)
            
            logger.info(f"Successfully crawled guideline: {title}")
            time.sleep(self.delay)
            return True
            
        except Exception as e:
            logger.error(f"Error crawling guideline {url}: {e}")
            return False
    
    def download_pdf(self, pdf_url: str, title: str, organization: str) -> bool:
        """PDF 파일 다운로드 (향후 PDF 텍스트 추출 기능 추가 예정)"""
        try:
            response = self.session.get(pdf_url, timeout=30)
            response.raise_for_status()
            
            file_path = self.documents_path / "guidelines" / organization / f"{title}.pdf"
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(file_path, 'wb') as f:
                f.write(response.content)
            
            logger.info(f"Successfully downloaded PDF: {title}")
            return True
            
        except Exception as e:
            logger.error(f"Error downloading PDF {pdf_url}: {e}")
            return False
    
    def crawl_court_cases(self, search_term: str, max_pages: int = 5) -> List[Dict]:
        """법원 판례 크롤링 (예시 - 실제 사이트에 맞게 조정 필요)"""
        cases = []
        
        # 대법원 종합법률정보 사이트 등에서 크롤링
        # 실제 구현 시 해당 사이트의 구조에 맞게 조정 필요
        
        logger.info(f"Court cases crawling for '{search_term}' - placeholder implementation")
        return cases


def main():
    """크롤링 실행 예시"""
    crawler = WebCrawler()
    
    # 예시 URL들 (실제 크롤링 시 적절한 URL로 변경)
    legal_docs = [
        {
            "url": "https://www.law.go.kr/법령/주택임대차보호법",
            "title": "housing_act_main",
            "category": "legal",
            "subcategory": "housing_act"
        }
    ]
    
    for doc in legal_docs:
        crawler.crawl_legal_document(
            doc["url"], doc["title"], doc["category"], doc["subcategory"]
        )


if __name__ == "__main__":
    main()