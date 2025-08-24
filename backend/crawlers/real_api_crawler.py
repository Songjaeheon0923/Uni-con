import requests
import json
import time
import sqlite3
import os
from datetime import datetime
from typing import List, Dict
import xml.etree.ElementTree as ET
import urllib.parse
import urllib3
from dotenv import load_dotenv
import random

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 환경 변수 로드
load_dotenv()

DATABASE_PATH = "users.db"

class RealAPIDataCrawler:
    """국토교통부 실제 실거래가 API 크롤러"""
    
    def __init__(self):
        self.db_path = os.getenv('DATABASE_PATH', DATABASE_PATH)
        # 환경 변수에서 API 키 로드
        self.service_key = os.getenv('MOLIT_API_KEY_DECODED')
        self.service_key_encoded = os.getenv('MOLIT_API_KEY_ENCODED')
        self.kakao_api_key = os.getenv('KAKAO_REST_API_KEY')
        
        if not self.service_key:
            raise ValueError("""
MOLIT_API_KEY_DECODED가 .env 파일에 설정되지 않았습니다.

해결 방법:
1. .env.example 파일을 .env로 복사하세요
2. https://data.go.kr에서 '국토교통부 아파트 매매 실거래가 상세 자료' API 키를 발급받으세요
3. 발급받은 키를 .env 파일의 MOLIT_API_KEY_DECODED에 입력하세요
            """)
        
        # 지오코딩 캐시 (API 호출 최소화)
        self.geocoding_cache = {}
        
        # 서울 주요 구 코드
        self.seoul_districts = {
            '강남구': '11680',
            '서초구': '11650',
            '송파구': '11710',
            '강동구': '11740',
            '마포구': '11560',
            '용산구': '11170',
            '성북구': '11290',
            '종로구': '11110',
            '중구': '11140',
            '영등포구': '11560'
        }
        
    def clear_fake_data(self):
        """기존 가짜 데이터 삭제"""
        print("🗑️  기존 가짜 데이터 삭제 중...")
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 이전에 생성한 가짜 데이터들 삭제
        cursor.execute("DELETE FROM rooms WHERE room_id LIKE 'molit_%' OR room_id LIKE 'seoul_%' OR room_id LIKE 'kb_%' OR room_id LIKE 'room_%'")
        deleted_count = cursor.rowcount
        
        conn.commit()
        conn.close()
        
        print(f"✅ {deleted_count}개 가짜 데이터 삭제 완료")
        return deleted_count
        
    def fetch_real_apartment_data(self, district_code, district_name, deal_ymd="202407"):
        """실제 아파트 실거래가 API 호출"""
        url = "http://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev"
        
        # 디코딩된 키 직접 사용
        params = {
            'serviceKey': self.service_key,
            'pageNo': '1',
            'numOfRows': '100',
            'LAWD_CD': district_code,
            'DEAL_YMD': deal_ymd
        }
        
        try:
            print(f"🏛️  {district_name} 실거래가 API 호출...")
            # SSL 검증 비활성화 및 헤더 추가
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
            response = requests.get(url, params=params, timeout=30, headers=headers)
            
            print(f"📡 응답 상태: {response.status_code}")
            print(f"📄 응답 길이: {len(response.content)} bytes")
            
            if response.status_code == 200:
                # XML 파싱
                try:
                    root = ET.fromstring(response.content)
                    
                    # 에러 체크 (가이드에 따른 수정)
                    result_code = root.find('.//resultCode')
                    result_msg = root.find('.//resultMsg')
                    
                    if result_code is not None and result_code.text != '000':
                        print(f"❌ API 오류: {result_msg.text if result_msg is not None else '알 수 없는 오류'}")
                        return []
                    
                    # 실제 데이터 파싱
                    items = root.findall('.//item')
                    print(f"📦 파싱된 아이템 수: {len(items)}")
                    
                    real_transactions = []
                    for item in items:
                        try:
                            # 실제 거래 데이터 추출 (가이드에 맞는 필드명 사용)
                            apt_name = self.get_text(item, 'aptNm')
                            dong = self.get_text(item, 'umdNm')  # 법정동
                            area = self.get_float(item, 'excluUseAr')  # 전용면적
                            floor = self.get_int(item, 'floor')
                            price_text = self.get_text(item, 'dealAmount')  # 거래금액
                            build_year = self.get_int(item, 'buildYear')
                            deal_year = self.get_int(item, 'dealYear')
                            deal_month = self.get_int(item, 'dealMonth')
                            deal_day = self.get_int(item, 'dealDay')
                            
                            # 가격 파싱 (쉼표 제거)
                            price = int(price_text.replace(',', '').replace(' ', '')) if price_text else 0
                            
                            if all([apt_name, dong, area > 0, price > 0]):
                                real_transactions.append({
                                    'apt_name': apt_name,
                                    'dong': dong,
                                    'area': area,
                                    'floor': floor,
                                    'price': price * 10000,  # 만원 -> 원
                                    'build_year': build_year,
                                    'deal_date': f"{deal_year}-{deal_month:02d}-{deal_day:02d}",
                                    'district': district_name,
                                    'transaction_type': '매매'
                                })
                                
                        except Exception as e:
                            print(f"⚠️  데이터 파싱 오류: {e}")
                            continue
                    
                    print(f"✅ {district_name} 실제 거래 데이터 {len(real_transactions)}건 수집")
                    return real_transactions
                    
                except ET.ParseError as e:
                    print(f"❌ XML 파싱 오류: {e}")
                    print(f"📄 응답 내용 (처음 500자): {response.text[:500]}")
                    return []
                    
            else:
                print(f"❌ API 호출 실패: {response.status_code}")
                print(f"📄 응답 내용: {response.text[:500]}")
                return []
                
        except Exception as e:
            print(f"❌ API 호출 오류: {e}")
            return []
    
    def get_text(self, item, tag_name):
        """XML 요소에서 텍스트 안전하게 추출"""
        element = item.find(tag_name)
        return element.text.strip() if element is not None and element.text else ""
    
    def get_int(self, item, tag_name):
        """XML 요소에서 정수 안전하게 추출"""
        text = self.get_text(item, tag_name)
        try:
            return int(text) if text else 0
        except ValueError:
            return 0
    
    def get_float(self, item, tag_name):
        """XML 요소에서 실수 안전하게 추출"""
        text = self.get_text(item, tag_name)
        try:
            return float(text) if text else 0.0
        except ValueError:
            return 0.0
    
    def get_coordinates_by_geocoding(self, address):
        """카카오 지오코딩 API로 주소를 위도/경도로 변환"""
        # 캐시 확인
        if address in self.geocoding_cache:
            return self.geocoding_cache[address]
        
        # OpenStreetMap Nominatim API 사용 (API 키 불필요)
        
        try:
            # OpenStreetMap Nominatim API 사용 (무료, API 키 불필요)
            url = "https://nominatim.openstreetmap.org/search"
            headers = {"User-Agent": "Uni-con-Real-Estate-App/1.0"}
            params = {
                "q": address,
                "format": "json",
                "limit": 1,
                "countrycodes": "kr"
            }
            
            response = requests.get(url, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if data:
                    # 첫 번째 결과 사용
                    location = data[0]
                    lat = float(location.get('lat', 37.5665))
                    lng = float(location.get('lon', 126.9780))
                    coords = (lat, lng)
                    
                    # 캐시에 저장
                    self.geocoding_cache[address] = coords
                    print(f"📍 OSM 지오코딩 성공: {address} → ({lat:.6f}, {lng:.6f})")
                    return coords
                else:
                    print(f"⚠️ OSM 지오코딩 결과 없음: {address}")
            else:
                print(f"⚠️ OSM 지오코딩 API 오류: {response.status_code}")
                
        except Exception as e:
            print(f"⚠️ OSM 지오코딩 오류: {e}")
        
        # 실패시 구/동 기반 기본 좌표 + 랜덤 오프셋
        fallback_coords = self.get_fallback_coordinates(address)
        self.geocoding_cache[address] = fallback_coords
        return fallback_coords
    
    def get_fallback_coordinates(self, address):
        """지오코딩 실패시 구/동 기반 정확한 좌표"""
        coords_map = {
            # 강남 3구 (서울 남동쪽)
            '강남구': (37.5172, 127.0473),
            '서초구': (37.4937, 127.0200),
            '송파구': (37.5145, 127.1050),
            
            # 동쪽 구들 
            '강동구': (37.5301, 127.1238),  # 실제 강동구 중심
            '광진구': (37.5384, 127.0822),
            
            # 서쪽 구들
            '마포구': (37.5663, 126.9019),
            '용산구': (37.5326, 126.9905),
            '영등포구': (37.5264, 126.8962),
            '서대문구': (37.5791, 126.9368),
            '은평구': (37.6176, 126.9227),
            
            # 북쪽 구들
            '성북구': (37.5894, 127.0167),
            '강북구': (37.6398, 127.0256),
            '도봉구': (37.6687, 127.0471),
            '노원구': (37.6542, 127.0568),
            
            # 중심 구들
            '종로구': (37.5735, 126.9788),
            '중구': (37.5641, 126.9979),
            '중랑구': (37.6066, 127.0925),
            
            # 남쪽 구들  
            '동작구': (37.5124, 126.9393),
            '관악구': (37.4781, 126.9514),
            '금천구': (37.4519, 126.9019),
            '구로구': (37.4954, 126.8874),
            '양천구': (37.5169, 126.8664),
            '강서구': (37.5509, 126.8495),
        }
        
        # 주소에서 구 이름 찾기
        for district, coords in coords_map.items():
            if district in address:
                # 랜덤 오프셋 추가 (반경 약 1km 내)
                offset_lat = random.uniform(-0.005, 0.005)
                offset_lng = random.uniform(-0.005, 0.005)
                final_coords = (coords[0] + offset_lat, coords[1] + offset_lng)
                print(f"📍 {district} 폴백 좌표 사용: {address} → {final_coords}")
                return final_coords
        
        # 기본 서울 중심 좌표 + 랜덤 오프셋
        base_lat, base_lng = 37.5665, 126.9780
        offset_lat = random.uniform(-0.02, 0.02)
        offset_lng = random.uniform(-0.02, 0.02)
        final_coords = (base_lat + offset_lat, base_lng + offset_lng)
        print(f"⚠️ 구별 매핑 실패, 기본 좌표 사용: {address} → {final_coords}")
        return final_coords
    
    def save_real_transactions(self, transactions):
        """실제 거래 데이터를 DB에 저장"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        saved_count = 0
        
        for tx in transactions:
            try:
                address = f"서울특별시 {tx['district']} {tx['dong']} {tx['apt_name']}"
                lat, lng = self.get_coordinates_by_geocoding(address)
                
                # API 호출 간격 (지오코딩 API 제한 고려)
                time.sleep(0.1)
                
                # 고유 ID 생성
                room_id = f"real_api_{tx['district']}_{tx['apt_name']}_{tx['dong']}_{tx['floor']}_{tx['deal_date'].replace('-', '')}"
                
                room_data = {
                    'room_id': room_id,
                    'address': address,
                    'latitude': lat,
                    'longitude': lng,
                    'transaction_type': tx['transaction_type'],
                    'price_deposit': tx['price'],
                    'price_monthly': 0,
                    'area': tx['area'],
                    'rooms': 3 if tx['area'] > 84 else (2 if tx['area'] > 59 else 1),
                    'floor': tx['floor'],
                    'building_year': tx['build_year'],
                    'description': f"{tx['apt_name']} 실거래 매물 ({tx['deal_date']})",
                    'landlord_name': '국토교통부 실거래',
                    'landlord_phone': '공개불가',
                    'risk_score': 0,
                    'view_count': 0,
                    'favorite_count': 0,
                    'is_active': True
                }
                
                cursor.execute('''
                    INSERT OR REPLACE INTO rooms (
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
                print(f"💾 저장: {tx['apt_name']} - {tx['price']:,}만원")
                
            except Exception as e:
                print(f"❌ 저장 실패: {e}")
                continue
        
        conn.commit()
        conn.close()
        return saved_count
    
    async def run_real_api_crawling(self):
        """실제 API 크롤링 실행"""
        print("=== 국토교통부 실제 실거래가 API 크롤링 시작 ===")
        
        # 기존 가짜 데이터 삭제
        self.clear_fake_data()
        
        all_transactions = []
        
        # 최근 몇 개월 데이터 수집 (2024년 최신 데이터)
        recent_months = ["202407", "202408", "202406"]
        
        for district_name, district_code in list(self.seoul_districts.items())[:5]:  # 주요 5개 구만 우선
            for month in recent_months[:3]:  # 최근 3개월
                try:
                    print(f"\n📍 {district_name} {month} 데이터 수집 중...")
                    transactions = self.fetch_real_apartment_data(district_code, district_name, month)
                    all_transactions.extend(transactions)
                    
                    # API 요청 간격
                    time.sleep(1)
                    
                except Exception as e:
                    print(f"❌ {district_name} {month} 크롤링 실패: {e}")
                    continue
        
        # 데이터베이스에 저장
        if all_transactions:
            print(f"\n💾 총 {len(all_transactions)}건의 실제 거래 데이터를 저장 중...")
            saved_count = self.save_real_transactions(all_transactions)
            
            print(f"✅ 실제 데이터 크롤링 완료!")
            print(f"📊 수집: {len(all_transactions)}건 | 저장: {saved_count}건")
            
            return {
                'total_crawled': len(all_transactions),
                'total_saved': saved_count,
                'success_rate': f"{(saved_count/len(all_transactions)*100):.1f}%" if all_transactions else "0%",
                'source': '국토교통부 실거래가 API'
            }
        else:
            print("❌ 수집된 실제 데이터가 없습니다.")
            return {'total_crawled': 0, 'total_saved': 0, 'success_rate': '0%'}

if __name__ == "__main__":
    import asyncio
    
    async def main():
        crawler = RealAPIDataCrawler()
        result = await crawler.run_real_api_crawling()
        print("\n📈 최종 결과:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    
    asyncio.run(main())