from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from models.user import UserCreate, UserLogin, User
from database.connection import (
    get_user_by_email, create_user, create_user_with_email_password,
    update_user_name, update_user_phone, update_user_phone_and_gender, 
    update_user_school_verification, get_user_by_id, get_db_connection
)
from utils.security import verify_password, get_password_hash
from utils.auth import create_access_token
import session

router = APIRouter()


@router.post("/signup", response_model=User, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate):
    existing_user = get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user_data.password)
    user = create_user(user_data, hashed_password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create user"
        )
    
    return User(id=user["id"], email=user["email"], name=user["name"])


@router.post("/login")
async def login(user_data: UserLogin):
    user = get_user_by_email(user_data.email)
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # JWT 토큰 생성
    access_token = create_access_token(user["id"], user["email"])
    
    # 세션에도 저장 (하위 호환성)
    session.current_user_session = {
        "id": user["id"],
        "email": user["email"], 
        "name": user["name"]
    }
    
    return {
        "user_id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/logout")
async def logout():
    session.current_user_session = None
    return {"message": "Successfully logged out"}


# 새로운 회원가입 관련 모델들
class InitialSignupRequest(BaseModel):
    email: str
    password: str

class PhoneVerificationRequest(BaseModel):
    user_id: int
    name: str
    phone_number: str
    resident_number: str

class SchoolVerificationRequest(BaseModel):
    user_id: int
    school_email: str


# 새로운 회원가입 플로우 엔드포인트들
@router.post("/signup/initial")
async def initial_signup(signup_data: InitialSignupRequest):
    """이메일과 비밀번호로 초기 사용자 생성"""
    existing_user = get_user_by_email(signup_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(signup_data.password)
    user = create_user_with_email_password(signup_data.email, signup_data.password, hashed_password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create user"
        )
    
    return {"user_id": user["id"], "email": user["email"], "message": "Initial signup successful"}


@router.post("/signup/phone-verification")
async def phone_verification(verification_data: PhoneVerificationRequest):
    """휴대폰 인증 완료 후 이름, 전화번호, 성별 저장"""
    print(f"[DEBUG] Phone verification request: {verification_data}")
    
    user = get_user_by_id(verification_data.user_id)
    if not user:
        print(f"[DEBUG] User not found: {verification_data.user_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    print(f"[DEBUG] Found user: {user}")
    
    # 이름 업데이트
    name_updated = update_user_name(verification_data.user_id, verification_data.name)
    print(f"[DEBUG] Name update result: {name_updated}")
    
    # 전화번호와 성별 업데이트 (주민등록번호에서 성별 추출)
    phone_gender_updated = update_user_phone_and_gender(
        verification_data.user_id, 
        verification_data.phone_number, 
        verification_data.resident_number
    )
    print(f"[DEBUG] Phone/Gender update result: {phone_gender_updated}")
    
    if not name_updated or not phone_gender_updated:
        print(f"[DEBUG] Update failed - name: {name_updated}, phone_gender: {phone_gender_updated}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update user information"
        )
    
    # 업데이트된 사용자 정보 반환
    updated_user = get_user_by_id(verification_data.user_id)
    print(f"[DEBUG] Updated user: {updated_user}")
    
    return {
        "user_id": updated_user["id"],
        "name": updated_user["name"],
        "phone_number": updated_user["phone_number"],
        "gender": updated_user["gender"],
        "message": "Phone verification completed"
    }


@router.post("/signup/school-verification")
async def school_verification(verification_data: SchoolVerificationRequest):
    """학교 인증 이메일 저장"""
    user = get_user_by_id(verification_data.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # 학교 인증 정보 저장
    saved = update_user_school_verification(verification_data.user_id, verification_data.school_email, True)
    
    if not saved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to save school verification"
        )
    
    return {
        "user_id": verification_data.user_id,
        "school_email": verification_data.school_email,
        "message": "School verification completed"
    }


class CompleteSignupRequest(BaseModel):
    email: str
    password: str
    name: str
    nationality: str
    resident_number: str
    phone_number: str
    carrier: str
    school_email: str = None
    school_verified: bool = False
    school_skipped: bool = False

@router.post("/signup/complete")
async def complete_signup(request: CompleteSignupRequest):
    """회원가입 최종 완료 - 모든 정보를 한 번에 처리"""
    print(f"[DEBUG] Complete signup request: {request}")
    
    # 이메일 중복 확인
    existing_user = get_user_by_email(request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # 비밀번호 해싱
    hashed_password = get_password_hash(request.password)
    
    # 주민등록번호에서 성별 추출
    from database.connection import extract_gender_from_resident_number
    gender = extract_gender_from_resident_number(request.resident_number)
    
    try:
        # 사용자 생성 (모든 정보 포함)
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 학교 인증 정보를 포함한 사용자 생성
        school_email = request.school_email if request.school_email and not request.school_skipped else None
        school_verified = request.school_verified if school_email else False
        school_verified_at = 'CURRENT_TIMESTAMP' if school_verified else None
        
        cursor.execute("""
            INSERT INTO users (email, name, hashed_password, phone_number, gender, 
                             school_email, school_verified, school_verified_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (request.email, request.name, hashed_password, request.phone_number, gender,
              school_email, school_verified, school_verified_at))
        
        user_id = cursor.lastrowid
        
        # 빈 프로필 생성
        cursor.execute("INSERT INTO user_profiles (user_id) VALUES (?)", (user_id,))
        
        # 빈 사용자 정보 생성
        cursor.execute("INSERT INTO user_info (user_id) VALUES (?)", (user_id,))
        
        conn.commit()
        conn.close()
        
        # JWT 토큰 생성
        access_token = create_access_token(user_id, request.email)
        
        print(f"[DEBUG] User created successfully: ID {user_id}")
        
        return {
            "user_id": user_id,
            "email": request.email,
            "name": request.name,
            "gender": gender,
            "access_token": access_token,
            "token_type": "bearer",
            "message": "Signup completed successfully"
        }
        
    except Exception as e:
        print(f"[DEBUG] Error creating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create user: {str(e)}"
        )