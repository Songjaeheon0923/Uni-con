from fastapi import APIRouter, HTTPException, status
from models.user import User
from pydantic import BaseModel
import session
from database.connection import get_db_connection

router = APIRouter()


class ProfileUpdate(BaseModel):
    sleep_schedule: str = None
    cleanliness: str = None
    noise_level: str = None
    guest_policy: str = None
    lifestyle: str = None
    study_pattern: str = None


@router.get("/me", response_model=User)
async def get_me():
    if session.current_user_session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not logged in"
        )
    return User(**session.current_user_session)


@router.put("/profile/me")
async def update_profile(profile_data: dict):
    if session.current_user_session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not logged in"
        )
    
    user_id = session.current_user_session["id"]
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