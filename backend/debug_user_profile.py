"""
사용자 프로필 디버깅
"""
import sqlite3
import json
from ai.policy_chat.agents.user_profiling_agent import user_profiling_agent

def debug_user_profile(user_id=1):
    """사용자 프로필 상세 디버깅"""
    print(f"=== 사용자 ID {user_id} 프로필 디버깅 ===")
    
    # 1. 직접 DB에서 사용자 정보 조회
    print("\n1. 직접 DB 조회:")
    try:
        with sqlite3.connect("users.db") as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # 사용자 기본 정보
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            user_data = cursor.fetchone()
            if user_data:
                print("   Users 테이블:")
                for key in user_data.keys():
                    print(f"     {key}: {user_data[key]}")
            
            # 사용자 프로필
            cursor.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,))
            profile_data = cursor.fetchone()
            if profile_data:
                print("   User_profiles 테이블:")
                for key in profile_data.keys():
                    print(f"     {key}: {profile_data[key]}")
                    
    except Exception as e:
        print(f"   DB 조회 오류: {e}")
    
    # 2. user_profiling_agent를 통한 프로필 로드
    print("\n2. User Profiling Agent로 로드:")
    try:
        profile = user_profiling_agent._load_existing_profile(user_id)
        print("   로드된 프로필:")
        print(json.dumps(profile, ensure_ascii=False, indent=2))
        
        # 특히 나이 정보 확인
        age_from_basic = profile.get('basic_info', {}).get('age')
        age_from_prefs = profile.get('preferences', {}).get('age')
        print(f"\n   나이 정보:")
        print(f"     basic_info.age: {age_from_basic}")
        print(f"     preferences.age: {age_from_prefs}")
        
    except Exception as e:
        print(f"   Agent 로드 오류: {e}")
    
    # 3. eligibility_checker가 어떻게 프로필을 포맷팅하는지 확인
    print("\n3. Eligibility Checker 포맷팅:")
    try:
        from ai.policy_chat.agents.eligibility_checker_agent import eligibility_checker_agent
        
        # 샘플 프로필로 포맷팅 테스트
        sample_profile = {
            "user_id": user_id,
            "basic_info": {"age": None},
            "preferences": {"age": 23},
            "age": 23,
            "age_range": "20대",
            "occupation": "대학생",
            "current_region": "서울",
            "transaction_type": "전세"
        }
        
        formatted = eligibility_checker_agent._format_user_profile(sample_profile)
        print("   포맷팅된 프로필:")
        print(formatted)
        
    except Exception as e:
        print(f"   포맷팅 오류: {e}")

if __name__ == "__main__":
    debug_user_profile(1)