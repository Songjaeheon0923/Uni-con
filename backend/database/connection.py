import sqlite3
from typing import Optional, List
from models.user import UserCreate
from models.profile import UserProfile, ProfileUpdateRequest

DATABASE_PATH = "users.db"


def get_db_connection():
    """데이터베이스 연결을 반환합니다."""
    return sqlite3.connect(DATABASE_PATH)


def init_db():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # 기존 users 테이블
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            hashed_password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 새로운 user_profiles 테이블
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            sleep_type TEXT,
            home_time TEXT,
            cleaning_frequency TEXT,
            cleaning_sensitivity TEXT,
            smoking_status TEXT,
            noise_sensitivity TEXT,
            is_complete BOOLEAN DEFAULT FALSE,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()


def get_user_by_email(email: str):
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, name, hashed_password FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()
    if user:
        return {"id": user[0], "email": user[1], "name": user[2], "hashed_password": user[3]}
    return None


def create_user(user_data: UserCreate, hashed_password: str):
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (email, name, hashed_password) VALUES (?, ?, ?)",
            (user_data.email, user_data.name, hashed_password)
        )
        conn.commit()
        user_id = cursor.lastrowid
        
        # 빈 프로필 생성
        cursor.execute(
            "INSERT INTO user_profiles (user_id) VALUES (?)",
            (user_id,)
        )
        conn.commit()
        conn.close()
        return {"id": user_id, "email": user_data.email, "name": user_data.name}
    except sqlite3.IntegrityError:
        conn.close()
        return None


def get_user_profile(user_id: int) -> Optional[UserProfile]:
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT user_id, sleep_type, home_time, cleaning_frequency, 
               cleaning_sensitivity, smoking_status, noise_sensitivity, is_complete
        FROM user_profiles WHERE user_id = ?
    """, (user_id,))
    profile = cursor.fetchone()
    conn.close()
    
    if profile:
        return UserProfile(
            user_id=profile[0],
            sleep_type=profile[1],
            home_time=profile[2],
            cleaning_frequency=profile[3],
            cleaning_sensitivity=profile[4],
            smoking_status=profile[5],
            noise_sensitivity=profile[6],
            is_complete=bool(profile[7])
        )
    return None


def update_user_profile(user_id: int, profile_data: ProfileUpdateRequest) -> bool:
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # 업데이트할 필드들 준비
    updates = []
    values = []
    
    for field, value in profile_data.dict(exclude_unset=True).items():
        if value is not None:
            updates.append(f"{field} = ?")
            values.append(value)
    
    if not updates:
        conn.close()
        return False
    
    # 완성도 체크
    cursor.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,))
    current = cursor.fetchone()
    
    if current:
        # 모든 필드가 채워졌는지 확인
        profile_dict = profile_data.dict(exclude_unset=True)
        current_data = {
            'sleep_type': current[2] or profile_dict.get('sleep_type'),
            'home_time': current[3] or profile_dict.get('home_time'),
            'cleaning_frequency': current[4] or profile_dict.get('cleaning_frequency'),
            'cleaning_sensitivity': current[5] or profile_dict.get('cleaning_sensitivity'),
            'smoking_status': current[6] or profile_dict.get('smoking_status'),
            'noise_sensitivity': current[7] or profile_dict.get('noise_sensitivity')
        }
        
        is_complete = all(value is not None for value in current_data.values())
        updates.append("is_complete = ?")
        values.append(is_complete)
    
    values.append(user_id)
    
    query = f"UPDATE user_profiles SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
    cursor.execute(query, values)
    conn.commit()
    conn.close()
    
    return cursor.rowcount > 0


def get_completed_profiles() -> List[UserProfile]:
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT user_id, sleep_type, home_time, cleaning_frequency, 
               cleaning_sensitivity, smoking_status, noise_sensitivity, is_complete
        FROM user_profiles WHERE is_complete = TRUE
    """)
    profiles = cursor.fetchall()
    conn.close()
    
    return [
        UserProfile(
            user_id=profile[0],
            sleep_type=profile[1],
            home_time=profile[2],
            cleaning_frequency=profile[3],
            cleaning_sensitivity=profile[4],
            smoking_status=profile[5],
            noise_sensitivity=profile[6],
            is_complete=bool(profile[7])
        )
        for profile in profiles
    ]