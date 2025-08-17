import asyncio
import sqlite3
import json
import re
import requests
from datetime import datetime
from typing import List, Dict, Optional
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import time
import random

DATABASE_PATH = "users.db"


class RealEstateCrawler:
    def __init__(self):
        self.db_path = DATABASE_PATH
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }

    async def crawl_naver_real_estate(self, region="1168000000", page_limit=5):
        """네이버 부동산에서 실제 데이터 크롤링"""
        print(f"🏠 네이버 부동산 크롤링 시작...")
        
        rooms_data = []
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            # User-Agent 설정
            await page.set_extra_http_headers(self.headers)
            
            for page_num in range(1, page_limit + 1):
                try:
                    # 네이버 부동산 원룸 검색 URL
                    url = f"https://new.land.naver.com/rooms?ms={region}&rt=0201&ptk=A1A3"
                    
                    print(f"📄 페이지 {page_num} 크롤링 중: {url}")
                    await page.goto(url, wait_until='networkidle')
                    await page.wait_for_timeout(3000)  # 페이지 로딩 대기
                    
                    # 방 리스트 요소들 찾기
                    await page.wait_for_selector('.item_list', timeout=10000)
                    
                    # 각 방 정보 추출
                    room_elements = await page.query_selector_all('.item_list .item')
                    
                    for idx, room_element in enumerate(room_elements):
                        try:
                            # 제목/주소
                            title_elem = await room_element.query_selector('.item_title')
                            title = await title_elem.inner_text() if title_elem else f"방 {idx+1}"
                            
                            # 가격 정보
                            price_elem = await room_element.query_selector('.price_line')
                            price_text = await price_elem.inner_text() if price_elem else "0"
                            
                            # 가격 파싱
                            deposit, monthly = self.parse_price(price_text)
                            
                            # 거래 유형 결정
                            if monthly > 0:
                                transaction_type = "월세"
                            elif "전세" in price_text or deposit > 50000:
                                transaction_type = "전세"
                            else:
                                transaction_type = "매매"
                            
                            # 면적 정보
                            area_elem = await room_element.query_selector('.area')
                            area_text = await area_elem.inner_text() if area_elem else "20㎡"
                            area = self.parse_area(area_text)
                            
                            # 주소 정보
                            address_elem = await room_element.query_selector('.item_address')
                            address = await address_elem.inner_text() if address_elem else title
                            
                            # 위치 정보 (기본값으로 서울 좌표 사용)
                            lat, lng = await self.get_coordinates_from_address(address, page)
                            
                            # 기타 정보
                            detail_elem = await room_element.query_selector('.item_detail')
                            detail_text = await detail_elem.inner_text() if detail_elem else ""
                            
                            room_data = {
                                'room_id': f'naver_{hash(address + price_text)}{idx}',
                                'address': address,
                                'latitude': lat,
                                'longitude': lng,
                                'transaction_type': transaction_type,
                                'price_deposit': deposit,
                                'price_monthly': monthly,
                                'area': area,
                                'rooms': self.extract_room_count(title + detail_text),
                                'floor': self.extract_floor(detail_text),
                                'building_year': self.extract_building_year(detail_text),
                                'description': title,
                                'landlord_name': '정보비공개',
                                'landlord_phone': '문의필요',
                                'risk_score': 0,
                                'view_count': 0,
                                'favorite_count': 0,
                                'is_active': True
                            }
                            
                            rooms_data.append(room_data)
                            print(f"✅ 방 정보 수집: {address} - {price_text}")
                            
                        except Exception as e:
                            print(f"❌ 방 정보 추출 실패: {e}")
                            continue
                    
                    # 다음 페이지로 이동하거나 대기
                    await page.wait_for_timeout(2000)
                    
                except Exception as e:
                    print(f"❌ 페이지 {page_num} 크롤링 실패: {e}")
                    continue
            
            await browser.close()
        
        print(f"🎉 네이버 부동산 크롤링 완료: {len(rooms_data)}개 방 정보 수집")
        return rooms_data

    async def crawl_zigbang(self, region_id=1, page_limit=3):
        """직방에서 실제 데이터 크롤링"""
        print(f"🏠 직방 크롤링 시작...")
        
        rooms_data = []
        
        # 직방 API 엔드포인트 (공개 API)
        base_url = "https://apis.zigbang.com/v2/items"
        
        for page in range(1, page_limit + 1):
            try:
                params = {
                    'domain': 'zigbang',
                    'geohash': 'wydm6',  # 서울 지역 geohash
                    'needHasNoFiltered': 'true',
                    'zoom': 12,
                    'page': page,
                    'room_type': [1, 2, 3],  # 원룸, 투룸, 쓰리룸
                    'sales_type': [0, 1],  # 월세, 전세
                }
                
                print(f"📄 직방 페이지 {page} 요청 중...")
                response = requests.get(base_url, params=params, headers=self.headers)
                
                if response.status_code == 200:
                    data = response.json()
                    items = data.get('items', [])
                    
                    for item in items:
                        try:
                            item_id = item.get('item_id')
                            
                            # 상세 정보 요청
                            detail_url = f"https://apis.zigbang.com/v2/items/{item_id}"
                            detail_response = requests.get(detail_url, headers=self.headers)
                            
                            if detail_response.status_code == 200:
                                detail = detail_response.json()
                                
                                # 가격 정보
                                deposit = detail.get('deposit', 0) // 10000  # 만원 단위로 변환
                                rent = detail.get('rent', 0)
                                sales_type = detail.get('sales_type')
                                
                                if sales_type == 0:  # 월세
                                    transaction_type = "월세"
                                    price_deposit = deposit
                                    price_monthly = rent
                                else:  # 전세
                                    transaction_type = "전세"
                                    price_deposit = deposit
                                    price_monthly = 0
                                
                                # 주소 정보
                                address = detail.get('address1', '') + ' ' + detail.get('address2', '')
                                
                                # 위치 정보
                                lat = detail.get('lat', 37.5665)
                                lng = detail.get('lng', 126.9780)
                                
                                # 기타 정보
                                area = detail.get('size_m2', 20)
                                floor = detail.get('floor', 1)
                                building_year = detail.get('building_year', 2000)
                                room_count = detail.get('room_type', 1)
                                
                                room_data = {
                                    'room_id': f'zigbang_{item_id}',
                                    'address': address.strip(),
                                    'latitude': lat,
                                    'longitude': lng,
                                    'transaction_type': transaction_type,
                                    'price_deposit': price_deposit,
                                    'price_monthly': price_monthly,
                                    'area': area,
                                    'rooms': room_count,
                                    'floor': floor,
                                    'building_year': building_year,
                                    'description': detail.get('title', '직방 매물'),
                                    'landlord_name': '정보비공개',
                                    'landlord_phone': '직방문의',
                                    'risk_score': 0,
                                    'view_count': 0,
                                    'favorite_count': 0,
                                    'is_active': True
                                }
                                
                                rooms_data.append(room_data)
                                print(f"✅ 직방 매물 수집: {address} - {transaction_type}")
                                
                                # API 요청 간격
                                await asyncio.sleep(0.5)
                            
                        except Exception as e:
                            print(f"❌ 직방 매물 정보 추출 실패: {e}")
                            continue
                
                # 페이지 요청 간격
                await asyncio.sleep(1)
                
            except Exception as e:
                print(f"❌ 직방 페이지 {page} 요청 실패: {e}")
                continue
        
        print(f"🎉 직방 크롤링 완료: {len(rooms_data)}개 방 정보 수집")
        return rooms_data

    def parse_price(self, price_text):
        """가격 텍스트를 파싱하여 보증금과 월세 추출"""
        try:
            # 숫자와 단위 추출
            numbers = re.findall(r'(\d+(?:,\d+)*)', price_text)
            
            if "월세" in price_text or "/" in price_text:
                # 월세 형태: "보증금/월세"
                if len(numbers) >= 2:
                    deposit = int(numbers[0].replace(',', ''))
                    monthly = int(numbers[1].replace(',', ''))
                else:
                    deposit = int(numbers[0].replace(',', '')) if numbers else 0
                    monthly = 50  # 기본 월세
            elif "전세" in price_text:
                # 전세
                deposit = int(numbers[0].replace(',', '')) if numbers else 10000
                monthly = 0
            else:
                # 매매 (억원 단위)
                deposit = int(numbers[0].replace(',', '')) * 10000 if numbers else 50000
                monthly = 0
            
            return deposit, monthly
            
        except Exception:
            return 10000, 50  # 기본값

    def parse_area(self, area_text):
        """면적 텍스트에서 숫자 추출"""
        try:
            numbers = re.findall(r'(\d+(?:\.\d+)?)', area_text)
            return float(numbers[0]) if numbers else 20.0
        except Exception:
            return 20.0

    async def get_coordinates_from_address(self, address, page):
        """주소로부터 좌표 추출 (기본 서울 좌표 사용)"""
        try:
            # 실제로는 geocoding API를 사용해야 하지만, 
            # 여기서는 서울 지역 기본 좌표 사용
            if "강남" in address:
                return 37.4979, 127.0276
            elif "서초" in address:
                return 37.4835, 127.0185
            elif "마포" in address:
                return 37.5563, 126.9236
            elif "종로" in address:
                return 37.5704, 126.9770
            elif "성북" in address:
                return 37.5894, 127.0167
            else:
                return 37.5665, 126.9780  # 서울 중심
        except Exception:
            return 37.5665, 126.9780

    def extract_room_count(self, text):
        """텍스트에서 방 개수 추출"""
        if "원룸" in text or "1룸" in text:
            return 1
        elif "투룸" in text or "2룸" in text:
            return 2
        elif "쓰리룸" in text or "3룸" in text:
            return 3
        else:
            return 1

    def extract_floor(self, text):
        """텍스트에서 층수 정보 추출"""
        try:
            floor_match = re.search(r'(\d+)층', text)
            return int(floor_match.group(1)) if floor_match else 1
        except Exception:
            return 1

    def extract_building_year(self, text):
        """텍스트에서 건물 연도 추출"""
        try:
            year_match = re.search(r'(19|20)\d{2}', text)
            return int(year_match.group(0)) if year_match else 2010
        except Exception:
            return 2010

    def save_rooms_to_db(self, rooms_data):
        """방 데이터를 데이터베이스에 저장"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        saved_count = 0
        
        for room in rooms_data:
            try:
                cursor.execute('''
                    INSERT INTO rooms (
                        room_id, address, latitude, longitude, transaction_type,
                        price_deposit, price_monthly, area, rooms, floor,
                        building_year, description, landlord_name, landlord_phone,
                        risk_score, view_count, favorite_count, is_active, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    room['room_id'], room['address'], room['latitude'], room['longitude'],
                    room['transaction_type'], room['price_deposit'], room['price_monthly'],
                    room['area'], room['rooms'], room['floor'], room['building_year'],
                    room['description'], room['landlord_name'], room['landlord_phone'],
                    room['risk_score'], room['view_count'], room['favorite_count'],
                    room['is_active'], datetime.now()
                ))
                saved_count += 1
                
            except sqlite3.IntegrityError:
                # 중복 room_id 처리
                print(f"중복 매물: {room['room_id']}")
                continue
            except Exception as e:
                print(f"저장 실패: {room['room_id']} - {e}")
                continue
        
        conn.commit()
        conn.close()
        
        return saved_count

    async def run_real_crawling(self):
        """실제 부동산 사이트에서 크롤링 실행"""
        print("=== 실제 부동산 사이트 크롤링 시작 ===")
        
        all_rooms = []
        
        try:
            # 네이버 부동산 크롤링
            print("\n🔍 네이버 부동산 크롤링...")
            naver_rooms = await self.crawl_naver_real_estate(page_limit=3)
            all_rooms.extend(naver_rooms)
            
        except Exception as e:
            print(f"❌ 네이버 부동산 크롤링 실패: {e}")
        
        try:
            # 직방 크롤링
            print("\n🔍 직방 크롤링...")
            zigbang_rooms = await self.crawl_zigbang(page_limit=3)
            all_rooms.extend(zigbang_rooms)
            
        except Exception as e:
            print(f"❌ 직방 크롤링 실패: {e}")
        
        # 데이터베이스에 저장
        if all_rooms:
            print(f"\n💾 총 {len(all_rooms)}개 실제 매물을 데이터베이스에 저장 중...")
            saved_count = self.save_rooms_to_db(all_rooms)
            
            print(f"✅ 실제 크롤링 완료: {saved_count}개 매물 저장됨")
            
            return {
                'total_crawled': len(all_rooms),
                'total_saved': saved_count,
                'naver_count': len([r for r in all_rooms if r['room_id'].startswith('naver_')]),
                'zigbang_count': len([r for r in all_rooms if r['room_id'].startswith('zigbang_')]),
                'success_rate': f"{(saved_count/len(all_rooms)*100):.1f}%" if all_rooms else "0%"
            }
        else:
            print("❌ 크롤링된 데이터가 없습니다.")
            return {
                'total_crawled': 0,
                'total_saved': 0,
                'naver_count': 0,
                'zigbang_count': 0,
                'success_rate': "0%"
            }


if __name__ == "__main__":
    async def main():
        crawler = RealEstateCrawler()
        result = await crawler.run_real_crawling()
        print("\n📊 실제 크롤링 결과:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    
    asyncio.run(main())