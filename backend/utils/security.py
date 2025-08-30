from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        print(f"Password verification error: {e}")
        print(f"Hash format: {hashed_password[:50]}...")  # 처음 50자만 로그
        # 평문 비밀번호인 경우 직접 비교 (임시 해결책)
        return plain_password == hashed_password


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)