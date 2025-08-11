from typing import List
from models.profile import UserProfile, MatchingResult
from database.connection import get_user_by_email


def calculate_gender_compatibility(user_profile: UserProfile, other_profile: UserProfile) -> float:
    """성별 선호도 호환성 계산"""
    user_gender = user_profile.gender
    other_gender = other_profile.gender
    user_pref = user_profile.gender_preference
    other_pref = other_profile.gender_preference
    
    if not all([user_gender, other_gender, user_pref, other_pref]):
        return 0.5  # 정보 부족시 중간 점수
    
    # 양방향 호환성 체크
    user_accepts_other = (
        user_pref == "any" or
        (user_pref == "same" and user_gender == other_gender) or
        (user_pref == "opposite" and user_gender != other_gender)
    )
    
    other_accepts_user = (
        other_pref == "any" or
        (other_pref == "same" and other_gender == user_gender) or
        (other_pref == "opposite" and other_gender != user_gender)
    )
    
    if user_accepts_other and other_accepts_user:
        return 1.0  # 완벽 매치
    elif user_accepts_other or other_accepts_user:
        return 0.3  # 일방적 매치
    else:
        return 0.0  # 호환 불가


def calculate_age_compatibility(user_profile: UserProfile, other_profile: UserProfile) -> float:
    """나이 호환성 계산 (±5세 이내 높은 점수)"""
    if not (user_profile.age and other_profile.age):
        return 0.5
    
    age_diff = abs(user_profile.age - other_profile.age)
    if age_diff <= 2:
        return 1.0
    elif age_diff <= 5:
        return 0.8
    elif age_diff <= 10:
        return 0.5
    else:
        return 0.2


def calculate_lifestyle_compatibility(user_profile: UserProfile, other_profile: UserProfile) -> float:
    """라이프스타일 호환성 계산"""
    if not (user_profile.lifestyle_type and other_profile.lifestyle_type):
        return 0.5
    
    # 같은 라이프스타일일 때 높은 점수
    if user_profile.lifestyle_type == other_profile.lifestyle_type:
        return 1.0
    
    # 학생-프리랜서, 직장인-프리랜서는 중간 점수
    compatible_pairs = [
        ("student", "freelancer"),
        ("worker", "freelancer")
    ]
    
    pair = (user_profile.lifestyle_type, other_profile.lifestyle_type)
    reverse_pair = (other_profile.lifestyle_type, user_profile.lifestyle_type)
    
    if pair in compatible_pairs or reverse_pair in compatible_pairs:
        return 0.7
    else:
        return 0.4


def calculate_budget_compatibility(user_profile: UserProfile, other_profile: UserProfile) -> float:
    """예산 호환성 계산"""
    if not (user_profile.budget_range and other_profile.budget_range):
        return 0.5
    
    if user_profile.budget_range == other_profile.budget_range:
        return 1.0
    
    # 인접한 예산 범위는 중간 점수
    budget_levels = {"low": 0, "medium": 1, "high": 2}
    user_level = budget_levels[user_profile.budget_range]
    other_level = budget_levels[other_profile.budget_range]
    
    if abs(user_level - other_level) == 1:
        return 0.6
    else:
        return 0.2


def calculate_personality_compatibility(user_profile: UserProfile, other_profile: UserProfile) -> float:
    """성격 호환성 계산 (보완적 관계 고려)"""
    if not (user_profile.personality_type and other_profile.personality_type):
        return 0.5
    
    # 같은 성격 타입
    if user_profile.personality_type == other_profile.personality_type:
        return 0.8
    
    # 보완적 관계 (내향-외향)
    if (user_profile.personality_type == "introverted" and other_profile.personality_type == "extroverted") or \
       (user_profile.personality_type == "extroverted" and other_profile.personality_type == "introverted"):
        return 0.9
    
    # 중간형과의 매치
    if user_profile.personality_type == "mixed" or other_profile.personality_type == "mixed":
        return 0.7
    
    return 0.5


