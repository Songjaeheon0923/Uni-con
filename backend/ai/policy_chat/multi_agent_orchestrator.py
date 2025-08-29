"""
LangGraph 멀티 Agent 오케스트레이터
사용자 질문을 받아 여러 Agent를 순차/병렬로 실행하여 최종 답변 생성
"""

import logging
import json
from typing import Dict, Any, List, Optional, AsyncGenerator
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from typing_extensions import Annotated, TypedDict
import asyncio

from .agents.user_profiling_agent import user_profiling_agent
from .agents.eligibility_checker_agent import eligibility_checker_agent  
from .agents.policy_ranking_agent import policy_ranking_agent
from .agents.strategy_planning_agent import strategy_planning_agent
from .agents.answer_synthesis_agent import answer_synthesis_agent
from .agents.simple_answer_agent import simple_answer_agent
from .vector_store import policy_vector_store

logger = logging.getLogger(__name__)

class PolicyConsultationState(TypedDict):
    """정책 상담 상태 정의"""
    user_id: int
    user_question: str
    user_profile: Dict[str, Any]
    property_context: str
    
    # Agent 결과들
    profiling_result: Dict[str, Any]
    search_result: List[Dict[str, Any]]
    eligibility_result: Dict[str, Any]
    ranking_result: Dict[str, Any]
    strategy_result: Dict[str, Any]
    
    # 최종 결과
    final_answer: str
    agent_errors: List[str]
    execution_log: List[str]

