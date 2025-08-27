from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
import sqlite3
from database.connection import DATABASE_PATH
from auth.jwt_handler import get_current_user
from models.user import User

router = APIRouter()

@router.post("/activity/heartbeat")
async def update_user_activity(
    current_user: User = Depends(get_current_user)
):
    """
    사용자가 앱을 사용 중임을 알리는 heartbeat 엔드포인트
    클라이언트에서 주기적으로 호출하여 마지막 접속 시간을 업데이트
    """
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # 현재 사용자의 마지막 접속 시간 업데이트 (한국 시간)
        kst = timezone(timedelta(hours=9))
        last_seen_at = datetime.now(kst).replace(tzinfo=None)
        
        cursor.execute("""
            UPDATE users SET last_seen_at = ? WHERE id = ?
        """, (last_seen_at, current_user.id))
        
        conn.commit()
        conn.close()
        
        return {"message": "Activity updated successfully", "last_seen_at": last_seen_at}
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        raise HTTPException(status_code=500, detail=f"Failed to update activity: {str(e)}")

@router.get("/activity/status/{user_id}")
async def get_user_status(
    user_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    특정 사용자의 접속 상태를 확인하는 엔드포인트
    """
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # 사용자 조회
        cursor.execute("""
            SELECT id, last_seen_at, created_at FROM users WHERE id = ?
        """, (user_id,))
        
        user_data = cursor.fetchone()
        conn.close()
        
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id_db, last_seen_at, created_at = user_data
        
        # 현재 시간과 마지막 접속 시간의 차이 계산 (한국 시간)
        kst = timezone(timedelta(hours=9))
        now = datetime.now(kst).replace(tzinfo=None)
        
        # last_seen_at이 None이면 created_at 사용
        if last_seen_at:
            last_seen = datetime.fromisoformat(last_seen_at)
        else:
            last_seen = datetime.fromisoformat(created_at)
        
        time_diff = now - last_seen
        
        # 5분 이내면 온라인으로 간주
        is_online = time_diff.total_seconds() < 300  # 5분
        
        return {
            "user_id": user_id,
            "is_online": is_online,
            "last_seen_at": last_seen.isoformat(),
            "minutes_ago": int(time_diff.total_seconds() / 60)
        }
    except HTTPException:
        raise
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        raise HTTPException(status_code=500, detail=f"Failed to get user status: {str(e)}")