def calculate_compatibility(user_profile: UserProfile, other_profile: UserProfile) -> float:
    """
    두 사용자 프로필 간의 호환성 점수를 계산합니다 (0.0 ~ 1.0)
    고도화된 매칭 알고리즘: 9개 요소를 종합적으로 고려
    """
    if not (user_profile.is_complete and other_profile.is_complete):
        return 0.0
    
    score = 0.0
    total_weight = 0.0
    
    # 1. 성별 선호도 호환성 (가중치: 0.25 - 가장 중요)
    gender_weight = 0.25
    gender_score = calculate_gender_compatibility(user_profile, other_profile)
    score += gender_weight * gender_score
    total_weight += gender_weight
    
    # 2. 흡연 호환성 (가중치: 0.2)
    smoking_weight = 0.2
    
    # 2. 집에 머무는 시간대 호환성 (가중치: 0.15) - 다른 시간대일 때 더 높은 점수
    home_time_weight = 0.15
    if user_profile.home_time != other_profile.home_time and \
       user_profile.home_time != "irregular" and other_profile.home_time != "irregular":
        score += home_time_weight * 1.0  # 다른 시간대일 때 가장 높은 점수
    elif user_profile.home_time == "irregular" or other_profile.home_time == "irregular":
        score += home_time_weight * 0.7  # 불규칙한 경우 중간 점수
    else:
        score += home_time_weight * 0.4  # 같은 시간대일 때 낮은 점수
    total_weight += home_time_weight
    
    # 3. 청소 관련 종합 호환성 (가중치: 0.25) - 빈도와 민감도를 통합한 매트릭스
    cleaning_weight = 0.25
    
    # 청소 빈도와 민감도를 결합한 통합 매트릭스
    cleaning_compatibility = {
        # 매일 청소하는 경우
        ("daily", "very_sensitive", "daily", "very_sensitive"): 1.0,      # 완벽 매치
        ("daily", "very_sensitive", "daily", "normal"): 0.9,              # 거의 완벽
        ("daily", "very_sensitive", "daily", "not_sensitive"): 0.8,       # 좋음
        ("daily", "very_sensitive", "weekly", "very_sensitive"): 0.4,     # 빈도 차이
        ("daily", "very_sensitive", "weekly", "normal"): 0.3,
        ("daily", "very_sensitive", "weekly", "not_sensitive"): 0.2,
        ("daily", "very_sensitive", "as_needed", "very_sensitive"): 0.2,  # 큰 빈도 차이
        ("daily", "very_sensitive", "as_needed", "normal"): 0.1,
        ("daily", "very_sensitive", "as_needed", "not_sensitive"): 0.1,
        
        ("daily", "normal", "daily", "normal"): 1.0,                      # 완벽 매치
        ("daily", "normal", "daily", "not_sensitive"): 0.9,               # 거의 완벽
        ("daily", "normal", "weekly", "very_sensitive"): 0.5,
        ("daily", "normal", "weekly", "normal"): 0.6,                     # 빈도 차이 있지만 괜찮음
        ("daily", "normal", "weekly", "not_sensitive"): 0.7,
        ("daily", "normal", "as_needed", "very_sensitive"): 0.2,
        ("daily", "normal", "as_needed", "normal"): 0.3,
        ("daily", "normal", "as_needed", "not_sensitive"): 0.4,
        
        ("daily", "not_sensitive", "daily", "not_sensitive"): 1.0,        # 완벽 매치
        ("daily", "not_sensitive", "weekly", "very_sensitive"): 0.6,
        ("daily", "not_sensitive", "weekly", "normal"): 0.7,
        ("daily", "not_sensitive", "weekly", "not_sensitive"): 0.8,       # 빈도 차이 있지만 관대함
        ("daily", "not_sensitive", "as_needed", "very_sensitive"): 0.3,
        ("daily", "not_sensitive", "as_needed", "normal"): 0.5,
        ("daily", "not_sensitive", "as_needed", "not_sensitive"): 0.6,
        
        # 주 1-2회 청소하는 경우
        ("weekly", "very_sensitive", "weekly", "very_sensitive"): 1.0,    # 완벽 매치
        ("weekly", "very_sensitive", "weekly", "normal"): 0.8,
        ("weekly", "very_sensitive", "weekly", "not_sensitive"): 0.7,
        ("weekly", "very_sensitive", "as_needed", "very_sensitive"): 0.6, # 빈도 차이
        ("weekly", "very_sensitive", "as_needed", "normal"): 0.4,
        ("weekly", "very_sensitive", "as_needed", "not_sensitive"): 0.3,
        
        ("weekly", "normal", "weekly", "normal"): 1.0,                    # 완벽 매치
        ("weekly", "normal", "weekly", "not_sensitive"): 0.9,
        ("weekly", "normal", "as_needed", "very_sensitive"): 0.5,
        ("weekly", "normal", "as_needed", "normal"): 0.7,                 # 적당한 호환성
        ("weekly", "normal", "as_needed", "not_sensitive"): 0.8,
        
        ("weekly", "not_sensitive", "weekly", "not_sensitive"): 1.0,      # 완벽 매치
        ("weekly", "not_sensitive", "as_needed", "very_sensitive"): 0.6,
        ("weekly", "not_sensitive", "as_needed", "normal"): 0.8,
        ("weekly", "not_sensitive", "as_needed", "not_sensitive"): 0.9,   # 둘 다 관대함
        
        # 필요할 때만 청소하는 경우
        ("as_needed", "very_sensitive", "as_needed", "very_sensitive"): 1.0,  # 완벽 매치
        ("as_needed", "very_sensitive", "as_needed", "normal"): 0.8,
        ("as_needed", "very_sensitive", "as_needed", "not_sensitive"): 0.7,
        
        ("as_needed", "normal", "as_needed", "normal"): 1.0,              # 완벽 매치
        ("as_needed", "normal", "as_needed", "not_sensitive"): 0.9,
        
        ("as_needed", "not_sensitive", "as_needed", "not_sensitive"): 1.0 # 완벽 매치
    }
    
    key = (user_profile.cleaning_frequency, user_profile.cleaning_sensitivity, 
           other_profile.cleaning_frequency, other_profile.cleaning_sensitivity)
    reverse_key = (other_profile.cleaning_frequency, other_profile.cleaning_sensitivity,
                   user_profile.cleaning_frequency, user_profile.cleaning_sensitivity)
    
    score += cleaning_weight * cleaning_compatibility.get(key, cleaning_compatibility.get(reverse_key, 0.5))
    total_weight += cleaning_weight
    
    # 4. 흡연 호환성 (가중치: 0.3)
    smoking_weight = 0.3
    smoking_compatibility = {
        ("non_smoker_strict", "non_smoker_strict"): 1.0,
        ("non_smoker_strict", "non_smoker_ok"): 1.0,
        ("non_smoker_strict", "smoker_indoor_no"): 0.3,
        ("non_smoker_strict", "smoker_indoor_yes"): 0.0,
        ("non_smoker_ok", "non_smoker_ok"): 1.0,
        ("non_smoker_ok", "smoker_indoor_no"): 0.8,
        ("non_smoker_ok", "smoker_indoor_yes"): 0.4,
        ("smoker_indoor_no", "smoker_indoor_no"): 1.0,
        ("smoker_indoor_no", "smoker_indoor_yes"): 0.6,
        ("smoker_indoor_yes", "smoker_indoor_yes"): 1.0
    }
    key = (user_profile.smoking_status, other_profile.smoking_status)
    reverse_key = (other_profile.smoking_status, user_profile.smoking_status)
    score += smoking_weight * smoking_compatibility.get(key, smoking_compatibility.get(reverse_key, 0.5))
    total_weight += smoking_weight
    
    # 5. 소음 민감도 호환성 (가중치: 0.2)
    noise_weight = 0.2
    noise_compatibility = {
        ("sensitive", "sensitive"): 1.0,
        ("sensitive", "normal"): 0.7,
        ("sensitive", "not_sensitive"): 0.3,
        ("normal", "normal"): 1.0,
        ("normal", "not_sensitive"): 0.8,
        ("not_sensitive", "not_sensitive"): 1.0
    }
    key = (user_profile.noise_sensitivity, other_profile.noise_sensitivity)
    reverse_key = (other_profile.noise_sensitivity, user_profile.noise_sensitivity)
    score += noise_weight * noise_compatibility.get(key, noise_compatibility.get(reverse_key, 0.5))
    total_weight += noise_weight
    
    return score / total_weight if total_weight > 0 else 0.0


