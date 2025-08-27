#!/usr/bin/env python3
"""
OpenStreetMap 지오코딩 API 테스트
"""
import requests
import time

def test_osm_geocoding():
    """OSM 지오코딩 API 테스트"""
    
    test_addresses = [
        "서울특별시 강남구 도곡동 SK허브프리모",
        "서울특별시 강남구 도곡동",
        "서울 강남구 도곡동",
        "강남구 도곡동"
    ]
    
    for address in test_addresses:
        try:
            url = "https://nominatim.openstreetmap.org/search"
            headers = {
                "User-Agent": "Uni-con-Real-Estate-App/1.0 (contact@unicon.com)",
                "Accept": "application/json",
                "Accept-Language": "ko,en"
            }
            params = {
                "q": address + " 대한민국",
                "format": "json", 
                "limit": 1,
                "countrycodes": "kr",
                "bounded": 1,
                "viewbox": "124.5,33.0,131.0,38.9",
                "addressdetails": 1
            }
            
            print(f"📍 테스트 주소: {address}")
            
            response = requests.get(url, headers=headers, params=params, timeout=10)
            
            print(f"📊 응답 상태 코드: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                if data:
                    location = data[0]
                    lat = float(location.get('lat', 37.5665))
                    lng = float(location.get('lon', 126.9780))
                    display_name = location.get('display_name', 'N/A')
                    print(f"✅ OSM 지오코딩 성공: ({lat:.6f}, {lng:.6f})")
                    print(f"📍 주소: {display_name}")
                    print("-" * 50)
                    return True
                else:
                    print(f"⚠️ OSM 지오코딩 결과 없음: {address}")
            else:
                print(f"❌ OSM API 오류: {response.status_code}")
                
            print("-" * 50)
            time.sleep(1)  # API 요청 간격
                
        except Exception as e:
            print(f"❌ OSM 지오코딩 오류: {e}")
            print("-" * 50)
    
    return False

if __name__ == "__main__":
    print("🧪 OpenStreetMap 지오코딩 테스트 시작")
    print("=" * 50)
    
    success = test_osm_geocoding()
    
    print(f"\n📋 테스트 결과: {'✅ 성공' if success else '❌ 실패'}")