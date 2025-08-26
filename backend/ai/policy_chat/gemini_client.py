"""
LangChain 기반 Gemini LLM 클라이언트
API 키 순차 로테이션 지원
"""

import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from typing import Optional

from .utils.api_key_manager import api_key_manager

logger = logging.getLogger(__name__)

class GeminiClient:
    """Gemini LLM 클라이언트 (LangChain 기반)"""
    
    def __init__(self, model_name: str = "gemini-1.5-flash"):
        self.model_name = model_name
        self._client = None
        self._current_api_key = None
        
    def _get_client(self) -> ChatGoogleGenerativeAI:
        """LangChain Gemini 클라이언트 lazy 초기화"""
        try:
            # 새 API 키 가져오기
            current_key = api_key_manager.get_gemini_key()
            
            # 키가 변경되었거나 클라이언트가 없으면 새로 생성
            if self._client is None or current_key != self._current_api_key:
                self._client = ChatGoogleGenerativeAI(
                    model=self.model_name,
                    google_api_key=current_key,
                    temperature=0.7,
                    max_tokens=1000
                )
                self._current_api_key = current_key
                logger.info(f"Created new Gemini client with model {self.model_name}")
                
            return self._client
            
        except Exception as e:
            logger.error(f"Failed to create Gemini client: {e}")
            # API 키 로테이션 후 재시도
            api_key_manager.force_rotate_gemini()
            raise
    
    def get_llm(self) -> ChatGoogleGenerativeAI:
        """LangChain 체인에서 사용할 LLM 반환"""
        return self._get_client()
    
    def invoke(self, messages):
        """직접 호출용 메서드"""
        try:
            client = self._get_client()
            return client.invoke(messages)
        except Exception as e:
            logger.error(f"Gemini invocation failed: {e}")
            # 키 로테이션 후 재시도
            api_key_manager.force_rotate_gemini()
            self._client = None  # 클라이언트 재생성 강제
            raise

# 전역 인스턴스
gemini_client = GeminiClient()