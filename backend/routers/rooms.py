from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from database.connection import get_db_connection
from models.room import Room, RoomCreate, RoomPin
import uuid

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.get("/search/text", response_model=List[RoomPin])
async def search_rooms_by_text(
    query: str = Query(..., description="검색어 (주소, 지역명 등)"),
    limit: int = Query(100, description="결과 개수 제한"),
):
    """텍스트 기반 방 검색"""

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 주소, 설명, 거래유형에서 검색어를 포함하는 방 검색
        search_query = f"%{query}%"

        sql = """
            SELECT room_id, address, latitude, longitude, price_deposit, price_monthly,
                   transaction_type, area, rooms, risk_score, favorite_count
            FROM rooms
            WHERE is_active = 1
            AND (
                address LIKE ? OR
                description LIKE ? OR
                transaction_type LIKE ?
            )
            ORDER BY view_count DESC, favorite_count DESC
            LIMIT ?
        """

        cursor.execute(sql, (search_query, search_query, search_query, limit))
        results = cursor.fetchall()

        # 결과를 RoomPin 모델로 변환
        rooms = []
        for row in results:
            room = RoomPin(
                room_id=row[0],
                address=row[1],
                latitude=row[2],
                longitude=row[3],
                price_deposit=row[4],
                price_monthly=row[5],
                transaction_type=row[6],
                area=row[7],
                rooms=row[8] or 1,
                risk_score=row[9],
                favorite_count=row[10],
            )
            rooms.append(room)

        return rooms

    except Exception as e:
        print(f"Error searching rooms by text: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/search", response_model=List[RoomPin])
async def search_rooms_on_map(
    lat_min: float = Query(..., description="최소 위도"),
    lat_max: float = Query(..., description="최대 위도"),
    lng_min: float = Query(..., description="최소 경도"),
    lng_max: float = Query(..., description="최대 경도"),
    min_price: Optional[int] = Query(None, description="최소 보증금"),
    max_price: Optional[int] = Query(None, description="최대 보증금"),
    transaction_type: Optional[str] = Query(None, description="거래 유형 (전세/월세)"),
):
    """지도 범위 내 방 목록 조회 (핀 표시용)"""

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 기본 쿼리
        query = """
            SELECT room_id, address, latitude, longitude, price_deposit, price_monthly,
                   transaction_type, area, rooms, risk_score, favorite_count
            FROM rooms
            WHERE is_active = 1
            AND latitude BETWEEN ? AND ?
            AND longitude BETWEEN ? AND ?
        """
        params = [lat_min, lat_max, lng_min, lng_max]

        # 가격 필터 추가
        if min_price is not None:
            query += " AND price_deposit >= ?"
            params.append(min_price)

        if max_price is not None:
            query += " AND price_deposit <= ?"
            params.append(max_price)

        # 거래 유형 필터 추가
        if transaction_type:
            query += " AND transaction_type = ?"
            params.append(transaction_type)

        # 모든 매물 반환 (프론트엔드에서 클러스터링 처리)
        query += " ORDER BY room_id LIMIT 3000"

        cursor.execute(query, params)
        results = cursor.fetchall()

        # 결과를 RoomPin 모델로 변환
        rooms = []
        for row in results:
            room = RoomPin(
                room_id=row[0],
                address=row[1],
                latitude=row[2],
                longitude=row[3],
                price_deposit=row[4],
                price_monthly=row[5],
                transaction_type=row[6],
                area=row[7],
                rooms=row[8] or 1,  # rooms 필드 추가
                risk_score=row[9],
                favorite_count=row[10],
            )
            rooms.append(room)

        return rooms

    except Exception as e:
        print(f"Error searching rooms: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/{room_id}", response_model=Room)
