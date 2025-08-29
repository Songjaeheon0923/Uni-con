"""
사용자 정보 가져오기 테스트
"""

import sqlite3
from ai.policy_chat.agents.user_profiling_agent import user_profiling_agent

def test_user_info(user_id=1):
    """사용자 정보 로드 테스트"""
    print(f"=== 사용자 ID {user_id} 정보 테스트 ===")
    
    # 1. DB에서 직접 조회
    print("\n1. DB에서 직접 조회:")
    try:
        with sqlite3.connect("users.db") as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # 사용자 기본 정보
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            user_data = cursor.fetchone()
            print(f"   사용자 기본 정보: {dict(user_data) if user_data else 'None'}")
            
            # 사용자 프로필
            cursor.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,))
            profile_data = cursor.fetchone()
            print(f"   사용자 프로필: {dict(profile_data) if profile_data else 'None'}")
            
            # 찜한 매물 수
            cursor.execute("SELECT COUNT(*) as count FROM favorites WHERE user_id = ?", (user_id,))
            fav_count = cursor.fetchone()[0]
            print(f"   찜한 매물 개수: {fav_count}")
            
    except Exception as e:
        print(f"   DB 조회 오류: {e}")
    
    # 2. User Profiling Agent를 통한 조회
    print("\n2. User Profiling Agent를 통한 조회:")
    try:
        profile = user_profiling_agent._load_existing_profile(user_id)
        print(f"   로드된 프로필:")
        print(f"   - 기본 정보: {profile.get('basic_info', {})}")
        print(f"   - 선호도: {profile.get('preferences', {})}")
        print(f"   - 관심 매물 개수: {len(profile.get('property_interests', []))}")
        
        # 관심 매물 컨텍스트
        context = user_profiling_agent.get_property_context(user_id)
        print(f"   - 관심 매물 컨텍스트: {context}")
        
    except Exception as e:
        print(f"   Agent 조회 오류: {e}")
    
    # 3. 프로파일 추출 테스트
    print("\n3. 프로파일 추출 테스트 (샘플 메시지):")
    try:
        sample_message = "안녕하세요, 25세 대학생이고 서울에서 전세 찾고 있어요"
        extracted = user_profiling_agent.extract_user_profile(sample_message, user_id)
        print(f"   추출된 정보: {extracted.get('extracted_info', {})}")
        print(f"   신뢰도: {extracted.get('confidence', 0)}")
        print(f"   부족한 정보: {extracted.get('missing_info', [])}")
        
    except Exception as e:
        print(f"   프로파일 추출 오류: {e}")

if __name__ == "__main__":
    test_user_info(1)  # user_id = 1로 테스트