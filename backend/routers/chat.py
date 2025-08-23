from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer
from typing import List, Optional
from models.chat import (
    CreateChatRoomRequest, SendMessageRequest, ChatRoomListItem, 
    ChatMessage, ChatRoom
)
from models.user import User
from auth.jwt_handler import get_current_user
from database.connection import (
    create_chat_room, get_user_chat_rooms, send_message, 
    get_chat_messages, update_last_read_time
)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/rooms")
async def create_room(
    request: CreateChatRoomRequest, 
    current_user: User = Depends(get_current_user)
):
    """새 채팅방 생성"""
    try:
        # 1:1 채팅의 경우 이미 존재하는 방이 있는지 확인
        if request.room_type == 'individual' and len(request.participant_ids) == 1:
            existing_rooms = get_user_chat_rooms(current_user.id)
            for room in existing_rooms:
                if (room['room_type'] == 'individual' and 
                    len(room['participants']) == 2 and
                    any(p['id'] == request.participant_ids[0] for p in room['participants'])):
                    return {"room_id": room['id'], "message": "Existing room found"}
        
        room_id = create_chat_room(
            created_by=current_user.id,
            room_type=request.room_type,
            name=request.name,
            participant_ids=request.participant_ids
        )
        
        if room_id:
            return {"room_id": room_id, "message": "Chat room created successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to create chat room")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rooms")
async def get_my_chat_rooms(current_user: User = Depends(get_current_user)):
    """내 채팅방 목록 조회"""
    try:
        rooms = get_user_chat_rooms(current_user.id)
        return {"rooms": rooms}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rooms/{room_id}/messages")
async def send_chat_message(
    room_id: int,
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user)
):
    """메시지 전송"""
    try:
        message_id = send_message(
            room_id=room_id,
            sender_id=current_user.id,
            content=request.content,
            message_type=request.message_type,
            file_url=request.file_url,
            reply_to_id=request.reply_to_id
        )
        
        if message_id:
            return {"message_id": message_id, "message": "Message sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send message")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rooms/{room_id}/messages")
async def get_room_messages(
    room_id: int,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user)
):
    """채팅방 메시지 목록 조회"""
    try:
        messages = get_chat_messages(room_id, current_user.id, limit, offset)
        return {"messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/rooms/{room_id}/read")
async def mark_as_read(
    room_id: int,
    current_user: User = Depends(get_current_user)
):
    """메시지 읽음 처리"""
    try:
        success = update_last_read_time(room_id, current_user.id)
        if success:
            return {"message": "Messages marked as read"}
        else:
            raise HTTPException(status_code=404, detail="Chat room not found or user not participant")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 더미 채팅 데이터 생성 엔드포인트 (개발/테스트용)
@router.post("/rooms/dummy")
async def create_dummy_chat_data(current_user: User = Depends(get_current_user)):
    """개발/테스트용 더미 채팅 데이터 생성"""
    try:
        # 테스트 사용자들과의 채팅방 생성
        test_user_ids = [2, 3, 4, 5]  # 테스트 사용자 ID들
        
        created_rooms = []
        for user_id in test_user_ids:
            if user_id != current_user.id:
                room_id = create_chat_room(
                    created_by=current_user.id,
                    room_type='individual',
                    participant_ids=[user_id]
                )
                
                if room_id:
                    # 더미 메시지들 추가
                    dummy_messages = [
                        "안녕하세요! 룸메이트 구하시는 건가요?",
                        "네, 맞습니다. 혹시 어떤 조건으로 찾고 계신가요?",
                        "저는 깔끔한 편이고 늦게 들어오는 편이에요",
                        "좋네요! 한번 만나서 얘기해봐요"
                    ]
                    
                    for i, content in enumerate(dummy_messages):
                        sender_id = current_user.id if i % 2 == 0 else user_id
                        send_message(room_id, sender_id, content)
                    
                    created_rooms.append(room_id)
        
        return {
            "message": f"Created {len(created_rooms)} dummy chat rooms with messages",
            "room_ids": created_rooms
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))