async def get_room_detail(room_id: str):
    """특정 방 상세 정보 조회 (핀 클릭 시)"""

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 조회수 증가
        cursor.execute(
            "UPDATE rooms SET view_count = view_count + 1 WHERE room_id = ?", (room_id,)
        )

        # 방 상세 정보 조회
        cursor.execute(
            """
            SELECT room_id, address, latitude, longitude, transaction_type, price_deposit,
                   price_monthly, area, rooms, floor, building_year, description,
                   landlord_name, landlord_phone, risk_score, view_count, favorite_count, created_at
            FROM rooms
            WHERE room_id = ? AND is_active = 1
        """,
            (room_id,),
        )

        result = cursor.fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="Room not found")

        conn.commit()  # 조회수 업데이트 커밋

        # Room 모델로 변환
        room = Room(
            room_id=result[0],
            address=result[1],
            latitude=result[2],
            longitude=result[3],
            transaction_type=result[4],
            price_deposit=result[5],
            price_monthly=result[6],
            area=result[7],
            rooms=result[8],
            floor=result[9],
            building_year=result[10],
            description=result[11],
            landlord_name=result[12],
            landlord_phone=result[13],
            risk_score=result[14],
            view_count=result[15],
            favorite_count=result[16],
            created_at=result[17],
        )

        return room

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting room detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.post("/", response_model=dict)
async def create_room(room_data: RoomCreate):
    """새 방 정보 등록"""

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 고유 room_id 생성
        room_id = f"room_{uuid.uuid4().hex[:8]}"

        cursor.execute(
            """
            INSERT INTO rooms (
                room_id, address, latitude, longitude, transaction_type,
                price_deposit, price_monthly, area, rooms, floor, building_year,
                description, landlord_name, landlord_phone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                room_id,
                room_data.address,
                room_data.latitude,
                room_data.longitude,
                room_data.transaction_type,
                room_data.price_deposit,
                room_data.price_monthly,
                room_data.area,
                room_data.rooms,
                room_data.floor,
                room_data.building_year,
                room_data.description,
                room_data.landlord_name,
                room_data.landlord_phone,
            ),
        )

        conn.commit()

        return {"message": "Room created successfully", "room_id": room_id}

    except Exception as e:
        conn.rollback()
        print(f"Error creating room: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/{room_id}/market-price")
async def get_market_price(room_id: str):
    """방 시세 정보 조회 (전세사기 예방용)"""

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 해당 방 정보 조회
        cursor.execute(
            """
            SELECT address, price_deposit, transaction_type, area
            FROM rooms
            WHERE room_id = ? AND is_active = 1
        """,
            (room_id,),
        )

        result = cursor.fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="Room not found")

        address, price_deposit, transaction_type, area = result

        # 주변 유사 매물 조회 (같은 주소 기반)
        cursor.execute(
            """
            SELECT price_deposit, area, transaction_type, created_at
            FROM rooms
            WHERE address LIKE ? AND room_id != ? AND is_active = 1
            ORDER BY created_at DESC LIMIT 5
        """,
            (f"%{address.split()[0]}%", room_id),
        )  # 첫번째 주소 단어로 검색

        nearby_prices = cursor.fetchall()

        # 평균 시세 계산
        if nearby_prices:
            avg_price = sum(row[0] for row in nearby_prices) / len(nearby_prices)
            avg_price_per_sqm = avg_price / area if area > 0 else 0
        else:
            avg_price = price_deposit
            avg_price_per_sqm = price_deposit / area if area > 0 else 0

        return {
            "room_id": room_id,
            "current_price": price_deposit,
            "average_price": int(avg_price),
            "price_per_sqm": int(avg_price_per_sqm),
            "nearby_count": len(nearby_prices),
            "price_analysis": {
                "is_expensive": price_deposit > avg_price * 1.2,
                "is_cheap": price_deposit < avg_price * 0.8,
                "price_difference_percent": (
                    round((price_deposit - avg_price) / avg_price * 100, 1)
                    if avg_price > 0
                    else 0
                ),
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting market price: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
