from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class RoomType(str, Enum):
    INDIVIDUAL = "individual"
    GROUP = "group"


class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"


class ChatRoom(BaseModel):
    id: int
    room_type: RoomType
    name: Optional[str] = None
    created_by: int
    created_at: datetime
    updated_at: datetime
    is_active: bool = True
    participants: Optional[List[int]] = []


class ChatParticipant(BaseModel):
    id: int
    room_id: int
    user_id: int
    joined_at: datetime
    last_read_at: datetime
    is_active: bool = True


class ChatMessage(BaseModel):
    id: int
    room_id: int
    sender_id: int
    message_type: MessageType
    content: str
    file_url: Optional[str] = None
    reply_to_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    is_deleted: bool = False
    sender_name: Optional[str] = None  # JOIN으로 가져올 발신자 이름


class CreateChatRoomRequest(BaseModel):
    room_type: RoomType = RoomType.INDIVIDUAL
    name: Optional[str] = None
    participant_ids: List[int]


class SendMessageRequest(BaseModel):
    content: str
    message_type: MessageType = MessageType.TEXT
    file_url: Optional[str] = None
    reply_to_id: Optional[int] = None


class ChatRoomListItem(BaseModel):
    id: int
    room_type: RoomType
    name: Optional[str] = None
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    unread_count: int = 0
    participants: List[dict] = []  # participant info