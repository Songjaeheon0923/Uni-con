#!/usr/bin/env python3
"""
initial_data.json에서 초기 데이터를 복원하는 스크립트
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

def restore_initial_data(db_path="users.db", backup_path="database/initial_data.json"):
    """백업 파일에서 초기 데이터를 데이터베이스로 복원"""
    
    if not Path(backup_path).exists():
        print(f"❌ Backup file not found: {backup_path}")
        return False
    
    print(f"🔄 Restoring initial data from {backup_path} to {db_path}")
    
    # 백업 데이터 로드
    with open(backup_path, 'r', encoding='utf-8') as f:
        backup_data = json.load(f)
    
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA encoding='UTF-8'")
    cursor = conn.cursor()
    
    try:
        # 기존 데이터 삭제 (순서 중요 - 외래키 제약 고려)
        print("🗑️  Clearing existing data...")
        cursor.execute("DELETE FROM favorites")
        cursor.execute("DELETE FROM policy_views")
        cursor.execute("DELETE FROM user_info") 
        cursor.execute("DELETE FROM user_profiles")
        cursor.execute("DELETE FROM users")
        cursor.execute("DELETE FROM rooms")
        cursor.execute("DELETE FROM policies")
        
        # 1. 사용자 데이터 복원
        if 'users' in backup_data:
            print(f"👥 Restoring {len(backup_data['users'])} users...")
            for user in backup_data['users']:
                cursor.execute("""
                    INSERT INTO users (id, email, name, hashed_password, phone_number, gender, school_email, created_at, last_seen_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    user['id'], user['email'], user['name'], user['hashed_password'],
                    user.get('phone_number'), user.get('gender'), user.get('school_email'),
                    user.get('created_at'), user.get('last_seen_at')
                ))
        
        # 2. 사용자 프로필 복원
        if 'user_profiles' in backup_data:
            print(f"📋 Restoring {len(backup_data['user_profiles'])} user profiles...")
            for profile in backup_data['user_profiles']:
                cursor.execute("""
                    INSERT INTO user_profiles 
                    (id, user_id, sleep_type, home_time, cleaning_frequency, cleaning_sensitivity,
                     smoking_status, noise_sensitivity, age, personality_type, lifestyle_type, 
                     budget_range, is_complete, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    profile['id'], profile['user_id'], profile.get('sleep_type'), profile.get('home_time'),
                    profile.get('cleaning_frequency'), profile.get('cleaning_sensitivity'), 
                    profile.get('smoking_status'), profile.get('noise_sensitivity'), profile.get('age'),
                    profile.get('personality_type'), profile.get('lifestyle_type'), profile.get('budget_range'),
                    profile.get('is_complete', False), profile.get('updated_at')
                ))
        
        # 3. 사용자 정보 복원
        if 'user_info' in backup_data:
            print(f"ℹ️  Restoring {len(backup_data['user_info'])} user info records...")
            for info in backup_data['user_info']:
                cursor.execute("""
                    INSERT INTO user_info 
                    (id, user_id, bio, current_location, desired_location, budget, move_in_date,
                     lifestyle, roommate_preference, introduction, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    info['id'], info['user_id'], info.get('bio'), info.get('current_location'),
                    info.get('desired_location'), info.get('budget'), info.get('move_in_date'),
                    info.get('lifestyle'), info.get('roommate_preference'), info.get('introduction'),
                    info.get('created_at'), info.get('updated_at')
                ))
        
        # 4. 방 데이터 복원
        if 'rooms' in backup_data:
            print(f"🏠 Restoring {len(backup_data['rooms'])} rooms...")
            for room in backup_data['rooms']:
                cursor.execute("""
                    INSERT INTO rooms 
                    (id, room_id, address, latitude, longitude, transaction_type, price_deposit,
                     price_monthly, area, rooms, floor, building_year, description, landlord_name,
                     landlord_phone, risk_score, view_count, favorite_count, is_active, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    room['id'], room['room_id'], room['address'], room['latitude'], room['longitude'],
                    room['transaction_type'], room['price_deposit'], room['price_monthly'], room['area'],
                    room['rooms'], room.get('floor'), room.get('building_year'), room.get('description'),
                    room.get('landlord_name'), room.get('landlord_phone'), room.get('risk_score', 0),
                    room.get('view_count', 0), room.get('favorite_count', 0), room.get('is_active', True),
                    room.get('created_at')
                ))
        
        # 5. 정책 데이터 복원
        if 'policies' in backup_data:
            print(f"📜 Restoring {len(backup_data['policies'])} policies...")
            for policy in backup_data['policies']:
                cursor.execute("""
                    INSERT INTO policies 
                    (id, title, description, content, url, category, target_age_min, target_age_max,
                     target_gender, target_location, tags, is_active, view_count, relevance_score,
                     crawled_at, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    policy['id'], policy['title'], policy['description'], policy['content'], policy['url'],
                    policy['category'], policy.get('target_age_min'), policy.get('target_age_max'),
                    policy.get('target_gender'), policy.get('target_location'), policy.get('tags'),
                    policy.get('is_active', True), policy.get('view_count', 0), 
                    policy.get('relevance_score', 0.0), policy.get('crawled_at'), policy.get('created_at')
                ))
        
        # 6. 찜하기 데이터 복원
        if 'favorites' in backup_data:
            print(f"❤️  Restoring {len(backup_data['favorites'])} favorites...")
            for favorite in backup_data['favorites']:
                cursor.execute("""
                    INSERT INTO favorites (id, user_id, room_id, created_at)
                    VALUES (?, ?, ?, ?)
                """, (
                    favorite['id'], favorite['user_id'], favorite['room_id'], favorite.get('created_at')
                ))
        
        # 변경사항 커밋
        conn.commit()
        
        # 복원 확인
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM rooms") 
        room_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM policies")
        policy_count = cursor.fetchone()[0]
        
        print(f"✅ Initial data restoration completed!")
        print(f"📊 Restored: {user_count} users, {room_count} rooms, {policy_count} policies")
        
        return True
        
    except Exception as e:
        print(f"❌ Error restoring data: {e}")
        conn.rollback()
        return False
        
    finally:
        conn.close()

if __name__ == "__main__":
    restore_initial_data()