class MultiAgentOrchestrator:
    """멀티 Agent 시스템 오케스트레이터"""
    
    def __init__(self):
        self.profiling_agent = user_profiling_agent
        self.eligibility_agent = eligibility_checker_agent
        self.ranking_agent = policy_ranking_agent
        self.strategy_agent = strategy_planning_agent
        self.synthesis_agent = answer_synthesis_agent
        self.simple_agent = simple_answer_agent
        self.vector_store = policy_vector_store
        
        # LangGraph workflow 구성
        self.workflow = self._build_workflow()
        self.app = self.workflow.compile()
    
    def _build_workflow(self) -> StateGraph:
        """LangGraph 워크플로우 구축"""
        
        workflow = StateGraph(PolicyConsultationState)
        
        # 노드 추가
        workflow.add_node("user_profiling", self._user_profiling_node)
        workflow.add_node("policy_search", self._policy_search_node)
        workflow.add_node("eligibility_check", self._eligibility_check_node)
        workflow.add_node("policy_ranking", self._policy_ranking_node)
        workflow.add_node("strategy_planning", self._strategy_planning_node)
        workflow.add_node("answer_synthesis", self._answer_synthesis_node)
        
        # 워크플로우 정의
        workflow.set_entry_point("user_profiling")
        
        # 순차 실행 흐름
        workflow.add_edge("user_profiling", "policy_search")
        workflow.add_edge("policy_search", "eligibility_check") 
        workflow.add_edge("eligibility_check", "policy_ranking")
        workflow.add_edge("policy_ranking", "strategy_planning")
        workflow.add_edge("strategy_planning", "answer_synthesis")
        workflow.add_edge("answer_synthesis", END)
        
        return workflow
    
    async def process_consultation(self, user_id: int, user_question: str) -> Dict[str, Any]:
        """정책 상담 전체 프로세스 실행"""
        try:
            logger.info(f"Starting policy consultation for user {user_id}")
            
            # 간단한 질문인지 판단
            if self.simple_agent.can_handle_simple(user_question):
                logger.info("Handling as simple question")
                simple_answer = self.simple_agent.generate_simple_answer(user_question)
                
                return {
                    "success": True,
                    "final_answer": simple_answer,
                    "user_profile": {},
                    "execution_log": ["simple_answer_agent: 간단 답변 생성"],
                    "agent_errors": [],
                    "metadata": {
                        "agent_type": "simple_answer",
                        "policies_found": 0,
                        "eligible_policies": 0,
                        "ranked_policies": 0
                    }
                }
            
            logger.info("Handling as complex policy question")
            
            # 초기 상태 설정
            initial_state = PolicyConsultationState(
                user_id=user_id,
                user_question=user_question,
                user_profile={},
                property_context="",
                profiling_result={},
                search_result=[],
                eligibility_result={},
                ranking_result={},
                strategy_result={},
                final_answer="",
                agent_errors=[],
                execution_log=[]
            )
            
            # 워크플로우 실행
            final_state = await self.app.ainvoke(initial_state)
            
            logger.info("Policy consultation completed successfully")
            
            return {
                "success": True,
                "final_answer": final_state["final_answer"],
                "user_profile": final_state["user_profile"],
                "execution_log": final_state["execution_log"],
                "agent_errors": final_state["agent_errors"],
                "metadata": {
                    "policies_found": len(final_state["search_result"]),
                    "eligible_policies": len(final_state["eligibility_result"].get("eligible_policies", [])),
                    "ranked_policies": len(final_state["ranking_result"].get("ranked_policies", []))
                }
            }
            
        except Exception as e:
            logger.error(f"Policy consultation failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "final_answer": "상담 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
                "agent_errors": [str(e)]
            }
    
    async def process_consultation_stream(self, user_id: int, user_question: str) -> AsyncGenerator[str, None]:
        """스트리밍 정책 상담 처리"""
        try:
            logger.info(f"Starting streaming consultation for user {user_id}")
            
            # 간단한 질문인지 판단
            if self.simple_agent.can_handle_simple(user_question):
                logger.info("Handling as simple question (streaming)")
                
                # 간단 답변 스트리밍
                async for chunk in self.simple_agent.generate_simple_answer_stream(user_question):
                    yield json.dumps({"type": "content", "message": chunk}, ensure_ascii=False) + "\n"
                
                return
            
            logger.info("Handling as complex policy question (streaming)")
            
            # 1. 사용자 프로파일링
            yield json.dumps({"type": "status", "agent": "profiling", "message": "사용자 정보를 분석중입니다..."}, ensure_ascii=False) + "\n"
            
            property_context = self.profiling_agent.get_property_context(user_id)
            profiling_result = self.profiling_agent.extract_user_profile(
                user_question, user_id, property_context
            )
            
            if profiling_result["confidence"] > 0.5:
                yield json.dumps({"type": "status", "agent": "profiling", "message": f"프로필 분석 완료 (신뢰도: {profiling_result['confidence']:.1%})", "complete": True}, ensure_ascii=False) + "\n"
            else:
                yield json.dumps({"type": "status", "agent": "profiling", "message": "프로필 정보가 부족합니다", "complete": True, "warning": True}, ensure_ascii=False) + "\n"
            
            # 2. 정책 검색
            yield json.dumps({"type": "status", "agent": "search", "message": "관련 정책을 검색중입니다..."}, ensure_ascii=False) + "\n"
            
            policies = self.vector_store.search(user_question, k=15)
            yield json.dumps({"type": "status", "agent": "search", "message": f"{len(policies)}개의 관련 정책을 발견했습니다", "complete": True}, ensure_ascii=False) + "\n"
            
            # 3. 자격 검증
            yield json.dumps({"type": "status", "agent": "eligibility", "message": "자격 요건을 검토중입니다..."}, ensure_ascii=False) + "\n"
            
            eligibility_result = self.eligibility_agent.check_eligibility(
                profiling_result["updated_profile"], policies, user_question
            )
            
            eligible_count = len(eligibility_result.get("eligible_policies", []))
            partial_count = len(eligibility_result.get("partially_eligible", []))
            
            yield json.dumps({"type": "status", "agent": "eligibility", "message": f"자격 검증 완료: 완전 자격 {eligible_count}개, 부분 자격 {partial_count}개", "complete": True}, ensure_ascii=False) + "\n"
            
            if eligible_count == 0 and partial_count == 0:
                yield json.dumps({"type": "status", "agent": "eligibility", "message": "현재 조건으로는 신청 가능한 정책이 없습니다", "warning": True}, ensure_ascii=False) + "\n"
                
                # 최종 답변 (자격 부족시)
                async for chunk in self.synthesis_agent.synthesize_final_answer_stream(
                    user_question,
                    profiling_result["updated_profile"],
                    {"eligibility_check": eligibility_result}
                ):
                    yield json.dumps({"type": "content", "message": chunk}, ensure_ascii=False) + "\n"
                return
            
            # 4. 정책 랭킹
            yield json.dumps({"type": "status", "agent": "ranking", "message": "개인 맞춤 우선순위를 계산중입니다..."}, ensure_ascii=False) + "\n"
            
            all_eligible = eligibility_result.get("eligible_policies", []) + \
                          eligibility_result.get("partially_eligible", [])
            
            ranking_result = self.ranking_agent.rank_policies(
                profiling_result["updated_profile"],
                all_eligible,
                user_question,
                property_context
            )
            
            ranked_count = len(ranking_result.get("ranked_policies", []))
            yield json.dumps({"type": "status", "agent": "ranking", "message": f"{ranked_count}개 정책 우선순위 완료", "complete": True}, ensure_ascii=False) + "\n"
            
            # 5. 전략 수립
            yield json.dumps({"type": "status", "agent": "strategy", "message": "실행 전략을 수립중입니다..."}, ensure_ascii=False) + "\n"
            
            strategy_result = self.strategy_agent.create_execution_strategy(
                profiling_result["updated_profile"],
                ranking_result.get("ranked_policies", []),
                user_question
            )
            
            yield json.dumps({"type": "status", "agent": "strategy", "message": "맞춤 실행 계획 완료", "complete": True}, ensure_ascii=False) + "\n"
            
            # 6. 최종 답변 스트리밍
            yield json.dumps({"type": "status", "agent": "synthesis", "message": "최종 답변을 생성중입니다..."}, ensure_ascii=False) + "\n"
            agent_results = {
                "user_profiling": profiling_result,
                "eligibility_check": eligibility_result,
                "policy_ranking": ranking_result,
                "strategy_planning": strategy_result
            }
            
            async for chunk in self.synthesis_agent.synthesize_final_answer_stream(
                user_question,
                profiling_result["updated_profile"],
                agent_results
            ):
                yield json.dumps({"type": "content", "message": chunk}, ensure_ascii=False) + "\n"
            
            logger.info("Streaming consultation completed successfully")
            
        except Exception as e:
            logger.error(f"Streaming consultation failed: {e}")
            yield json.dumps({"type": "error", "message": f"상담 처리 중 오류가 발생했습니다: {str(e)}"}, ensure_ascii=False) + "\n"
    
    # LangGraph 노드 함수들
    
    async def _user_profiling_node(self, state: PolicyConsultationState) -> PolicyConsultationState:
        """사용자 프로파일링 노드"""
        try:
            state["execution_log"].append("Starting user profiling")
            
            # 매물 컨텍스트 가져오기
            property_context = self.profiling_agent.get_property_context(state["user_id"])
            state["property_context"] = property_context
            
            # 프로파일링 실행
            profiling_result = self.profiling_agent.extract_user_profile(
                state["user_question"], 
                state["user_id"], 
                property_context
            )
            
            state["profiling_result"] = profiling_result
            state["user_profile"] = profiling_result["updated_profile"]
            state["execution_log"].append(f"User profiling completed: confidence={profiling_result.get('confidence', 0):.2f}")
            
            return state
            
        except Exception as e:
            logger.error(f"User profiling node failed: {e}")
            state["agent_errors"].append(f"User profiling: {str(e)}")
            return state
    
    async def _policy_search_node(self, state: PolicyConsultationState) -> PolicyConsultationState:
        """정책 검색 노드"""
        try:
            state["execution_log"].append("Starting policy search")
            
            # 벡터 검색
            policies = self.vector_store.search(state["user_question"], k=15)
            state["search_result"] = policies
            state["execution_log"].append(f"Policy search completed: {len(policies)} policies found")
            
            return state
            
        except Exception as e:
            logger.error(f"Policy search node failed: {e}")
            state["agent_errors"].append(f"Policy search: {str(e)}")
            return state
    
    async def _eligibility_check_node(self, state: PolicyConsultationState) -> PolicyConsultationState:
        """자격 검증 노드"""
        try:
            state["execution_log"].append("Starting eligibility check")
            
            eligibility_result = self.eligibility_agent.check_eligibility(
                state["user_profile"],
                state["search_result"],
                state["user_question"]
            )
            
            state["eligibility_result"] = eligibility_result
            
            eligible_count = len(eligibility_result.get("eligible_policies", []))
            partial_count = len(eligibility_result.get("partially_eligible", []))
            state["execution_log"].append(f"Eligibility check completed: {eligible_count} eligible, {partial_count} partial")
            
            return state
            
        except Exception as e:
            logger.error(f"Eligibility check node failed: {e}")
            state["agent_errors"].append(f"Eligibility check: {str(e)}")
            return state
    
    async def _policy_ranking_node(self, state: PolicyConsultationState) -> PolicyConsultationState:
        """정책 랭킹 노드"""
        try:
            state["execution_log"].append("Starting policy ranking")
            
            # 자격이 있는 정책들만 랭킹
            all_eligible = state["eligibility_result"].get("eligible_policies", []) + \
                          state["eligibility_result"].get("partially_eligible", [])
            
            if all_eligible:
                ranking_result = self.ranking_agent.rank_policies(
                    state["user_profile"],
                    all_eligible,
                    state["user_question"],
                    state["property_context"]
                )
                state["ranking_result"] = ranking_result
                
                ranked_count = len(ranking_result.get("ranked_policies", []))
                state["execution_log"].append(f"Policy ranking completed: {ranked_count} policies ranked")
            else:
                state["ranking_result"] = {"ranked_policies": []}
                state["execution_log"].append("Policy ranking skipped: no eligible policies")
            
            return state
            
        except Exception as e:
            logger.error(f"Policy ranking node failed: {e}")
            state["agent_errors"].append(f"Policy ranking: {str(e)}")
            return state
    
    async def _strategy_planning_node(self, state: PolicyConsultationState) -> PolicyConsultationState:
        """전략 기획 노드"""
        try:
            state["execution_log"].append("Starting strategy planning")
            
            strategy_result = self.strategy_agent.create_execution_strategy(
                state["user_profile"],
                state["ranking_result"].get("ranked_policies", []),
                state["user_question"]
            )
            
            state["strategy_result"] = strategy_result
            state["execution_log"].append("Strategy planning completed")
            
            return state
            
        except Exception as e:
            logger.error(f"Strategy planning node failed: {e}")
            state["agent_errors"].append(f"Strategy planning: {str(e)}")
            return state
    
    async def _answer_synthesis_node(self, state: PolicyConsultationState) -> PolicyConsultationState:
        """답변 종합 노드"""
        try:
            state["execution_log"].append("Starting answer synthesis")
            
            # 모든 Agent 결과 통합
            agent_results = {
                "user_profiling": state["profiling_result"],
                "eligibility_check": state["eligibility_result"],
                "policy_ranking": state["ranking_result"],
                "strategy_planning": state["strategy_result"]
            }
            
            final_answer = self.synthesis_agent.synthesize_final_answer(
                state["user_question"],
                state["user_profile"],
                agent_results
            )
            
            state["final_answer"] = final_answer
            state["execution_log"].append("Answer synthesis completed")
            
            return state
            
        except Exception as e:
            logger.error(f"Answer synthesis node failed: {e}")
            state["agent_errors"].append(f"Answer synthesis: {str(e)}")
            
            # 대체 답변
            state["final_answer"] = "답변 생성 중 오류가 발생했습니다. 다시 시도해주세요."
            return state

# 전역 인스턴스
multi_agent_orchestrator = MultiAgentOrchestrator()