"""
정책 추천 RAG 챗봇 메인 클래스 - 간단한 답변과 RAG 답변 지원
"""

import logging
import sqlite3
from typing import List, Dict, Any, Optional, AsyncGenerator
from pathlib import Path

from .agents.simple_answer_agent import simple_answer_agent
from .agents.rag_answer_agent import rag_answer_agent
from .agents.intent_classifier import intent_classifier
from .vector_store import policy_vector_store

logger = logging.getLogger(__name__)

class PolicyChatbot:
    """정책 추천 RAG 챗봇"""
    
    def __init__(self, db_path: str = "users.db"):
        self.db_path = db_path
        
        # 새로운 에이전트 시스템
        self.simple_agent = simple_answer_agent
        self.rag_agent = rag_answer_agent
        self.vector_store = policy_vector_store
        
        # 벡터 스토어 초기화
        self._initialize_vector_store()
    
    def _initialize_vector_store(self):
        """벡터 스토어 초기화 - DB에서 정책 로드"""
        try:
            current_count = self.vector_store.get_policy_count()
            logger.info(f"Current vector store has {current_count} policies")
            
            # DB 정책 수 확인
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM policies")
                db_count = cursor.fetchone()[0]
            
            logger.info(f"Database has {db_count} policies")
            
            # 벡터 스토어가 비어있거나 DB와 차이가 나면 다시 로드
            if current_count == 0 or current_count != db_count:
                self._rebuild_vector_store()
                
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {e}")
    
    def _rebuild_vector_store(self):
        """벡터 스토어 재구축"""
        try:
            logger.info("Rebuilding vector store from database...")
            
            # DB에서 모든 정책 로드
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT id, title, organization, category, target, content, region, details
                    FROM policies WHERE is_active = 1
                """)
                
                policies = []
                for row in cursor.fetchall():
                    # Parse details JSON if it exists
                    details = {}
                    try:
                        if row['details']:
                            import json
                            details = json.loads(row['details'])
                    except:
                        details = {}
                    
                    policy = {
                        'id': row['id'],
                        'title': row['title'],
                        'organization': row['organization'],
                        'category': row['category'],
                        'target': row['target'],
                        'content': row['content'] or '',
                        'region': row['region'],
                        'details': details
                    }
                    policies.append(policy)
            
            if policies:
                # 기존 벡터 스토어 클리어 후 재구축
                self.vector_store.clear()
                self.vector_store.add_policies(policies)
                logger.info(f"Successfully rebuilt vector store with {len(policies)} policies")
            else:
                logger.warning("No policies found in database")
                
        except Exception as e:
            logger.error(f"Failed to rebuild vector store: {e}")
            raise
    
    async def chat(self, user_message: str, user_id: int, user_context: Optional[Dict[str, Any]] = None, use_multi_agent: bool = True) -> Dict[str, Any]:
        """사용자 메시지에 대한 챗봇 응답"""
        try:
            logger.info(f"Processing chat message: {user_message[:50]}...")
            
            # 의도 분류
            intent = intent_classifier.classify_intent(user_message)
            logger.info(f"Classified intent: {intent}")
            
            # 의도에 따라 처리 방식 결정 (단순화)
            if intent in ['greeting', 'general_chat']:
                # 인사말이나 일반 대화
                answer = self.simple_agent.generate_simple_answer(user_message, user_id)
                return {
                    "answer": answer,
                    "policies": [],
                    "source": "simple",
                    "intent": intent,
                    "personalized": []
                }
            else:
                # 모든 정책 관련 질문은 RAG로
                response = self.rag_agent.generate_rag_answer(user_message, user_id)
                response['intent'] = intent
                return response
            
        except Exception as e:
            logger.error(f"Chat processing failed: {e}")
            return {
                "answer": "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
                "policies": [],
                "source": "error",
                "error": str(e)
            }
    
    async def chat_stream(self, user_message: str, user_id: int, user_context: Optional[Dict[str, Any]] = None, use_multi_agent: bool = True) -> AsyncGenerator[str, None]:
        """사용자 메시지에 대한 스트리밍 응답"""
        try:
            logger.info(f"Processing streaming chat: {user_message[:50]}...")
            
            # 의도 분류
            intent = intent_classifier.classify_intent(user_message)
            logger.info(f"Classified intent for streaming: {intent}")
            
            # 의도에 따라 처리 방식 결정 (단순화)
            answer = ""
            if intent in ['greeting', 'general_chat']:
                # 인사말이나 일반 대화
                raw_answer = self.simple_agent.generate_simple_answer(user_message, user_id)
                answer = str(raw_answer) if raw_answer else ""
            else:
                # 모든 정책 관련 질문은 RAG로
                response = self.rag_agent.generate_rag_answer(user_message, user_id)
                raw_answer = response.get("answer", "") if isinstance(response, dict) else ""
                answer = str(raw_answer) if raw_answer else ""
            
            # 문자열 답변 확인 및 청크로 나누어 스트림
            if isinstance(answer, str) and answer.strip():
                chunk_size = 50
                for i in range(0, len(answer), chunk_size):
                    yield answer[i:i+chunk_size]
            else:
                yield "답변을 생성할 수 없습니다."
            
            logger.info("Successfully completed streaming chat")
            
        except Exception as e:
            logger.error(f"Streaming chat failed: {e}")
            yield "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
    
    def get_recommendations(self, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """사용자 컨텍스트 기반 정책 추천"""
        try:
            logger.info("Generating personalized policy recommendations...")
            
            # 관련 정책 검색
            policies = self.vector_store.search("청년 지원 정책 추천", k=10)
            
            # 개인화된 설명 생성
            if policies:
                personalized = self._personalize_response(policies, user_context)
                
                return {
                    "answer": f"회원님의 상황을 고려한 맞춤 정책을 추천해드립니다.",
                    "policies": policies[:5],
                    "personalized": personalized,
                    "source": "recommendations"
                }
            else:
                return {
                    "answer": "현재 회원님의 상황에 맞는 정책을 찾지 못했습니다. 더 구체적인 정보를 제공해주시면 더 정확한 추천을 드릴 수 있습니다.",
                    "policies": [],
                    "source": "recommendations"
                }
                
        except Exception as e:
            logger.error(f"Recommendation generation failed: {e}")
            return {
                "answer": "추천 생성 중 오류가 발생했습니다.",
                "policies": [],
                "source": "error"
            }
    
    def _personalize_response(self, policies: List[Dict[str, Any]], user_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """사용자 컨텍스트에 따른 정책 개인화"""
        personalized = []
        
        for policy in policies:
            # 개인화 점수 계산
            relevance_score = self._calculate_relevance(policy, user_context)
            
            personalized_policy = policy.copy()
            personalized_policy['relevance_score'] = relevance_score
            personalized_policy['personalized_reason'] = self._generate_relevance_reason(policy, user_context)
            
            personalized.append(personalized_policy)
        
        # 관련성 점수로 정렬
        personalized.sort(key=lambda x: x['relevance_score'], reverse=True)
        return personalized
    
    def _calculate_relevance(self, policy: Dict[str, Any], user_context: Dict[str, Any]) -> float:
        """정책과 사용자 컨텍스트 간 관련성 점수"""
        score = 0.0
        
        # 지역 매칭
        if user_context.get('region') and policy.get('region'):
            if user_context['region'] in policy['region'] or policy['region'] in user_context['region']:
                score += 0.3
        
        # 관심분야 매칭
        if user_context.get('interests') and policy.get('category'):
            for interest in user_context['interests']:
                if interest.lower() in policy['category'].lower():
                    score += 0.2
        
        # 상황 매칭
        if user_context.get('situation'):
            situation = user_context['situation'].lower()
            policy_text = f"{policy.get('title', '')} {policy.get('content', '')}".lower()
            
            situation_keywords = ['구직', '창업', '주거', '결혼', '육아', '학업', '취업']
            for keyword in situation_keywords:
                if keyword in situation and keyword in policy_text:
                    score += 0.2
        
        # 기본 유사도 점수 추가
        if policy.get('similarity_score'):
            score += policy['similarity_score'] * 0.3
        
        return min(score, 1.0)
    
    def _generate_relevance_reason(self, policy: Dict[str, Any], user_context: Dict[str, Any]) -> str:
        """개인화 이유 생성"""
        reasons = []
        
        if user_context.get('region') and policy.get('region'):
            if user_context['region'] in policy['region']:
                reasons.append(f"거주지역({user_context['region']})에 해당")
        
        if user_context.get('interests') and policy.get('category'):
            for interest in user_context['interests']:
                if interest.lower() in policy['category'].lower():
                    reasons.append(f"관심분야({interest})와 일치")
        
        if user_context.get('situation'):
            reasons.append("현재 상황과 관련")
        
        return " | ".join(reasons) if reasons else "일반 추천"
    
    def get_policy_count(self) -> int:
        """로드된 정책 수 반환"""
        return self.vector_store.get_policy_count()
    
    def refresh_policies(self):
        """정책 데이터 새로고침"""
        self._rebuild_vector_store()
    
    def _extract_policies_from_response(self, response: Dict[str, Any]) -> List[Dict[str, Any]]:
        """멀티 Agent 응답에서 정책 목록 추출"""
        try:
            # 실행 로그에서 metadata 확인
            if response.get("success") and "metadata" in response:
                metadata = response["metadata"]
                
                # 간단한 정책 정보 반환 (실제로는 더 상세한 정보 필요)
                return [
                    {
                        "total_found": metadata.get("policies_found", 0),
                        "eligible_count": metadata.get("eligible_policies", 0),
                        "ranked_count": metadata.get("ranked_policies", 0)
                    }
                ]
            
            return []
            
        except Exception as e:
            logger.error(f"Failed to extract policies from response: {e}")
            return []
    
    async def get_consultation_summary(self, user_id: int) -> Dict[str, Any]:
        """사용자의 상담 요약 정보 조회"""
        try:
            # 사용자 기본 정보 조회
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                # 사용자 정보
                cursor.execute("""
                    SELECT u.name, u.gender, up.age, up.lifestyle_type, up.budget_range
                    FROM users u
                    LEFT JOIN user_profiles up ON u.id = up.user_id
                    WHERE u.id = ?
                """, (user_id,))
                user_data = cursor.fetchone()
                
                # 찜한 매물 수
                cursor.execute("SELECT COUNT(*) FROM favorites WHERE user_id = ?", (user_id,))
                favorite_count = cursor.fetchone()[0]
            
            # 기본 통계
            policy_count = self.get_policy_count()
            
            return {
                "user_profile_completeness": 0.8 if user_data else 0.3,
                "favorite_properties": favorite_count,
                "available_policies": policy_count,
                "profile_summary": {
                    "name": user_data['name'] if user_data else "사용자",
                    "age": user_data['age'] if user_data else None,
                    "occupation": user_data['lifestyle_type'] if user_data else "미정",
                    "budget_range": user_data['budget_range'] if user_data else "미정",
                    "region": "서울" if favorite_count > 0 else "미확인"
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get consultation summary: {e}")
            return {"error": str(e)}
    
    def _calculate_profile_completeness(self, profile: Dict[str, Any]) -> float:
        """프로필 완성도 계산"""
        required_fields = [
            "age", "occupation", "income_household", "desired_region", 
            "transaction_type", "budget_deposit"
        ]
        
        completed_fields = 0
        for field in required_fields:
            if profile.get(field) or profile.get("preferences", {}).get(field):
                completed_fields += 1
        
        return completed_fields / len(required_fields)

# 전역 인스턴스
policy_chatbot = PolicyChatbot()