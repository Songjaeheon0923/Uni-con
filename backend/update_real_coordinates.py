#!/usr/bin/env python3
"""
실제 외부 API 데이터의 좌표를 실제 지오코딩으로 업데이트
"""
import sqlite3
import time
from crawlers.real_api_crawler import RealAPIDataCrawler

def update_real_coordinates():
    """실제 외부 API 데이터의 좌표를 실제 지오코딩으로 업데이트"""
    print("=== 실제 외부 API 데이터 좌표 업데이트 시작 ===")
    
    crawler = RealAPIDataCrawler()
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    
    # 실제 외부 API 데이터만 선택
    cursor.execute("""
        SELECT room_id, address 
        FROM rooms 
        WHERE room_id LIKE 'real_api_%' 
        AND is_active = 1
        ORDER BY room_id
    """)
    
    rooms = cursor.fetchall()
    total_count = len(rooms)
    updated_count = 0
    failed_count = 0
    
    print(f"📊 업데이트 대상: {total_count}개 실제 매물")
    
    for i, (room_id, address) in enumerate(rooms, 1):
        try:
            print(f"\n[{i}/{total_count}] 처리 중: {address}")
            
            # 실제 지오코딩으로 좌표 획득
            lat, lng = crawler.get_coordinates_by_geocoding(address)
            
            # 데이터베이스 업데이트
            cursor.execute("""
                UPDATE rooms 
                SET latitude = ?, longitude = ? 
                WHERE room_id = ?
            """, (lat, lng, room_id))
            
            updated_count += 1
            
            # API 요청 간격 (지오코딩 서버 부하 방지)
            time.sleep(0.2)
            
            # 진행 상황 표시
            if i % 100 == 0:
                conn.commit()
                print(f"✅ 중간 저장: {i}/{total_count} 완료")
                
        except Exception as e:
            print(f"❌ {room_id} 업데이트 실패: {e}")
            failed_count += 1
            continue
    
    # 최종 저장
    conn.commit()
    conn.close()
    
    print(f"\n🎉 실제 외부 API 데이터 좌표 업데이트 완료!")
    print(f"📊 총 처리: {total_count}개")
    print(f"✅ 성공: {updated_count}개")
    print(f"❌ 실패: {failed_count}개")
    print(f"📈 성공률: {(updated_count/total_count*100):.1f}%" if total_count > 0 else "0%")
    
    return {
        'total': total_count,
        'updated': updated_count,
        'failed': failed_count,
        'success_rate': f"{(updated_count/total_count*100):.1f}%" if total_count > 0 else "0%"
    }

if __name__ == "__main__":
    result = update_real_coordinates()
    print(f"\n📋 최종 결과: {result}")