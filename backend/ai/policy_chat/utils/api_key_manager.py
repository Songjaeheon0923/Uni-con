"""
API 키 관리 유틸리티
환경변수에서만 키를 가져오고 순차적으로 로테이션
"""

import os
import time
import random
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class APIKeyManager:
    """API 키 안전 관리 클래스"""
    
    def __init__(self):
        self._current_gemini_index = 0
        self._last_rotation_time = time.time()
        self._rotation_interval = 3600  # 1시간마다 로테이션
        
    def get_openai_embedding_key(self) -> Optional[str]:
        """OpenAI Embedding API 키 반환"""
        key = os.getenv('OPENAI_EMBEDDING_API_KEY')
        if not key:
            logger.error("OPENAI_EMBEDDING_API_KEY not found in environment variables")
            raise ValueError("OpenAI embedding API key not configured")
        return key
    
    def get_gemini_key(self) -> Optional[str]:
        """Gemini API 키 순차적으로 반환"""
        # 시간 기반 자동 로테이션
        current_time = time.time()
        if current_time - self._last_rotation_time > self._rotation_interval:
            self._rotate_gemini_key()
            self._last_rotation_time = current_time
        
        # 현재 키 반환
        key_name = f'GEMINI_API_KEY_{self._current_gemini_index + 1}'
        key = os.getenv(key_name)
        
        if not key:
            logger.error(f"{key_name} not found in environment variables")
            raise ValueError(f"Gemini API key {key_name} not configured")
            
        logger.debug(f"Using Gemini API key {self._current_gemini_index + 1}")
        return key
    
    def _rotate_gemini_key(self):
        """Gemini API 키 로테이션"""
        # 1-5번 키 순차적으로 사용
        self._current_gemini_index = (self._current_gemini_index + 1) % 5
        logger.info(f"Rotated to Gemini API key {self._current_gemini_index + 1}")
    
    def force_rotate_gemini(self):
        """수동으로 Gemini 키 로테이션 (에러 발생시 사용)"""
        self._rotate_gemini_key()
        self._last_rotation_time = time.time()
    
    def get_available_gemini_keys_count(self) -> int:
        """사용 가능한 Gemini API 키 개수 확인"""
        count = 0
        for i in range(1, 6):
            if os.getenv(f'GEMINI_API_KEY_{i}'):
                count += 1
        return count

# 전역 인스턴스 (싱글톤 패턴)
api_key_manager = APIKeyManager()