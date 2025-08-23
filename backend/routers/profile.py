from fastapi import APIRouter, HTTPException, status
from typing import List
from models.profile import UserProfile, ProfileUpdateRequest, MatchingResult
from database.connection import get_user_profile, update_user_profile, get_completed_profiles
from utils.matching import find_matches
import session

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=UserProfile)
async def get_my_profile():
    """현재 로그인한 사용자의 프로필을 조회합니다"""
    if session.current_user_session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not logged in"
        )
    
    user_id = session.current_user_session["id"]
    profile = get_user_profile(user_id)
    
    if not profile:
        # 프로필이 없으면 빈 프로필 생성
        from database.connection import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO user_profiles (user_id) VALUES (?)", (user_id,))
            conn.commit()
            conn.close()
            
            # 새로 생성된 프로필 반환
            profile = get_user_profile(user_id)
        except Exception as e:
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create profile"
            )
    
    return profile


@router.put("/me", response_model=UserProfile)
async def update_my_profile(profile_data: ProfileUpdateRequest):
    """현재 로그인한 사용자의 프로필을 업데이트합니다"""
    if session.current_user_session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not logged in"
        )
    
    user_id = session.current_user_session["id"]
    
    if not update_user_profile(user_id, profile_data):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update profile"
        )
    
    updated_profile = get_user_profile(user_id)
    return updated_profile


@router.get("/matches", response_model=List[MatchingResult])
async def get_my_matches():
    """현재 로그인한 사용자와 호환되는 룸메이트 목록을 반환합니다"""
    if session.current_user_session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not logged in"
        )
    
    user_id = session.current_user_session["id"]
    user_profile = get_user_profile(user_id)
    
    if not user_profile or not user_profile.is_complete:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile must be completed before matching"
        )
    
    all_profiles = get_completed_profiles()
    matches = find_matches(user_id, all_profiles)
    
    return matches


@router.get("/questions")
async def get_profile_questions():
    """프로필 설정을 위한 질문 목록을 반환합니다"""
    return {
        "questions": [
            {
                "id": "sleep_type",
                "question": "보통 몇 시쯤 기상하고,\n몇 시쯤 잠자리에 드시나요?",
                "options": [
                    {"value": "morning", "label": "아침형 (기상 7-9시, 취침 22-24시)"},
                    {"value": "night", "label": "야행형 (기상 10-12시, 취침 01-03시)"}
                ]
            },
            {
                "id": "home_time",
                "question": "하루 중 집에 머무는 시간대는\n언제가 많으신가요?",
                "options": [
                    {"value": "day", "label": "낮 시간 (08:00~18:00)"},
                    {"value": "night", "label": "밤 시간 (18:00~02:00)"},
                    {"value": "irregular", "label": "일정하지 않아요"}
                ]
            },
            {
                "id": "cleaning_frequency",
                "question": "청소는 얼마나 자주 하시나요?",
                "options": [
                    {"value": "daily", "label": "매일 / 이틀에 한번"},
                    {"value": "weekly", "label": "주 1~2회"},
                    {"value": "as_needed", "label": "필요할 때만"}
                ]
            },
            {
                "id": "cleaning_sensitivity",
                "question": "룸메이트의 청소 상태가\n신경 쓰이는 편인가요?",
                "options": [
                    {"value": "very_sensitive", "label": "매우 민감함 (먼지, 정리에 예민)"},
                    {"value": "normal", "label": "보통"},
                    {"value": "not_sensitive", "label": "크게 상관 없음"}
                ]
            },
            {
                "id": "smoking_status",
                "question": "흡연을 하시나요?",
                "options": [
                    {"value": "non_smoker", "label": "비흡연자"},
                    {"value": "smoker", "label": "흡연자"}
                ],
                "sub_options": {
                    "non_smoker": [
                        {"value": "non_smoker_strict", "label": "흡연자와 함께 지내기 어려움"},
                        {"value": "non_smoker_ok", "label": "흡연자와 함께 지내기 가능"}
                    ],
                    "smoker": [
                        {"value": "smoker_indoor_no", "label": "실내 금연, 외부에서만 흡연"},
                        {"value": "smoker_indoor_yes", "label": "실내 흡연 희망"}
                    ]
                }
            },
            {
                "id": "noise_sensitivity",
                "question": "생활 소음에 얼마나 민감하신가요?\n(예: 발소리, 말소리, 음악 등)",
                "options": [
                    {"value": "sensitive", "label": "매우 민감함 (소음에 예민)"},
                    {"value": "normal", "label": "보통 (일상 소음은 괜찮음)"},
                    {"value": "not_sensitive", "label": "크게 상관 없음 (소음에 둔감)"}
                ]
            }
        ]
    }
