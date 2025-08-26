"""
사용자 프로파일링 Agent
사용자 대화에서 개인정보 추출 및 프로필 구축
"""

import logging
import sqlite3
from typing import Dict, Any, List, Optional
from langchain.prompts import PromptTemplate
from langchain.schema import BaseOutputParser
from langchain_core.messages import HumanMessage
import json

from ..gemini_client import gemini_client

logger = logging.getLogger(__name__)

class UserProfileParser(BaseOutputParser):
    """사용자 프로필 파싱"""
    
    def parse(self, text: str) -> Dict[str, Any]:
        try:
            # JSON 형태로 파싱 시도
            if "```json" in text:
                json_part = text.split("```json")[1].split("```")[0].strip()
            else:
                json_part = text.strip()
            
            return json.loads(json_part)
        except:
            # 파싱 실패시 기본 구조 반환
            return {
                "extracted_info": {},
                "confidence": 0.0,
                "missing_info": [],
                "follow_up_questions": []
            }

class UserProfilingAgent:
    """사용자 개인정보 추출 및 프로필 구축 Agent"""
    
    def __init__(self, db_path: str = "users.db"):
        self.db_path = db_path
        self.llm = gemini_client.get_llm()
        self.parser = UserProfileParser()
        
        # 프로필 추출 프롬프트
        self.profile_prompt = PromptTemplate(
            input_variables=["user_message", "existing_profile", "property_context"],
            template="""당신은 부동산 정책 상담을 위한 사용자 프로파일링 전문가입니다.

사용자 메시지에서 다음 정보를 추출하고 기존 프로필을 업데이트해주세요:

**추출할 정보:**
- 나이/연령대 (예: 25세, 20대 등)
- 직업/신분 (대학생, 직장인, 취업준비생, 창업자 등)
- 소득 정보 (본인/가구 소득, 부모님 소득 등)
- 지역 정보 (현재 거주지, 희망 지역 등)
- 주거 형태 (전세, 월세, 매매 등)
- 가족 구성 (1인 가구, 신혼부부, 부모님과 동거 등)
- 특수 상황 (결혼 예정, 임신, 창업 계획 등)

**사용자 메시지:** {user_message}

**기존 프로필:** {existing_profile}

**관심 매물 정보:** {property_context}

다음 JSON 형식으로 답변해주세요:
```json
{{
    "extracted_info": {{
        "age": "추출된 나이 정보",
        "age_range": "연령대 (10대/20대/30대/40대 등)",
        "occupation": "직업/신분",
        "income_personal": "본인 소득 (숫자만)",
        "income_household": "가구 소득 (숫자만)",
        "income_parents": "부모님 소득 (숫자만)",
        "current_region": "현재 거주지",
        "desired_region": "희망 지역",
        "transaction_type": "거래 유형 (전세/월세/매매)",
        "family_type": "가족 구성",
        "special_situation": "특수 상황",
        "budget_deposit": "보증금 예산 (숫자만)",
        "budget_monthly": "월세 예산 (숫자만)",
        "budget_purchase": "매매 예산 (숫자만)"
    }},
    "confidence": 0.8,
    "missing_info": ["부족한 정보 목록"],
    "follow_up_questions": ["추가로 필요한 질문들"]
}}
```

**중요:** 
- 명확하지 않은 정보는 null로 표시
- confidence는 0.0~1.0 사이 값
- missing_info에는 정책 추천에 필요하지만 부족한 정보 나열
- follow_up_questions에는 자연스러운 추가 질문 제안"""
        )
    
    def extract_user_profile(self, user_message: str, user_id: int, property_context: str = "") -> Dict[str, Any]:
        """사용자 메시지에서 프로필 정보 추출"""
        try:
            # 기존 프로필 로드
            existing_profile = self._load_existing_profile(user_id)
            
            # 프롬프트 생성
            prompt_text = self.profile_prompt.format(
                user_message=user_message,
                existing_profile=json.dumps(existing_profile, ensure_ascii=False, indent=2),
                property_context=property_context
            )
            
            # LLM 호출
            message = HumanMessage(content=prompt_text)
            response = self.llm.invoke([message])
            
            # 결과 파싱
            parsed_result = self.parser.parse(response.content)
            
            # 프로필 업데이트
            updated_profile = self._merge_profiles(existing_profile, parsed_result.get("extracted_info", {}))
            self._save_profile(user_id, updated_profile)
            
            logger.info(f"Profile extracted for user {user_id}: confidence={parsed_result.get('confidence', 0)}")
            
            return {
                "updated_profile": updated_profile,
                "confidence": parsed_result.get("confidence", 0),
                "missing_info": parsed_result.get("missing_info", []),
                "follow_up_questions": parsed_result.get("follow_up_questions", []),
                "extraction_success": True
            }
            
        except Exception as e:
            logger.error(f"Profile extraction failed: {e}")
            return {
                "updated_profile": self._load_existing_profile(user_id),
                "confidence": 0.0,
                "missing_info": ["프로필 추출 실패"],
                "follow_up_questions": [],
                "extraction_success": False,
                "error": str(e)
            }
    
    def _load_existing_profile(self, user_id: int) -> Dict[str, Any]:
        """기존 사용자 프로필 로드"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                # 사용자 기본 정보
                cursor.execute("""
                    SELECT email, phone_number, gender 
                    FROM users WHERE id = ?
                """, (user_id,))
                user_data = cursor.fetchone()
                
                # 사용자 프로필
                cursor.execute("""
                    SELECT age, budget_range, sleep_type, home_time,
                           cleaning_frequency, smoking_status, noise_sensitivity,
                           personality_type, lifestyle_type
                    FROM user_profiles WHERE user_id = ?
                """, (user_id,))
                profile_data = cursor.fetchone()
                
                # 찜한 매물 정보 (최근 5개)
                cursor.execute("""
                    SELECT r.transaction_type, r.price_deposit, r.price_monthly,
                           r.address, r.area, r.rooms
                    FROM favorites f
                    JOIN rooms r ON f.room_id = r.room_id
                    WHERE f.user_id = ?
                    ORDER BY f.created_at DESC
                    LIMIT 5
                """, (user_id,))
                favorite_properties = cursor.fetchall()
                
                # 프로필 구성
                profile = {
                    "user_id": user_id,
                    "basic_info": dict(user_data) if user_data else {},
                    "preferences": dict(profile_data) if profile_data else {},
                    "property_interests": [dict(prop) for prop in favorite_properties],
                    "last_updated": None
                }
                
                return profile
                
        except Exception as e:
            logger.error(f"Failed to load profile for user {user_id}: {e}")
            return {"user_id": user_id, "basic_info": {}, "preferences": {}, "property_interests": []}
    
    def _merge_profiles(self, existing: Dict[str, Any], extracted: Dict[str, Any]) -> Dict[str, Any]:
        """기존 프로필과 새로 추출된 정보 병합"""
        merged = existing.copy()
        
        # 새로 추출된 정보로 업데이트 (null이 아닌 값만)
        for key, value in extracted.items():
            if value is not None and value != "":
                if key.startswith("income_") or key.startswith("budget_"):
                    try:
                        merged[key] = int(value) if isinstance(value, (int, float, str)) else value
                    except (ValueError, TypeError):
                        merged[key] = value
                else:
                    merged[key] = value
        
        return merged
    
    def _save_profile(self, user_id: int, profile: Dict[str, Any]):
        """업데이트된 프로필 저장"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # 사용자 기본 정보 업데이트 (필요시)
                if profile.get("age") and profile.get("age") != profile.get("preferences", {}).get("age"):
                    cursor.execute("""
                        UPDATE user_profiles 
                        SET age = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = ?
                    """, (profile.get("age"), user_id))
                
                # 추후 확장: 별도 테이블에 상세 프로필 저장 가능
                logger.info(f"Profile saved for user {user_id}")
                
        except Exception as e:
            logger.error(f"Failed to save profile: {e}")
    
    def get_property_context(self, user_id: int) -> str:
        """사용자의 관심 매물 컨텍스트 생성"""
        try:
            profile = self._load_existing_profile(user_id)
            properties = profile.get("property_interests", [])
            
            if not properties:
                return "관심 매물 없음"
            
            context_parts = []
            for prop in properties:
                prop_info = f"- {prop.get('transaction_type', '거래유형미상')} {prop.get('price_deposit', 0):,}원"
                if prop.get('price_monthly', 0) > 0:
                    prop_info += f"/{prop.get('price_monthly', 0):,}원"
                prop_info += f" {prop.get('area', 0)}㎡ {prop.get('address', '주소미상')}"
                context_parts.append(prop_info)
            
            return f"관심 매물 {len(properties)}개:\n" + "\n".join(context_parts)
            
        except Exception as e:
            logger.error(f"Failed to get property context: {e}")
            return "관심 매물 정보 로드 실패"

# 전역 인스턴스
user_profiling_agent = UserProfilingAgent()