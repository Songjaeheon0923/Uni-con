"""
답변 종합 Agent  
모든 Agent 결과를 통합하여 최종 사용자 친화적 답변 생성
"""

import logging
from typing import Dict, Any, List, Optional
from langchain.prompts import PromptTemplate
from langchain.schema import BaseOutputParser
from langchain_core.messages import HumanMessage
import json

from ..gemini_client import gemini_client

logger = logging.getLogger(__name__)

class AnswerSynthesisParser(BaseOutputParser):
    """최종 답변 파싱"""
    
    def parse(self, text: str) -> Dict[str, Any]:
        # 답변은 마크다운 형태로 그대로 반환
        return {
            "final_answer": text.strip(),
            "format": "markdown"
        }

class AnswerSynthesisAgent:
    """최종 답변 종합 생성 Agent"""
    
    def __init__(self):
        self.llm = gemini_client.get_llm()
        self.parser = AnswerSynthesisParser()
        
        # 답변 종합 프롬프트
        self.synthesis_prompt = PromptTemplate(
            input_variables=["user_question", "user_profile", "agent_results"],
            template="""당신은 청년 정책 전문 컨설턴트입니다. 사용자에게 **마크다운 형식**으로 가독성 높은 답변을 제공해주세요.

**중요 규칙:**
1. 마크다운 문법을 적극 활용 (제목, 굵은 글씨, 목록, 표 등)
2. 이모지는 적절히 사용 (섹션 제목에 1개, 중요 포인트에만)
3. 가독성을 위해 섹션 간 적절한 여백 유지
4. 핵심 정보는 **굵은 글씨**나 `코드 블록`으로 강조

**사용자 질문:** {user_question}

**사용자 프로필:** {user_profile}

**전문가 분석 결과:** {agent_results}

다음 형식으로 답변을 작성해주세요:

## 📌 상황 분석

{user_question}에 대한 답변을 드리겠습니다.

**현재 상황 요약**
- 사용자의 주요 조건과 상황을 2-3줄로 정리
- 핵심 니즈 파악

---

## 🎯 맞춤 정책 추천

### 1. **[정책명]** - 가장 추천

> 💡 **추천 이유**: 왜 이 정책이 최우선인지 한 문장으로

**주요 혜택**
- 혜택 1: 구체적인 금액이나 내용
- 혜택 2: 실질적인 도움 내용
- 혜택 3: 추가 장점

**신청 조건**
| 구분 | 요구사항 | 충족여부 |
|------|---------|----------|
| 나이 | 만 XX세 이하 | ✅ 충족 |
| 소득 | 기준중위소득 XX% | ✅ 충족 |
| 거주지 | 서울시 | ✅ 충족 |

**신청 방법**: `온라인 신청` 또는 방문 신청 가능

---

### 2. **[정책명]** - 차선책

> 💡 **추천 이유**: 간단한 추천 사유

**주요 혜택**
- 핵심 혜택 위주로 간단히

**특이사항**: 주의할 점이나 특별한 장점

---

### 3. **[정책명]** - 보조 지원

> 💡 **추천 이유**: 왜 함께 신청하면 좋은지

**주요 혜택**
- 다른 정책과 중복 가능한 점 강조

---

## 📋 실행 계획

### **즉시 시작** (이번 주)
- [ ] 필요 서류 확인 및 준비
- [ ] 온라인 신청 사이트 회원가입
- [ ] 자격 요건 최종 확인

### **단기 목표** (2-4주)
- [ ] 1순위 정책 신청 완료
- [ ] 추가 서류 보완 (필요시)
- [ ] 2순위 정책 검토 및 준비

### **중기 목표** (1-3개월)
- [ ] 승인 결과 확인
- [ ] 추가 정책 신청
- [ ] 혜택 수령 시작

---

## 💡 꼭 알아두세요

### **성공 확률 높이는 팁**
1. **서류 준비**: 미리 준비하면 승인 확률 UP
2. **신청 시기**: 월초 신청이 유리한 경우 많음
3. **중복 신청**: 여러 정책 동시 진행 가능

### **주의사항**
- ⚠️ 허위 서류 제출 시 불이익
- ⚠️ 신청 기한 엄수 필요
- ⚠️ 소득 변동 시 즉시 신고

---

## 💬 추가 질문 예시

궁금한 점이 있다면 이렇게 물어보세요:
- "1순위 정책 신청 서류를 자세히 알려주세요"
- "다른 지역 정책도 있나요?"
- "소득이 변경되면 어떻게 하나요?"

**도움이 되셨나요?** 더 구체적인 상담이 필요하시면 언제든 질문해주세요!
💬 **추가 질문이 있으시면 언제든 말씀해주세요!**
구체적인 서류 준비 방법이나 신청 과정에서 궁금한 점이 생기면 도움드리겠습니다.

**작성 가이드라인:**
1. **친근하고 격려하는 톤**: "걱정 마세요", "충분히 가능해요" 등 사용
2. **구체적이고 실용적**: 추상적 설명보다는 구체적 수치와 액션
3. **시각적 구조화**: 이모지와 체크리스트로 가독성 향상
4. **개인화**: 사용자 상황을 구체적으로 반영
5. **실행 가능성**: 현실적이고 달성 가능한 계획 제시
6. **리스크 관리**: 가능한 문제점과 대안을 미리 제시"""
        )
        
        # 스트리밍용 답변 프롬프트 (간소화)
        self.streaming_prompt = PromptTemplate(
            input_variables=["user_question", "user_profile", "agent_results"],
            template="""청년 정책 전문가로서 **마크다운 형식**으로 가독성 높은 답변을 제공해주세요.

**중요 규칙:**
- 마크다운 문법 활용 (##제목, **굵은글씨**, 표, 목록)
- 이모지는 섹션 제목당 1개만 (과도한 사용 금지)
- 핵심 정보는 **굵게** 또는 `하이라이트`로 강조

**사용자:** {user_question}
**프로필:** {user_profile}
**분석 결과:** {agent_results}

간결하면서도 구조화된 답변으로 정책 추천과 실행 방법을 설명해주세요.
표와 체크리스트를 적극 활용하여 실용적인 가이드를 제공해주세요."""
        )
    
    def synthesize_final_answer(self, 
                               user_question: str,
                               user_profile: Dict[str, Any], 
                               agent_results: Dict[str, Any],
                               streaming: bool = False) -> str:
        """최종 답변 종합 생성"""
        try:
            logger.info("Synthesizing final answer from all agent results")
            
            # 사용자 프로필 요약
            profile_summary = self._summarize_user_profile(user_profile)
            
            # Agent 결과 통합 
            integrated_results = self._integrate_agent_results(agent_results)
            
            # 프롬프트 선택 (스트리밍 vs 일반)
            prompt = self.streaming_prompt if streaming else self.synthesis_prompt
            
            # 프롬프트 생성
            prompt_text = prompt.format(
                user_question=user_question,
                user_profile=profile_summary,
                agent_results=integrated_results
            )
            
            # LLM 호출
            message = HumanMessage(content=prompt_text)
            response = self.llm.invoke([message])
            
            # 답변 후처리
            final_answer = self._post_process_answer(response.content, agent_results)
            
            logger.info("Final answer synthesis completed")
            return final_answer
            
        except Exception as e:
            logger.error(f"Answer synthesis failed: {e}")
            return self._create_fallback_answer(user_question, user_profile, str(e))
    
    async def synthesize_final_answer_stream(self, 
                                           user_question: str,
                                           user_profile: Dict[str, Any],
                                           agent_results: Dict[str, Any]):
        """스트리밍 최종 답변 생성"""
        try:
            logger.info("Starting streaming answer synthesis")
            
            # 사용자 프로필 요약
            profile_summary = self._summarize_user_profile(user_profile)
            
            # Agent 결과 통합
            integrated_results = self._integrate_agent_results(agent_results)
            
            # 스트리밍용 프롬프트 생성
            prompt_text = self.streaming_prompt.format(
                user_question=user_question,
                user_profile=profile_summary,
                agent_results=integrated_results
            )
            
            # Gemini 스트리밍
            llm = gemini_client.get_llm()
            message = HumanMessage(content=prompt_text)
            
            # 스트리밍 답변 생성
            async for chunk in llm.astream([message]):
                if hasattr(chunk, 'content') and chunk.content:
                    yield chunk.content
            
            logger.info("Streaming synthesis completed")
            
        except Exception as e:
            logger.error(f"Streaming synthesis failed: {e}")
            yield f"답변 생성 중 오류가 발생했습니다: {str(e)}"
    
    def _summarize_user_profile(self, profile: Dict[str, Any]) -> str:
        """사용자 프로필 요약"""
        try:
            summary_parts = []
            
            # 기본 정보
            if profile.get('age') and profile.get('occupation'):
                summary_parts.append(f"{profile['age']}세 {profile['occupation']}")
            
            # 소득 정보
            income = profile.get('income_household') or profile.get('income_parents', 0)
            if income:
                summary_parts.append(f"가구소득 연 {income:,}원")
            
            # 예산 정보
            if profile.get('budget_deposit'):
                summary_parts.append(f"보증금 예산 {profile['budget_deposit']:,}원")
            
            # 지역
            if profile.get('desired_region'):
                summary_parts.append(f"희망지역 {profile['desired_region']}")
            
            # 거래 유형
            if profile.get('transaction_type'):
                summary_parts.append(f"{profile['transaction_type']} 관심")
            
            return " | ".join(summary_parts) if summary_parts else "기본 정보 부족"
            
        except Exception as e:
            logger.error(f"Profile summarization failed: {e}")
            return "프로필 요약 실패"
    
    def _integrate_agent_results(self, agent_results: Dict[str, Any]) -> str:
        """Agent 결과들을 통합하여 텍스트로 포맷팅"""
        try:
            integrated = []
            
            # 프로필링 결과
            if 'user_profiling' in agent_results:
                profiling = agent_results['user_profiling']
                confidence = profiling.get('confidence', 0)
                integrated.append(f"**프로필 분석:** 신뢰도 {confidence:.1%}")
                
                missing_info = profiling.get('missing_info', [])
                if missing_info:
                    integrated.append(f"부족한 정보: {', '.join(missing_info[:3])}")
            
            # 자격 검증 결과
            if 'eligibility_check' in agent_results:
                eligibility = agent_results['eligibility_check']
                eligible_count = len(eligibility.get('eligible_policies', []))
                partial_count = len(eligibility.get('partially_eligible', []))
                
                integrated.append(f"**자격 검증:** 완전자격 {eligible_count}개, 부분자격 {partial_count}개")
            
            # 랭킹 결과
            if 'policy_ranking' in agent_results:
                ranking = agent_results['policy_ranking']
                ranked_policies = ranking.get('ranked_policies', [])
                
                integrated.append(f"**정책 랭킹:** {len(ranked_policies)}개 정책 우선순위 완료")
                
                # 상위 3개 정책 요약
                for i, policy in enumerate(ranked_policies[:3], 1):
                    title = policy.get('title', f'정책 {i}')
                    score = policy.get('total_score', 0)
                    integrated.append(f"{i}순위: {title} (점수: {score:.1f})")
            
            # 전략 결과
            if 'strategy_planning' in agent_results:
                strategy = agent_results['strategy_planning']
                execution = strategy.get('execution_strategy', {})
                primary = execution.get('primary_track', {})
                
                if primary.get('success_probability'):
                    success_prob = primary['success_probability']
                    integrated.append(f"**실행 전략:** 성공 확률 {success_prob:.1%}")
                
                timeline = strategy.get('detailed_timeline', [])
                if timeline:
                    integrated.append(f"총 {len(timeline)}개 실행 단계 계획")
            
            return "\n".join(integrated) if integrated else "Agent 결과 통합 실패"
            
        except Exception as e:
            logger.error(f"Result integration failed: {e}")
            return f"결과 통합 중 오류: {str(e)}"
    
    def _post_process_answer(self, raw_answer: str, agent_results: Dict[str, Any]) -> str:
        """답변 후처리 및 품질 개선"""
        try:
            processed = raw_answer
            
            # 실제 정책명 교체 (결과에서 추출)
            if 'policy_ranking' in agent_results:
                ranked_policies = agent_results['policy_ranking'].get('ranked_policies', [])
                
                for i, policy in enumerate(ranked_policies[:3], 1):
                    title = policy.get('title', '')
                    if title:
                        # 플레이스홀더를 실제 정책명으로 교체
                        placeholder_patterns = [
                            f"{i}순위: [정책명]",
                            f"### {i}순위: [정책명]",
                            "[정책명]" if i == 1 else None
                        ]
                        
                        for pattern in placeholder_patterns:
                            if pattern and pattern in processed:
                                processed = processed.replace(pattern, f"{i}순위: {title}")
            
            # 예상 비용 정보 추가
            if 'strategy_planning' in agent_results:
                cost_info = agent_results['strategy_planning'].get('detailed_cost_analysis', {})
                total_cost = cost_info.get('total_estimated_cost', 0)
                
                if total_cost and "XX만원" in processed:
                    processed = processed.replace("XX만원", f"{total_cost//10000}만원")
            
            return processed
            
        except Exception as e:
            logger.error(f"Answer post-processing failed: {e}")
            return raw_answer
    
    def _create_fallback_answer(self, user_question: str, user_profile: Dict[str, Any], error: str) -> str:
        """오류 발생시 대체 답변"""
        user_name = user_profile.get('basic_info', {}).get('username', '고객님')
        
        return f"""## 😅 죄송합니다, {user_name}!

답변 생성 중 일시적인 문제가 발생했습니다.

### 🔄 다음과 같이 도와드릴 수 있습니다:

1. **질문을 더 구체적으로** 다시 말씀해주세요
   - 예: "25세 대학생인데 서울에서 전세 구하려고 해요"

2. **기본 정보 확인**
   - 나이, 소득, 지역, 주거 형태 등을 포함해서 질문해주세요

3. **단계별 접근**
   - 먼저 관심있는 매물 정보를 공유해주시면 더 정확한 추천이 가능합니다

### 💡 일반적인 청년 정책 안내

**주요 청년 주거 지원 정책:**
- 청년전세임대 (만 19-39세)
- 버팀목전세자금 (만 34세 이하)
- 청년우대형 주택청약

**다음에는 꼭 포함해서 질문해주세요:**
- 나이/연령대
- 소득 수준 (본인/가족)
- 희망 지역
- 전세/월세 여부
- 예산 범위

죄송합니다. 다시 질문해주시면 더 정확한 맞춤 상담을 도와드리겠습니다! 🙏

**오류 정보:** {error}"""

# 전역 인스턴스
answer_synthesis_agent = AnswerSynthesisAgent()