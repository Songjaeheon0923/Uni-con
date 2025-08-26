"""
전략 기획 Agent
정책 조합 전략 및 실행 계획 수립
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from langchain.prompts import PromptTemplate
from langchain.schema import BaseOutputParser
from langchain_core.messages import HumanMessage
import json

from ..gemini_client import gemini_client

logger = logging.getLogger(__name__)

class StrategyParser(BaseOutputParser):
    """전략 계획 파싱"""
    
    def parse(self, text: str) -> Dict[str, Any]:
        try:
            if "```json" in text:
                json_part = text.split("```json")[1].split("```")[0].strip()
            else:
                json_part = text.strip()
            
            return json.loads(json_part)
        except:
            return {
                "execution_strategy": {},
                "timeline": [],
                "risk_management": {},
                "contingency_plans": []
            }

class StrategyPlanningAgent:
    """정책 조합 및 실행 전략 Agent"""
    
    def __init__(self):
        self.llm = gemini_client.get_llm()
        self.parser = StrategyParser()
        
        # 전략 수립 프롬프트
        self.strategy_prompt = PromptTemplate(
            input_variables=["user_profile", "ranked_policies", "user_question", "current_date"],
            template="""당신은 청년 정책 실행 전략 전문가입니다.

사용자의 상황과 우선순위가 정해진 정책들을 바탕으로 실제 실행 가능한 전략과 상세한 액션 플랜을 수립해주세요.

**현재 날짜:** {current_date}

**사용자 프로필:**
{user_profile}

**사용자 질문:**
{user_question}

**우선순위별 정책 목록:**
{ranked_policies}

**전략 수립 고려사항:**
1. **정책 간 시너지/충돌 분석**: 동시 신청 가능 여부, 상호 배타적 관계
2. **타이밍 전략**: 신청 시기, 마감일, 심사 기간, 결과 발표 일정
3. **서류 준비 최적화**: 공통 서류 활용, 준비 순서, 비용 최적화
4. **리스크 관리**: 탈락 대비책, Plan B, 기회비용 최소화
5. **성공 확률 극대화**: 경쟁률, 선발 기준, 가점 요소 활용

다음 JSON 형식으로 답변해주세요:
```json
{{
    "execution_strategy": {{
        "primary_track": {{
            "target_policies": ["1순위 정책들"],
            "success_probability": 0.7,
            "expected_timeline": "3-6개월",
            "required_budget": 1000000,
            "key_success_factors": ["핵심 성공 요소들"]
        }},
        "backup_track": {{
            "fallback_policies": ["대안 정책들"],
            "activation_triggers": ["Plan B 실행 조건들"],
            "timeline_adjustment": "조정된 일정"
        }},
        "parallel_opportunities": {{
            "compatible_policies": ["병행 가능 정책들"],
            "resource_allocation": "자원 배분 전략"
        }}
    }},
    "detailed_timeline": [
        {{
            "phase": "Phase 1: 즉시 실행",
            "duration": "1-2주",
            "actions": [
                {{
                    "task": "구체적 실행 항목",
                    "deadline": "2024-XX-XX",
                    "priority": "high",
                    "estimated_cost": 50000,
                    "required_documents": ["필요 서류들"],
                    "expected_outcome": "예상 결과"
                }}
            ],
            "success_criteria": "성공 기준",
            "risk_factors": "위험 요소"
        }}
    ],
    "document_strategy": {{
        "common_documents": ["공통으로 사용할 서류들"],
        "specialized_documents": {{
            "policy_name": ["해당 정책 전용 서류"]
        }},
        "preparation_sequence": "서류 준비 순서",
        "cost_optimization": "비용 절약 방안",
        "validity_management": "서류 유효기간 관리"
    }},
    "risk_management": {{
        "high_risk_scenarios": [
            {{
                "scenario": "리스크 시나리오",
                "probability": 0.3,
                "impact": "영향도",
                "mitigation_plan": "대응 계획",
                "early_warning_signs": ["조기 경고 신호들"]
            }}
        ],
        "contingency_budget": 500000,
        "emergency_alternatives": ["비상 대안들"]
    }},
    "success_optimization": {{
        "competitive_advantages": ["경쟁 우위 요소들"],
        "application_tips": ["신청 꿀팁들"],
        "follow_up_strategy": "신청 후 관리 전략",
        "networking_opportunities": "네트워킹 기회 활용"
    }},
    "monthly_action_plan": {{
        "month_1": ["1개월차 주요 액션"],
        "month_2": ["2개월차 주요 액션"],
        "month_3": ["3개월차 주요 액션"]
    }},
    "resource_requirements": {{
        "total_budget": 1500000,
        "time_commitment": "주 5-10시간",
        "support_needed": "필요한 외부 도움",
        "tools_and_services": "활용할 도구/서비스"
    }}
}}
```

