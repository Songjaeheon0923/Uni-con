"""
Intent Classifier - 질문 의도 분류 에이전트
"""

import logging
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class IntentClassifier:
    """질문 의도를 분류하는 에이전트"""

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

    def _configure_gemini(self):
        """Gemini API 설정"""
        try:
            genai.configure(api_key=self.gemini_keys[self.current_key_index])
            self.model = genai.GenerativeModel("gemini-2.5-flash")
            logger.info(
                f"Intent Classifier configured with key {self.current_key_index + 1}"
            )
        except Exception as e:
            logger.error(f"Failed to configure Gemini: {e}")
            raise

    def classify_intent(self, question: str) -> str:
        """질문 의도를 분류하여 적절한 처리 방식 결정"""
        try:
            prompt = f"""사용자 질문을 분석하여 다음 중 하나로 분류해주세요:

질문: {question}

분류 기준:
1. "greeting" - 인사말만 (안녕하세요, 반가워요, 넌 누구야 등)

2. "general_chat" - 정책과 완전히 무관한 일반 대화 (날씨, 잡담 등)

3. "policy_question" - 정책 관련된 모든 질문 (정책 검색, 추천, 정보 요청 등)

한 단어로만 답변 (greeting/general_chat/policy_question):"""

            response = self.model.generate_content(prompt)
            intent = response.text.strip().lower()

            # 유효한 의도인지 확인
            valid_intents = ["greeting", "general_chat", "policy_question"]
            if intent not in valid_intents:
                # 기본값으로 policy_question 반환 (안전하게 RAG로)
                logger.warning(
                    f"Unknown intent: {intent}, defaulting to policy_question"
                )
                return "policy_question"

            logger.info(f"Classified intent: {intent} for question: {question[:50]}...")
            return intent

        except Exception as e:
            logger.error(f"Failed to classify intent: {e}")
            # 오류 시 기본값 반환
            return "simple_question"


# 전역 인스턴스
intent_classifier = IntentClassifier()
