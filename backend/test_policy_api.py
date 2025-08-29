"""
정책 API 테스트 (서버 실행 후 테스트)
"""
import requests
import json

def test_policy_api():
    """정책 API 테스트"""
    base_url = "http://localhost:8080/api/policy-chat"
    
    # 1. 상태 확인
    print("=== 1. 상태 확인 ===")
    try:
        response = requests.get(f"{base_url}/status")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Status check failed: {e}")
        return
    
    # 2. 가짜 JWT 토큰으로 간단한 테스트 (인증 우회용)
    headers = {
        "Content-Type": "application/json",
        # 실제 토큰이 필요하지만 테스트용으로는 생략
    }
    
    # 3. 간단한 질문 테스트 (인증 없이는 실패할 것)
    print("\n=== 2. 간단한 질문 테스트 ===")
    simple_data = {
        "message": "안녕하세요"
    }
    
    try:
        response = requests.post(f"{base_url}/chat", 
                               json=simple_data, 
                               headers=headers)
        print(f"Simple chat status: {response.status_code}")
        print(f"Response: {response.text[:200]}")
    except Exception as e:
        print(f"Simple chat failed: {e}")
    
    # 4. 복잡한 질문 테스트 (인증 없이는 실패할 것)
    print("\n=== 3. 복잡한 질문 테스트 ===")
    complex_data = {
        "message": "23세 대학생인데 전세 대출 정책 알려줘"
    }
    
    try:
        response = requests.post(f"{base_url}/chat", 
                               json=complex_data, 
                               headers=headers)
        print(f"Complex chat status: {response.status_code}")
        print(f"Response: {response.text[:200]}")
    except Exception as e:
        print(f"Complex chat failed: {e}")

if __name__ == "__main__":
    test_policy_api()