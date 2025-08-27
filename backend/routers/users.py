from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer
from models.user import User
from pydantic import BaseModel
from auth.jwt_handler import get_current_user
from database.connection import get_db_connection, get_user_info, update_user_info

router = APIRouter()


class ProfileUpdate(BaseModel):
    sleep_schedule: str = None
    cleanliness: str = None
    noise_level: str = None
    guest_policy: str = None
    lifestyle: str = None
    study_pattern: str = None


@router.get("/me", response_model=User)
async def get_me(current_user = Depends(get_current_user)):
    # 데이터베이스에서 사용자 정보 조회
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id, email, name FROM users WHERE id = ?", (current_user.id,))
        user_data = cursor.fetchone()
        
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return User(id=user_data[0], email=user_data[1], name=user_data[2])
    finally:
        conn.close()


@router.put("/profile/me")
async def update_profile(profile_data: dict, current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    print(f"[프로필 업데이트] 사용자 ID: {user_id}")
    
    # 프로필 데이터 업데이트 - user_profiles 테이블 사용
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 기존 프로필이 있는지 확인
        cursor.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,))
        existing_profile = cursor.fetchone()
        
        if not existing_profile:
            # 프로필이 없으면 새로 생성
            cursor.execute("INSERT INTO user_profiles (user_id) VALUES (?)", (user_id,))
            conn.commit()
            print("[프로필 업데이트] 새 프로필 생성 완료")
        
        # 프로필 필드들 업데이트 - 직접 필드명 사용
        update_fields = []
        update_values = []
        
        # 유효한 데이터베이스 필드들
        valid_fields = ['sleep_type', 'home_time', 'cleaning_frequency', 'cleaning_sensitivity', 'smoking_status', 'noise_sensitivity']
        
        for field in valid_fields:
            if field in profile_data and profile_data[field] is not None:
                update_fields.append(f"{field} = ?")
                update_values.append(profile_data[field])
        
        # 완성도 체크 - 모든 필드가 채워졌는지 확인
        is_complete = len(update_fields) >= 6
        if is_complete:
            update_fields.append("is_complete = ?")
            update_values.append(True)
        
        if update_fields:
            update_values.append(user_id)
            update_query = f"UPDATE user_profiles SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
            cursor.execute(update_query, update_values)
            conn.commit()
            
            completion_status = "완료" if is_complete else "진행중"
            print(f"[프로필 업데이트] {len(update_fields)}개 항목 업데이트 - 상태: {completion_status}")
            
            # 업데이트된 항목들을 간단히 출력
            updated_items = []
            for field in valid_fields:
                if field in profile_data and profile_data[field] is not None:
                    updated_items.append(f"{field}: {profile_data[field]}")
            print(f"[업데이트 항목] {', '.join(updated_items)}")
        
        # 업데이트된 프로필 정보 가져오기
        cursor.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,))
        updated_profile = cursor.fetchone()
        
        return {"message": "Profile updated successfully", "profile": dict(zip([col[0] for col in cursor.description], updated_profile))}
        
    except Exception as e:
        conn.rollback()
        print(f"[프로필 업데이트 오류] 사용자 ID {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/info/me")
async def get_my_info(current_user: User = Depends(get_current_user)):
    """사용자 정보 조회"""
    user_id = current_user.id
    user_info = get_user_info(user_id)
    
    if user_info is None:
        # 정보가 없으면 빈 정보 반환
        user_info = {
            "bio": "",
            "current_location": "",
            "desired_location": "",
            "budget": "",
            "move_in_date": "",
            "lifestyle": "",
            "roommate_preference": "",
            "introduction": ""
        }
    
    return user_info


@router.put("/info/me")
async def update_my_info(info_data: dict, current_user: User = Depends(get_current_user)):
    """사용자 정보 업데이트"""
    user_id = current_user.id
    print(f"Updating user info for user_id: {user_id}")
    print(f"Info data received: {info_data}")
    
    try:
        success = update_user_info(user_id, info_data)
        if success:
            return {"message": "User info updated successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to update user info")
    except Exception as e:
        print(f"Error updating user info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/bio/me")
async def update_my_bio(bio_data: dict, current_user: User = Depends(get_current_user)):
    """한줄 소개만 업데이트"""
    user_id = current_user.id
    bio = bio_data.get("bio", "").strip()
    print(f"Updating bio for user_id: {user_id}")
    print(f"Bio data: {bio}")
    
    try:
        success = update_user_info(user_id, {"bio": bio})
        if success:
            return {"message": "Bio updated successfully", "bio": bio}
        else:
            raise HTTPException(status_code=500, detail="Failed to update bio")
    except Exception as e:
        print(f"Error updating bio: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}")
async def get_user_by_id(user_id: int, current_user: User = Depends(get_current_user)):
    """특정 사용자의 기본 정보 조회"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 사용자 기본 정보 조회
        cursor.execute("""
            SELECT id, email, name, phone_number, gender, school_email, created_at
            FROM users WHERE id = ?
        """, (user_id,))
        user_data = cursor.fetchone()
        
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # 사용자 프로필 정보 조회
        cursor.execute("""
            SELECT age, sleep_type, home_time, cleaning_frequency, cleaning_sensitivity, 
                   smoking_status, noise_sensitivity, personality_type, lifestyle_type, 
                   budget_range, is_complete
            FROM user_profiles WHERE user_id = ?
        """, (user_id,))
        profile_data = cursor.fetchone()
        
        # 사용자 추가 정보 조회 (bio, 거주지 등)
        user_info = get_user_info(user_id)
        if user_info is None:
            user_info = {
                "bio": "",
                "current_location": "", 
                "desired_location": "",
                "budget": "",
                "move_in_date": "",
                "lifestyle": "",
                "roommate_preference": "",
                "introduction": ""
            }
        
        # 응답 데이터 구성
        result = {
            "id": user_data[0],
            "email": user_data[1], 
            "name": user_data[2],
            "phone_number": user_data[3],
            "gender": user_data[4],
            "school_email": user_data[5],
            "created_at": user_data[6],
            "profile": None,
            "user_info": user_info
        }
        
        if profile_data:
            result["profile"] = {
                "age": profile_data[0],
                "sleep_type": profile_data[1],
                "home_time": profile_data[2], 
                "cleaning_frequency": profile_data[3],
                "cleaning_sensitivity": profile_data[4],
                "smoking_status": profile_data[5],
                "noise_sensitivity": profile_data[6],
                "personality_type": profile_data[7],
                "lifestyle_type": profile_data[8],
                "budget_range": profile_data[9],
                "is_complete": profile_data[10]
            }
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()