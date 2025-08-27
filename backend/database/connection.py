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
    
    # 기존 users 테이블 (school_verified, school_verified_at 제거)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            hashed_password TEXT NOT NULL,
            phone_number TEXT,
            gender TEXT,
            school_email TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_seen_at TIMESTAMP DEFAULT NULL
        )
    ''')
    
    # 기존 테이블에 새 컬럼들 추가
    try:
        cursor.execute('ALTER TABLE users ADD COLUMN phone_number TEXT')
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute('ALTER TABLE users ADD COLUMN gender TEXT')
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute('ALTER TABLE users ADD COLUMN school_email TEXT')
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute('ALTER TABLE users ADD COLUMN last_seen_at TIMESTAMP DEFAULT NULL')
    except sqlite3.OperationalError:
        pass
    
    # user_profiles 테이블에서 gender_preference 컬럼 제거 (SQLite는 DROP COLUMN을 지원하지 않으므로 테이블 재생성)
    try:
        # 기존 데이터 백업
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_profiles'")
        if cursor.fetchone():
            cursor.execute("""
                CREATE TABLE user_profiles_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER UNIQUE NOT NULL,
                    sleep_type TEXT,
                    home_time TEXT,
                    cleaning_frequency TEXT,
                    cleaning_sensitivity TEXT,
                    smoking_status TEXT,
                    noise_sensitivity TEXT,
                    age INTEGER,
                    personality_type TEXT,
                    lifestyle_type TEXT,
                    budget_range TEXT,
                    is_complete BOOLEAN DEFAULT FALSE,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
            
            # 기존 데이터 복사 (gender 제거)
            cursor.execute("""
                INSERT INTO user_profiles_new (
                    id, user_id, sleep_type, home_time, cleaning_frequency,
                    cleaning_sensitivity, smoking_status, noise_sensitivity,
                    age, personality_type, lifestyle_type, budget_range,
                    is_complete, updated_at
                )
                SELECT id, user_id, sleep_type, home_time, cleaning_frequency,
                       cleaning_sensitivity, smoking_status, noise_sensitivity,
                       age, personality_type, lifestyle_type, budget_range,
                       is_complete, updated_at
                FROM user_profiles
            """)
            
            # 기존 테이블 삭제 후 새 테이블로 이름 변경
            cursor.execute("DROP TABLE user_profiles")
            cursor.execute("ALTER TABLE user_profiles_new RENAME TO user_profiles")
    except sqlite3.OperationalError as e:
        # 테이블이 존재하지 않거나 이미 마이그레이션된 경우
        pass
    
    # 새로운 user_profiles 테이블 (gender 제거)
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
            personality_type TEXT,
            lifestyle_type TEXT,
            budget_range TEXT,
            is_complete BOOLEAN DEFAULT FALSE,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # 새로운 user_info 테이블 (한줄 소개 및 내 정보)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_info (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            bio TEXT DEFAULT '',
            current_location TEXT DEFAULT '',
            desired_location TEXT DEFAULT '',
            budget TEXT DEFAULT '',
            move_in_date TEXT DEFAULT '',
            lifestyle TEXT DEFAULT '',
            roommate_preference TEXT DEFAULT '',
            introduction TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    
    # school_verifications 테이블은 제거됨 (users 테이블에 통합)
    
    # policies 테이블 생성
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS policies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            content TEXT NOT NULL,
            url TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL,
            target_age_min INTEGER,
            target_age_max INTEGER,
            target_gender TEXT,
            target_location TEXT,
            tags TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            view_count INTEGER DEFAULT 0,
            relevance_score REAL DEFAULT 0.0,
            crawled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # policy_views 테이블 생성 (사용자 조회 기록)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS policy_views (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            policy_id INTEGER NOT NULL,
            viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (policy_id) REFERENCES policies (id),
            UNIQUE(user_id, policy_id)
        )
    ''')
    
    # 채팅방 테이블
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_type TEXT NOT NULL DEFAULT 'individual', -- 'individual' 또는 'group'
            name TEXT, -- 그룹 채팅의 경우 채팅방 이름
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (created_by) REFERENCES users (id)
        )
    ''')
    
    # 채팅방 참가자 테이블
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (room_id) REFERENCES chat_rooms (id),
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(room_id, user_id)
        )
    ''')
    
    # 채팅 메시지 테이블
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id INTEGER NOT NULL,
            sender_id INTEGER NOT NULL,
            message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'file' 등
            content TEXT NOT NULL,
            file_url TEXT, -- 파일/이미지 URL (필요시)
            reply_to_id INTEGER, -- 답장 기능
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_deleted BOOLEAN DEFAULT FALSE,
            sent BOOLEAN DEFAULT 0, -- 전송됨
            delivered BOOLEAN DEFAULT 0, -- 수신됨
            read_status BOOLEAN DEFAULT 0, -- 읽음
            FOREIGN KEY (room_id) REFERENCES chat_rooms (id),
            FOREIGN KEY (sender_id) REFERENCES users (id),
            FOREIGN KEY (reply_to_id) REFERENCES chat_messages (id)
        )
    ''')
    
    # 기존 테이블에 새 컬럼들 추가 (이미 존재하는 경우 에러 무시)
    try:
        cursor.execute('ALTER TABLE chat_messages ADD COLUMN sent BOOLEAN DEFAULT 0')
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute('ALTER TABLE chat_messages ADD COLUMN delivered BOOLEAN DEFAULT 0')
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute('ALTER TABLE chat_messages ADD COLUMN read_status BOOLEAN DEFAULT 0')
    except sqlite3.OperationalError:
        pass
    
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
    cursor.execute("""
        SELECT id, email, name, hashed_password, phone_number, gender, school_email
        FROM users WHERE email = ?
    """, (email,))
    user = cursor.fetchone()
    conn.close()
    if user:
        return {
            "id": user[0], 
            "email": user[1], 
            "name": user[2], 
            "hashed_password": user[3], 
            "phone_number": user[4], 
            "gender": user[5],
            "school_email": user[6]
        }
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
        
        # 빈 사용자 정보 생성
        cursor.execute(
            "INSERT INTO user_info (user_id) VALUES (?)",
            (user_id,)
        )
        conn.commit()
        conn.close()
        return {"id": user_id, "email": user_data.email, "name": user_data.name, "phone_number": None}
    except sqlite3.IntegrityError:
        conn.close()
        return None


def get_user_profile(user_id: int) -> Optional[UserProfile]:
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.user_id, p.sleep_type, p.home_time, p.cleaning_frequency, 
               p.cleaning_sensitivity, p.smoking_status, p.noise_sensitivity,
               p.age, p.personality_type, p.lifestyle_type, p.budget_range, 
               p.is_complete, u.gender, u.school_email
        FROM user_profiles p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ?
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
            gender=profile[12],  # users 테이블에서 가져온 gender (12번째 인덱스)
            gender_preference=None,  # 제거된 필드
            personality_type=profile[8],
            lifestyle_type=profile[9],
            budget_range=profile[10],
            is_complete=bool(profile[11]),
            school_email=profile[13]  # school_email 추가
        )
    return None


def update_user_profile(user_id: int, profile_data: ProfileUpdateRequest) -> bool:
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # 업데이트할 필드들 준비
    updates = []
    values = []
    
    for field, value in profile_data.dict(exclude_unset=True).items():
        if value is not None and field not in ['gender_preference', 'gender']:  # gender_preference, gender 필드 무시
            updates.append(f"{field} = ?")
            values.append(value)
    
    if not updates:
        conn.close()
        return False
    
    # 완성도 체크
    cursor.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,))
    current = cursor.fetchone()
    
    if current:
        # 모든 필드가 채워졌는지 확인 (gender 제거된 버전)
        profile_dict = profile_data.dict(exclude_unset=True)
        current_data = {
            'sleep_type': current[2] or profile_dict.get('sleep_type'),
            'home_time': current[3] or profile_dict.get('home_time'),
            'cleaning_frequency': current[4] or profile_dict.get('cleaning_frequency'),
            'cleaning_sensitivity': current[5] or profile_dict.get('cleaning_sensitivity'),
            'smoking_status': current[6] or profile_dict.get('smoking_status'),
            'noise_sensitivity': current[7] or profile_dict.get('noise_sensitivity'),
            'age': current[8] or profile_dict.get('age'),
            'personality_type': current[9] or profile_dict.get('personality_type'),
            'lifestyle_type': current[10] or profile_dict.get('lifestyle_type'),
            'budget_range': current[11] or profile_dict.get('budget_range')
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
        SELECT p.user_id, p.sleep_type, p.home_time, p.cleaning_frequency, 
               p.cleaning_sensitivity, p.smoking_status, p.noise_sensitivity,
               p.age, p.personality_type, p.lifestyle_type, p.budget_range, 
               p.is_complete, u.gender, u.school_email
        FROM user_profiles p
        JOIN users u ON p.user_id = u.id
        WHERE p.is_complete = TRUE
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
            gender=profile[12],  # users 테이블에서 가져온 gender
            gender_preference=None,  # 제거된 필드
            personality_type=profile[8],
            lifestyle_type=profile[9],
            budget_range=profile[10],
            is_complete=bool(profile[11]),
            school_email=profile[13]  # school_email 추가
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
            # 사용자 생성 (현재 스키마에 맞게 모든 컬럼 포함)
            cursor.execute("""
                INSERT INTO users (email, name, hashed_password, phone_number, gender, school_email) 
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                user_data['email'], 
                user_data['name'], 
                hash_password(user_data['password']),
                f"010-{1000 + len(user_data['email'])}-{5678}",  # 더미 전화번호
                user_data['profile']['gender'],
                f"{user_data['email'].split('@')[0]}@university.ac.kr"  # 더미 학교 이메일
            ))
            user_id = cursor.lastrowid
            
            # 프로필 생성
            profile = user_data['profile']
            cursor.execute("""
                INSERT INTO user_profiles (
                    user_id, age, sleep_type, home_time,
                    cleaning_frequency, cleaning_sensitivity, smoking_status, noise_sensitivity,
                    personality_type, lifestyle_type, budget_range, is_complete
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id, profile['age'],
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


def get_user_info(user_id: int):
    """사용자 정보 조회"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT bio, current_location, desired_location, budget, 
               move_in_date, lifestyle, roommate_preference, introduction
        FROM user_info WHERE user_id = ?
    """, (user_id,))
    info = cursor.fetchone()
    conn.close()
    
    if info:
        return {
            "bio": info[0] or "",
            "current_location": info[1] or "",
            "desired_location": info[2] or "",
            "budget": info[3] or "",
            "move_in_date": info[4] or "",
            "lifestyle": info[5] or "",
            "roommate_preference": info[6] or "",
            "introduction": info[7] or ""
        }
    return None


def update_user_info(user_id: int, info_data: dict) -> bool:
    """사용자 정보 업데이트"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        # 기존 정보가 있는지 확인
        cursor.execute("SELECT id FROM user_info WHERE user_id = ?", (user_id,))
        existing = cursor.fetchone()
        
        if not existing:
            # 정보가 없으면 새로 생성
            cursor.execute("INSERT INTO user_info (user_id) VALUES (?)", (user_id,))
        
        # 업데이트할 필드들 준비
        updates = []
        values = []
        
        for field, value in info_data.items():
            if field in ['bio', 'current_location', 'desired_location', 'budget', 
                        'move_in_date', 'lifestyle', 'roommate_preference', 'introduction']:
                updates.append(f"{field} = ?")
                values.append(value)
        
        if updates:
            values.append(user_id)
            query = f"UPDATE user_info SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
            cursor.execute(query, values)
            conn.commit()
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error updating user info: {e}")
        conn.rollback()
        conn.close()
        return False


def update_user_phone(user_id: int, phone_number: str) -> bool:
    """사용자 전화번호 업데이트"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "UPDATE users SET phone_number = ? WHERE id = ?",
            (phone_number, user_id)
        )
        conn.commit()
        conn.close()
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Error updating phone number: {e}")
        conn.close()
        return False


def extract_gender_from_resident_number(resident_number: str) -> str:
    """주민등록번호에서 성별을 추출"""
    if len(resident_number) < 7 or '-' not in resident_number:
        return None
    
    # 주민등록번호 형식: YYMMDD-GXXXXXX (G는 성별을 나타내는 숫자)
    try:
        gender_digit = int(resident_number.split('-')[1][0])
        if gender_digit in [1, 3]:
            return 'male'
        elif gender_digit in [2, 4]:
            return 'female'
        else:
            return None
    except (ValueError, IndexError):
        return None


def calculate_age_from_resident_number(resident_number: str) -> int:
    """주민등록번호에서 나이를 계산"""
    if len(resident_number) < 7 or '-' not in resident_number:
        return None
    
    # 주민등록번호 형식: YYMMDD-GXXXXXX
    try:
        from datetime import datetime
        
        year_str = resident_number[:2]
        year_num = int(year_str)
        
        # 성별 숫자로 세기 판단
        gender_digit = int(resident_number.split('-')[1][0])
        
        # 1900년대생 (성별 숫자 1, 2) vs 2000년대생 (성별 숫자 3, 4)
        if gender_digit in [1, 2]:
            # 1900년대생
            birth_year = 1900 + year_num
        elif gender_digit in [3, 4]:
            # 2000년대생  
            birth_year = 2000 + year_num
        else:
            return None
        
        current_year = datetime.now().year
        age = current_year - birth_year
        
        return age
        
    except (ValueError, IndexError):
        return None


def update_user_phone_and_gender(user_id: int, phone_number: str, resident_number: str) -> bool:
    """사용자 전화번호와 성별을 함께 업데이트"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        # 주민등록번호에서 성별 추출
        gender = extract_gender_from_resident_number(resident_number)
        
        cursor.execute(
            "UPDATE users SET phone_number = ?, gender = ? WHERE id = ?",
            (phone_number, gender, user_id)
        )
        conn.commit()
        conn.close()
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Error updating phone number and gender: {e}")
        conn.close()
        return False


def update_user_school_verification(user_id: int, school_email: str, is_verified: bool = False) -> bool:
    """학교 인증 정보를 users 테이블에 업데이트 (school_email만)"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE users 
            SET school_email = ?
            WHERE id = ?
        """, (school_email, user_id))
        
        conn.commit()
        conn.close()
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Error updating school verification: {e}")
        conn.close()
        return False


def get_user_by_id(user_id: int):
    """사용자 ID로 사용자 정보 조회"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, email, name, phone_number, gender, school_email
        FROM users WHERE id = ?
    """, (user_id,))
    user = cursor.fetchone()
    conn.close()
    if user:
        return {
            "id": user[0], 
            "email": user[1], 
            "name": user[2], 
            "phone_number": user[3], 
            "gender": user[4],
            "school_email": user[5]
        }
    return None


def create_user_with_email_password(email: str, password: str, hashed_password: str):
    """이메일과 비밀번호로만 초기 사용자 생성"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (email, name, hashed_password) VALUES (?, ?, ?)",
            (email, "임시사용자", hashed_password)
        )
        conn.commit()
        user_id = cursor.lastrowid
        
        # 빈 프로필 생성
        cursor.execute(
            "INSERT INTO user_profiles (user_id) VALUES (?)",
            (user_id,)
        )
        
        # 빈 사용자 정보 생성
        cursor.execute(
            "INSERT INTO user_info (user_id) VALUES (?)",
            (user_id,)
        )
        conn.commit()
        conn.close()
        return {"id": user_id, "email": email, "name": "임시사용자", "phone_number": None}
    except sqlite3.IntegrityError:
        conn.close()
        return None


def update_user_name(user_id: int, name: str) -> bool:
    """사용자 이름 업데이트"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "UPDATE users SET name = ? WHERE id = ?",
            (name, user_id)
        )
        conn.commit()
        conn.close()
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Error updating user name: {e}")
        conn.close()
        return False


# 채팅 관련 함수들
def create_chat_room(created_by: int, room_type: str = 'individual', name: str = None, participant_ids: List[int] = None):
    """새 채팅방 생성"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        # 채팅방 생성
        cursor.execute("""
            INSERT INTO chat_rooms (room_type, name, created_by)
            VALUES (?, ?, ?)
        """, (room_type, name, created_by))
        room_id = cursor.lastrowid
        
        # 참가자 추가 (생성자 포함)
        participants = participant_ids or []
        if created_by not in participants:
            participants.append(created_by)
        
        for user_id in participants:
            cursor.execute("""
                INSERT INTO chat_participants (room_id, user_id, last_read_at)
                VALUES (?, ?, NULL)
            """, (room_id, user_id))
        
        conn.commit()
        return room_id
    except Exception as e:
        conn.rollback()
        print(f"Error creating chat room: {e}")
        return None
    finally:
        conn.close()


def get_user_chat_rooms(user_id: int):
    """사용자의 채팅방 목록 조회"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT DISTINCT 
                cr.id, cr.room_type, cr.name, cr.created_at,
                cm.content as last_message, cm.created_at as last_message_time,
                u.name as sender_name
            FROM chat_rooms cr
            JOIN chat_participants cp ON cr.id = cp.room_id
            LEFT JOIN chat_messages cm ON cr.id = cm.room_id AND cm.id = (
                SELECT MAX(id) FROM chat_messages WHERE room_id = cr.id AND is_deleted = FALSE
            )
            LEFT JOIN users u ON cm.sender_id = u.id
            WHERE cp.user_id = ?
            ORDER BY COALESCE(cm.created_at, cr.created_at) DESC
        """, (user_id,))
        
        rooms = cursor.fetchall()
        
        # 각 채팅방의 참가자 정보도 가져오기
        result = []
        for room in rooms:
            room_id = room[0]
            
            # 참가자 정보 조회 (프로필 정보 포함)
            cursor.execute("""
                SELECT u.id, u.name, u.gender, u.school_email,
                       p.age, p.sleep_type, p.smoking_status, p.personality_type,
                       p.lifestyle_type, p.budget_range
                FROM users u
                JOIN chat_participants cp ON u.id = cp.user_id
                LEFT JOIN user_profiles p ON u.id = p.user_id
                WHERE cp.room_id = ?
            """, (room_id,))
            participants_data = cursor.fetchall()
            
            # 참가자 정보를 딕셔너리로 변환
            participants = []
            for p in participants_data:
                # 학교명 추출 (이메일에서)
                school = None
                if p[3]:  # school_email이 있는 경우
                    if 'korea' in p[3].lower():
                        school = '고려대학교'
                    elif 'sungshin' in p[3].lower():
                        school = '성신여자대학교'
                    elif 'kyunghee' in p[3].lower():
                        school = '경희대학교'
                    else:
                        school = p[3].split('@')[1].replace('.ac.kr', '').capitalize() + '대학교'
                
                participant_info = {
                    'id': p[0],
                    'name': p[1],
                    'gender': p[2],
                    'school': school,
                    'university': school,  # 호환성을 위해 둘 다 제공
                    'age': p[4],
                    'birth_year': 2024 - p[4] if p[4] else None,
                    'profile': {
                        'sleep_type': p[5],
                        'smoking_status': p[6],
                        'personality_type': p[7],
                        'lifestyle_type': p[8],
                        'budget_range': p[9]
                    }
                }
                participants.append(participant_info)
            
            # 읽지 않은 메시지 수 계산 (해당 사용자의 last_read_at만 사용)
            cursor.execute("""
                SELECT last_read_at FROM chat_participants 
                WHERE room_id = ? AND user_id = ?
            """, (room_id, user_id))
            
            last_read_result = cursor.fetchone()
            last_read_at = last_read_result[0] if last_read_result else None
            
            if last_read_at:
                cursor.execute("""
                    SELECT COUNT(*) FROM chat_messages 
                    WHERE room_id = ? AND created_at > ? 
                    AND sender_id != ? AND is_deleted = FALSE
                """, (room_id, last_read_at, user_id))
            else:
                # last_read_at이 NULL이면 모든 메시지가 읽지 않은 것으로 간주
                cursor.execute("""
                    SELECT COUNT(*) FROM chat_messages 
                    WHERE room_id = ? AND sender_id != ? AND is_deleted = FALSE
                """, (room_id, user_id))
            
            unread_count = cursor.fetchone()[0]
            
            result.append({
                'id': room[0],
                'room_type': room[1],
                'name': room[2],
                'created_at': room[3],
                'last_message': room[4],
                'last_message_time': room[5],
                'last_sender_name': room[6],
                'participants': participants,
                'unread_count': unread_count
            })
        
        return result
    finally:
        conn.close()


def send_message(room_id: int, sender_id: int, content: str, message_type: str = 'text', file_url: str = None, reply_to_id: int = None):
    """메시지 전송"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        # 메시지 생성 (기본 상태: sent=true, delivered=false, read=false)
        # 한국 시간으로 저장
        cursor.execute("""
            INSERT INTO chat_messages (room_id, sender_id, message_type, content, file_url, reply_to_id, sent, delivered, read_status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, 0, 0, datetime('now', '+9 hours'))
        """, (room_id, sender_id, message_type, content, file_url, reply_to_id))
        
        message_id = cursor.lastrowid
        
        # 채팅방 업데이트 시간 갱신
        cursor.execute("""
            UPDATE chat_rooms SET updated_at = datetime('now', '+9 hours') WHERE id = ?
        """, (room_id,))
        
        # 메시지 전송 직후 delivered 상태로 업데이트 (실시간 시뮬레이션)
        cursor.execute("""
            UPDATE chat_messages SET delivered = 1 WHERE id = ?
        """, (message_id,))
        
        conn.commit()
        return message_id
    except Exception as e:
        conn.rollback()
        print(f"Error sending message: {e}")
        return None
    finally:
        conn.close()


def get_chat_messages(room_id: int, user_id: int, limit: int = 50, offset: int = 0, mark_as_read: bool = True):
    """채팅 메시지 목록 조회"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        # 해당 사용자가 채팅방 참가자인지 확인
        cursor.execute("""
            SELECT 1 FROM chat_participants 
            WHERE room_id = ? AND user_id = ?
        """, (room_id, user_id))
        
        if not cursor.fetchone():
            return []
        
        # 메시지 조회 (새로운 상태 필드들 포함)
        cursor.execute("""
            SELECT 
                cm.id, cm.room_id, cm.sender_id, cm.message_type, cm.content,
                cm.file_url, cm.reply_to_id, cm.created_at, cm.updated_at, cm.is_deleted,
                u.name as sender_name, cm.sent, cm.delivered, cm.read_status
            FROM chat_messages cm
            JOIN users u ON cm.sender_id = u.id
            WHERE cm.room_id = ? AND cm.is_deleted = FALSE
            ORDER BY cm.created_at DESC
            LIMIT ? OFFSET ?
        """, (room_id, limit, offset))
        
        messages = cursor.fetchall()
        
        # 읽음 상태로 마크 (기본값 True)
        if mark_as_read:
            cursor.execute("""
                UPDATE chat_participants 
                SET last_read_at = datetime('now', '+9 hours')
                WHERE room_id = ? AND user_id = ?
            """, (room_id, user_id))
            
            # 내가 받은 메시지들을 read 상태로 업데이트
            cursor.execute("""
                UPDATE chat_messages 
                SET read_status = 1
                WHERE room_id = ? AND sender_id != ? AND read_status = 0
            """, (room_id, user_id))
            
            conn.commit()
        
        # 각 메시지에 대해 읽지 않은 사용자 수 계산
        result_messages = []
        for msg in reversed(messages):  # 시간 순 정렬
            # 해당 메시지를 읽지 않은 참가자 수 계산 (발신자 제외)
            cursor.execute("""
                SELECT COUNT(*) FROM chat_participants cp
                WHERE cp.room_id = ? 
                AND cp.user_id != ? 
                AND (cp.last_read_at IS NULL OR cp.last_read_at < ?)
            """, (room_id, msg[2], msg[7]))  # msg[2]는 sender_id, msg[7]은 created_at
            
            unread_count = cursor.fetchone()[0]
            
            message_data = {
                'id': msg[0],
                'room_id': msg[1],
                'sender_id': msg[2],
                'message_type': msg[3],
                'content': msg[4],
                'file_url': msg[5],
                'reply_to_id': msg[6],
                'created_at': msg[7],
                'updated_at': msg[8],
                'is_deleted': msg[9],
                'sender_name': msg[10],
                'sent': bool(msg[11]),
                'delivered': bool(msg[12]),
                'read': bool(msg[13]),
                'unread_count': unread_count,  # 읽지 않은 사용자 수
                'status': 'read' if msg[13] else ('delivered' if msg[12] else ('sent' if msg[11] else 'pending'))
            }
            result_messages.append(message_data)
        
        return result_messages
        
    finally:
        conn.close()


def get_chat_messages_without_marking_read(room_id: int, user_id: int, limit: int = 50, offset: int = 0):
    """읽음 상태를 업데이트하지 않고 채팅 메시지 목록 조회 (실시간 업데이트용)"""
    return get_chat_messages(room_id, user_id, limit, offset, mark_as_read=False)


def update_message_status(message_id: int, status_type: str):
    """메시지 상태 업데이트 (sent, delivered, read)"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        if status_type == 'sent':
            cursor.execute("UPDATE chat_messages SET sent = 1 WHERE id = ?", (message_id,))
        elif status_type == 'delivered':
            cursor.execute("UPDATE chat_messages SET delivered = 1 WHERE id = ?", (message_id,))
        elif status_type == 'read':
            cursor.execute("UPDATE chat_messages SET read_status = 1 WHERE id = ?", (message_id,))
        
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        print(f"Error updating message status: {e}")
        return False
    finally:
        conn.close()


def update_last_read_time(room_id: int, user_id: int):
    """사용자의 마지막 읽은 시간 업데이트"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE chat_participants 
            SET last_read_at = datetime('now', '+9 hours')
            WHERE room_id = ? AND user_id = ?
        """, (room_id, user_id))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        print(f"Error updating last read time: {e}")
        return False
    finally:
        conn.close()


def delete_chat_room(room_id: int, user_id: int):
    """채팅방 완전 삭제 - DB에서 모든 관련 데이터 삭제"""
    print(f"🗑️ [DB DELETE] 시작: room_id={room_id}, user_id={user_id}")
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        # 해당 사용자가 채팅방 참가자인지 확인
        print(f"🔍 [DB DELETE] 참가자 확인 중...")
        cursor.execute("""
            SELECT 1 FROM chat_participants 
            WHERE room_id = ? AND user_id = ?
        """, (room_id, user_id))
        
        participant_check = cursor.fetchone()
        print(f"🔍 [DB DELETE] 참가자 확인 결과: {participant_check}")
        
        if not participant_check:
            print(f"❌ [DB DELETE] 사용자가 해당 채팅방의 참가자가 아님")
            return False
        
        # 1. 채팅 메시지 삭제
        print(f"🔄 [DB DELETE] 채팅 메시지 삭제 중...")
        cursor.execute("DELETE FROM chat_messages WHERE room_id = ?", (room_id,))
        messages_deleted = cursor.rowcount
        print(f"🔄 [DB DELETE] 채팅 메시지 삭제 완료: {messages_deleted}개")
        
        # 2. 채팅 참가자 삭제
        print(f"🔄 [DB DELETE] 채팅 참가자 삭제 중...")
        cursor.execute("DELETE FROM chat_participants WHERE room_id = ?", (room_id,))
        participants_deleted = cursor.rowcount
        print(f"🔄 [DB DELETE] 채팅 참가자 삭제 완료: {participants_deleted}개")
        
        # 3. 채팅방 삭제
        print(f"🔄 [DB DELETE] 채팅방 삭제 중...")
        cursor.execute("DELETE FROM chat_rooms WHERE id = ?", (room_id,))
        rooms_deleted = cursor.rowcount
        print(f"🔄 [DB DELETE] 채팅방 삭제 완료: {rooms_deleted}개")
        
        conn.commit()
        print(f"✅ [DB DELETE] 완전 삭제 처리 완료 (메시지: {messages_deleted}, 참가자: {participants_deleted}, 방: {rooms_deleted})")
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"❌ [DB DELETE] 오류 발생: {e}")
        print(f"❌ [DB DELETE] 트랜잭션 롤백됨")
        return False
    finally:
        conn.close()