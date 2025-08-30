#!/usr/bin/env python3
"""
현재 DB의 초기 데이터를 JSON 백업 파일로 생성하는 스크립트
"""

import sqlite3
import json
import sys
import os
from pathlib import Path

# Windows 콘솔 인코딩 설정
if os.name == 'nt':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

def export_initial_data():
    """현재 users.db에서 초기 데이터를 추출하여 JSON 파일로 저장"""
    
    db_path = "users.db"
    backup_path = "database/initial_data.json"
    
    if not Path(db_path).exists():
        print(f"❌ Database file not found: {db_path}")
        sys.exit(1)
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # dict-like access
    # UTF-8 인코딩 설정
    conn.execute("PRAGMA encoding='UTF-8'")
    cursor = conn.cursor()
    
    backup_data = {}
    
    try:
        # 1. 테스트 사용자들 (1-6번만)
        print("📦 Exporting users...")
        cursor.execute("SELECT * FROM users WHERE id <= 6 ORDER BY id")
        backup_data['users'] = [dict(row) for row in cursor.fetchall()]
        print(f"   Exported {len(backup_data['users'])} users")
        
        # 2. 사용자 프로필
        print("📦 Exporting user profiles...")
        cursor.execute("SELECT * FROM user_profiles WHERE user_id <= 6 ORDER BY user_id")
        backup_data['user_profiles'] = [dict(row) for row in cursor.fetchall()]
        print(f"   Exported {len(backup_data['user_profiles'])} profiles")
        
        # 3. 사용자 정보
        print("📦 Exporting user info...")
        cursor.execute("SELECT * FROM user_info WHERE user_id <= 6 ORDER BY user_id")
        backup_data['user_info'] = [dict(row) for row in cursor.fetchall()]
        print(f"   Exported {len(backup_data['user_info'])} user info records")
        
        # 4. 방 데이터 (모든 방)
        print("📦 Exporting rooms...")
        cursor.execute("SELECT * FROM rooms ORDER BY id")
        backup_data['rooms'] = [dict(row) for row in cursor.fetchall()]
        print(f"   Exported {len(backup_data['rooms'])} rooms")
        
        # 5. 정책 데이터 (모든 정책)
        print("📦 Exporting policies...")
        cursor.execute("SELECT * FROM policies ORDER BY id")
        backup_data['policies'] = [dict(row) for row in cursor.fetchall()]
        print(f"   Exported {len(backup_data['policies'])} policies")
        
        # 6. 찜하기 데이터 (테스트 유저들만)
        print("📦 Exporting favorites...")
        cursor.execute("SELECT * FROM favorites WHERE user_id <= 6 ORDER BY user_id")
        backup_data['favorites'] = [dict(row) for row in cursor.fetchall()]
        print(f"   Exported {len(backup_data['favorites'])} favorites")
        
    except Exception as e:
        print(f"❌ Error exporting data: {e}")
        conn.close()
        sys.exit(1)
    
    conn.close()
    
    # 백업 파일 저장
    backup_dir = Path(backup_path).parent
    backup_dir.mkdir(exist_ok=True)
    
    with open(backup_path, 'w', encoding='utf-8') as f:
        json.dump(backup_data, f, ensure_ascii=False, indent=2, default=str)
    
    print(f"✅ Initial data backup created: {backup_path}")
    print(f"📊 Total records: {sum(len(v) if isinstance(v, list) else 0 for v in backup_data.values())}")
    
    return backup_path

if __name__ == "__main__":
    export_initial_data()