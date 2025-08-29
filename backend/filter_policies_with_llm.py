"""
LLM 기반 정책 필터링 스크립트
- 각 정책을 LLM으로 평가하여 플랫폼 적합성 판단
- 청년 주거/금융 지원 관련 정책만 유지
"""

import os
import sqlite3
import json
import logging
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PolicyFilter:
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

    def evaluate_policy_relevance(self, policy_data):
        """LLM으로 정책의 플랫폼 적합성 평가"""
        
        # 정책 정보 구성
        title = policy_data.get('title', '')
        content = policy_data.get('content', '')
        organization = policy_data.get('organization', '')
        category = policy_data.get('category', '')
        target = policy_data.get('target', '')
        
        # details JSON 파싱
        details = {}
        try:
            if policy_data.get('details'):
                details = json.loads(policy_data['details'])
        except:
            details = {}
        
        prompt = f"""당신은 청년 주거/금융 플랫폼의 정책 큐레이터입니다.

우리 플랫폼의 목적:
- 청년(만 19-39세)을 위한 주거 및 금융 지원 정보 제공
- 전세, 월세, 주택 구매, 생활비 지원에 집중
- 실질적인 경제적 도움이 되는 정책 위주

다음 정책이 우리 플랫폼에 적합한지 평가해주세요:

=== 정책 정보 ===
제목: {title}
주관기관: {organization}
카테고리: {category}
대상: {target}
내용: {content[:500]}...
세부내용: {str(details)[:300]}...

=== 평가 기준 ===
✅ 적합한 정책:
- 청년 주거 지원 (전세, 월세, 임대주택, 주택구매)
- 청년 금융 지원 (대출, 보증, 이자지원)
- 청년 생활비/수당 지원
- 주거 관련 직접적 경제 지원

❌ 부적합한 정책:
- 문화/예술/체육 활동
- 교육/연수 프로그램
- 창업 지원 (주거 무관)
- 일자리/취업 지원
- 건강/의료 지원
- 축제/행사/이벤트
- 상담/멘토링 서비스
- 자립지원 (보호종료아동 등 특수계층)

반드시 다음 JSON 형식으로만 답변하세요:
{{
  "relevant": true/false,
  "reason": "판단 이유를 한 문장으로",
  "category_match": "주거지원/금융지원/생활지원/기타",
  "confidence": 0.0-1.0
}}"""

        try:
            response = self.model.generate_content(prompt)
            
            # JSON 파싱
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text.replace('```json', '').replace('```', '').strip()
            
            result = json.loads(response_text)
            return result
            
        except Exception as e:
            logger.error(f"LLM evaluation failed: {e}")
            # API 키 순환 시도
            if "quota" in str(e).lower() or "rate" in str(e).lower():
                try:
                    self._rotate_api_key()
                    response = self.model.generate_content(prompt)
                    response_text = response.text.strip()
                    if response_text.startswith('```json'):
                        response_text = response_text.replace('```json', '').replace('```', '').strip()
                    result = json.loads(response_text)
                    return result
                except Exception as retry_error:
                    logger.error(f"Retry with rotated key failed: {retry_error}")
            
            # 기본값 반환 (보수적으로 유지)
            return {
                "relevant": True,
                "reason": "LLM 평가 실패로 보수적 유지",
                "category_match": "기타",
                "confidence": 0.1
            }

    def filter_all_policies(self):
        """모든 정책을 LLM으로 필터링"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                # 모든 활성 정책 조회
                cursor.execute("""
                    SELECT id, title, organization, category, target, content, region, details
                    FROM policies 
                    WHERE is_active = 1
                    ORDER BY id
                """)
                
                policies = cursor.fetchall()
                total_policies = len(policies)
                
                logger.info(f"총 {total_policies}개 정책 평가 시작")
                
                relevant_count = 0
                irrelevant_count = 0
                
                for i, policy in enumerate(policies, 1):
                    policy_dict = dict(policy)
                    
                    logger.info(f"[{i}/{total_policies}] 평가 중: {policy_dict['title'][:50]}...")
                    
                    # LLM으로 평가
                    evaluation = self.evaluate_policy_relevance(policy_dict)
                    
                    if evaluation['relevant']:
                        relevant_count += 1
                        logger.info(f"  ✅ 유지: {evaluation['reason']}")
                    else:
                        irrelevant_count += 1
                        logger.info(f"  ❌ 제거: {evaluation['reason']}")
                        
                        # DB에서 비활성화
                        cursor.execute("""
                            UPDATE policies 
                            SET is_active = 0
                            WHERE id = ?
                        """, (policy_dict['id'],))
                
                conn.commit()
                
                logger.info("="*50)
                logger.info(f"필터링 완료!")
                logger.info(f"유지된 정책: {relevant_count}개")
                logger.info(f"제거된 정책: {irrelevant_count}개")
                logger.info(f"전체 정책: {total_policies}개")
                
                return {
                    "total": total_policies,
                    "relevant": relevant_count,
                    "irrelevant": irrelevant_count
                }
                
        except Exception as e:
            logger.error(f"Policy filtering failed: {e}")
            raise

def main():
    print("=" * 60)
    print("LLM 기반 정책 필터링 시작")
    print("=" * 60)
    
    filter_system = PolicyFilter()
    
    # 자동 실행 (Claude Code 환경용)
    print("\n⚠️  LLM 기반 정책 필터링을 시작합니다...")
    
    try:
        result = filter_system.filter_all_policies()
        
        print("\n" + "=" * 60)
        print("필터링 결과 요약")
        print("=" * 60)
        print(f"전체 정책: {result['total']}개")
        print(f"유지된 정책: {result['relevant']}개")
        print(f"제거된 정책: {result['irrelevant']}개")
        print(f"유지율: {result['relevant']/result['total']*100:.1f}%")
        
    except KeyboardInterrupt:
        print("\n사용자가 작업을 중단했습니다.")
    except Exception as e:
        print(f"❌ 오류 발생: {e}")

if __name__ == "__main__":
    main()