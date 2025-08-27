#!/usr/bin/env python3
"""
정책 URL 업데이트 스크립트
사용법: python update_policy_urls.py
"""

import sys
import os
from policy_url_crawler import PolicyURLCrawler

def main():
    print("정책 URL 크롤러를 시작합니다...")
    print("=" * 50)
    
    try:
        crawler = PolicyURLCrawler()
        
        # 특정 정책만 테스트하려면 아래 코드 사용
        if len(sys.argv) > 1 and sys.argv[1] == "--test":
            print("테스트 모드로 실행합니다.")
            test_policies = [
                ("공공기관 청년고용의무제 운영", "기획조정실"),
                ("청년 주거지원 정책", "국토교통부"),
                ("청년 창업 지원", "중소벤처기업부")
            ]
            
            for title, org in test_policies:
                print(f"\n검색 중: {title} ({org})")
                url = crawler.find_policy_url(title, org)
                if url:
                    print(f"✅ 찾은 URL: {url}")
                else:
                    print(f"❌ URL을 찾지 못했습니다.")
        else:
            # 전체 DB 업데이트
            print("데이터베이스의 모든 정책 URL을 업데이트합니다.")
            crawler.update_policy_urls_in_db()
            print("✅ 정책 URL 업데이트가 완료되었습니다!")
    
    except KeyboardInterrupt:
        print("\n사용자가 중단했습니다.")
    except Exception as e:
        print(f"❌ 오류가 발생했습니다: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()