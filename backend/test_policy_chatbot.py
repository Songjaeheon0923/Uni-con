"""
새로 구현한 정책 챗봇 테스트
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai.policy_chat.policy_chatbot import policy_chatbot

async def test_intent_classification():
    """의도 분류 테스트"""
    print("=== 의도 분류 및 자동 응답 테스트 ===")
    
    questions = [
        "안녕하세요",  # greeting
        "청년 정책이 뭐가 있나요?",  # simple_question
        "서울시 청년 주거 지원 정책 자세히 알려주세요",  # complex_search
        "23살 대학생이 받을 수 있는 지원 추천해줘",  # personal_recommendation
        "오늘 날씨 어때?",  # general_chat
    ]
    
    for question in questions:
        print(f"\n질문: {question}")
        
        # 자동 의도 분류 사용 (use_multi_agent는 무시됨)
        response = await policy_chatbot.chat(
            user_message=question,
            user_id=1,
            use_multi_agent=None  # 의도 분류가 자동으로 결정
        )
        
        print(f"의도: {response.get('intent', 'unknown')}")
        print(f"소스: {response['source']}")
        print(f"답변: {response['answer'][:200]}...")  # 처음 200자만
        if response.get('policies'):
            print(f"정책 수: {len(response['policies'])}")
        print("-" * 50)

async def test_rag_chat():
    """RAG 기반 답변 테스트"""
    print("\n=== RAG 기반 답변 테스트 ===")
    
    questions = [
        "청년 창업 지원 정책에 대해 자세히 알려주세요",
        "대학생 주거비 지원 제도가 있나요?",
        "청년 취업 관련 지원책을 추천해주세요"
    ]
    
    for question in questions:
        print(f"\n질문: {question}")
        
        response = await policy_chatbot.chat(
            user_message=question,
            user_id=1,
            use_multi_agent=True  # RAG 기반 답변
        )
        
        print(f"답변: {response['answer']}")
        print(f"소스: {response['source']}")
        print(f"관련 정책 수: {len(response.get('policies', []))}")
        
        if response.get('policies'):
            print("관련 정책:")
            for i, policy in enumerate(response['policies'][:3], 1):
                print(f"  {i}. {policy.get('title', '제목 없음')}")
                print(f"     기관: {policy.get('organization', '미상')}")
                print(f"     유사도: {policy.get('similarity_score', 0):.3f}")
        
        print("-" * 50)

def test_vector_store():
    """벡터 스토어 상태 확인"""
    print("\n=== 벡터 스토어 상태 확인 ===")
    
    policy_count = policy_chatbot.get_policy_count()
    print(f"로드된 정책 수: {policy_count}")
    
    if policy_count == 0:
        print("벡터 스토어가 비어있습니다. 새로고침을 시도합니다...")
        try:
            policy_chatbot.refresh_policies()
            new_count = policy_chatbot.get_policy_count()
            print(f"새로고침 후 정책 수: {new_count}")
        except Exception as e:
            print(f"새로고침 실패: {e}")

async def main():
    """메인 테스트 함수"""
    print("정책 챗봇 테스트를 시작합니다...\n")
    
    # 벡터 스토어 상태 확인
    test_vector_store()
    
    # 의도 분류 테스트
    await test_intent_classification()
    
    # RAG 기반 답변 테스트  
    # await test_rag_chat()
    
    print("\n테스트 완료!")

if __name__ == "__main__":
    asyncio.run(main())