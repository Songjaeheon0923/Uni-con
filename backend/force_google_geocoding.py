#!/usr/bin/env python3
"""
모든 매물을 구글 지오코딩 API로만 강제 업데이트
"""
import sqlite3
import requests
import os
import time
from dotenv import load_dotenv

load_dotenv()

def force_google_geocoding():
    """모든 매물을 구글 API로만 강제 업데이트"""
    api_key = os.getenv('GOOGLE_GEOCODING_API_KEY')
    
    if not api_key or api_key == 'YOUR_GOOGLE_API_KEY_HERE':
        print("❌ 구글 API 키가 설정되지 않았습니다!")
        return False
    
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    
    # 모든 매물 주소 가져오기
    cursor.execute('SELECT id, address FROM rooms ORDER BY id')
    properties = cursor.fetchall()
    
    total_count = len(properties)
    success_count = 0
    fail_count = 0
    
    print(f"🚀 구글 지오코딩으로 {total_count}개 매물 업데이트 시작")
    print("=" * 60)
    
    for i, (room_id, address) in enumerate(properties, 1):
        try:
            print(f"[{i}/{total_count}] 처리 중: {address[:50]}...")
            
            # 구글 지오코딩 API 호출
            url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {
                'address': address,
                'key': api_key,
                'region': 'kr',
                'language': 'ko'
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('status') == 'OK' and data.get('results'):
                    # 첫 번째 결과 사용
                    result = data['results'][0]
                    location = result['geometry']['location']
                    lat = float(location['lat'])
                    lng = float(location['lng'])
                    location_type = result['geometry'].get('location_type', 'UNKNOWN')
                    
                    # 데이터베이스 업데이트
                    cursor.execute('''
                        UPDATE rooms 
                        SET latitude = ?, longitude = ? 
                        WHERE id = ?
                    ''', (lat, lng, room_id))
                    
                    success_count += 1
                    print(f"✅ 성공: ({lat:.6f}, {lng:.6f}) - {location_type}")
                    
                else:
                    status = data.get('status', 'UNKNOWN_ERROR')
                    error_msg = data.get('error_message', '')
                    print(f"⚠️ 실패: {status} {error_msg}")
                    fail_count += 1
                    
            else:
                print(f"❌ API 오류: {response.status_code}")
                fail_count += 1
                
            # API 요청 간격 (Google API는 초당 50요청 제한)
            time.sleep(0.02)  # 20ms 간격
            
            # 100개마다 중간 저장
            if i % 100 == 0:
                conn.commit()
                print(f"📊 진행률: {i}/{total_count} ({i/total_count*100:.1f}%)")
                
        except Exception as e:
            print(f"❌ 오류: {e}")
            fail_count += 1
    
    # 최종 저장
    conn.commit()
    conn.close()
    
    print("\n" + "=" * 60)
    print(f"📋 업데이트 완료!")
    print(f"총 매물: {total_count}개")
    print(f"성공: {success_count}개")
    print(f"실패: {fail_count}개")
    print(f"성공률: {success_count/total_count*100:.1f}%")
    
    return True

if __name__ == "__main__":
    print("🧪 구글 지오코딩 강제 업데이트 시작")
    print("=" * 60)
    
    success = force_google_geocoding()
    
    print(f"\n📋 최종 결과: {'✅ 완료' if success else '❌ 실패'}")