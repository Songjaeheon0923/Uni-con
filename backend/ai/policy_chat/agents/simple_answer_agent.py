"""
Simple Answer Agent - 간단한 정책 답변 생성
"""

import logging
import sqlite3
from typing import Dict, Any, List, Optional
import google.generativeai as genai
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class SimpleAnswerAgent:
    """간단한 정책 답변 생성 에이전트"""

    def __init__(self):
        self.gemini_keys = [
            os.getenv("GEMINI_API_KEY_1"),
            os.getenv("GEMINI_API_KEY_2"),
            os.getenv("GEMINI_API_KEY_3"),
            os.getenv("GEMINI_API_KEY_4"),
            os.getenv("GEMINI_API_KEY_5"),
        ]
        self.current_key_index = 0
        self._configure_gemini()
        self.db_path = Path("users.db")

    def _configure_gemini(self):
        """Gemini API 설정"""
        try:
            genai.configure(api_key=self.gemini_keys[self.current_key_index])
            self.model = genai.GenerativeModel("gemini-2.5-flash")
            logger.info(f"Gemini configured with key {self.current_key_index + 1}")
        except Exception as e:
            logger.error(f"Failed to configure Gemini: {e}")
            raise

    def _rotate_api_key(self):
        """API 키 순환"""
        self.current_key_index = (self.current_key_index + 1) % len(self.gemini_keys)
        self._configure_gemini()
        logger.info(f"Rotated to API key {self.current_key_index + 1}")

    def _get_user_context(self, user_id: int) -> Dict[str, Any]:
        """사용자 정보 조회"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()

                # 사용자 기본 정보
                cursor.execute(
                    """
                    SELECT u.name, u.gender, u.email, up.age, up.lifestyle_type, up.budget_range
                    FROM users u
                    LEFT JOIN user_profiles up ON u.id = up.user_id
                    WHERE u.id = ?
                """,
                    (user_id,),
                )
                user_data = cursor.fetchone()

                if not user_data:
                    return {}

                # 찜한 매물 정보 (최대 3개)
                cursor.execute(
                    """
                    SELECT r.transaction_type, r.price_deposit, r.price_monthly, r.address, r.area
                    FROM favorites f
                    JOIN rooms r ON f.room_id = r.room_id
                    WHERE f.user_id = ?
                    ORDER BY f.created_at DESC
                    LIMIT 3
                """,
                    (user_id,),
                )
                favorites = cursor.fetchall()

                return {
                    "name": user_data["name"] or "사용자",
                    "gender": user_data["gender"] or "미정",
                    "age": user_data["age"],
                    "lifestyle": user_data["lifestyle_type"] or "미정",
                    "budget": user_data["budget_range"] or "미정",
                    "favorites": [dict(fav) for fav in favorites],
                }

        except Exception as e:
            logger.error(f"Failed to get user context: {e}")
            return {}

    def generate_simple_answer(self, question: str, user_id: int) -> str:
        """간단한 정책 답변 생성"""
        try:
            # 사용자 정보 조회
            user_context = self._get_user_context(user_id)

            # 프롬프트 구성
            prompt = f"""당신은 청년 정책 전문 상담사입니다. 사용자와 자연스럽게 대화하며 필요시 정책 정보를 제공합니다.

사용자 정보:
- 이름: {user_context.get('name', '사용자')}
- 성별: {user_context.get('gender', '미정')}
- 나이: {user_context.get('age', '미정')}세
- 생활유형: {user_context.get('lifestyle', '미정')}
- 예산: {user_context.get('budget', '미정')}

질문: {question}

답변 지침:
   - 친근한 인사와 함께 정책 상담 도움을 제안
   - 예: "안녕하세요 {user_context.get('name', '')}님! 어떤 정책 정보를 찾고 계신가요?"
   - 질문에 맞는 답변을 제공
답변:"""

            # Gemini API 호출
            response = self.model.generate_content(prompt)
            return response.text.strip()

        except Exception as e:
            logger.error(f"Failed to generate simple answer: {e}")
            # API 키 순환 시도
            if "quota" in str(e).lower() or "rate" in str(e).lower():
                try:
                    self._rotate_api_key()
                    response = self.model.generate_content(prompt)
                    return response.text.strip()
                except Exception as retry_error:
                    logger.error(f"Retry with rotated key failed: {retry_error}")

            return "죄송합니다. 현재 답변 생성에 어려움이 있습니다. 잠시 후 다시 시도해주세요."


# 전역 인스턴스
simple_answer_agent = SimpleAnswerAgent()
