from pydantic import BaseModel
from typing import Optional


class Room(BaseModel):
    room_id: str
    address: str
    latitude: float
    longitude: float
    transaction_type: str  # "전세", "월세"
    price_deposit: int
    price_monthly: Optional[int] = 0
    area: float
    rooms: Optional[int] = 1
    floor: Optional[int] = None
    description: Optional[str] = None
    landlord_name: Optional[str] = None
    landlord_phone: Optional[str] = None


class RoomCreate(BaseModel):
    address: str
    latitude: float
    longitude: float
    transaction_type: str
    price_deposit: int
    price_monthly: Optional[int] = 0
    area: float


class RoomPin(BaseModel):
    """지도 핀용 간단한 방 정보"""
    room_id: str
    address: str
    latitude: float
    longitude: float
    price_deposit: int
    price_monthly: int
    transaction_type: str
    area: float
    risk_score: int
    favorite_count: int
