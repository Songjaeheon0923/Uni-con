from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
import asyncio
import json
from datetime import datetime
from models.policy import Policy, PolicyRecommendation
from utils.policy_recommender import PolicyRecommender
from crawlers.policy_crawler import PolicyCrawler
from crawlers.youth_policy_crawler import YouthPolicyCrawler
from crawlers.youth_center_crawler import YouthCenterCrawler
from auth.jwt_handler import verify_token
from database.connection import get_db_connection


router = APIRouter(prefix="/policies", tags=["policies"])
recommender = PolicyRecommender()


@router.get("/recommendations")
async def get_policy_recommendations(
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    token_data: dict = Depends(verify_token)
):
    """개인화된 정책 추천 조회"""
    try:
        user_id = token_data.get("user_id")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 사용자 맞춤 정책 조회 (지역, 연령 등 고려)
        # 전체 개수 조회
        cursor.execute("""
            SELECT COUNT(*) 
            FROM policies
            WHERE is_active = 1 
            AND ([region] = '전국' OR [region] IS NULL OR [region] = '')
        """)
        total_count = cursor.fetchone()[0]
        
        # 정책 데이터 조회
        cursor.execute(f"""
            SELECT id, source, source_id, title, organization, target, 
                   content, application_period, start_date, end_date,
                   application_url, reference_url, category, [region], details,
                   view_count, created_at
            FROM policies
            WHERE is_active = 1 
            AND ([region] = '전국' OR [region] IS NULL OR [region] = '')
            ORDER BY view_count DESC, created_at DESC
            LIMIT {limit} OFFSET {offset}
        """)
        
        policies = cursor.fetchall()
        conn.close()
        
        result = []
        for p in policies:
            try:
                details = json.loads(p[14]) if p[14] else {}
            except:
                details = {}
            result.append({
                "id": p[0],
                "source": p[1],
                "source_id": p[2], 
                "title": p[3],
                "organization": p[4],
                "target": p[5],
                "content": p[6],
                "application_period": p[7],
                "start_date": p[8],
                "end_date": p[9],
                "application_url": p[10],
                "reference_url": p[11],
                "category": p[12],
                "region": p[13],
                "details": details,
                "view_count": p[15],
                "created_at": p[16],
                "policy": {
                    "id": p[0],
                    "title": p[3],
                    "category": p[12],
                    "description": (p[6][:200] + "...") if p[6] and len(p[6]) > 200 else (p[6] or ""),
                    "url": p[10] or p[11] or ""
                },
                "reason": "맞춤 추천"
            })
        
        return {
            "data": result,
            "total_count": total_count,
            "page": (offset // limit) + 1,
            "total_pages": (total_count + limit - 1) // limit
        }
    except Exception as e:
        print(f"Error getting policy recommendations: {e}")
        raise HTTPException(status_code=500, detail="정책 추천 조회에 실패했습니다")


@router.get("/popular")
async def get_popular_policies(
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    region: Optional[str] = Query(None, description="지역 필터"),
    category: Optional[str] = Query(None, description="카테고리 필터")
):
    """인기 정책 조회 (로그인 불필요)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 전체 개수 조회
        cursor.execute("""
            SELECT COUNT(*) 
            FROM policies
            WHERE is_active = 1
        """)
        total_count = cursor.fetchone()[0]
        
        # 쿼리 실행  
        query = f"""
            SELECT id, source, source_id, title, organization, target, 
                   content, application_period, start_date, end_date,
                   application_url, reference_url, category, region, details,
                   view_count, created_at
            FROM policies
            WHERE is_active = 1
            ORDER BY view_count DESC, created_at DESC LIMIT {limit} OFFSET {offset}
        """
        cursor.execute(query)
        policies = cursor.fetchall()
        conn.close()
        
        result = []
        for p in policies:
            try:
                details = json.loads(p[14]) if p[14] else {}
            except:
                details = {}
            result.append({
                "id": p[0],
                "source": p[1],
                "source_id": p[2],
                "title": p[3],
                "organization": p[4],
                "target": p[5],
                "content": p[6],
                "application_period": p[7],
                "start_date": p[8],
                "end_date": p[9],
                "application_url": p[10],
                "reference_url": p[11],
                "category": p[12],
                "region": p[13],
                "details": details,
                "view_count": p[15],
                "created_at": p[16]
            })
        
        return {
            "data": result,
            "total_count": total_count,
            "page": (offset // limit) + 1,
            "total_pages": (total_count + limit - 1) // limit
        }
    except Exception as e:
        print(f"Error getting popular policies: {e}")
        raise HTTPException(status_code=500, detail="인기 정책 조회에 실패했습니다")


@router.post("/view/{policy_id}")
async def record_policy_view(
    policy_id: int,
    user_id: int = Depends(verify_token)
):
    """정책 조회 기록"""
    try:
        recommender.record_policy_view(user_id, policy_id)
        return {"message": "조회 기록이 저장되었습니다"}
    except Exception as e:
        print(f"Error recording policy view: {e}")
        raise HTTPException(status_code=500, detail="조회 기록 저장에 실패했습니다")


@router.get("/categories")
async def get_policy_categories():
    """정책 카테고리 목록 조회"""
    try:
        conn = recommender.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT category, COUNT(*) as count
            FROM policies
            WHERE is_active = 1
            GROUP BY category
            ORDER BY count DESC
        """)
        
        categories = [{"name": row[0], "count": row[1]} for row in cursor.fetchall()]
        conn.close()
        
        return categories
    except Exception as e:
        print(f"Error getting policy categories: {e}")
        raise HTTPException(status_code=500, detail="카테고리 조회에 실패했습니다")


