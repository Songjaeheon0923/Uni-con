#!/usr/bin/env python3
"""
데이터베이스 초기 설정 스크립트
팀원들이 git clone 후 실행하면 2000+ 매물 데이터가 자동으로 생성됩니다.
"""

import os
import sys
from database.connection import init_db

def setup_database():
    print("데이터베이스 초기화 중...")
    
    # 1. 데이터베이스 테이블 생성
    init_db()
    print("✓ 테이블 생성 완료")
    
    # 2. 실제 API 크롤러 실행
    print("\n실제 매물 데이터 수집 중 (1-2분 소요)...")
    from crawlers.real_api_crawler import RealAPICrawler
    crawler = RealAPICrawler()
    crawler.crawl_and_save()
    print("✓ 실제 API 데이터 수집 완료")
    
    # 3. 서울시 부동산 API 데이터 수집
    print("\n서울시 부동산 데이터 수집 중 (2-3분 소요)...")
    try:
        from crawlers.seoul_api_crawler import SeoulRealEstateCrawler
        seoul_crawler = SeoulRealEstateCrawler()
        seoul_crawler.crawl_all_seoul()
        print("✓ 서울시 API 데이터 수집 완료")
    except Exception as e:
        print(f"⚠️ 서울시 API 데이터 수집 실패 (API 키 필요): {e}")
        print("   .env 파일에 SEOUL_REAL_ESTATE_API_KEY 설정 필요")
    
    # 4. 지오코딩으로 좌표 업데이트
    print("\n좌표 정보 업데이트 중...")
    try:
        from update_real_coordinates import update_coordinates
        update_coordinates()
        print("✓ 좌표 업데이트 완료")
    except:
        print("⚠️ 좌표 업데이트 스킵 (옵션)")
    
    print("\n✅ 데이터베이스 설정 완료!")
    print("   python main.py로 서버를 시작하세요.")

if __name__ == "__main__":
    setup_database()