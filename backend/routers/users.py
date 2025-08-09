from fastapi import APIRouter, Depends
from models.user import User
from auth.jwt_handler import get_current_user

router = APIRouter()


@router.get("/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user