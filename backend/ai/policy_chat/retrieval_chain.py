"""
LangChain 기반 정책 검색 체인 - 스트리밍 지원
"""

import logging
from typing import List, Dict, Any, AsyncGenerator
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.schema import BaseOutputParser
from langchain_core.messages import HumanMessage

from .gemini_client import gemini_client
from .vector_store import policy_vector_store

logger = logging.getLogger(__name__)

class PolicyAnswerParser(BaseOutputParser):
    """정책 답변 파서"""
    
    def parse(self, text: str) -> Dict[str, Any]:
        return {
            "answer": text.strip(),
            "source": "policy_search"
        }

class PolicyRetrievalChain:
    """정책 검색 및 답변 생성 체인"""
    
    def __init__(self):
        self.vector_store = policy_vector_store
        self.llm = gemini_client.get_llm()
        
        # 답변 생성 프롬프트
        self.answer_prompt = PromptTemplate(
            input_variables=["user_question", "policies"],
            template="""당신은 청년 정책 전문가입니다. 사용자의 질문에 대해 관련 정책 정보를 바탕으로 친절하고 정확한 답변을 제공해주세요.

사용자 질문: {user_question}

관련 정책 정보:
{policies}

답변 작성 가이드:
1. 질문에 가장 적합한 정책들을 우선으로 설명
2. 구체적인 지원 내용, 신청 방법, 대상 등을 포함
3. 여러 정책이 관련될 경우 비교하여 설명
4. 정확한 정보만 제공하고, 불확실한 부분은 명시
5. 친근하고 이해하기 쉬운 언어 사용

답변:"""
        )
        
        # 답변 생성 체인
        self.answer_chain = LLMChain(
            llm=self.llm,
            prompt=self.answer_prompt,
            output_parser=PolicyAnswerParser()
        )
    
    def _format_policies(self, policies: List[Dict[str, Any]]) -> str:
        """검색된 정책들을 프롬프트용 텍스트로 변환"""
        if not policies:
            return "관련 정책을 찾지 못했습니다."
        
        formatted = []
        for i, policy in enumerate(policies, 1):
            policy_text = f"{i}. {policy.get('title', '제목없음')}\n"
            
            if policy.get('organization'):
                policy_text += f"   - 기관: {policy['organization']}\n"
            
            if policy.get('category'):
                policy_text += f"   - 분야: {policy['category']}\n"
            
            if policy.get('target'):
                policy_text += f"   - 대상: {policy['target']}\n"
            
            if policy.get('region'):
                policy_text += f"   - 지역: {policy['region']}\n"
            
            if policy.get('content'):
                content = policy['content'][:200] + "..." if len(policy['content']) > 200 else policy['content']
                policy_text += f"   - 내용: {content}\n"
            
            # 상세 정보 추가
            details = policy.get('details', {})
            if details:
                if details.get('explanation'):
                    explanation = details['explanation'][:150] + "..." if len(details['explanation']) > 150 else details['explanation']
                    policy_text += f"   - 설명: {explanation}\n"
                
                if details.get('application_method'):
                    policy_text += f"   - 신청방법: {details['application_method']}\n"
                
                if details.get('income_condition'):
                    policy_text += f"   - 소득조건: {details['income_condition']}\n"
            
            formatted.append(policy_text)
        
        return "\n".join(formatted)
    
    def search_and_answer(self, user_question: str, top_k: int = 5) -> Dict[str, Any]:
        """사용자 질문에 대해 정책 검색 후 답변 생성"""
        try:
            logger.info(f"Processing user question: {user_question[:50]}...")
            
            # 벡터 검색
            relevant_policies = self.vector_store.search(user_question, k=top_k)
            
            if not relevant_policies:
                return {
                    "answer": "죄송합니다. 질문과 관련된 정책을 찾지 못했습니다. 다른 키워드로 다시 질문해보시거나, 더 구체적인 상황을 알려주시면 도움이 될 것 같습니다.",
                    "policies": [],
                    "source": "policy_search"
                }
            
            # 정책 정보 포매팅
            formatted_policies = self._format_policies(relevant_policies)
            
            # LLM 답변 생성
            result = self.answer_chain.run(
                user_question=user_question,
                policies=formatted_policies
            )
            
            # 결과에 검색된 정책 메타데이터 추가
            result["policies"] = relevant_policies
            
            logger.info("Successfully generated answer with policy context")
            return result
            
        except Exception as e:
            logger.error(f"Failed to process question: {e}")
            return {
                "answer": "죄송합니다. 답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
                "policies": [],
                "source": "error"
            }
    
    async def search_and_answer_stream(self, user_question: str, top_k: int = 5) -> AsyncGenerator[str, None]:
        """스트리밍 답변 생성"""
        try:
            logger.info(f"Processing streaming question: {user_question[:50]}...")
            
            # 벡터 검색 (동기)
            relevant_policies = self.vector_store.search(user_question, k=top_k)
            
            if not relevant_policies:
                yield "죄송합니다. 질문과 관련된 정책을 찾지 못했습니다. 다른 키워드로 다시 질문해보시거나, 더 구체적인 상황을 알려주시면 도움이 될 것 같습니다."
                return
            
            # 정책 정보 포매팅
            formatted_policies = self._format_policies(relevant_policies)
            
            # 프롬프트 생성
            prompt_text = self.answer_prompt.format(
                user_question=user_question,
                policies=formatted_policies
            )
            
            # Gemini 스트리밍
            llm = gemini_client.get_llm()
            message = HumanMessage(content=prompt_text)
            
            # 스트리밍 답변 생성
            async for chunk in llm.astream([message]):
                if hasattr(chunk, 'content') and chunk.content:
                    yield chunk.content
            
            logger.info("Successfully completed streaming response")
            
        except Exception as e:
            logger.error(f"Streaming failed: {e}")
            yield f"죄송합니다. 답변 생성 중 오류가 발생했습니다: {str(e)}"
    
    def get_policy_suggestions(self, user_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """사용자 컨텍스트 기반 정책 추천"""
        try:
            # 사용자 정보를 쿼리로 변환
            query_parts = []
            
            if user_context.get('age_range'):
                query_parts.append(f"{user_context['age_range']} 청년")
            
            if user_context.get('interests'):
                query_parts.extend(user_context['interests'])
            
            if user_context.get('region'):
                query_parts.append(user_context['region'])
            
            if user_context.get('situation'):
                query_parts.append(user_context['situation'])
            
            search_query = " ".join(query_parts) if query_parts else "청년 정책"
            
            # 검색
            suggestions = self.vector_store.search(search_query, k=10)
            
            logger.info(f"Generated {len(suggestions)} policy suggestions")
            return suggestions
            
        except Exception as e:
            logger.error(f"Failed to generate suggestions: {e}")
            return []

# 전역 인스턴스
policy_retrieval_chain = PolicyRetrievalChain()