**특별 고려사항:**
- 사용자의 실제 생활 패턴과 일정에 맞는 현실적 계획
- 각 정책의 실제 경쟁률과 선발 기준 반영
- 서류 준비부터 결과 발표까지의 전체 프로세스 고려
- 비용 대비 효과를 극대화하는 자원 배분"""
        )
    
    def create_execution_strategy(self, 
                                 user_profile: Dict[str, Any],
                                 ranked_policies: List[Dict[str, Any]],
                                 user_question: str = "") -> Dict[str, Any]:
        """실행 전략 및 액션 플랜 수립"""
        try:
            logger.info(f"Creating strategy for {len(ranked_policies)} ranked policies")
            
            if not ranked_policies:
                return self._create_fallback_strategy(user_profile)
            
            # 현재 날짜
            current_date = datetime.now().strftime("%Y-%m-%d")
            
            # 정책 정보 포맷팅
            formatted_policies = self._format_ranked_policies(ranked_policies)
            
            # 사용자 프로필 포맷팅
            formatted_profile = self._format_user_profile(user_profile)
            
            # 프롬프트 생성
            prompt_text = self.strategy_prompt.format(
                user_profile=formatted_profile,
                ranked_policies=formatted_policies,
                user_question=user_question,
                current_date=current_date
            )
            
            # LLM 호출
            message = HumanMessage(content=prompt_text)
            response = self.llm.invoke([message])
            
            # 결과 파싱
            result = self.parser.parse(response.content)
            
            # 전략 최적화 및 검증
            enhanced_result = self._enhance_strategy(user_profile, result, ranked_policies)
            
            logger.info("Execution strategy created successfully")
            
            return enhanced_result
            
        except Exception as e:
            logger.error(f"Strategy creation failed: {e}")
            return self._create_fallback_strategy(user_profile, error=str(e))
    
    def _format_ranked_policies(self, policies: List[Dict[str, Any]]) -> str:
        """랭킹된 정책들을 전략 수립용 텍스트로 포맷팅"""
        formatted = []
        
        for policy in policies:
            rank = policy.get('rank', 0)
            title = policy.get('title', '제목없음')
            score = policy.get('total_score', 0)
            
            policy_text = f"**{rank}순위: {title}** (점수: {score:.1f})\n"
            
            # ROI 정보
            roi_analysis = policy.get('roi_analysis', {})
            if roi_analysis.get('expected_benefit'):
                policy_text += f"   - 예상혜택: {roi_analysis['expected_benefit']:,}원\n"
            if roi_analysis.get('success_probability'):
                policy_text += f"   - 성공확률: {roi_analysis['success_probability']:.1%}\n"
            
            # 추천 이유
            if policy.get('recommendation_reason'):
                policy_text += f"   - 추천이유: {policy['recommendation_reason']}\n"
            
            # 액션 우선순위
            if policy.get('action_priority'):
                policy_text += f"   - 액션우선순위: {policy['action_priority']}\n"
            
            # 예상 타임라인
            if policy.get('estimated_timeline'):
                policy_text += f"   - 예상기간: {policy['estimated_timeline']}\n"
            
            # 원본 데이터
            original_data = policy.get('original_data', {})
            if original_data.get('organization'):
                policy_text += f"   - 기관: {original_data['organization']}\n"
            
            formatted.append(policy_text)
        
        return "\n".join(formatted)
    
    def _format_user_profile(self, profile: Dict[str, Any]) -> str:
        """사용자 프로필을 전략 수립용으로 포맷팅"""
        formatted = "**사용자 현황 및 제약사항:**\n"
        
        # 시간적 제약
        if profile.get('occupation'):
            if '대학생' in str(profile['occupation']):
                formatted += f"- 시간 가용성: 높음 (대학생)\n"
            elif '직장인' in str(profile['occupation']):
                formatted += f"- 시간 가용성: 제한적 (직장인)\n"
            else:
                formatted += f"- 직업: {profile['occupation']}\n"
        
        # 재정적 상황
        if profile.get('budget_deposit'):
            formatted += f"- 가용 예산: 보증금 {profile['budget_deposit']:,}원\n"
        
        if profile.get('income_household') or profile.get('income_parents'):
            income = profile.get('income_household') or profile.get('income_parents')
            formatted += f"- 소득 수준: 연 {income:,}원\n"
        
        # 지역적 제약
        if profile.get('current_region') != profile.get('desired_region'):
            formatted += f"- 지역 이동: {profile.get('current_region')} → {profile.get('desired_region')}\n"
        elif profile.get('current_region'):
            formatted += f"- 활동 지역: {profile['current_region']}\n"
        
        # 긴급도
        if profile.get('special_situation'):
            formatted += f"- 특수 상황: {profile['special_situation']} (긴급도 고려 필요)\n"
        
        # 경험/역량
        formatted += f"- 정책 신청 경험: 초보자로 가정 (상세 가이드 필요)\n"
        
        return formatted
    
    def _enhance_strategy(self, user_profile: Dict[str, Any], llm_result: Dict[str, Any], ranked_policies: List[Dict[str, Any]]) -> Dict[str, Any]:
        """전략 계획 개선 및 실용성 보완"""
        try:
            enhanced = llm_result.copy()
            
            # 실제 마감일 정보 추가
            enhanced['critical_deadlines'] = self._identify_critical_deadlines(ranked_policies)
            
            # 비용 분석 개선
            enhanced['detailed_cost_analysis'] = self._analyze_detailed_costs(user_profile, ranked_policies)
            
            # 실행 체크리스트 생성
            enhanced['execution_checklist'] = self._generate_execution_checklist(ranked_policies[:3])
            
            # KPI 및 성과 측정
            enhanced['success_metrics'] = self._define_success_metrics(user_profile, ranked_policies)
            
            # 실시간 모니터링 포인트
            enhanced['monitoring_points'] = self._create_monitoring_points(enhanced.get('detailed_timeline', []))
            
            return enhanced
            
        except Exception as e:
            logger.error(f"Strategy enhancement failed: {e}")
            return llm_result
    
    def _identify_critical_deadlines(self, policies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """중요 마감일 식별"""
        deadlines = []
        
        for policy in policies[:5]:  # 상위 5개 정책만
            title = policy.get('title', '')
            
            # 일반적인 정책 신청 기간 (실제 데이터로 교체 필요)
            if '청년전세임대' in title:
                deadlines.append({
                    'policy': title,
                    'type': '정기모집',
                    'estimated_deadline': '분기별 (3, 6, 9, 12월)',
                    'preparation_time': '1개월 전 준비 권장'
                })
            elif '버팀목' in title:
                deadlines.append({
                    'policy': title,
                    'type': '수시모집',
                    'estimated_deadline': '연중 수시',
                    'preparation_time': '2주 전 준비'
                })
        
        return deadlines
    
    def _analyze_detailed_costs(self, user_profile: Dict[str, Any], policies: List[Dict[str, Any]]) -> Dict[str, Any]:
        """상세 비용 분석"""
        costs = {
            'document_preparation': {
                '주민등록등본': 300,
                '소득증명원': 300,
                '재학증명서': 500,
                '통장사본': 0,
                '신분증사본': 100
            },
            'application_fees': {
                '정책별_수수료': 0,  # 대부분 무료
                '공증비용': 30000,
                '교통비': 50000
            },
            'opportunity_costs': {
                '시간비용': 200000,  # 신청/준비 시간
                '기회비용': 100000   # 다른 기회 포기
            }
        }
        
        total_estimated = sum(
            sum(category.values()) 
            for category in costs.values()
        )
        
        return {
            **costs,
            'total_estimated_cost': total_estimated,
            'user_budget_impact': f"{total_estimated / user_profile.get('budget_deposit', 1) * 100:.2f}%"
        }
    
    def _generate_execution_checklist(self, top_policies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """실행 체크리스트 생성"""
        checklist = []
        
        for i, policy in enumerate(top_policies, 1):
            policy_checklist = {
                'policy': policy.get('title', f'정책 {i}'),
                'priority': f'{i}순위',
                'tasks': [
                    {'task': '정책 공고문 상세 검토', 'status': 'pending', 'deadline': '즉시'},
                    {'task': '자격요건 재확인', 'status': 'pending', 'deadline': '1일 내'},
                    {'task': '필요서류 리스트업', 'status': 'pending', 'deadline': '2일 내'},
                    {'task': '서류 발급 및 준비', 'status': 'pending', 'deadline': '1주 내'},
                    {'task': '신청서 작성 및 검토', 'status': 'pending', 'deadline': '신청 마감 3일 전'},
                    {'task': '최종 신청 완료', 'status': 'pending', 'deadline': '마감일'},
                    {'task': '결과 확인 및 후속 조치', 'status': 'pending', 'deadline': '결과 발표 후'}
                ]
            }
            checklist.append(policy_checklist)
        
        return checklist
    
    def _define_success_metrics(self, user_profile: Dict[str, Any], policies: List[Dict[str, Any]]) -> Dict[str, Any]:
        """성과 측정 지표 정의"""
        user_budget = user_profile.get('budget_deposit', 0)
        
        return {
            'quantitative_metrics': {
                'application_success_rate': '목표: 30% 이상',
                'total_benefit_achieved': f'목표: {user_budget * 0.5:,}원 이상',
                'cost_effectiveness': 'ROI 1,000% 이상',
                'timeline_adherence': '계획 대비 90% 이상 준수'
            },
            'qualitative_metrics': {
                'learning_experience': '정책 신청 프로세스 숙련도 향상',
                'network_building': '정책 관련 인맥 구축',
                'confidence_building': '향후 정책 활용 자신감 향상'
            },
            'milestone_tracking': {
                '1개월': '서류 준비 100% 완료',
                '2개월': '주요 정책 50% 신청 완료',
                '3개월': '1차 결과 확인 및 전략 조정'
            }
        }
    
    def _create_monitoring_points(self, timeline: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """모니터링 포인트 생성"""
        monitoring = []
        
        for phase in timeline:
            monitoring.append({
                'phase': phase.get('phase', 'Unknown Phase'),
                'check_frequency': '주 1회',
                'key_indicators': [
                    '진행률',
                    '예산 소진율',
                    '품질 체크',
                    '리스크 발생 여부'
                ],
                'escalation_triggers': [
                    '진행률 20% 이상 지연',
                    '예산 초과 징후',
                    '서류 하자 발견'
                ],
                'adjustment_authority': '사용자 의사결정 필요'
            })
        
        return monitoring
    
    def _create_fallback_strategy(self, user_profile: Dict[str, Any], error: str = None) -> Dict[str, Any]:
        """대체 전략 (오류 발생시)"""
        return {
            "execution_strategy": {
                "primary_track": {
                    "target_policies": ["정책 재검색 필요"],
                    "success_probability": 0.0,
                    "expected_timeline": "1-2개월 (정책 발굴부터)",
                    "required_budget": 500000,
                    "key_success_factors": ["정책 정보 재수집", "자격 요건 재검토"]
                }
            },
            "detailed_timeline": [
                {
                    "phase": "Phase 1: 정책 재발굴",
                    "duration": "1-2주",
                    "actions": [
                        {
                            "task": "관련 기관 홈페이지 직접 조회",
                            "priority": "high",
                            "expected_outcome": "신규 정책 발굴"
                        }
                    ]
                }
            ],
            "risk_management": {
                "high_risk_scenarios": [
                    {
                        "scenario": "적합한 정책 부재",
                        "mitigation_plan": "자격 조건 개선 후 재시도",
                        "probability": 0.5
                    }
                ]
            },
            "error_info": error,
            "next_steps": [
                "사용자 정보 보완",
                "정책 데이터베이스 업데이트 확인",
                "전문가 상담 권장"
            ]
        }

# 전역 인스턴스  
strategy_planning_agent = StrategyPlanningAgent()