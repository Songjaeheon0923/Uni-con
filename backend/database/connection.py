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
    
    # rooms 테이블 생성
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id TEXT UNIQUE NOT NULL,
            address TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            transaction_type TEXT NOT NULL,
            price_deposit INTEGER NOT NULL,
            price_monthly INTEGER DEFAULT 0,
            area REAL NOT NULL,
            rooms INTEGER DEFAULT 1,
            floor INTEGER,
            building_year INTEGER,
            description TEXT,
            landlord_name TEXT,
            landlord_phone TEXT,
            risk_score INTEGER DEFAULT 0,
            view_count INTEGER DEFAULT 0,
            favorite_count INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # favorites 테이블 생성
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            room_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (room_id) REFERENCES rooms (room_id),
            UNIQUE(user_id, room_id)
        )
    ''')
    
    conn.commit()
    
    # 더미 데이터 생성
    create_dummy_data(cursor, conn)
    
    conn.close()


def create_dummy_data(cursor, conn):
    """더미 데이터 생성"""
    import uuid
    import random
    
    # 이미 데이터가 있는지 확인
    cursor.execute("SELECT COUNT(*) FROM rooms")
    room_count = cursor.fetchone()[0]
    
    if room_count > 0:
        return  # 이미 데이터가 있으면 스킵
    
    # 서울 지역의 더미 방 데이터
    dummy_rooms = [
        {
            'room_id': f'room_{uuid.uuid4().hex[:8]}',
            'address': '서울특별시 강남구 역삼동 123-45',
            'latitude': 37.4979,
            'longitude': 127.0276,
            'transaction_type': '전세',
            'price_deposit': 50000,
            'price_monthly': 0,
            'area': 33.0,
            'rooms': 1,
            'floor': 3,
            'building_year': 2018,
            'description': '강남역 도보 5분, 깔끔한 원룸',
            'landlord_name': '김철수',
            'landlord_phone': '010-1234-5678',
            'risk_score': random.randint(1, 10),
            'view_count': random.randint(10, 100),
            'favorite_count': random.randint(0, 15)
        },
        {
            'room_id': f'room_{uuid.uuid4().hex[:8]}',
            'address': '서울특별시 홍대입구역 근처 원룸',
            'latitude': 37.5563,
            'longitude': 126.9236,
            'transaction_type': '월세',
            'price_deposit': 1000,
            'price_monthly': 60,
            'area': 25.0,
            'rooms': 1,
            'floor': 2,
            'building_year': 2020,
            'description': '홍대입구역 도보 3분, 신축 원룸',
            'landlord_name': '박영희',
            'landlord_phone': '010-9876-5432',
            'risk_score': random.randint(1, 10),
            'view_count': random.randint(10, 100),
            'favorite_count': random.randint(0, 15)
        },
        {
            'room_id': f'room_{uuid.uuid4().hex[:8]}',
            'address': '서울특별시 마포구 연남동 456-78',
            'latitude': 37.5665,
            'longitude': 126.9251,
            'transaction_type': '전세',
            'price_deposit': 30000,
            'price_monthly': 0,
            'area': 40.0,
            'rooms': 2,
            'floor': 1,
            'building_year': 2015,
            'description': '연남동 조용한 투룸, 반려동물 가능',
            'landlord_name': '이민수',
            'landlord_phone': '010-5555-7777',
            'risk_score': random.randint(1, 10),
            'view_count': random.randint(10, 100),
            'favorite_count': random.randint(0, 15)
        },
        {
            'room_id': f'room_{uuid.uuid4().hex[:8]}',
            'address': '서울특별시 송파구 잠실동 789-12',
            'latitude': 37.5133,
            'longitude': 127.1028,
            'transaction_type': '월세',
            'price_deposit': 2000,
            'price_monthly': 80,
            'area': 50.0,
            'rooms': 2,
            'floor': 5,
            'building_year': 2019,
            'description': '잠실역 근처, 넓은 투룸',
            'landlord_name': '최지영',
            'landlord_phone': '010-3333-4444',
            'risk_score': random.randint(1, 10),
            'view_count': random.randint(10, 100),
            'favorite_count': random.randint(0, 15)
        },
        {
            'room_id': f'room_{uuid.uuid4().hex[:8]}',
            'address': '서울특별시 용산구 이태원동 101-23',
            'latitude': 37.5344,
            'longitude': 126.9947,
            'transaction_type': '전세',
            'price_deposit': 40000,
            'price_monthly': 0,
            'area': 35.0,
            'rooms': 1,
            'floor': 4,
            'building_year': 2017,
            'description': '이태원역 도보 7분, 외국인 친화적',
            'landlord_name': '정태희',
            'landlord_phone': '010-7777-8888',
            'risk_score': random.randint(1, 10),
            'view_count': random.randint(10, 100),
            'favorite_count': random.randint(0, 15)
        }
    ]
    
    # 더미 방 데이터 삽입
    for room in dummy_rooms:
        cursor.execute('''
            INSERT INTO rooms (
                room_id, address, latitude, longitude, transaction_type,
                price_deposit, price_monthly, area, rooms, floor, building_year,
                description, landlord_name, landlord_phone, risk_score, view_count, favorite_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            room['room_id'], room['address'], room['latitude'], room['longitude'],
            room['transaction_type'], room['price_deposit'], room['price_monthly'],
            room['area'], room['rooms'], room['floor'], room['building_year'],
            room['description'], room['landlord_name'], room['landlord_phone'],
            room['risk_score'], room['view_count'], room['favorite_count']
        ))
    
    conn.commit()
    print(f"Created {len(dummy_rooms)} dummy rooms")


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