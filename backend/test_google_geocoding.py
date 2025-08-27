#!/usr/bin/env python3
"""
구글 지오코딩 API 테스트
"""
import requests
import os
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

def test_google_geocoding():
    """구글 지오코딩 API 테스트"""
    api_key = os.getenv('GOOGLE_GEOCODING_API_KEY')
    
    print(f"🔑 Google API Key: {api_key[:10]}...")
    
    if not api_key or api_key == 'YOUR_GOOGLE_API_KEY_HERE':
        print("❌ 구글 API 키가 설정되지 않았습니다!")
        return False
    
    # 테스트 주소들
    test_addresses = [
        "서울특별시 강남구 도곡동 SK허브프리모",
        "서울특별시 강남구 도곡동 도곡렉슬",
        "서울특별시 강남구 대치동 롯데캐슬리베",
        "서울 강남구 도곡동 한신엠비씨"
    ]
    
    for address in test_addresses:
        try:
            url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {
                'address': address,
                'key': api_key,
                'region': 'kr',  # 한국 우선
                'language': 'ko'  # 한국어 결과
            }
            
            print(f"\n📍 테스트 주소: {address}")
            
            response = requests.get(url, params=params, timeout=10)
            
            print(f"📊 응답 상태 코드: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('status') == 'OK' and data.get('results'):
                    # 첫 번째 결과 사용
                    result = data['results'][0]
                    location = result['geometry']['location']
                    lat = float(location['lat'])
                    lng = float(location['lng'])
                    formatted_address = result.get('formatted_address', 'N/A')
                    
                    print(f"✅ 구글 지오코딩 성공: ({lat:.6f}, {lng:.6f})")
                    print(f"📍 형식화된 주소: {formatted_address}")
                    
                    # 정확도 타입 표시
                    location_type = result['geometry'].get('location_type', 'UNKNOWN')
                    print(f"🎯 정확도: {location_type}")
                    
                else:
                    status = data.get('status', 'UNKNOWN_ERROR')
                    error_message = data.get('error_message', '')
                    print(f"⚠️ 구글 지오코딩 실패: {status}")
                    if error_message:
                        print(f"💬 오류 메시지: {error_message}")
            else:
                print(f"❌ 구글 API 오류: {response.status_code}")
                
            print("-" * 50)
                
        except Exception as e:
            print(f"❌ 구글 지오코딩 오류: {e}")
            print("-" * 50)
    
    return True

if __name__ == "__main__":
    print("🧪 구글 지오코딩 API 테스트 시작")
    print("=" * 50)
    
    success = test_google_geocoding()
    
    print(f"\n📋 테스트 결과: {'✅ 완료' if success else '❌ 실패'}")