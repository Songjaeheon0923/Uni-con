"""
사용자 DB 정보만 확인하는 테스트
"""

import sqlite3
import json

def test_user_db_info(user_id=1):
    """사용자 DB 정보 테스트"""
    print(f"=== 사용자 ID {user_id} DB 정보 테스트 ===")
    
    try:
        with sqlite3.connect("users.db") as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            print("\n1. 사용자 기본 정보 (users 테이블):")
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            user_data = cursor.fetchone()
            if user_data:
                for key in user_data.keys():
                    print(f"   {key}: {user_data[key]}")
            else:
                print("   사용자를 찾을 수 없습니다.")
                return
            
            print("\n2. 사용자 프로필 (user_profiles 테이블):")
            cursor.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,))
            profile_data = cursor.fetchone()
            if profile_data:
                for key in profile_data.keys():
                    print(f"   {key}: {profile_data[key]}")
            else:
                print("   프로필이 없습니다.")
            
            print("\n3. 찜한 매물 정보 (favorites + rooms):")
            cursor.execute("""
                SELECT f.created_at, r.transaction_type, r.price_deposit, r.price_monthly,
                       r.address, r.area, r.rooms
                FROM favorites f
                JOIN rooms r ON f.room_id = r.room_id
                WHERE f.user_id = ?
                ORDER BY f.created_at DESC
                LIMIT 5
            """, (user_id,))
            favorites = cursor.fetchall()
            
            if favorites:
                print(f"   총 {len(favorites)}개의 찜한 매물:")
                for i, fav in enumerate(favorites, 1):
                    print(f"   {i}. {fav['transaction_type']} {fav['price_deposit']:,}원")
                    if fav['price_monthly'] and fav['price_monthly'] > 0:
                        print(f"      /{fav['price_monthly']:,}원")
                    print(f"      {fav['area']}㎡ {fav['address']} ({fav['created_at']})")
            else:
                print("   찜한 매물이 없습니다.")
                
            print("\n4. 사용자 정보 (user_info 테이블):")
            cursor.execute("SELECT * FROM user_info WHERE user_id = ?", (user_id,))
            info_data = cursor.fetchone()
            if info_data:
                for key in info_data.keys():
                    print(f"   {key}: {info_data[key]}")
            else:
                print("   추가 사용자 정보가 없습니다.")
                
    except Exception as e:
        print(f"DB 조회 오류: {e}")

def check_db_tables():
    """DB 테이블 구조 확인"""
    print("=== DB 테이블 구조 확인 ===")
    try:
        with sqlite3.connect("users.db") as conn:
            cursor = conn.cursor()
            
            # 모든 테이블 목록
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            print(f"테이블 목록: {[table[0] for table in tables]}")
            
            # 각 테이블 스키마
            for table in tables:
                table_name = table[0]
                cursor.execute(f"PRAGMA table_info({table_name})")
                columns = cursor.fetchall()
                print(f"\n{table_name} 테이블 구조:")
                for col in columns:
                    print(f"  {col[1]} ({col[2]}) - {'NOT NULL' if col[3] else 'NULL'}")
                    
    except Exception as e:
        print(f"테이블 구조 확인 오류: {e}")

if __name__ == "__main__":
    check_db_tables()
    print("\n" + "="*50 + "\n")
    test_user_db_info(1)  # user_id = 1로 테스트