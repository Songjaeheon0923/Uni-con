#!/usr/bin/env python3
"""
서울시 부동산 실거래가 정보 API 크롤러
"""
import requests
import sqlite3
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

class SeoulRealEstateAPICrawler:
    def __init__(self):
        self.api_key = os.getenv("SEOUL_REAL_ESTATE_API_KEY")
        self.base_url = "http://openapi.seoul.go.kr:8088"
        self.db_path = "users.db"
        
        # 서울시 자치구 코드
        self.district_codes = {
            "강남구": "11680", "강동구": "11740", "강북구": "11305", "강서구": "11500",
            "관악구": "11620", "광진구": "11215", "구로구": "11530", "금천구": "11545",
            "노원구": "11350", "도봉구": "11320", "동대문구": "11230", "동작구": "11590",
            "마포구": "11440", "서대문구": "11410", "서초구": "11650", "성동구": "11200",
            "성북구": "11290", "송파구": "11710", "양천구": "11470", "영등포구": "11560",
            "용산구": "11170", "은평구": "11380", "종로구": "11110", "중구": "11140", "중랑구": "11260"
        }
        
        # 지오코딩을 위한 구별 중심 좌표
        self.district_center_coords = {
            "강남구": (37.5172, 127.0473),
            "강동구": (37.5301, 127.1238),
            "강북구": (37.6396, 127.0253),
            "강서구": (37.5509, 126.8495),
            "관악구": (37.4784, 126.9514),
            "광진구": (37.5388, 127.0823),
            "구로구": (37.4955, 126.8874),
            "금천구": (37.4569, 126.8956),
            "노원구": (37.6542, 127.0568),
            "도봉구": (37.6658, 127.0317),
            "동대문구": (37.5744, 127.0396),
            "동작구": (37.5124, 126.9393),
            "마포구": (37.5663, 126.9019),
            "서대문구": (37.5794, 126.9368),
            "서초구": (37.4837, 127.0324),
            "성동구": (37.5634, 127.0365),
            "성북구": (37.5894, 127.0167),
            "송파구": (37.5145, 127.1056),
            "양천구": (37.5170, 126.8663),
            "영등포구": (37.5264, 126.8962),
            "용산구": (37.5384, 126.9654),
            "은평구": (37.6027, 126.9291),
            "종로구": (37.5735, 126.9788),
            "중구": (37.5641, 126.9979),
            "중랑구": (37.6063, 127.0925)
        }

    def get_coordinates_from_address(self, district, dong, building_name=None):
        """주소를 기반으로 대략적인 좌표 생성"""
        base_lat, base_lng = self.district_center_coords.get(district, (37.5665, 126.9780))
        
        # 구 내에서 약간의 랜덤 오프셋 추가 (실제 위치 시뮬레이션)
        import random
        lat_offset = random.uniform(-0.01, 0.01)
        lng_offset = random.uniform(-0.01, 0.01)
        
        return base_lat + lat_offset, base_lng + lng_offset

    def fetch_real_estate_data(self, year=2024, district_code=None, district_name=None, start_index=1, end_index=100):
        """서울시 실거래가 API에서 데이터 가져오기"""
        url = f"{self.base_url}/{self.api_key}/xml/tbLnOpendataRtmsV/{start_index}/{end_index}"
        
        # 선택적 파라미터 추가
        params = []
        if year:
            url += f"/{year}"
            params.append(f"year={year}")
        if district_code:
            url += f"/{district_code}"
            params.append(f"district_code={district_code}")
        if district_name:
            url += f"/{district_name}"
            params.append(f"district_name={district_name}")
        
        print(f"API 요청: {url}")
        print(f"파라미터: {', '.join(params) if params else '없음'}")
        
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            # XML 파싱
            root = ET.fromstring(response.content)
            
            # 결과 확인
            result_code = root.find('.//CODE')
            result_message = root.find('.//MESSAGE')
            
            if result_code is not None:
                print(f"API 응답 코드: {result_code.text}")
                print(f"API 응답 메시지: {result_message.text}")
                
                if result_code.text != "INFO-000":
                    print(f"API 오류: {result_message.text}")
                    return []
            
            # 총 데이터 건수 확인
            total_count = root.find('.//list_total_count')
            if total_count is not None:
                print(f"총 데이터 건수: {total_count.text}")
            
            # 데이터 파싱
            properties = []
            for row in root.findall('.//row'):
                try:
                    property_data = self.parse_property_data(row)
                    if property_data:
                        properties.append(property_data)
                except Exception as e:
                    print(f"데이터 파싱 오류: {e}")
                    continue
            
            print(f"파싱된 매물 수: {len(properties)}")
            return properties
            
        except requests.exceptions.RequestException as e:
            print(f"API 요청 실패: {e}")
            return []
        except ET.ParseError as e:
            print(f"XML 파싱 실패: {e}")
            return []
        except Exception as e:
            print(f"예상치 못한 오류: {e}")
            return []

    def parse_property_data(self, row):
        """XML row 데이터를 파싱하여 매물 정보로 변환"""
        def get_text(element_name):
            element = row.find(element_name)
            return element.text if element is not None and element.text else ""
        
        # 기본 정보 추출
        district_name = get_text('CGG_NM')
        dong_name = get_text('STDG_NM')
        building_name = get_text('BLDG_NM')
        building_usage = get_text('BLDG_USG')
        
        # 주소 생성
        address = f"서울특별시 {district_name} {dong_name} {building_name}"
        
        # 좌표 생성
        latitude, longitude = self.get_coordinates_from_address(district_name, dong_name, building_name)
        
        # 가격 정보
        price_amount = get_text('THING_AMT')
        try:
            price_deposit = int(price_amount) if price_amount else 0
        except ValueError:
            price_deposit = 0
        
        # 면적 정보
        arch_area = get_text('ARCH_AREA')
        try:
            area = float(arch_area) if arch_area else 0
        except ValueError:
            area = 0
        
        # 층 정보
        floor = get_text('FLR')
        try:
            floor_num = int(floor) if floor else 1
        except ValueError:
            floor_num = 1
        
        # 건축년도
        arch_year = get_text('ARCH_YR')
        try:
            building_year = int(arch_year) if arch_year else 2000
        except ValueError:
            building_year = 2000
        
        # 거래 유형 추정 (건물 용도 기반)
        if building_usage == "아파트":
            transaction_type = "매매"
            rooms = 3  # 기본값
        elif building_usage == "오피스텔":
            transaction_type = "월세"
            rooms = 1
            price_deposit = price_deposit // 10  # 매매가를 전세가로 변환
        elif building_usage == "연립다세대":
            transaction_type = "전세" 
            rooms = 2
            price_deposit = price_deposit // 2  # 매매가를 전세가로 변환
        else:
            transaction_type = "매매"
            rooms = 2
        
        # 월세의 경우 보증금과 월세 분리
        price_monthly = 0
        if transaction_type == "월세" and price_deposit > 0:
            price_monthly = max(30, price_deposit // 100)  # 보증금의 1% 정도를 월세로
            price_deposit = price_deposit // 5  # 보증금 조정
        
        # 고유 ID 생성
        contract_day = get_text('CTRT_DAY')
        room_id = f"seoul_api_{district_name}_{building_name.replace(' ', '_')}_{dong_name}_{contract_day}"
        
        # 설명 생성
        description = f"{district_name} {dong_name} {building_name}, {building_usage}"
        if arch_area:
            description += f", 면적 {area}㎡"
        if arch_year:
            description += f", {building_year}년 건축"
        
        return {
            'room_id': room_id,
            'address': address,
            'latitude': latitude,
            'longitude': longitude,
            'transaction_type': transaction_type,
            'price_deposit': price_deposit,
            'price_monthly': price_monthly,
            'area': area,
            'rooms': rooms,
            'floor': floor_num,
            'building_year': building_year,
            'description': description,
            'landlord_name': '서울시API',
            'landlord_phone': '010-0000-0000',
            'risk_score': 0,  # API 데이터는 안전하다고 가정
            'view_count': 0,
            'favorite_count': 0,
            'is_active': True
        }

    def save_to_database(self, properties):
        """매물 데이터를 데이터베이스에 저장"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        saved_count = 0
        failed_count = 0
        
        for prop in properties:
            try:
                cursor.execute('''
                    INSERT OR IGNORE INTO rooms (
                        room_id, address, latitude, longitude, transaction_type,
                        price_deposit, price_monthly, area, rooms, floor,
                        building_year, description, landlord_name, landlord_phone,
                        risk_score, view_count, favorite_count, is_active, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    prop['room_id'], prop['address'], prop['latitude'], prop['longitude'],
                    prop['transaction_type'], prop['price_deposit'], prop['price_monthly'],
                    prop['area'], prop['rooms'], prop['floor'], prop['building_year'],
                    prop['description'], prop['landlord_name'], prop['landlord_phone'],
                    prop['risk_score'], prop['view_count'], prop['favorite_count'],
                    prop['is_active'], datetime.now()
                ))
                
                if cursor.rowcount > 0:  # 실제로 삽입된 경우
                    saved_count += 1
                    print(f"✅ 저장: {prop['address']}")
                    
            except Exception as e:
                failed_count += 1
                print(f"❌ 저장 실패 {prop['address']}: {e}")
        
        conn.commit()
        conn.close()
        
        return saved_count, failed_count

    def crawl_all_districts(self, year=2024, limit_per_district=50):
        """모든 서울시 구에서 데이터 크롤링"""
        print(f"=== 서울시 전체 구 실거래가 데이터 크롤링 시작 ({year}년) ===")
        
        total_saved = 0
        total_failed = 0
        processed_districts = []
        
        for district_name, district_code in self.district_codes.items():
            print(f"\n📍 {district_name} ({district_code}) 크롤링 중...")
            
            try:
                # API에서 데이터 가져오기
                properties = self.fetch_real_estate_data(
                    year=year,
                    district_code=district_code,
                    district_name=district_name,
                    start_index=1,
                    end_index=limit_per_district
                )
                
                if properties:
                    # 데이터베이스에 저장
                    saved, failed = self.save_to_database(properties)
                    total_saved += saved
                    total_failed += failed
                    processed_districts.append(district_name)
                    
                    print(f"✅ {district_name}: {saved}개 저장, {failed}개 실패")
                else:
                    print(f"⚠️ {district_name}: 데이터 없음")
                
                # API 요청 간격 (서버 부하 방지)
                time.sleep(1)
                
            except Exception as e:
                print(f"❌ {district_name} 크롤링 실패: {e}")
                continue
        
        print(f"\n🎉 서울시 실거래가 데이터 크롤링 완료!")
        print(f"📊 처리된 구: {len(processed_districts)}개")
        print(f"✅ 총 저장: {total_saved}개")
        print(f"❌ 총 실패: {total_failed}개")
        print(f"📈 성공률: {(total_saved/(total_saved+total_failed)*100):.1f}%" if (total_saved+total_failed) > 0 else "0%")
        
        return {
            'total_saved': total_saved,
            'total_failed': total_failed,
            'processed_districts': processed_districts,
            'success_rate': f"{(total_saved/(total_saved+total_failed)*100):.1f}%" if (total_saved+total_failed) > 0 else "0%"
        }

    def crawl_specific_district(self, district_name, year=2024, limit=100):
        """특정 구의 데이터만 크롤링"""
        if district_name not in self.district_codes:
            print(f"❌ 지원하지 않는 구: {district_name}")
            return None
            
        district_code = self.district_codes[district_name]
        print(f"=== {district_name} 실거래가 데이터 크롤링 시작 ===")
        
        properties = self.fetch_real_estate_data(
            year=year,
            district_code=district_code,
            district_name=district_name,
            start_index=1,
            end_index=limit
        )
        
        if properties:
            saved, failed = self.save_to_database(properties)
            print(f"✅ 결과: {saved}개 저장, {failed}개 실패")
            return {'saved': saved, 'failed': failed}
        else:
            print("⚠️ 데이터 없음")
            return {'saved': 0, 'failed': 0}


if __name__ == "__main__":
    crawler = SeoulRealEstateAPICrawler()
    
    # 모든 구 크롤링
    result = crawler.crawl_all_districts(year=2024, limit_per_district=30)
    print(f"\n📋 최종 결과: {result}")