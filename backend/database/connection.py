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
    
    # 새로운 user_profiles 테이블 (고도화된 버전)
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
            age INTEGER,
            gender TEXT,
            gender_preference TEXT,
            personality_type TEXT,
            lifestyle_type TEXT,
            budget_range TEXT,
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
    create_test_users_and_profiles(cursor, conn)
    
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
               cleaning_sensitivity, smoking_status, noise_sensitivity,
               age, gender, gender_preference, personality_type, 
               lifestyle_type, budget_range, is_complete
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
            age=profile[7],
            gender=profile[8],
            gender_preference=profile[9],
            personality_type=profile[10],
            lifestyle_type=profile[11],
            budget_range=profile[12],
            is_complete=bool(profile[13])
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
        # 모든 필드가 채워졌는지 확인 (고도화된 버전)
        profile_dict = profile_data.dict(exclude_unset=True)
        current_data = {
            'sleep_type': current[2] or profile_dict.get('sleep_type'),
            'home_time': current[3] or profile_dict.get('home_time'),
            'cleaning_frequency': current[4] or profile_dict.get('cleaning_frequency'),
            'cleaning_sensitivity': current[5] or profile_dict.get('cleaning_sensitivity'),
            'smoking_status': current[6] or profile_dict.get('smoking_status'),
            'noise_sensitivity': current[7] or profile_dict.get('noise_sensitivity'),
            'age': current[8] or profile_dict.get('age'),
            'gender': current[9] or profile_dict.get('gender'),
            'gender_preference': current[10] or profile_dict.get('gender_preference'),
            'personality_type': current[11] or profile_dict.get('personality_type'),
            'lifestyle_type': current[12] or profile_dict.get('lifestyle_type'),
            'budget_range': current[13] or profile_dict.get('budget_range')
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
               cleaning_sensitivity, smoking_status, noise_sensitivity,
               age, gender, gender_preference, personality_type, 
               lifestyle_type, budget_range, is_complete
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
            age=profile[7],
            gender=profile[8],
            gender_preference=profile[9],
            personality_type=profile[10],
            lifestyle_type=profile[11],
            budget_range=profile[12],
            is_complete=bool(profile[13])
        )
        for profile in profiles
    ]


