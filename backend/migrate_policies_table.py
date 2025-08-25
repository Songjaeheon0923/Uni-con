#!/usr/bin/env python3
"""
정책 테이블 마이그레이션 스크립트
기존 policies 테이블을 백업하고 새로운 구조로 변경합니다.
"""

import sqlite3
from datetime import datetime

def migrate_policies_table():
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    
    try:
        # 1. 기존 테이블 구조 확인
        cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='policies'")
        existing_table = cursor.fetchone()
        
        if existing_table:
            print("기존 policies 테이블 발견, 마이그레이션 시작...")
            
            # 2. 기존 데이터 백업
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS policies_backup AS 
                SELECT * FROM policies
            """)
            print("✓ 기존 데이터 백업 완료")
            
            # 3. 기존 테이블 삭제
            cursor.execute("DROP TABLE IF EXISTS policies")
            
            # 4. 새로운 구조로 테이블 생성
            cursor.execute('''
                CREATE TABLE policies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source TEXT NOT NULL,
                    source_id TEXT,
                    title TEXT NOT NULL,
                    organization TEXT,
                    target TEXT,
                    content TEXT,
                    application_period TEXT,
                    start_date TEXT,
                    end_date TEXT,
                    application_url TEXT,
                    reference_url TEXT,
                    category TEXT,
                    region TEXT,
                    details TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    view_count INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE,
                    UNIQUE(source, source_id)
                )
            ''')
            print("✓ 새로운 테이블 구조 생성 완료")
            
            # 5. 기존 데이터가 있었다면 변환하여 이동
            cursor.execute("SELECT COUNT(*) FROM policies_backup")
            backup_count = cursor.fetchone()[0]
            
            if backup_count > 0:
                print(f"기존 데이터 {backup_count}개 발견, 마이그레이션 중...")
                
                # 기존 데이터를 새 구조로 변환
                cursor.execute("""
                    INSERT INTO policies (
                        source, title, content, application_url, 
                        category, region, created_at, view_count, is_active
                    )
                    SELECT 
                        'legacy',
                        title,
                        COALESCE(content, description, ''),
                        url,
                        category,
                        target_location,
                        crawled_at,
                        view_count,
                        is_active
                    FROM policies_backup
                """)
                print(f"✓ {cursor.rowcount}개 데이터 마이그레이션 완료")
        else:
            # 테이블이 없으면 새로 생성
            print("policies 테이블이 없음, 새로 생성...")
            cursor.execute('''
                CREATE TABLE policies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source TEXT NOT NULL,
                    source_id TEXT,
                    title TEXT NOT NULL,
                    organization TEXT,
                    target TEXT,
                    content TEXT,
                    application_period TEXT,
                    start_date TEXT,
                    end_date TEXT,
                    application_url TEXT,
                    reference_url TEXT,
                    category TEXT,
                    region TEXT,
                    details TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    view_count INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE,
                    UNIQUE(source, source_id)
                )
            ''')
            print("✓ 새로운 policies 테이블 생성 완료")
        
        conn.commit()
        print("✅ 마이그레이션 완료!")
        
    except Exception as e:
        print(f"❌ 마이그레이션 실패: {e}")
        conn.rollback()
        
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_policies_table()