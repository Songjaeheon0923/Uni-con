from pydantic import BaseModel
from typing import Optional
from enum import Enum


class SleepType(str, Enum):
    MORNING = "morning"  # 아침형
    EVENING = "evening"  # 저녁형


class HomeTime(str, Enum):
    DAY = "day"  # 낮 시간
    NIGHT = "night"  # 밤 시간
    IRREGULAR = "irregular"  # 일정하지 않아요


class CleaningFrequency(str, Enum):
    DAILY = "daily"  # 매일 / 이틀에 한번
    WEEKLY = "weekly"  # 주 1~2회
    AS_NEEDED = "as_needed"  # 필요할 때만


class CleaningSensitivity(str, Enum):
    VERY_SENSITIVE = "very_sensitive"  # 매우 민감함
    NORMAL = "normal"  # 보통
    NOT_SENSITIVE = "not_sensitive"  # 크게 상관 없음


class SmokingStatus(str, Enum):
    NON_SMOKER_STRICT = "non_smoker_strict"  # 비흡연자 + 흡연자와 함께 지내기 어려움
    NON_SMOKER_OK = "non_smoker_ok"  # 비흡연자 + 흡연자와 함께 지내기 가능
    SMOKER_INDOOR_NO = "smoker_indoor_no"  # 흡연자 + 실내 금연
    SMOKER_INDOOR_YES = "smoker_indoor_yes"  # 흡연자 + 실내 흡연


class NoiseSensitivity(str, Enum):
    SENSITIVE = "sensitive"  # 민감함
    NORMAL = "normal"  # 보통
    NOT_SENSITIVE = "not_sensitive"  # 둔감함


class Gender(str, Enum):
    MALE = "male"  # 남성
    FEMALE = "female"  # 여성
    OTHER = "other"  # 기타


class GenderPreference(str, Enum):
    SAME = "same"  # 동성
    OPPOSITE = "opposite"  # 이성
    ANY = "any"  # 무관


class PersonalityType(str, Enum):
    INTROVERTED = "introverted"  # 내향적
    EXTROVERTED = "extroverted"  # 외향적
    MIXED = "mixed"  # 중간


class LifestyleType(str, Enum):
    STUDENT = "student"  # 학생
    WORKER = "worker"  # 직장인
    FREELANCER = "freelancer"  # 프리랜서
    OTHER = "other"  # 기타


class BudgetRange(str, Enum):
    LOW = "low"  # ~50만원
    MEDIUM = "medium"  # 50-100만원
    HIGH = "high"  # 100만원+


class UserProfile(BaseModel):
    user_id: int
    # 기존 필드들
    sleep_type: Optional[SleepType] = None
    home_time: Optional[HomeTime] = None
    cleaning_frequency: Optional[CleaningFrequency] = None
    cleaning_sensitivity: Optional[CleaningSensitivity] = None
    smoking_status: Optional[SmokingStatus] = None
    noise_sensitivity: Optional[NoiseSensitivity] = None
    # 새로운 필드들
    age: Optional[int] = None
    gender: Optional[Gender] = None
    gender_preference: Optional[GenderPreference] = None
    personality_type: Optional[PersonalityType] = None
    lifestyle_type: Optional[LifestyleType] = None
    budget_range: Optional[BudgetRange] = None
    is_complete: bool = False


class ProfileUpdateRequest(BaseModel):
    # 기존 필드들
    sleep_type: Optional[SleepType] = None
    home_time: Optional[HomeTime] = None
    cleaning_frequency: Optional[CleaningFrequency] = None
    cleaning_sensitivity: Optional[CleaningSensitivity] = None
    smoking_status: Optional[SmokingStatus] = None
    noise_sensitivity: Optional[NoiseSensitivity] = None
    # 새로운 필드들
    age: Optional[int] = None
    gender: Optional[Gender] = None
    gender_preference: Optional[GenderPreference] = None
    personality_type: Optional[PersonalityType] = None
    lifestyle_type: Optional[LifestyleType] = None
    budget_range: Optional[BudgetRange] = None


class MatchingResult(BaseModel):
    user_id: int
    email: str
    name: str
    compatibility_score: float  # 0.0 ~ 1.0
    matching_details: dict