def create_test_users_and_profiles(cursor, conn):
    """테스트용 사용자들과 완성된 프로필 생성"""
    import hashlib
    
    # 이미 테스트 사용자가 있는지 확인
    cursor.execute("SELECT COUNT(*) FROM users WHERE email LIKE 'test%@example.com'")
    user_count = cursor.fetchone()[0]
    
    if user_count > 0:
        return  # 이미 테스트 사용자가 있으면 스킵
    
    # 패스워드 해시 생성 (간단한 예시)
    def hash_password(password):
        return hashlib.sha256(password.encode()).hexdigest()
    
    # 테스트 사용자들 데이터
    test_users = [
        {
            'email': 'test1@example.com',
            'name': '김민수',
            'password': 'test123',
            'profile': {
                'age': 23,
                'gender': 'male',
                'gender_preference': 'same',
                'sleep_type': 'morning',
                'home_time': 'night',
                'cleaning_frequency': 'daily',
                'cleaning_sensitivity': 'very_sensitive',
                'smoking_status': 'non_smoker_strict',
                'noise_sensitivity': 'sensitive',
                'personality_type': 'introverted',
                'lifestyle_type': 'student',
                'budget_range': 'medium'
            }
        },
        {
            'email': 'test2@example.com',
            'name': '박지영',
            'password': 'test123',
            'profile': {
                'age': 25,
                'gender': 'female',
                'gender_preference': 'same',
                'sleep_type': 'evening',
                'home_time': 'day',
                'cleaning_frequency': 'weekly',
                'cleaning_sensitivity': 'normal',
                'smoking_status': 'non_smoker_ok',
                'noise_sensitivity': 'normal',
                'personality_type': 'extroverted',
                'lifestyle_type': 'worker',
                'budget_range': 'high'
            }
        },
        {
            'email': 'test3@example.com',
            'name': '이동욱',
            'password': 'test123',
            'profile': {
                'age': 22,
                'gender': 'male',
                'gender_preference': 'any',
                'sleep_type': 'morning',
                'home_time': 'irregular',
                'cleaning_frequency': 'daily',
                'cleaning_sensitivity': 'not_sensitive',
                'smoking_status': 'smoker_indoor_no',
                'noise_sensitivity': 'not_sensitive',
                'personality_type': 'mixed',
                'lifestyle_type': 'student',
                'budget_range': 'low'
            }
        },
        {
            'email': 'test4@example.com',
            'name': '최서연',
            'password': 'test123',
            'profile': {
                'age': 27,
                'gender': 'female',
                'gender_preference': 'opposite',
                'sleep_type': 'evening',
                'home_time': 'night',
                'cleaning_frequency': 'as_needed',
                'cleaning_sensitivity': 'very_sensitive',
                'smoking_status': 'non_smoker_strict',
                'noise_sensitivity': 'sensitive',
                'personality_type': 'introverted',
                'lifestyle_type': 'freelancer',
                'budget_range': 'medium'
            }
        },
        {
            'email': 'test5@example.com',
            'name': '정태현',
            'password': 'test123',
            'profile': {
                'age': 24,
                'gender': 'male',
                'gender_preference': 'same',
                'sleep_type': 'morning',
                'home_time': 'day',
                'cleaning_frequency': 'weekly',
                'cleaning_sensitivity': 'normal',
                'smoking_status': 'non_smoker_ok',
                'noise_sensitivity': 'normal',
                'personality_type': 'extroverted',
                'lifestyle_type': 'student',
                'budget_range': 'medium'
            }
        },
        {
            'email': 'test6@example.com',
            'name': '안혜진',
            'password': 'test123',
            'profile': {
                'age': 26,
                'gender': 'female',
                'gender_preference': 'any',
                'sleep_type': 'evening',
                'home_time': 'irregular',
                'cleaning_frequency': 'as_needed',
                'cleaning_sensitivity': 'not_sensitive',
                'smoking_status': 'smoker_indoor_yes',
                'noise_sensitivity': 'not_sensitive',
                'personality_type': 'extroverted',
                'lifestyle_type': 'worker',
                'budget_range': 'high'
            }
        }
    ]
    
    # 사용자와 프로필 생성
    for user_data in test_users:
        try:
            # 사용자 생성
            cursor.execute(
                "INSERT INTO users (email, name, hashed_password) VALUES (?, ?, ?)",
                (user_data['email'], user_data['name'], hash_password(user_data['password']))
            )
            user_id = cursor.lastrowid
            
            # 프로필 생성
            profile = user_data['profile']
            cursor.execute("""
                INSERT INTO user_profiles (
                    user_id, age, gender, gender_preference, sleep_type, home_time,
                    cleaning_frequency, cleaning_sensitivity, smoking_status, noise_sensitivity,
                    personality_type, lifestyle_type, budget_range, is_complete
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id, profile['age'], profile['gender'], profile['gender_preference'],
                profile['sleep_type'], profile['home_time'], profile['cleaning_frequency'],
                profile['cleaning_sensitivity'], profile['smoking_status'], profile['noise_sensitivity'],
                profile['personality_type'], profile['lifestyle_type'], profile['budget_range'], True
            ))
            
            print(f"Created test user: {user_data['name']} (ID: {user_id})")
            
        except Exception as e:
            print(f"Error creating user {user_data['name']}: {e}")
    
    conn.commit()
    
    # 테스트 찜하기 데이터 생성 (첫 번째 방을 여러 사용자가 찜하도록)
    cursor.execute("SELECT room_id FROM rooms LIMIT 1")
    first_room = cursor.fetchone()
    
    if first_room:
        room_id = first_room[0]
        # 사용자 2, 3, 4, 5가 첫 번째 방을 찜하도록 설정
        test_favorites = [(2, room_id), (3, room_id), (4, room_id), (5, room_id)]
        
        for user_id, room_id in test_favorites:
            try:
                cursor.execute(
                    "INSERT INTO favorites (user_id, room_id) VALUES (?, ?)",
                    (user_id, room_id)
                )
                # 방의 찜 횟수 증가
                cursor.execute(
                    "UPDATE rooms SET favorite_count = favorite_count + 1 WHERE room_id = ?",
                    (room_id,)
                )
            except Exception as e:
                print(f"Error creating favorite for user {user_id}: {e}")
    
    conn.commit()
    print("Test users, profiles, and favorites created successfully!")