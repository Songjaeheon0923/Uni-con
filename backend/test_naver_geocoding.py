#!/usr/bin/env python3
"""
네이버 지오코딩 API 테스트
"""
import requests
import os
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

def test_naver_geocoding():
    """네이버 지오코딩 API 테스트"""
    client_id = os.getenv('NAVER_MAP_CLIENT_ID')
    client_secret = os.getenv('NAVER_MAP_CLIENT_SECRET')
    
    print(f"🔑 Client ID: {client_id}")
    print(f"🔑 Client Secret: {client_secret[:10]}...")
    
    if not client_id or not client_secret:
        print("❌ 네이버 API 키가 설정되지 않았습니다!")
        return False
    
    # 테스트 주소
    test_address = "서울특별시 강남구 도곡동 SK허브프리모"
    
    try:
        url = "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode"
        headers = {
            'X-NCP-APIGW-API-KEY-ID': client_id,
            'X-NCP-APIGW-API-KEY': client_secret
        }
        params = {
            'query': test_address
        }
        
        print(f"📍 테스트 주소: {test_address}")
        print(f"🌐 API URL: {url}")
        print(f"📋 Headers: {headers}")
        print(f"📋 Params: {params}")
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        
        print(f"📊 응답 상태 코드: {response.status_code}")
        print(f"📄 응답 헤더: {dict(response.headers)}")
        print(f"📝 응답 내용: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('addresses'):
                address_data = data['addresses'][0]
                lat = address_data.get('y')
                lng = address_data.get('x')
                print(f"✅ 지오코딩 성공: ({lat}, {lng})")
                return True
            else:
                print("⚠️ 주소를 찾을 수 없습니다")
                return False
        else:
            print(f"❌ API 오류: {response.status_code}")
            if response.status_code == 401:
                print("💡 401 오류: API 키 인증 실패 - API 키를 확인하세요")
            elif response.status_code == 403:
                print("💡 403 오류: API 접근 권한 없음 - 서비스 등록을 확인하세요")
            return False
            
    except Exception as e:
        print(f"❌ 네이버 지오코딩 테스트 오류: {e}")
        return False

def test_kakao_geocoding():
    """카카오 지오코딩 API 테스트"""
    api_key = os.getenv('KAKAO_REST_API_KEY')
    
    print(f"\n🔑 카카오 API Key: {api_key[:10]}...")
    
    if not api_key:
        print("❌ 카카오 API 키가 설정되지 않았습니다!")
        return False
    
    test_address = "서울특별시 강남구 도곡동 SK허브프리모"
    
    try:
        url = "https://dapi.kakao.com/v2/local/search/address.json"
        headers = {
            'Authorization': f'KakaoAK {api_key}'
        }
        params = {
            'query': test_address
        }
        
        print(f"📍 테스트 주소: {test_address}")
        print(f"🌐 API URL: {url}")
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        
        print(f"📊 응답 상태 코드: {response.status_code}")
        print(f"📝 응답 내용: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('documents'):
                location = data['documents'][0]
                if 'road_address' in location and location['road_address']:
                    lat = location['road_address']['y']
                    lng = location['road_address']['x']
                else:
                    lat = location['address']['y']
                    lng = location['address']['x']
                print(f"✅ 카카오 지오코딩 성공: ({lat}, {lng})")
                return True
            else:
                print("⚠️ 주소를 찾을 수 없습니다")
                return False
        else:
            print(f"❌ 카카오 API 오류: {response.status_code}")
            if response.status_code == 401:
                print("💡 401 오류: API 키 인증 실패")
            elif response.status_code == 403:
                print("💡 403 오류: API 접근 권한 없음")
            return False
            
    except Exception as e:
        print(f"❌ 카카오 지오코딩 테스트 오류: {e}")
        return False

if __name__ == "__main__":
    print("🧪 지오코딩 API 테스트 시작")
    print("=" * 50)
    
    print("\n1️⃣ 네이버 지오코딩 API 테스트")
    print("-" * 30)
    naver_success = test_naver_geocoding()
    
    print("\n2️⃣ 카카오 지오코딩 API 테스트")
    print("-" * 30)
    kakao_success = test_kakao_geocoding()
    
    print("\n📋 테스트 결과")
    print("=" * 50)
    print(f"네이버 API: {'✅ 성공' if naver_success else '❌ 실패'}")
    print(f"카카오 API: {'✅ 성공' if kakao_success else '❌ 실패'}")