#!/usr/bin/env python3
"""
정책 API 테스트 스크립트
"""

import asyncio
import sys
import os
from dotenv import load_dotenv

# 환경변수 로드
load_dotenv()

# 프로젝트 루트 디렉토리를 Python 패스에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from routers.policies import get_popular_policies
from database.connection import get_db_connection
import json

async def test_popular_policies():
    """인기 정책 API 테스트"""
    print("=== 인기 정책 API 테스트 ===")
    
    try:
        # API 함수 직접 호출
        result = await get_popular_policies(limit=3)
        
        print(f"✅ API 호출 성공!")
        print(f"반환된 정책 수: {len(result)}")
        
        for i, policy in enumerate(result[:3]):
            print(f"\n{i+1}. {policy['title']}")
            print(f"   카테고리: {policy['category']}")
            print(f"   지역: {policy['region']}")
            print(f"   조회수: {policy['view_count']}")
            
    except Exception as e:
        print(f"❌ API 호출 실패: {e}")

def test_database_direct():
    """DB 직접 조회 테스트"""
    print("\n=== 데이터베이스 직접 조회 테스트 ===")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, title, category, region, view_count
            FROM policies 
            WHERE is_active = 1
            ORDER BY view_count DESC, created_at DESC
            LIMIT 3
        """)
        
        policies = cursor.fetchall()
        conn.close()
        
        print(f"✅ DB 조회 성공!")
        print(f"정책 수: {len(policies)}")
        
        for i, p in enumerate(policies):
            print(f"\n{i+1}. {p[1]}")
            print(f"   카테고리: {p[2]}")
            print(f"   지역: {p[3]}")
            print(f"   조회수: {p[4]}")
            
    except Exception as e:
        print(f"❌ DB 조회 실패: {e}")

def test_environment():
    """환경변수 테스트"""
    print("\n=== 환경변수 테스트 ===")
    
    api_key = os.getenv('YOUTH_CENTER_API_KEY')
    if api_key:
        print(f"✅ YOUTH_CENTER_API_KEY: {api_key[:10]}...{api_key[-5:]}")
    else:
        print("❌ YOUTH_CENTER_API_KEY가 설정되지 않았습니다.")

async def main():
    """메인 테스트 함수"""
    test_environment()
    test_database_direct()
    await test_popular_policies()
    
    print("\n=== 테스트 완료 ===")

if __name__ == "__main__":
    asyncio.run(main())