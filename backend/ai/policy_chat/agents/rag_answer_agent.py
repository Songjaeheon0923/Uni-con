"""
RAG Answer Agent - RAG 기반 정책 답변 생성
"""

import logging
import sqlite3
from typing import Dict, Any, List, Optional
import google.generativeai as genai
from pathlib import Path
import os
from dotenv import load_dotenv

from ..vector_store import policy_vector_store

load_dotenv()
logger = logging.getLogger(__name__)


class RAGAnswerAgent:
    """RAG 기반 정책 답변 생성 에이전트"""

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
        self.vector_store = policy_vector_store

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
                    SELECT u.name, u.gender, u.email, up.age, up.lifestyle_type, up.budget_range,
                           up.sleep_type, up.home_time, up.cleaning_frequency, up.smoking_status
                    FROM users u
                    LEFT JOIN user_profiles up ON u.id = up.user_id
                    WHERE u.id = ?
                """,
                    (user_id,),
                )
                user_data = cursor.fetchone()

                if not user_data:
                    return {}

                # 찜한 매물 정보 (최대 5개)
                cursor.execute(
                    """
                    SELECT r.transaction_type, r.price_deposit, r.price_monthly,
                           r.address, r.area, r.rooms
                    FROM favorites f
                    JOIN rooms r ON f.room_id = r.room_id
                    WHERE f.user_id = ?
                    ORDER BY f.created_at DESC
                    LIMIT 5
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
                    "sleep_type": user_data["sleep_type"] or "미정",
                    "home_time": user_data["home_time"] or "미정",
                    "cleaning": user_data["cleaning_frequency"] or "미정",
                    "smoking": user_data["smoking_status"] or "미정",
                    "favorites": [dict(fav) for fav in favorites],
                }

        except Exception as e:
            logger.error(f"Failed to get user context: {e}")
            return {}

    def _search_relevant_policies(
        self, question: str, k: int = 5
    ) -> List[Dict[str, Any]]:
        """질문과 관련된 정책 검색"""
        try:
            results = self.vector_store.search(question, k=k)
            return results
        except Exception as e:
            logger.error(f"Failed to search policies: {e}")
            return []

    def _format_policies_for_context(self, policies: List[Dict[str, Any]]) -> str:
        """정책 정보를 컨텍스트용으로 포맷팅"""
        if not policies:
            return "관련 정책 정보를 찾을 수 없습니다."

        context = "관련 정책 정보:\n\n"
        for i, policy in enumerate(policies, 1):
            context += f"{i}. {policy.get('title', '제목 없음')}\n"
            context += f"   주관기관: {policy.get('organization', '미상')}\n"
            context += f"   대상: {policy.get('target', '미상')}\n"
            context += f"   지역: {policy.get('region', '전국')}\n"
            context += f"   내용: {policy.get('content', '내용 없음')[:200]}...\n"

            # details가 딕셔너리인 경우 처리
            details = policy.get("details", {})
            if isinstance(details, dict) and details:
                details_str = ""
                for key, value in details.items():
                    if value:
                        details_str += f"{key}: {value}, "
                if details_str:
                    context += f"   세부내용: {details_str.rstrip(', ')}\n"
            elif isinstance(details, str) and details:
                context += f"   세부내용: {details[:100]}...\n"

            context += f"   유사도: {policy.get('similarity_score', 0):.3f}\n\n"

        return context

    def generate_rag_answer(self, question: str, user_id: int) -> Dict[str, Any]:
        """RAG 기반 정책 답변 생성"""
        try:
            # 사용자 정보 조회
            user_context = self._get_user_context(user_id)

            # 관련 정책 검색
            relevant_policies = self._search_relevant_policies(question, k=5)
            policy_context = self._format_policies_for_context(relevant_policies)

            # 프롬프트 구성
            prompt = f"""당신은 청년 정책 전문 상담사입니다. 검색된 정책 정보를 바탕으로 사용자의 질문에 대해 정확하고 상세한 답변을 제공해주세요.

사용자 정보:
- 이름: {user_context.get('name', '사용자')}
- 성별: {user_context.get('gender', '미정')}
- 나이: {user_context.get('age', '미정')}세
- 생활유형: {user_context.get('lifestyle', '미정')}
- 예산: {user_context.get('budget', '미정')}
- 수면패턴: {user_context.get('sleep_type', '미정')}
- 흡연여부: {user_context.get('smoking', '미정')}

{policy_context}

질문: {question}

답변 조건:
1. 검색된 정책 정보를 우선적으로 활용
2. 사용자 정보를 고려한 개인화된 답변
3. 구체적인 정책명, 지원내용, 신청방법 포함
4. 정확한 정보만 제공 (불확실한 경우 명시)
5. 400-600자 내외로 상세하게
6. 정책별로 구분하여 설명할 때 정책명은 반드시 꺾쇠 괄호로 감싸기
7. 결론 섹션에는 꺾쇠를 사용한 정책 제목 적지 않기
8. 각 섹션 제목에는 볼드체(**) 사용 금지
9. 섹션 설명에는 마크다운("*") 활용해서 가독성 있게 표시. 단, 섹션 제목(정책 제목 쓸 부분)은 그 어떤 마크다운 문법도 표시하지 않고 일반 텍스트로만 표시합니다. 또한, 마크다운 이중 리스트는 사용하지 않습니다. 또한, (** ** 볼드체)를 적극적으로 사용합니다. ##, ###을 사용해서 가독성 좋게 표시합니다.
10. 결론 섹션에서는 마크다운 문법 적극적으로 활용하기(가독성있게). (** ** 볼드체)를 적극적으로 사용합니다. #, ##, ###을 사용해서 가독성 좋게 표시합니다.


중요: 「 」(꺾쇠 괄호)는 오직 정책 제목만을 표시할 때만 사용하세요.
- 올바른 예시: 「청년월세 지원사업」, 「서울시 청년수당」, 「전세보증금 반환보증 보증료 지원」
- 절대 사용 금지: 「지원 대상」, 「지원 내용」, 「신청 방법」, 「자격 요건」 등 일반 설명 항목
- 절대 사용 금지: **정책명**, *정책명* 등 다른 형식

---------예시 시작----------=
이동욱님께 도움이 될 만한 정책을 소개해드리겠습니다.

「청년월세 지원사업」
**이 정책은 청년층의 주거비 부담을 덜어주기 위한 월세 지원 사업입니다.**

### 주요 내용:
• **지원 대상**: 만 19~34세 청년 중 소득·재산 기준을 충족하는 자
• **지원 내용**: 월 최대 20만원을 최대 24개월 지원
• **신청 방법**: 온라인(복지로) 또는 주민센터 방문 신청

### 신청 시 유의사항:
현재 **신규 신청이 중단된 상태**이므로, 향후 재개 여부를 확인해야 합니다.

「서울시 청년수당」
**서울시 거주 청년의 구직활동을 지원하는 정책입니다.**

### 주요 내용:
• **지원 대상**: 만 18~34세 서울시 거주 미취업 청년
• **지원 내용**: 월 50만원, 최대 6개월 지원
• **활용 목적**: 구직활동비, 생활비 등으로 활용 가능

## 결론:
위 정책들은 **청년층의 주거 안정과 경제적 부담 완화**를 목표로 합니다. _본인의 거주지역과 소득 기준을 확인하여 해당 정책을 활용하시길 권합니다._
---------예시 끝----------

**중요**: 꺾쇠 괄호「 」는 오직 실제 정책 이름에만 사용하고, 그 외에는 절대 사용하지 마세요.

LLM 답변은 프론트엔드에서 파싱해서 정책 제목을 실제 정책 모달로 바꿀 예정입니다. 따라서, 그 인식 토큰으로 꺾쇠 괄호를 사용하는 것이니 함부로 꺾쇠 괄호를 사용하면 안됩니다. 딱 정책 제목에만 사용하세요. 요약 때에도 정책 괄호를 사용하면 프론트엔드에서 파싱을 못합니다.

답변:"""

            # Gemini API 호출
            response = self.model.generate_content(prompt)

            # 디버깅: 전체 LLM 답변 출력
            logger.info("=" * 50)
            logger.info("RAG AGENT - LLM RAW RESPONSE:")
            logger.info(f"Response type: {type(response.text)}")
            logger.info(
                f"Response length: {len(response.text) if response.text else 0}"
            )
            logger.info("Response content:")
            logger.info(response.text)
            logger.info("=" * 50)

            # 결과 반환
            return {
                "answer": response.text.strip(),
                "policies": relevant_policies,
                "source": "RAG",
                "user_personalized": True,
            }

        except Exception as e:
            logger.error(f"Failed to generate RAG answer: {e}")
            # API 키 순환 시도
            if "quota" in str(e).lower() or "rate" in str(e).lower():
                try:
                    self._rotate_api_key()
                    response = self.model.generate_content(prompt)
                    return {
                        "answer": response.text.strip(),
                        "policies": relevant_policies,
                        "source": "RAG",
                        "user_personalized": True,
                    }
                except Exception as retry_error:
                    logger.error(f"Retry with rotated key failed: {retry_error}")

            return {
                "answer": "죄송합니다. 현재 정책 정보 검색에 어려움이 있습니다. 잠시 후 다시 시도해주세요.",
                "policies": [],
                "source": "error",
                "user_personalized": False,
            }


# 전역 인스턴스
rag_answer_agent = RAGAnswerAgent()
