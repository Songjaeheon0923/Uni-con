from typing import List
from models.profile import UserProfile, MatchingResult
from database.connection import get_user_by_email


def calculate_compatibility(user_profile: UserProfile, other_profile: UserProfile) -> float:
    """
    두 사용자 프로필 간의 호환성 점수를 계산합니다 (0.0 ~ 1.0)
    6개 요소 기반 매칭 알고리즘
    """
    if not (user_profile.is_complete and other_profile.is_complete):
        return 0.0

    score = 0.0
    total_weight = 0.0

    # 1. 기상/취침 시간 호환성 (가중치: 0.2)
    sleep_weight = 0.2
    if user_profile.sleep_type == other_profile.sleep_type:
        score += sleep_weight * 1.0
    else:
        score += sleep_weight * 0.3  # 다르면 약간의 점수
    total_weight += sleep_weight

    # 2. 집에 머무는 시간대 호환성 (가중치: 0.15)
    home_time_weight = 0.15
    if user_profile.home_time == other_profile.home_time:
        score += home_time_weight * 1.0
    elif user_profile.home_time == "irregular" or other_profile.home_time == "irregular":
        score += home_time_weight * 0.7  # 불규칙한 경우 중간 점수
    else:
        score += home_time_weight * 0.4  # 다른 시간대
    total_weight += home_time_weight

    # 3. 청소 빈도 호환성 (가중치: 0.2)
    cleaning_freq_weight = 0.2
    freq_compatibility = {
        ("daily", "daily"): 1.0,
        ("daily", "weekly"): 0.6,
        ("daily", "as_needed"): 0.2,
        ("weekly", "weekly"): 1.0,
        ("weekly", "as_needed"): 0.7,
        ("as_needed", "as_needed"): 1.0
    }
    key = (user_profile.cleaning_frequency, other_profile.cleaning_frequency)
    reverse_key = (other_profile.cleaning_frequency, user_profile.cleaning_frequency)
    score += cleaning_freq_weight * freq_compatibility.get(key, freq_compatibility.get(reverse_key, 0.5))
    total_weight += cleaning_freq_weight

    # 4. 청소 민감도 호환성 (가중치: 0.15)
    cleaning_sens_weight = 0.15
    sens_compatibility = {
        ("very_sensitive", "very_sensitive"): 1.0,
        ("very_sensitive", "normal"): 0.6,
        ("very_sensitive", "not_sensitive"): 0.1,
        ("normal", "normal"): 1.0,
        ("normal", "not_sensitive"): 0.8,
        ("not_sensitive", "not_sensitive"): 1.0
    }
    key = (user_profile.cleaning_sensitivity, other_profile.cleaning_sensitivity)
    reverse_key = (other_profile.cleaning_sensitivity, user_profile.cleaning_sensitivity)
    score += cleaning_sens_weight * sens_compatibility.get(key, sens_compatibility.get(reverse_key, 0.5))
    total_weight += cleaning_sens_weight

    # 5. 흡연 호환성 (가중치: 0.25) - 가장 중요
    smoking_weight = 0.25
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

    # 6. 소음 민감도 호환성 (가중치: 0.05)
    noise_weight = 0.05
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
        "home_time_compatible": user_profile.home_time == other_profile.home_time,
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
        "noise_sensitivity_compatible": user_profile.noise_sensitivity == other_profile.noise_sensitivity or \
                                      (user_profile.noise_sensitivity == "not_sensitive" or other_profile.noise_sensitivity == "not_sensitive"),
        "other_profile": {
            "sleep_type": other_profile.sleep_type,
            "home_time": other_profile.home_time,
            "cleaning_frequency": other_profile.cleaning_frequency,
            "cleaning_sensitivity": other_profile.cleaning_sensitivity,
            "smoking_status": other_profile.smoking_status,
            "noise_sensitivity": other_profile.noise_sensitivity
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