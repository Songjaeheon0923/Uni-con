"""
LLM 기반 정책 배치 필터링 스크립트 (고속 버전)
- 50개씩 배치 단위로 처리
- 진행 상황 저장 및 복구
"""

import os
import sqlite3
import json
import logging
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai
import time

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PolicyBatchFilter:
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

    def evaluate_policy_batch(self, policies_batch):
        """정책 배치를 한 번에 평가"""
        
        # 정책 목록 구성
        policy_list = ""
        for i, policy in enumerate(policies_batch, 1):
            title = policy.get('title', '')
            content = policy.get('content', '')[:200]  # 내용 축약
            organization = policy.get('organization', '')
            category = policy.get('category', '')
            
            policy_list += f"""
=== 정책 {i} (ID: {policy['id']}) ===
제목: {title}
기관: {organization}
카테고리: {category}
내용: {content}...
"""

        prompt = f"""당신은 청년 주거/금융 플랫폼의 정책 큐레이터입니다.

우리 플랫폼의 목적:
- 청년(만 19-39세)을 위한 주거 및 금융 지원 정보 제공
- 전세, 월세, 주택 구매, 생활비 지원에 집중

✅ 적합: 청년 주거지원, 금융지원(대출/보증), 생활비/수당
❌ 부적합: 문화/예술, 교육/연수, 창업, 일자리, 축제/행사, 자립지원(특수계층)

다음 {len(policies_batch)}개 정책을 평가해주세요:
{policy_list}

반드시 다음 JSON 배열 형식으로만 답변하세요:
[
  {{"id": 정책ID, "relevant": true/false, "reason": "판단이유"}},
  {{"id": 정책ID, "relevant": true/false, "reason": "판단이유"}},
  ...
]"""

        try:
            response = self.model.generate_content(prompt)
            
            # JSON 파싱
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text.replace('```json', '').replace('```', '').strip()
            
            results = json.loads(response_text)
            return results
            
        except Exception as e:
            logger.error(f"Batch LLM evaluation failed: {e}")
            # API 키 순환 시도
            if "quota" in str(e).lower() or "rate" in str(e).lower():
                try:
                    self._rotate_api_key()
                    time.sleep(2)  # 잠시 대기
                    response = self.model.generate_content(prompt)
                    response_text = response.text.strip()
                    if response_text.startswith('```json'):
                        response_text = response_text.replace('```json', '').replace('```', '').strip()
                    results = json.loads(response_text)
                    return results
                except Exception as retry_error:
                    logger.error(f"Retry failed: {retry_error}")
            
            # 실패 시 모든 정책을 보수적으로 유지
            return [{"id": p['id'], "relevant": True, "reason": "평가 실패로 보수적 유지"} for p in policies_batch]

    def filter_all_policies_batch(self, batch_size=10):
        """배치 단위로 모든 정책 필터링"""
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
                
                all_policies = [dict(row) for row in cursor.fetchall()]
                total_policies = len(all_policies)
                
                logger.info(f"총 {total_policies}개 정책을 {batch_size}개씩 배치 처리")
                
                relevant_count = 0
                irrelevant_count = 0
                
                # 배치 단위로 처리
                for i in range(0, total_policies, batch_size):
                    batch = all_policies[i:i+batch_size]
                    batch_num = i // batch_size + 1
                    total_batches = (total_policies + batch_size - 1) // batch_size
                    
                    logger.info(f"배치 {batch_num}/{total_batches} 처리 중 ({len(batch)}개 정책)...")
                    
                    # 배치 평가
                    evaluations = self.evaluate_policy_batch(batch)
                    
                    # 결과 처리
                    for eval_result in evaluations:
                        policy_id = eval_result['id']
                        is_relevant = eval_result['relevant']
                        reason = eval_result['reason']
                        
                        if is_relevant:
                            relevant_count += 1
                            logger.info(f"  ✅ ID {policy_id}: 유지 - {reason}")
                        else:
                            irrelevant_count += 1
                            logger.info(f"  ❌ ID {policy_id}: 제거 - {reason}")
                            
                            # DB에서 비활성화
                            cursor.execute("""
                                UPDATE policies 
                                SET is_active = 0
                                WHERE id = ?
                            """, (policy_id,))
                    
                    # 배치별로 커밋
                    conn.commit()
                    
                    # API 호출 제한 고려하여 잠시 대기
                    if batch_num < total_batches:
                        time.sleep(1)
                
                logger.info("="*50)
                logger.info(f"배치 필터링 완료!")
                logger.info(f"유지된 정책: {relevant_count}개")
                logger.info(f"제거된 정책: {irrelevant_count}개")
                logger.info(f"전체 정책: {total_policies}개")
                
                return {
                    "total": total_policies,
                    "relevant": relevant_count,
                    "irrelevant": irrelevant_count
                }
                
        except Exception as e:
            logger.error(f"Batch policy filtering failed: {e}")
            raise

def main():
    print("=" * 60)
    print("LLM 배치 기반 정책 필터링 시작")
    print("=" * 60)
    
    filter_system = PolicyBatchFilter()
    
    try:
        result = filter_system.filter_all_policies_batch(batch_size=10)
        
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