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
    get_chat_messages, get_chat_messages_without_marking_read,
    update_last_read_time, delete_chat_room, update_message_status
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
    """채팅방 메시지 목록 조회 (읽음 처리)"""
    try:
        messages = get_chat_messages(room_id, current_user.id, limit, offset)
        return {"messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rooms/{room_id}/messages/peek")
async def peek_room_messages(
    room_id: int,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user)
):
    """채팅방 메시지 목록 조회 (읽음 처리 안함 - 실시간 업데이트용)"""
    try:
        messages = get_chat_messages_without_marking_read(room_id, current_user.id, limit, offset)
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


@router.put("/messages/{message_id}/status")
async def update_message_status_endpoint(
    message_id: int,
    status: str,  # 'sent', 'delivered', 'read'
    current_user: User = Depends(get_current_user)
):
    """메시지 상태 업데이트"""
    try:
        if status not in ['sent', 'delivered', 'read']:
            raise HTTPException(status_code=400, detail="Invalid status. Must be 'sent', 'delivered', or 'read'")
        
        success = update_message_status(message_id, status)
        if success:
            return {"message": f"Message status updated to {status}"}
        else:
            raise HTTPException(status_code=404, detail="Message not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/rooms/{room_id}")
async def delete_room(
    room_id: int,
    current_user: User = Depends(get_current_user)
):
    """채팅방 삭제 (해당 사용자에게만 보이지 않게 처리)"""
    print(f"🗑️ [API DELETE] 요청 받음: room_id={room_id}, user_id={current_user.id}")
    try:
        success = delete_chat_room(room_id, current_user.id)
        print(f"🗑️ [API DELETE] DB 함수 결과: {success}")
        
        if success:
            print(f"✅ [API DELETE] 성공 응답 반환")
            return {"message": "Chat room deleted successfully"}
        else:
            print(f"❌ [API DELETE] 404 에러 - 채팅방을 찾을 수 없음")
            raise HTTPException(status_code=404, detail="Chat room not found or user not participant")
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [API DELETE] 예외 발생: {e}")
        raise HTTPException(status_code=500, detail=str(e))


