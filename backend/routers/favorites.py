from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from database.connection import get_db_connection
from models.favorite import Favorite, FavoriteUser, RoomSummary
from models.user import User  # 사용자 정보용
import session

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.post("/")
async def add_favorite(favorite_data: Favorite):
    """방 찜하기"""

    # 로그인 체크
    if session.current_user_session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not logged in"
        )

    user_id = session.current_user_session["id"]
    room_id = favorite_data.room_id

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 이미 찜했는지 확인
        cursor.execute(
            """
            SELECT id FROM favorites
            WHERE user_id = ? AND room_id = ?         """,
            (user_id, room_id),
        )

        existing = cursor.fetchone()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already added to favorites",
            )

        # 방이 존재하는지 확인
        cursor.execute(
            "SELECT room_id FROM rooms WHERE room_id = ? AND is_active = 1", (room_id,)
        )
        room_exists = cursor.fetchone()
        if not room_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Room not found"
            )

        # 찜 추가
        cursor.execute(
            """
            INSERT INTO favorites (user_id, room_id)
            VALUES (?, ?)
        """,
            (user_id, room_id),
        )

        # 방의 찜 횟수 업데이트
        cursor.execute(
            """
            UPDATE rooms
            SET favorite_count = favorite_count + 1
            WHERE room_id = ?
        """,
            (room_id,),
        )

        conn.commit()

        return {
            "message": "Added to favorites successfully",
            "user_id": user_id,
            "room_id": room_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f"Error adding favorite: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.delete("/{room_id}")
async def remove_favorite(room_id: str):
    """찜 취소"""

    # 로그인 체크
    if session.current_user_session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not logged in"
        )

    user_id = session.current_user_session["id"]

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 찜이 존재하는지 확인
        cursor.execute(
            """
            SELECT id FROM favorites
            WHERE user_id = ? AND room_id = ?         """,
            (user_id, room_id),
        )

        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Favorite not found"
            )

        # 찜 삭제 (hard delete - favorites 테이블에 is_active 컬럼 없음)
        cursor.execute(
            """
            DELETE FROM favorites
            WHERE user_id = ? AND room_id = ?
        """,
            (user_id, room_id),
        )

        # 방의 찜 횟수 감소
        cursor.execute(
            """
            UPDATE rooms
            SET favorite_count = favorite_count - 1
            WHERE room_id = ?
        """,
            (room_id,),
        )

        conn.commit()

        return {
            "message": "Removed from favorites successfully",
            "user_id": user_id,
            "room_id": room_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f"Error removing favorite: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/{room_id}/users", response_model=List[FavoriteUser])
async def get_room_favorites(room_id: str):
    """특정 방을 찜한 사람들 리스트"""

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 방이 존재하는지 확인
        cursor.execute(
            "SELECT room_id FROM rooms WHERE room_id = ? AND is_active = 1", (room_id,)
        )
        room_exists = cursor.fetchone()
        if not room_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Room not found"
            )

        # 찜한 사용자들 조회 (users 테이블과 조인)
        cursor.execute(
            """
            SELECT f.user_id, u.nickname, u.age, u.gender, u.occupation,
                   u.profile_image, f.created_at
            FROM favorites f
            JOIN users u ON f.user_id = u.id
            WHERE f.room_id = ?             ORDER BY f.created_at DESC
        """,
            (room_id,),
        )

        results = cursor.fetchall()

        # FavoriteUser 모델로 변환
        favorite_users = []
        for row in results:
            user = FavoriteUser(
                user_id=row[0],
                nickname=row[1] or "Unknown",
                age=row[2],
                gender=row[3],
                occupation=row[4],
                profile_image=row[5],
                matching_score=0,  # 나중에 매칭 알고리즘 구현
                favorite_date=row[6],
            )
            favorite_users.append(user)

        return favorite_users

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting room favorites: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/user/{user_id}", response_model=List[RoomSummary])
async def get_user_favorites(user_id: str):
    """사용자가 찜한 방 목록"""

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 사용자가 찜한 방들 조회 (rooms 테이블과 조인)
        cursor.execute(
            """
            SELECT r.room_id, r.address, r.price_deposit, r.price_monthly,
                   r.transaction_type, r.area, r.risk_score
            FROM favorites f
            JOIN rooms r ON f.room_id = r.room_id
            WHERE f.user_id = ? AND r.is_active = 1
            ORDER BY f.created_at DESC
        """,
            (user_id,),
        )

        results = cursor.fetchall()

        # RoomSummary 모델로 변환
        favorite_rooms = []
        for row in results:
            room = RoomSummary(
                room_id=row[0],
                address=row[1],
                price_deposit=row[2],
                price_monthly=row[3],
                transaction_type=row[4],
                area=row[5],
                risk_score=row[6],
                thumbnail_image=None,  # 나중에 이미지 기능 구현
            )
            favorite_rooms.append(room)

        return favorite_rooms

    except Exception as e:
        print(f"Error getting user favorites: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/my-favorites", response_model=List[RoomSummary])
async def get_my_favorites():
    """내가 찜한 방 목록"""

    # 로그인 체크
    if session.current_user_session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not logged in"
        )

    user_id = session.current_user_session["id"]
    return await get_user_favorites(user_id)


@router.get("/{room_id}/matched", response_model=List[FavoriteUser])
async def get_matched_roommates(room_id: str):
    """찜한 사람들 중 나와 매칭도 높은 순으로 정렬"""

    # 로그인 체크
    if session.current_user_session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not logged in"
        )

    user_id = session.current_user_session["id"]

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 일단 기본 찜한 사람들 가져오기
        favorite_users = await get_room_favorites(room_id)

        # 나 자신은 제외
        favorite_users = [user for user in favorite_users if user.user_id != user_id]

        # TODO: 매칭 알고리즘 구현
        # 지금은 임시로 랜덤 점수 부여
        import random

        for user in favorite_users:
            user.matching_score = random.randint(60, 95)

        # 매칭 점수 높은 순으로 정렬
        favorite_users.sort(key=lambda x: x.matching_score, reverse=True)

        return favorite_users

    except Exception as e:
        print(f"Error getting matched roommates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{room_id}/check")
async def check_favorite_status(room_id: str):
    """내가 이 방을 찜했는지 확인"""

    # 로그인 체크
    if session.current_user_session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not logged in"
        )

    user_id = session.current_user_session["id"]

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT id FROM favorites
            WHERE user_id = ? AND room_id = ?         """,
            (user_id, room_id),
        )

        result = cursor.fetchone()

        return {
            "is_favorited": result is not None,
            "user_id": user_id,
            "room_id": room_id,
        }

    except Exception as e:
        print(f"Error checking favorite status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
