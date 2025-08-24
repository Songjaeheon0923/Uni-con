#!/usr/bin/env python3
"""
지오코딩 기능 테스트 및 더미 데이터 생성
"""
import sqlite3
import random
from datetime import datetime
from crawlers.real_api_crawler import RealAPIDataCrawler

def create_test_rooms():
    """다양한 좌표를 가진 테스트 방 데이터 생성"""
    print("=== 지오코딩 테스트용 더미 데이터 생성 ===")
    
    # 크롤러 인스턴스 생성
    crawler = RealAPIDataCrawler()
    
    # 테스트용 매물 데이터
    test_apartments = [
        {"district": "강남구", "dong": "역삼동", "apt_name": "역삼타워"},
        {"district": "강남구", "dong": "삼성동", "apt_name": "삼성래미안"},
        {"district": "강남구", "dong": "청담동", "apt_name": "청담브라운스톤"},
        {"district": "서초구", "dong": "서초동", "apt_name": "서초센트럴"},
        {"district": "서초구", "dong": "반포동", "apt_name": "반포자이"},
        {"district": "송파구", "dong": "잠실동", "apt_name": "잠실리센츠"},
        {"district": "강동구", "dong": "상일동", "apt_name": "고덕아르테온"},
        {"district": "강동구", "dong": "암사동", "apt_name": "롯데캐슬퍼스트"},
        {"district": "마포구", "dong": "합정동", "apt_name": "합정래미안"},
        {"district": "성북구", "dong": "안암동", "apt_name": "안암힐스테이트"},
    ]
    
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    
    # 기존 테스트 데이터 삭제
    cursor.execute("DELETE FROM rooms WHERE room_id LIKE 'test_geo_%'")
    print(f"기존 테스트 데이터 {cursor.rowcount}개 삭제")
    
    saved_count = 0
    
    for i, apt_data in enumerate(test_apartments):
        try:
            # 주소 생성
            address = f"서울특별시 {apt_data['district']} {apt_data['dong']} {apt_data['apt_name']}"
            
            # 지오코딩으로 좌표 획득
            lat, lng = crawler.get_coordinates_by_geocoding(address)
            
            # 여러 층의 매물 생성
            for floor in range(3, 16, 3):  # 3, 6, 9, 12, 15층
                room_id = f"test_geo_{apt_data['district']}_{apt_data['apt_name']}_F{floor}_{i}"
                
                room_data = {
                    'room_id': room_id,
                    'address': address,
                    'latitude': lat + random.uniform(-0.001, 0.001),  # 약간의 오프셋
                    'longitude': lng + random.uniform(-0.001, 0.001),  # 약간의 오프셋
                    'transaction_type': random.choice(['전세', '월세', '매매']),
                    'price_deposit': random.randint(50000, 150000),  # 5억~15억
                    'price_monthly': random.randint(0, 300) if random.random() > 0.5 else 0,
                    'area': round(random.uniform(59, 84), 2),
                    'rooms': random.choice([2, 3, 4]),
                    'floor': floor,
                    'building_year': random.randint(2015, 2023),
                    'description': f'{apt_data["apt_name"]} {floor}층 매물',
                    'landlord_name': '테스트집주인',
                    'landlord_phone': '010-0000-0000',
                    'risk_score': random.randint(0, 5),
                    'view_count': random.randint(0, 100),
                    'favorite_count': random.randint(0, 20),
                    'is_active': True
                }
                
                cursor.execute('''
                    INSERT INTO rooms (
                        room_id, address, latitude, longitude, transaction_type,
                        price_deposit, price_monthly, area, rooms, floor,
                        building_year, description, landlord_name, landlord_phone,
                        risk_score, view_count, favorite_count, is_active, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    room_data['room_id'], room_data['address'], room_data['latitude'], 
                    room_data['longitude'], room_data['transaction_type'], room_data['price_deposit'],
                    room_data['price_monthly'], room_data['area'], room_data['rooms'], 
                    room_data['floor'], room_data['building_year'], room_data['description'],
                    room_data['landlord_name'], room_data['landlord_phone'], room_data['risk_score'],
                    room_data['view_count'], room_data['favorite_count'], room_data['is_active'],
                    datetime.now()
                ))
                saved_count += 1
                
                print(f"💾 저장: {apt_data['apt_name']} {floor}층 - ({lat:.6f}, {lng:.6f})")
        
        except Exception as e:
            print(f"❌ {apt_data['apt_name']} 저장 실패: {e}")
            continue
    
    conn.commit()
    conn.close()
    
    print(f"\n✅ 지오코딩 테스트 데이터 생성 완료!")
    print(f"📊 총 {saved_count}개 매물 저장")
    print(f"📍 {len(test_apartments)}개 지역의 다양한 좌표로 분산 배치")
    
    return saved_count

if __name__ == "__main__":
    create_test_rooms()