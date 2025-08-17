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
async def update_profile(profile_data: dict, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    print(f"Updating profile for user_id: {user_id}")
    print(f"Profile data received: {profile_data}")
    
    # 프로필 데이터 업데이트 - user_profiles 테이블 사용
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 기존 프로필이 있는지 확인
        cursor.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,))
        existing_profile = cursor.fetchone()
        print(f"Existing profile: {existing_profile}")
        
        if not existing_profile:
            # 프로필이 없으면 새로 생성
            cursor.execute("INSERT INTO user_profiles (user_id) VALUES (?)", (user_id,))
            conn.commit()
            print("Created new profile")
        
        # 프로필 필드들 업데이트 - 직접 필드명 사용
        update_fields = []
        update_values = []
        
        # 유효한 데이터베이스 필드들
        valid_fields = ['sleep_type', 'home_time', 'cleaning_frequency', 'cleaning_sensitivity', 'smoking_status', 'noise_sensitivity']
        
        print(f"Valid fields: {valid_fields}")
        
        for field in valid_fields:
            if field in profile_data and profile_data[field] is not None:
                update_fields.append(f"{field} = ?")
                update_values.append(profile_data[field])
                print(f"Adding field {field}: {profile_data[field]}")
        
        # 완성도 체크 - 모든 필드가 채워졌는지 확인
        if len(update_fields) >= 6:  # 모든 필드가 업데이트 되었다면
            update_fields.append("is_complete = ?")
            update_values.append(True)
            print("Profile is complete")
        
        if update_fields:
            update_values.append(user_id)
            update_query = f"UPDATE user_profiles SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
            print(f"Update query: {update_query}")
            print(f"Update values: {update_values}")
            cursor.execute(update_query, update_values)
            conn.commit()
            print("Profile updated successfully")
        
        # 업데이트된 프로필 정보 가져오기
        cursor.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,))
        updated_profile = cursor.fetchone()
        print(f"Updated profile: {updated_profile}")
        
        return {"message": "Profile updated successfully", "profile": dict(zip([col[0] for col in cursor.description], updated_profile))}
        
    except Exception as e:
        conn.rollback()
        print(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/info/me")
async def get_my_info(current_user: dict = Depends(get_current_user)):
    """사용자 정보 조회"""
    user_id = current_user["id"]
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
async def update_my_info(info_data: dict, current_user: dict = Depends(get_current_user)):
    """사용자 정보 업데이트"""
    user_id = current_user["id"]
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
async def update_my_bio(bio_data: dict, current_user: dict = Depends(get_current_user)):
    """한줄 소개만 업데이트"""
    user_id = current_user["id"]
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