"""
정책 챗봇 API 라우터 - 스트리밍 지원
"""

import logging
import json
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from utils.auth import get_current_user
from ai.policy_chat.policy_chatbot import policy_chatbot

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/policy-chat", tags=["policy-chat"])

class ChatRequest(BaseModel):
    message: str
    user_context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    answer: str
    policies: List[Dict[str, Any]]
    personalized: Optional[List[Dict[str, Any]]] = None
    source: str

class RecommendationRequest(BaseModel):
    user_context: Dict[str, Any]

class PolicyCountResponse(BaseModel):
    count: int
    status: str

@router.post("/chat", response_model=ChatResponse)
async def chat_with_policies(
    request: ChatRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """정책 챗봇과 대화 (멀티 Agent 시스템)"""
    try:
        logger.info(f"Policy chat request from user {current_user.get('username')}")

        # 챗봇 응답 생성 (멀티 Agent 시스템 사용)
        response = await policy_chatbot.chat(
            user_message=request.message,
            user_id=current_user.get('id'),
            user_context=request.user_context,
            use_multi_agent=True
        )

        return ChatResponse(**response)

    except Exception as e:
        logger.error(f"Policy chat failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="채팅 처리 중 오류가 발생했습니다."
        )

@router.post("/chat/simple", response_model=ChatResponse)
async def chat_with_policies_simple(
    request: ChatRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """정책 챗봇과 대화 (단순 RAG 시스템)"""
    try:
        logger.info(f"Policy simple chat request from user {current_user.get('username')}")

        # 기존 단순 RAG 시스템 사용
        response = await policy_chatbot.chat(
            user_message=request.message,
            user_id=current_user.get('id'),
            user_context=request.user_context,
            use_multi_agent=False
        )

        return ChatResponse(**response)

    except Exception as e:
        logger.error(f"Policy simple chat failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="단순 채팅 처리 중 오류가 발생했습니다."
        )



@router.post("/recommendations", response_model=ChatResponse)
async def get_policy_recommendations(
    request: RecommendationRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """사용자 맞춤 정책 추천"""
    try:
        logger.info(f"Policy recommendation request from user {current_user.get('username')}")

        # 개인화된 추천 생성
        response = policy_chatbot.get_recommendations(request.user_context)

        return ChatResponse(**response)

    except Exception as e:
        logger.error(f"Policy recommendation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="정책 추천 생성 중 오류가 발생했습니다."
        )

@router.get("/status", response_model=PolicyCountResponse)
async def get_chatbot_status():
    """챗봇 상태 확인"""
    try:
        policy_count = policy_chatbot.get_policy_count()

        return PolicyCountResponse(
            count=policy_count,
            status="active" if policy_count > 0 else "not_ready"
        )

    except Exception as e:
        logger.error(f"Status check failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="상태 확인 중 오류가 발생했습니다."
        )

@router.post("/refresh")
async def refresh_chatbot_policies(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """정책 데이터 새로고침 - 모든 사용자 가능"""
    try:
        logger.info(f"Policy refresh requested by {current_user.get('username', 'unknown')}")

        # 정책 데이터 새로고침
        policy_chatbot.refresh_policies()

        new_count = policy_chatbot.get_policy_count()

        return {
            "success": True,
            "message": "정책 데이터가 새로고침되었습니다.",
            "policy_count": new_count,
            "last_updated": "just_now"
        }

    except Exception as e:
        logger.error(f"Policy refresh failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="정책 새로고침 중 오류가 발생했습니다."
        )

@router.get("/profile/summary")
async def get_user_profile_summary(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """사용자 프로필 및 상담 요약"""
    try:
        summary = await policy_chatbot.get_consultation_summary(current_user.get('id'))

        return {
            "user_id": current_user.get('id'),
            "username": current_user.get('username'),
            **summary
        }

    except Exception as e:
        logger.error(f"Profile summary failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="프로필 요약 조회 중 오류가 발생했습니다."
        )

class ChatModeRequest(BaseModel):
    mode: str  # "multi_agent" or "simple"

@router.post("/mode/set")
async def set_chat_mode(
    request: ChatModeRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """채팅 모드 설정 (개발/테스트용)"""
    try:
        valid_modes = ["multi_agent", "simple"]
        if request.mode not in valid_modes:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid mode. Choose from: {valid_modes}"
            )

        # 여기서는 단순히 확인만 하고, 실제로는 세션에 저장할 수 있음
        return {
            "message": f"Chat mode set to {request.mode}",
            "user_id": current_user.get('id'),
            "mode": request.mode,
            "available_endpoints": {
                "multi_agent": "/api/policy-chat/chat",
                "simple": "/api/policy-chat/chat/simple",
                "streaming": "/api/policy-chat/chat/stream"
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Mode setting failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="모드 설정 중 오류가 발생했습니다."
        )
