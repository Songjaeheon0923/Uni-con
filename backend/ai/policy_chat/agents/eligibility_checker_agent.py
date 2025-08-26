"""
자격 조건 검증 Agent
사용자 프로필과 정책 자격요건 매칭
"""

import logging
import sqlite3
from typing import Dict, Any, List, Optional
from langchain.prompts import PromptTemplate
from langchain.schema import BaseOutputParser
from langchain_core.messages import HumanMessage
import json
import re

from ..gemini_client import gemini_client

logger = logging.getLogger(__name__)

class EligibilityParser(BaseOutputParser):
    """자격 검증 결과 파싱"""
    
    def parse(self, text: str) -> Dict[str, Any]:
        try:
            if "```json" in text:
                json_part = text.split("```json")[1].split("```")[0].strip()
            else:
                json_part = text.strip()
            
            return json.loads(json_part)
        except:
            return {
                "eligible_policies": [],
                "ineligible_policies": [],
                "partially_eligible": [],
                "missing_requirements": []
            }

class EligibilityCheckerAgent:
    """정책 자격요건 검증 Agent"""
    
    def __init__(self, db_path: str = "users.db"):
        self.db_path = db_path
        self.llm = gemini_client.get_llm()
        self.parser = EligibilityParser()
        
        # 자격 검증 프롬프트
        self.eligibility_prompt = PromptTemplate(
            input_variables=["user_profile", "policies", "user_question"],
            template="""당신은 청년 정책 자격요건 검증 전문가입니다.

사용자 프로필을 바탕으로 각 정책의 자격요건을 세밀하게 검토하여 신청 가능 여부를 판단해주세요.

**사용자 프로필:**
{user_profile}

**사용자 질문:**
{user_question}

**검토할 정책들:**
{policies}

**검증 기준:**
1. **연령 조건**: 만 나이 기준으로 정확히 계산
2. **소득 조건**: 개인소득, 가구소득, 부모소득 등 세분화하여 검토
3. **지역 조건**: 거주지, 근무지, 대학 소재지 등 고려
4. **신분 조건**: 대학생, 직장인, 취업준비생, 신혼부부 등
5. **기타 조건**: 주거형태, 자산, 부채, 특수상황 등

다음 JSON 형식으로 답변해주세요:
```json
{{
    "eligible_policies": [
        {{
            "policy_id": 1,
            "title": "정책명",
            "eligibility_score": 0.95,
            "matched_conditions": ["만족하는 조건들"],
            "confidence": "high",
            "recommendation": "적극 추천 사유"
        }}
    ],
    "partially_eligible": [
        {{
            "policy_id": 2,
            "title": "정책명",
            "eligibility_score": 0.7,
            "matched_conditions": ["만족하는 조건들"],
            "missing_conditions": ["부족한 조건들"],
            "confidence": "medium",
            "workarounds": ["조건 충족 방법들"]
        }}
    ],
    "ineligible_policies": [
        {{
            "policy_id": 3,
            "title": "정책명",
            "eligibility_score": 0.2,
            "failed_conditions": ["실패한 조건들"],
            "reason": "부적격 사유"
        }}
    ],
    "missing_requirements": [
        "추가로 필요한 사용자 정보"
    ],
    "overall_assessment": {{
        "total_policies": 10,
        "eligible_count": 3,
        "partially_eligible_count": 2,
        "recommendations": "전체적인 추천사항"
    }}
}}
```

**중요사항:**
- eligibility_score: 0.0~1.0 (0.8 이상: 확실 신청가능, 0.6-0.8: 조건부 가능, 0.6 미만: 신청 어려움)
- confidence: high(확실)/medium(애매)/low(불확실)
- 애매한 조건은 partially_eligible로 분류하고 workarounds 제시
- 소득 조건은 최신 기준으로 정확히 검토 (예: 5천만원 vs 5천5백만원)"""
        )
    
    def check_eligibility(self, user_profile: Dict[str, Any], policies: List[Dict[str, Any]], user_question: str = "") -> Dict[str, Any]:
        """정책 자격요건 검증"""
        try:
            logger.info(f"Checking eligibility for {len(policies)} policies")
            
            # 정책 정보 포맷팅
            formatted_policies = self._format_policies_for_check(policies)
            
            # 사용자 프로필 포맷팅
            formatted_profile = self._format_user_profile(user_profile)
            
            # 프롬프트 생성
            prompt_text = self.eligibility_prompt.format(
                user_profile=formatted_profile,
                policies=formatted_policies,
                user_question=user_question
            )
            
            # LLM 호출
            message = HumanMessage(content=prompt_text)
            response = self.llm.invoke([message])
            
            # 결과 파싱
            result = self.parser.parse(response.content)
            
            # 추가 검증 로직 적용
            enhanced_result = self._apply_business_rules(user_profile, result)
            
            logger.info(f"Eligibility check completed: {enhanced_result.get('overall_assessment', {}).get('eligible_count', 0)} eligible policies")
            
            return enhanced_result
            
        except Exception as e:
            logger.error(f"Eligibility check failed: {e}")
            return {
                "eligible_policies": [],
                "partially_eligible": [],
                "ineligible_policies": policies,
                "missing_requirements": ["자격 검증 실패"],
                "error": str(e)
            }
    
    def _format_policies_for_check(self, policies: List[Dict[str, Any]]) -> str:
        """정책 목록을 검증용 텍스트로 포맷팅"""
        formatted = []
        
        for i, policy in enumerate(policies, 1):
            policy_text = f"{i}. **{policy.get('title', '제목없음')}**\n"
            policy_text += f"   - ID: {policy.get('id')}\n"
            
            if policy.get('organization'):
                policy_text += f"   - 기관: {policy['organization']}\n"
            
            if policy.get('target'):
                policy_text += f"   - 대상: {policy['target']}\n"
                
            if policy.get('category'):
                policy_text += f"   - 분야: {policy['category']}\n"
            
            if policy.get('region'):
                policy_text += f"   - 지역: {policy['region']}\n"
            
            # 상세 조건
            details = policy.get('details', {})
            if details.get('explanation'):
                explanation = details['explanation'][:300] + "..." if len(details['explanation']) > 300 else details['explanation']
                policy_text += f"   - 설명: {explanation}\n"
            
            if details.get('income_condition'):
                policy_text += f"   - 소득조건: {details['income_condition']}\n"
            
            if details.get('application_method'):
                policy_text += f"   - 신청방법: {details['application_method'][:100]}\n"
            
            formatted.append(policy_text)
        
        return "\n".join(formatted)
    
    def _format_user_profile(self, profile: Dict[str, Any]) -> str:
        """사용자 프로필을 검증용 텍스트로 포맷팅"""
        formatted = "**사용자 기본 정보:**\n"
        
        # 기본 정보
        if profile.get('age'):
            formatted += f"- 나이: {profile['age']}세\n"
        if profile.get('age_range'):
            formatted += f"- 연령대: {profile['age_range']}\n"
        if profile.get('occupation'):
            formatted += f"- 직업/신분: {profile['occupation']}\n"
        
        # 소득 정보
        formatted += "\n**소득 정보:**\n"
        if profile.get('income_personal'):
            formatted += f"- 개인소득: 연 {profile['income_personal']:,}원\n"
        if profile.get('income_household'):
            formatted += f"- 가구소득: 연 {profile['income_household']:,}원\n"
        if profile.get('income_parents'):
            formatted += f"- 부모님소득: 연 {profile['income_parents']:,}원\n"
        
        # 지역 정보
        formatted += "\n**지역 정보:**\n"
        if profile.get('current_region'):
            formatted += f"- 현재 거주지: {profile['current_region']}\n"
        if profile.get('desired_region'):
            formatted += f"- 희망 지역: {profile['desired_region']}\n"
        
        # 주거 관련
        formatted += "\n**주거 정보:**\n"
        if profile.get('transaction_type'):
            formatted += f"- 거래 유형: {profile['transaction_type']}\n"
        if profile.get('budget_deposit'):
            formatted += f"- 보증금 예산: {profile['budget_deposit']:,}원\n"
        if profile.get('budget_monthly'):
            formatted += f"- 월세 예산: {profile['budget_monthly']:,}원\n"
        if profile.get('family_type'):
            formatted += f"- 가족 구성: {profile['family_type']}\n"
        
        # 특수 상황
        if profile.get('special_situation'):
            formatted += f"\n**특수 상황:** {profile['special_situation']}\n"
        
        # 관심 매물
        properties = profile.get('property_interests', [])
        if properties:
            formatted += f"\n**관심 매물 {len(properties)}개:**\n"
            for prop in properties[:3]:  # 최근 3개만
                formatted += f"- {prop.get('transaction_type')} {prop.get('price_deposit', 0):,}원"
                if prop.get('price_monthly', 0) > 0:
                    formatted += f"/{prop.get('price_monthly', 0):,}원"
                formatted += f" {prop.get('area', 0)}㎡ {prop.get('address', '')}\n"
        
        return formatted
    
    def _apply_business_rules(self, user_profile: Dict[str, Any], llm_result: Dict[str, Any]) -> Dict[str, Any]:
        """비즈니스 룰 기반 추가 검증"""
        try:
            # 소득 조건 재검증
            user_income = user_profile.get('income_household', 0) or user_profile.get('income_parents', 0)
            user_age = user_profile.get('age', 0)
            
            enhanced_result = llm_result.copy()
            
            # 각 정책에 대해 추가 검증
            for policy_list in ['eligible_policies', 'partially_eligible']:
                if policy_list in enhanced_result:
                    for policy in enhanced_result[policy_list]:
                        # 소득 조건 세밀 검토
                        policy['verified_income'] = self._verify_income_condition(
                            user_income, 
                            policy.get('title', ''),
                            policy.get('matched_conditions', [])
                        )
                        
                        # 연령 조건 세밀 검토
                        policy['verified_age'] = self._verify_age_condition(
                            user_age,
                            policy.get('title', ''),
                            policy.get('matched_conditions', [])
                        )
            
            return enhanced_result
            
        except Exception as e:
            logger.error(f"Business rules application failed: {e}")
            return llm_result
    
    def _verify_income_condition(self, user_income: int, policy_title: str, conditions: List[str]) -> Dict[str, Any]:
        """소득 조건 정밀 검증"""
        # 일반적인 청년 정책 소득 기준
        income_limits = {
            "청년전세임대": 5000,  # 5천만원 이하
            "버팀목전세자금": 5000,
            "청년우대형주택청약": 5500,  # 5천5백만원 이하
            "신혼희망타운": 7000,    # 7천만원 이하 (신혼부부)
        }
        
        for policy_name, limit in income_limits.items():
            if policy_name in policy_title:
                is_eligible = user_income <= limit * 10000  # 만원 단위 변환
                return {
                    "meets_income_limit": is_eligible,
                    "user_income": user_income,
                    "policy_limit": limit * 10000,
                    "margin": (limit * 10000 - user_income) if is_eligible else (user_income - limit * 10000)
                }
        
        return {"meets_income_limit": True, "verification": "manual"}
    
    def _verify_age_condition(self, user_age: int, policy_title: str, conditions: List[str]) -> Dict[str, Any]:
        """연령 조건 정밀 검증"""
        # 일반적인 청년 정책 연령 기준
        age_limits = {
            "청년전세임대": (19, 39),
            "청년우대형": (19, 34),
            "버팀목": (19, 34),
            "신혼": (19, 39),  # 신혼부부는 보통 39세까지
        }
        
        for policy_name, (min_age, max_age) in age_limits.items():
            if policy_name in policy_title:
                is_eligible = min_age <= user_age <= max_age
                return {
                    "meets_age_limit": is_eligible,
                    "user_age": user_age,
                    "policy_range": f"{min_age}-{max_age}세",
                    "years_until_ineligible": max_age - user_age if is_eligible else 0
                }
        
        return {"meets_age_limit": True, "verification": "manual"}

# 전역 인스턴스
eligibility_checker_agent = EligibilityCheckerAgent()