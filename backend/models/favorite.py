from pydantic import BaseModel
from typing import Optional

class Favorite(BaseModel):
    user_id: str
    room_id: str

class FavoriteUser(BaseModel):
    """찜한 사람 정보"""
    user_id: str
    nickname: str
    age: Optional[int]
    gender: Optional[str]
    occupation: Optional[str]
    profile_image: Optional[str]
    matching_score: Optional[int] = 0
    favorite_date: str

class RoomSummary(BaseModel):
    """찜한 방 요약 정보"""
    room_id: str
    address: str
    price_deposit: int
    price_monthly: int
    transaction_type: str
    area: float
    risk_score: int
    thumbnail_image: Optional[str]
