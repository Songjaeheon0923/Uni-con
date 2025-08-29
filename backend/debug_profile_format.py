"""
프로필 포맷팅 디버깅 (환경변수 없이 테스트)
"""
import sqlite3
import json

def debug_profile_format():
    """프로필 포맷팅 시뮬레이션"""
    print("=== 프로필 포맷팅 디버깅 ===")
    
    # 1. 실제 DB에서 사용자 정보 조회
    print("\n1. DB에서 사용자 정보 조회 (user_id=2):")
    try:
        with sqlite3.connect("users.db") as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # 사용자 기본 정보
            cursor.execute("SELECT * FROM users WHERE id = ?", (2,))
            user_data = cursor.fetchone()
            print(f"   Users: {dict(user_data) if user_data else 'None'}")
            
            # 사용자 프로필
            cursor.execute("SELECT * FROM user_profiles WHERE user_id = ?", (2,))
            profile_data = cursor.fetchone()
            print(f"   Profiles: {dict(profile_data) if profile_data else 'None'}")
            
            # 찜한 매물
            cursor.execute("""
                SELECT r.transaction_type, r.price_deposit, r.price_monthly,
                       r.address, r.area, r.rooms
                FROM favorites f
                JOIN rooms r ON f.room_id = r.room_id
                WHERE f.user_id = ?
                ORDER BY f.created_at DESC
                LIMIT 5
            """, (2,))
            favorite_properties = cursor.fetchall()
            print(f"   Favorites: {[dict(prop) for prop in favorite_properties]}")
            
    except Exception as e:
        print(f"   DB 조회 오류: {e}")
        return
    
    # 2. user_profiling_agent의 구조로 프로필 구성
    print("\n2. User Profiling Agent 구조 시뮬레이션:")
    simulated_profile = {
        "user_id": 2,
        "basic_info": dict(user_data) if user_data else {},
        "preferences": dict(profile_data) if profile_data else {},
        "property_interests": [dict(prop) for prop in favorite_properties],
        "last_updated": None
    }
    
    print(json.dumps(simulated_profile, ensure_ascii=False, indent=2))
    
    # 3. eligibility_checker의 _format_user_profile 시뮬레이션
    print("\n3. Eligibility Checker 포맷팅 시뮬레이션:")
    
    def simulate_format_user_profile(profile):
        """_format_user_profile 메서드 시뮬레이션"""
        formatted = "**사용자 기본 정보:**\n"
        
        # 중첩된 구조에서 정보 추출
        basic_info = profile.get('basic_info', {})
        preferences = profile.get('preferences', {})
        
        print(f"   basic_info: {basic_info}")
        print(f"   preferences: {preferences}")
        
        # 나이 정보 (preferences.age 우선, 없으면 basic_info.age)
        age = preferences.get('age') or basic_info.get('age') or profile.get('age')
        print(f"   추출된 나이: {age}")
        
        if age:
            formatted += f"- 나이: {age}세\n"
            # 연령대 자동 계산
            if age < 30:
                formatted += f"- 연령대: 20대\n"
            elif age < 40:
                formatted += f"- 연령대: 30대\n"
        else:
            formatted += "- 나이: 정보 없음\n"
        
        # 직업/신분 정보
        occupation = profile.get('occupation') or preferences.get('occupation')
        if occupation:
            formatted += f"- 직업/신분: {occupation}\n"
        elif age and age <= 25:
            formatted += f"- 직업/신분: 대학생 (추정)\n"
        
        return formatted
    
    formatted = simulate_format_user_profile(simulated_profile)
    print("   포맷팅 결과:")
    print(formatted)

if __name__ == "__main__":
    debug_profile_format()