@router.get("/category/{category}", response_model=List[PolicyRecommendation])
async def get_policies_by_category(
    category: str,
    limit: int = Query(20, ge=1, le=50),
    user_id: Optional[int] = Depends(verify_token)
):
    """카테고리별 정책 조회"""
    try:
        conn = recommender.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, title, description, content, url, category,
                   target_age_min, target_age_max, target_gender, target_location,
                   tags, view_count, relevance_score, crawled_at
            FROM policies
            WHERE category = ? AND is_active = 1
            ORDER BY view_count DESC, crawled_at DESC
            LIMIT ?
        """, (category, limit))
        
        policies = cursor.fetchall()
        conn.close()
        
        recommendations = []
        for policy_data in policies:
            from datetime import datetime
            import json
            
            policy = Policy(
                id=policy_data[0],
                title=policy_data[1],
                description=policy_data[2],
                content=policy_data[3],
                url=policy_data[4],
                category=policy_data[5],
                target_age_min=policy_data[6],
                target_age_max=policy_data[7],
                target_gender=policy_data[8],
                target_location=policy_data[9],
                tags=json.loads(policy_data[10]) if policy_data[10] else [],
                view_count=policy_data[11],
                relevance_score=policy_data[12],
                crawled_at=datetime.fromisoformat(policy_data[13])
            )
            
            recommendations.append(PolicyRecommendation(
                policy=policy,
                score=policy_data[11],
                reason=f"{category} 카테고리"
            ))
        
        return recommendations
    except Exception as e:
        print(f"Error getting policies by category: {e}")
        raise HTTPException(status_code=500, detail="카테고리별 정책 조회에 실패했습니다")


@router.post("/crawl")
async def trigger_crawling():
    """정책 크롤링 수동 실행 (관리자용)"""
    try:
        crawler = PolicyCrawler()
        result = await crawler.run_crawling()
        return {"message": "크롤링이 완료되었습니다", "result": result}
    except Exception as e:
        print(f"Error triggering crawling: {e}")
        raise HTTPException(status_code=500, detail="크롤링 실행에 실패했습니다")


@router.post("/crawl/youth")
async def trigger_youth_policy_crawling():
    """청년 정책 크롤링 수동 실행 (관리자용)"""
    try:
        crawler = YouthPolicyCrawler()
        result = await crawler.run_youth_policy_crawling()
        return {"message": "청년 정책 크롤링이 완료되었습니다", "result": result}
    except Exception as e:
        print(f"Error triggering youth policy crawling: {e}")
        raise HTTPException(status_code=500, detail="청년 정책 크롤링 실행에 실패했습니다")


@router.post("/crawl/youth-center")
async def trigger_youth_center_crawling(
    max_pages: int = Query(5, ge=1, le=20, description="크롤링할 페이지 수")
):
    """온통청년 API 크롤링 수동 실행 (관리자용)"""
    try:
        crawler = YouthCenterCrawler()
        saved, updated = crawler.crawl_all_policies(max_pages=max_pages)
        return {
            "message": "온통청년 정책 크롤링이 완료되었습니다",
            "result": {
                "saved": saved,
                "updated": updated,
                "total": saved + updated
            }
        }
    except Exception as e:
        print(f"Error triggering youth center crawling: {e}")
        raise HTTPException(status_code=500, detail="온통청년 크롤링 실행에 실패했습니다")


@router.get("/youth", response_model=List[PolicyRecommendation])
async def get_youth_policies(
    limit: int = Query(10, ge=1, le=50),
    token_data: dict = Depends(verify_token)
):
    """개인화된 청년 정책 조회"""
    try:
        user_id = token_data.get("user_id")
        crawler = YouthPolicyCrawler()
        policies = crawler.get_personalized_policies(user_id, limit)
        
        # PolicyRecommendation 형태로 변환
        recommendations = []
        for policy_data in policies:
            from datetime import datetime
            
            policy = Policy(
                id=policy_data['id'],
                title=policy_data['title'],
                description=policy_data['description'],
                content=policy_data['content'],
                url=policy_data['url'],
                category=policy_data['category'],
                target_age_min=policy_data['target_age_min'],
                target_age_max=policy_data['target_age_max'],
                target_gender=None,
                target_location=None,
                tags=policy_data['tags'],
                view_count=0,
                relevance_score=0.0,
                crawled_at=datetime.fromisoformat(policy_data['crawled_at'])
            )
            
            recommendations.append(PolicyRecommendation(
                policy=policy,
                score=100,
                reason="청년 맞춤 정책"
            ))
        
        return recommendations
        
    except Exception as e:
        print(f"Error getting youth policies: {e}")
        raise HTTPException(status_code=500, detail="청년 정책 조회에 실패했습니다")


@router.get("/search")
async def search_policies(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=50),
    user_id: Optional[int] = Depends(verify_token)
):
    """정책 검색"""
    try:
        conn = recommender.get_db_connection()
        cursor = conn.cursor()
        
        # 제목, 설명, 내용에서 키워드 검색
        search_query = f"%{q}%"
        cursor.execute("""
            SELECT id, title, description, content, url, category,
                   target_age_min, target_age_max, target_gender, target_location,
                   tags, view_count, relevance_score, crawled_at
            FROM policies
            WHERE (title LIKE ? OR description LIKE ? OR content LIKE ?)
            AND is_active = 1
            ORDER BY view_count DESC, crawled_at DESC
            LIMIT ?
        """, (search_query, search_query, search_query, limit))
        
        policies = cursor.fetchall()
        conn.close()
        
        recommendations = []
        for policy_data in policies:
            from datetime import datetime
            import json
            
            policy = Policy(
                id=policy_data[0],
                title=policy_data[1],
                description=policy_data[2],
                content=policy_data[3],
                url=policy_data[4],
                category=policy_data[5],
                target_age_min=policy_data[6],
                target_age_max=policy_data[7],
                target_gender=policy_data[8],
                target_location=policy_data[9],
                tags=json.loads(policy_data[10]) if policy_data[10] else [],
                view_count=policy_data[11],
                relevance_score=policy_data[12],
                crawled_at=datetime.fromisoformat(policy_data[13])
            )
            
            recommendations.append(PolicyRecommendation(
                policy=policy,
                score=policy_data[11],
                reason=f"'{q}' 검색 결과"
            ))
        
        return recommendations
    except Exception as e:
        print(f"Error searching policies: {e}")
        raise HTTPException(status_code=500, detail="정책 검색에 실패했습니다")