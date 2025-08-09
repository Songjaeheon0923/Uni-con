from fastapi import APIRouter, HTTPException, status
from models.user import UserCreate, UserLogin, User
from database.connection import get_user_by_email, create_user
from utils.security import verify_password, get_password_hash
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


@router.post("/login", response_model=User)
async def login(user_data: UserLogin):
    user = get_user_by_email(user_data.email)
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # 간단한 세션에 사용자 정보 저장 (MVP용)
    session.current_user_session = {
        "id": user["id"],
        "email": user["email"], 
        "name": user["name"]
    }
    
    return User(id=user["id"], email=user["email"], name=user["name"])


@router.post("/logout")
async def logout():
    session.current_user_session = None
    return {"message": "Successfully logged out"}