def get_matching_details(user_profile: UserProfile, other_profile: UserProfile) -> dict:
    """매칭 세부 정보를 반환합니다"""
    return {
        "sleep_type_match": user_profile.sleep_type == other_profile.sleep_type,
        "home_time_different": user_profile.home_time != other_profile.home_time and \
                              user_profile.home_time != "irregular" and other_profile.home_time != "irregular",
        "cleaning_frequency_compatible": abs(
            ["daily", "weekly", "as_needed"].index(user_profile.cleaning_frequency) -
            ["daily", "weekly", "as_needed"].index(other_profile.cleaning_frequency)
        ) <= 1,
        "cleaning_sensitivity_compatible": user_profile.cleaning_sensitivity == other_profile.cleaning_sensitivity or \
                                         (user_profile.cleaning_sensitivity == "not_sensitive" or other_profile.cleaning_sensitivity == "not_sensitive"),
        "smoking_compatible": not (
            user_profile.smoking_status == "non_smoker_strict" and 
            other_profile.smoking_status in ["smoker_indoor_no", "smoker_indoor_yes"]
        ),
        "other_profile": {
            "sleep_type": other_profile.sleep_type,
            "home_time": other_profile.home_time,
            "cleaning_frequency": other_profile.cleaning_frequency,
            "cleaning_sensitivity": other_profile.cleaning_sensitivity,
            "smoking_status": other_profile.smoking_status
        }
    }


def find_matches(user_id: int, all_profiles: List[UserProfile]) -> List[MatchingResult]:
    """사용자에게 가장 적합한 룸메이트들을 찾습니다"""
    user_profile = None
    other_profiles = []
    
    for profile in all_profiles:
        if profile.user_id == user_id:
            user_profile = profile
        else:
            other_profiles.append(profile)
    
    if not user_profile or not user_profile.is_complete:
        return []
    
    matches = []
    for other_profile in other_profiles:
        if other_profile.is_complete:
            compatibility_score = calculate_compatibility(user_profile, other_profile)
            
            # 사용자 정보 가져오기
            user_info = get_user_by_email_by_id(other_profile.user_id)
            if user_info:
                matches.append(MatchingResult(
                    user_id=other_profile.user_id,
                    email=user_info["email"],
                    name=user_info["name"],
                    compatibility_score=compatibility_score,
                    matching_details=get_matching_details(user_profile, other_profile)
                ))
    
    # 호환성 점수 순으로 정렬
    matches.sort(key=lambda x: x.compatibility_score, reverse=True)
    return matches


def get_user_by_email_by_id(user_id: int):
    """user_id로 사용자 정보를 가져옵니다"""
    import sqlite3
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, name FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    if user:
        return {"id": user[0], "email": user[1], "name": user[2]}
    return None
