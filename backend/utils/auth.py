import jwt
import datetime
from typing import Optional
from fastapi import HTTPException, status, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24

security = HTTPBearer(auto_error=False)

def create_access_token(user_id: int, email: str) -> str:
    """액세스 토큰 생성"""
    expire = datetime.datetime.utcnow() + datetime.timedelta(hours=TOKEN_EXPIRE_HOURS)
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": expire
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

def verify_token(token: str) -> Optional[dict]:
    """토큰 검증"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """현재 사용자 가져오기"""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not logged in",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 안전한 딕셔너리 접근으로 KeyError 방지
    user_id = payload.get("user_id") or payload.get("id")
    email = payload.get("email", "")
    
    return {
        "id": user_id,
        "email": email
    }

async def get_optional_user(credentials: HTTPAuthorizationCredentials = None):
    """선택적 사용자 인증 (로그인이 필수가 아닌 경우)"""
    if credentials is None:
        return None
    
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        return None
    
    # 안전한 딕셔너리 접근으로 KeyError 방지
    user_id = payload.get("user_id") or payload.get("id")
    email = payload.get("email", "")
    
    return {
        "id": user_id,
        "email": email
    }