import requests
import json
import time
import sqlite3
from datetime import datetime
from typing import List, Dict
import xml.etree.ElementTree as ET

DATABASE_PATH = "users.db"

class RealMarketCrawler:
    """실제 공개 API를 통한 부동산 실거래가 데이터 수집"""
    
    def __init__(self):
        self.db_path = DATABASE_PATH
        # 실제 공공데이터포털 API 키 (발급 필요)
        self.service_key = "YOUR_API_KEY_HERE"
        
    def fetch_actual_transaction_data(self, region_code="11680", deal_ymd="202312"):
        """국토교통부 아파트 실거래가 API 호출"""
        url = "http://openapi.molit.go.kr/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcAptTradeDev"
        
        params = {
            'serviceKey': self.service_key,
            'pageNo': '1',
            'numOfRows': '100',
            'LAWD_CD': region_code,  # 강남구: 11680
            'DEAL_YMD': deal_ymd
        }
        
        try:
            print(f"🏛️ 국토교통부 실거래가 API 호출: {region_code}")
            response = requests.get(url, params=params)
            
            if response.status_code == 200:
                # XML 파싱
                root = ET.fromstring(response.content)
                items = root.findall('.//item')
                
                real_transactions = []
                for item in items:
                    try:
                        # 실제 거래 데이터 추출
                        apt_name = item.find('아파트').text if item.find('아파트') is not None else ""
                        dong = item.find('법정동').text if item.find('법정동') is not None else ""
                        area = float(item.find('전용면적').text) if item.find('전용면적') is not None else 0
                        floor = int(item.find('층').text) if item.find('층') is not None else 0
                        price = int(item.find('거래금액').text.replace(',', '').replace(' ', '')) if item.find('거래금액') is not None else 0
                        build_year = int(item.find('건축년도').text) if item.find('건축년도') is not None else 2000
                        
                        real_transactions.append({
                            'apt_name': apt_name,
                            'dong': dong,
                            'area': area,
                            'floor': floor,
                            'price': price * 10000,  # 만원 -> 원
                            'build_year': build_year,
                            'transaction_type': '매매'
                        })
                        
                    except Exception as e:
                        print(f"데이터 파싱 오류: {e}")
                        continue
                
                print(f"✅ 실제 거래 데이터 {len(real_transactions)}건 수집")
                return real_transactions
                
            else:
                print(f"❌ API 호출 실패: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"❌ API 호출 오류: {e}")
            return []
    
    def get_coordinates_by_dong(self, dong_name):
        """동이름으로 좌표 추정"""
        dong_coords = {
            '역삼동': (37.5009, 127.0370),
            '삼성동': (37.5140, 127.0590),
            '청담동': (37.5272, 127.0473),
            '논현동': (37.5132, 127.0224),
            '압구정동': (37.5274, 127.0286),
            '신사동': (37.5204, 127.0233),
            '개포동': (37.4791, 127.0582),
            '서초동': (37.4935, 127.0103),
            '반포동': (37.5087, 127.0096),
            '잠원동': (37.5156, 127.0110)
        }
        return dong_coords.get(dong_name, (37.5665, 126.9780))
    
    def save_real_transactions(self, transactions):
        """실제 거래 데이터를 DB에 저장"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        saved_count = 0
        
        for tx in transactions:
            try:
                lat, lng = self.get_coordinates_by_dong(tx['dong'])
                address = f"서울특별시 강남구 {tx['dong']} {tx['apt_name']}"
                
                room_data = {
                    'room_id': f"real_{tx['apt_name']}_{tx['dong']}_{tx['floor']}_{int(time.time())}",
                    'address': address,
                    'latitude': lat,
                    'longitude': lng,
                    'transaction_type': tx['transaction_type'],
                    'price_deposit': tx['price'],
                    'price_monthly': 0,
                    'area': tx['area'],
                    'rooms': 3 if tx['area'] > 60 else (2 if tx['area'] > 35 else 1),
                    'floor': tx['floor'],
                    'building_year': tx['build_year'],
                    'description': f"{tx['apt_name']} 실거래 매물",
                    'landlord_name': '실거래정보',
                    'landlord_phone': '공개불가',
                    'risk_score': 0,
                    'view_count': 0,
                    'favorite_count': 0,
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
                
            except Exception as e:
                print(f"저장 실패: {e}")
                continue
        
        conn.commit()
        conn.close()
        return saved_count

if __name__ == "__main__":
    print("⚠️  실제 공공데이터포털 API 키가 필요합니다")
    print("🔗 https://www.data.go.kr 에서 '아파트매매 실거래가 정보' API 신청")
    print("📝 신청 후 service_key를 수정하여 사용하세요")