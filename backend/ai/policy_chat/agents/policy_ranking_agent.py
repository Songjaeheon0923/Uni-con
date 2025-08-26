"""
정책 랭킹 Agent
개인화된 정책 우선순위 및 ROI 계산
"""

import logging
import re
from typing import Dict, Any, List, Optional, Tuple
from langchain.prompts import PromptTemplate
from langchain.schema import BaseOutputParser
from langchain_core.messages import HumanMessage
import json

from ..gemini_client import gemini_client

logger = logging.getLogger(__name__)

class PolicyRankingParser(BaseOutputParser):
    """정책 랭킹 결과 파싱"""
    
    def parse(self, text: str) -> Dict[str, Any]:
        try:
            if "```json" in text:
                json_part = text.split("```json")[1].split("```")[0].strip()
            else:
                json_part = text.strip()
            
            return json.loads(json_part)
        except:
            return {
                "ranked_policies": [],
                "ranking_rationale": "",
                "roi_analysis": {}
            }

class PolicyRankingAgent:
    """개인화된 정책 우선순위 Agent"""
    
    def __init__(self):
        self.llm = gemini_client.get_llm()
        self.parser = PolicyRankingParser()
        
        # 정책 랭킹 프롬프트
        self.ranking_prompt = PromptTemplate(
            input_variables=["user_profile", "eligible_policies", "user_question", "property_context"],
            template="""당신은 개인 맞춤형 정책 우선순위 전문가입니다. **마크다운 형식의 표**를 활용해 명확한 분석을 제공합니다.

**사용자 프로필:** {user_profile}

**사용자 질문:** {user_question}

**관심 매물 정보:** {property_context}

**신청 가능한 정책들:** {eligible_policies}

## 평가 기준 (100점 만점)

| 평가 항목 | 배점 | 설명 |
|-----------|------|------|
| **혜택 규모** | 40점 | 지원 금액, 이자율 혜택, 실질적 절약 효과 |
| **신청 난이도** | 25점 | 낮은 경쟁률, 간단한 서류, 쉬운 절차 |
| **개인 적합도** | 20점 | 사용자 상황과의 일치성, 즉시 활용 가능성 |
| **시급성** | 10점 | 마감 임박, 선착순, 기회비용 |
| **중복 가능** | 5점 | 다른 정책과 동시 수혜 가능 |

## ROI 분석 요소
- **직접 혜택**: 현금 지원, 이자 절감액 (연간 기준)
- **간접 혜택**: 신용도 개선, 미래 기회 창출
- **소요 비용**: 시간 투자(시간), 서류 비용(원)
- **성공 확률**: 경쟁률과 자격 충족도 기반

다음 JSON 형식으로 답변해주세요:
```json
{{
    "ranked_policies": [
        {{
            "rank": 1,
            "policy_id": 1,
            "title": "정책명",
            "total_score": 85.5,
            "score_breakdown": {{
                "benefit_scale": 38.0,
                "application_difficulty": 20.0,
                "personal_fit": 18.0,
                "urgency": 7.0,
                "compatibility": 2.5
            }},
            "roi_analysis": {{
                "expected_benefit": 15000000,
                "application_cost": 500000,
                "success_probability": 0.7,
                "expected_roi": 2000.0,
                "roi_explanation": "ROI 계산 설명"
            }},
            "recommendation_reason": "1순위 추천 이유",
            "action_priority": "즉시 신청",
            "estimated_timeline": "신청~승인 예상 기간"
        }}
    ],
    "ranking_rationale": "전체 랭킹 논리와 전략",
    "optimal_strategy": {{
        "primary_targets": ["1순위로 신청할 정책들"],
        "backup_options": ["보완책 정책들"],
        "timing_strategy": "신청 순서 및 타이밍 전략",
        "risk_mitigation": "리스크 대비책"
    }},
    "roi_summary": {{
        "best_roi_policy": "최고 ROI 정책",
        "total_expected_benefit": 25000000,
        "recommended_budget": "신청 예산 권장사항"
    }}
}}
```

**중요 고려사항:**
- 사용자의 구체적 매물 관심사를 반영한 실용성 평가
- 현실적인 경쟁률과 성공 가능성 고려
- 정책 간 시너지 및 충돌 가능성 분석
- 단기/중기/장기 관점에서의 전략적 우선순위"""
        )
    
    def rank_policies(self, 
                     user_profile: Dict[str, Any], 
                     eligible_policies: List[Dict[str, Any]], 
                     user_question: str = "",
                     property_context: str = "") -> Dict[str, Any]:
        """정책 우선순위 및 ROI 분석"""
        try:
            logger.info(f"Ranking {len(eligible_policies)} policies")
            
            if not eligible_policies:
                return self._empty_ranking_result()
            
            # 정책 정보 포맷팅
            formatted_policies = self._format_policies_for_ranking(eligible_policies)
            
            # 사용자 프로필 포맷팅  
            formatted_profile = self._format_user_profile(user_profile)
            
            # 프롬프트 생성
            prompt_text = self.ranking_prompt.format(
                user_profile=formatted_profile,
                eligible_policies=formatted_policies,
                user_question=user_question,
                property_context=property_context
            )
            
            # LLM 호출
            message = HumanMessage(content=prompt_text)
            response = self.llm.invoke([message])
            
            # 결과 파싱
            result = self.parser.parse(response.content)
            
            # 추가 계산 및 검증
            enhanced_result = self._enhance_ranking_result(user_profile, result, eligible_policies)
            
            logger.info(f"Policy ranking completed: {len(enhanced_result.get('ranked_policies', []))} policies ranked")
            
            return enhanced_result
            
        except Exception as e:
            logger.error(f"Policy ranking failed: {e}")
            return {
                "ranked_policies": eligible_policies[:5],  # 원본 순서 유지
                "ranking_rationale": "랭킹 생성 실패로 기본 순서 반환",
                "error": str(e)
            }
    
    def _format_policies_for_ranking(self, policies: List[Dict[str, Any]]) -> str:
        """정책 목록을 랭킹용 텍스트로 포맷팅"""
        formatted = []
        
        for i, policy in enumerate(policies, 1):
            policy_text = f"{i}. **{policy.get('title', '제목없음')}**\n"
            policy_text += f"   - ID: {policy.get('id') or policy.get('policy_id')}\n"
            
            if policy.get('organization'):
                policy_text += f"   - 기관: {policy['organization']}\n"
                
            if policy.get('category'):
                policy_text += f"   - 분야: {policy['category']}\n"
            
            if policy.get('target'):
                policy_text += f"   - 대상: {policy['target']}\n"
            
            # 자격 검증 결과 포함
            if policy.get('eligibility_score'):
                policy_text += f"   - 자격 점수: {policy['eligibility_score']:.2f}/1.0\n"
            
            if policy.get('matched_conditions'):
                conditions = ', '.join(policy['matched_conditions'][:3])
                policy_text += f"   - 만족 조건: {conditions}\n"
            
            if policy.get('confidence'):
                policy_text += f"   - 신뢰도: {policy['confidence']}\n"
                
            # 혜택 정보 추출
            benefit_info = self._extract_benefit_info(policy)
            if benefit_info:
                policy_text += f"   - 예상 혜택: {benefit_info}\n"
            
            formatted.append(policy_text)
        
        return "\n".join(formatted)
    
    def _format_user_profile(self, profile: Dict[str, Any]) -> str:
        """사용자 프로필을 랭킹용 텍스트로 포맷팅"""
        formatted = "**개인 상황 요약:**\n"
        
        # 기본 정보
        if profile.get('age') and profile.get('occupation'):
            formatted += f"- {profile['age']}세 {profile['occupation']}\n"
        
        # 소득 및 예산
        if profile.get('income_household') or profile.get('income_parents'):
            income = profile.get('income_household') or profile.get('income_parents', 0)
            formatted += f"- 가구소득: 연 {income:,}원\n"
        
        if profile.get('budget_deposit'):
            formatted += f"- 보증금 예산: {profile['budget_deposit']:,}원\n"
        
        if profile.get('budget_monthly'):
            formatted += f"- 월세 예산: {profile['budget_monthly']:,}원\n"
        
        # 지역 및 주거
        if profile.get('desired_region'):
            formatted += f"- 희망 지역: {profile['desired_region']}\n"
        
        if profile.get('transaction_type'):
            formatted += f"- 희망 거래: {profile['transaction_type']}\n"
        
        # 긴급도/상황
        if profile.get('special_situation'):
            formatted += f"- 특수 상황: {profile['special_situation']}\n"
        
        return formatted
    
    def _extract_benefit_info(self, policy: Dict[str, Any]) -> Optional[str]:
        """정책에서 혜택 정보 추출"""
        try:
            content = policy.get('content', '') or ''
            details = policy.get('details', {})
            explanation = details.get('explanation', '') or ''
            
            full_text = f"{content} {explanation}".lower()
            
            # 금액 정보 추출
            amounts = []
            
            # 원 단위 숫자 찾기
            import re
            money_patterns = [
                r'(\d{1,3}(?:,\d{3})*)\s*만\s*원',
                r'(\d{1,3}(?:,\d{3})*)\s*억\s*원', 
                r'(\d+(?:\.\d+)?)\s*%',
                r'무이자|저금리'
            ]
            
            for pattern in money_patterns:
                matches = re.findall(pattern, full_text)
                amounts.extend(matches)
            
            if amounts:
                return f"혜택규모 관련: {', '.join(amounts[:3])}"
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to extract benefit info: {e}")
            return None
    
    def _enhance_ranking_result(self, user_profile: Dict[str, Any], llm_result: Dict[str, Any], original_policies: List[Dict[str, Any]]) -> Dict[str, Any]:
        """랭킹 결과 개선 및 검증"""
        try:
            enhanced_result = llm_result.copy()
            
            # 원본 정책 정보 병합
            policy_lookup = {p.get('id') or p.get('policy_id'): p for p in original_policies}
            
            for ranked_policy in enhanced_result.get('ranked_policies', []):
                policy_id = ranked_policy.get('policy_id')
                if policy_id and policy_id in policy_lookup:
                    original_policy = policy_lookup[policy_id]
                    
                    # 원본 정보 추가
                    ranked_policy.update({
                        'original_data': {
                            'organization': original_policy.get('organization'),
                            'category': original_policy.get('category'),
                            'target': original_policy.get('target'),
                            'region': original_policy.get('region'),
                            'content': original_policy.get('content', '')[:200]
                        }
                    })
                    
                    # ROI 재계산/검증
                    verified_roi = self._verify_roi_calculation(
                        user_profile, 
                        ranked_policy,
                        original_policy
                    )
                    if verified_roi:
                        ranked_policy['roi_analysis']['verified'] = verified_roi
            
            # 전체 전략 보완
            enhanced_result['strategic_insights'] = self._generate_strategic_insights(
                user_profile, 
                enhanced_result.get('ranked_policies', [])
            )
            
            return enhanced_result
            
        except Exception as e:
            logger.error(f"Failed to enhance ranking result: {e}")
            return llm_result
    
    def _verify_roi_calculation(self, user_profile: Dict[str, Any], ranked_policy: Dict[str, Any], original_policy: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """ROI 계산 검증 및 보정"""
        try:
            policy_title = ranked_policy.get('title', '').lower()
            user_budget = user_profile.get('budget_deposit', 0)
            
            # 대표적인 정책별 예상 혜택
            estimated_benefits = {
                '청년전세임대': min(user_budget * 0.8, 200000000),  # 보증금의 80% 또는 2억
                '버팀목전세자금': min(user_budget * 0.9, 300000000),  # 보증금의 90% 또는 3억
                '청년우대형': user_budget * 0.05,  # 연 5% 이자 절약 효과
            }
            
            for policy_name, benefit in estimated_benefits.items():
                if policy_name in policy_title:
                    return {
                        'estimated_direct_benefit': int(benefit),
                        'calculation_method': f'{policy_name} 표준 혜택 계산',
                        'annual_saving': int(benefit * 0.03) if '임대' in policy_name else int(benefit),
                        'confidence': 0.8
                    }
            
            return None
            
        except Exception as e:
            logger.error(f"ROI verification failed: {e}")
            return None
    
    def _generate_strategic_insights(self, user_profile: Dict[str, Any], ranked_policies: List[Dict[str, Any]]) -> Dict[str, Any]:
        """전략적 인사이트 생성"""
        try:
            if not ranked_policies:
                return {}
            
            top_3_policies = ranked_policies[:3]
            user_budget = user_profile.get('budget_deposit', 0)
            user_age = user_profile.get('age', 25)
            
            return {
                'budget_optimization': f"{user_budget:,}원 예산에 최적화된 상위 3개 정책 선정",
                'age_advantage': f"{user_age}세 연령대에서 {39-user_age}년간 청년 정책 활용 가능",
                'competition_analysis': f"상위 정책들의 평균 경쟁률 분석 필요",
                'timing_recommendation': "신청 마감일 기준 우선순위 조정 권장",
                'risk_distribution': f"상위 {len(top_3_policies)}개 정책으로 리스크 분산 전략"
            }
            
        except Exception as e:
            logger.error(f"Strategic insights generation failed: {e}")
            return {}
    
    def _empty_ranking_result(self) -> Dict[str, Any]:
        """빈 랭킹 결과 반환"""
        return {
            "ranked_policies": [],
            "ranking_rationale": "신청 가능한 정책이 없습니다.",
            "optimal_strategy": {
                "primary_targets": [],
                "backup_options": [],
                "timing_strategy": "추가 정보 수집 후 재검토",
                "risk_mitigation": "자격 조건 개선 방안 모색"
            },
            "roi_summary": {
                "best_roi_policy": None,
                "total_expected_benefit": 0,
                "recommended_budget": "정책 자격 확보 우선"
            }
        }

# 전역 인스턴스
policy_ranking_agent = PolicyRankingAgent()