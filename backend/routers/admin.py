from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
import asyncio
from crawlers.daily_scheduler import PolicyCrawlerScheduler
from crawlers.advanced_policy_crawler import AdvancedPolicyCrawler
from utils.policy_recommender import PolicyRecommender
from auth.jwt_handler import verify_admin_token  # 관리자 인증 함수 (추후 구현)


router = APIRouter(prefix="/admin", tags=["admin"])

# 전역 스케줄러 인스턴스
scheduler_instance = None


def get_scheduler():
    """스케줄러 인스턴스 반환"""
    global scheduler_instance
    if not scheduler_instance:
        scheduler_instance = PolicyCrawlerScheduler()
    return scheduler_instance


@router.post("/crawling/run")
async def trigger_manual_crawling():
    """수동 크롤링 실행"""
    try:
        crawler = AdvancedPolicyCrawler()
        result = await crawler.run_advanced_crawling()
        return {"message": "크롤링이 완료되었습니다", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"크롤링 실행 실패: {str(e)}")


@router.get("/crawling/status")
async def get_crawling_status():
    """크롤링 스케줄러 상태 조회"""
    try:
        scheduler = get_scheduler()
        status = scheduler.get_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"상태 조회 실패: {str(e)}")


@router.get("/crawling/statistics")
async def get_crawling_statistics(days: int = 7):
    """크롤링 통계 조회"""
    try:
        scheduler = get_scheduler()
        stats = scheduler.get_crawling_statistics(days)
        return {"statistics": stats, "period_days": days}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"통계 조회 실패: {str(e)}")


@router.post("/crawling/cleanup")
async def cleanup_old_data(days_to_keep: int = 30):
    """오래된 데이터 정리"""
    try:
        scheduler = get_scheduler()
        scheduler.cleanup_old_logs(days_to_keep)
        return {"message": f"{days_to_keep}일 이전 데이터가 정리되었습니다"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터 정리 실패: {str(e)}")


@router.get("/policies/analytics")
async def get_policy_analytics():
    """정책 분석 데이터 조회"""
    try:
        recommender = PolicyRecommender()
        conn = recommender.get_db_connection()
        cursor = conn.cursor()
        
        # 카테고리별 정책 수
        cursor.execute("""
            SELECT category, COUNT(*) as count
            FROM policies
            WHERE is_active = 1
            GROUP BY category
            ORDER BY count DESC
        """)
        category_stats = [{"category": row[0], "count": row[1]} for row in cursor.fetchall()]
        
        # 최근 7일간 추가된 정책 수
        cursor.execute("""
            SELECT DATE(crawled_at) as date, COUNT(*) as count
            FROM policies
            WHERE crawled_at >= date('now', '-7 days')
            AND is_active = 1
            GROUP BY DATE(crawled_at)
            ORDER BY date DESC
        """)
        daily_stats = [{"date": row[0], "count": row[1]} for row in cursor.fetchall()]
        
        # 가장 많이 조회된 정책 Top 10
        cursor.execute("""
            SELECT title, view_count, category
            FROM policies
            WHERE is_active = 1
            ORDER BY view_count DESC
            LIMIT 10
        """)
        popular_policies = [
            {"title": row[0], "view_count": row[1], "category": row[2]} 
            for row in cursor.fetchall()
        ]
        
        # 전체 통계
        cursor.execute("""
            SELECT 
                COUNT(*) as total_policies,
                COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_policies,
                AVG(view_count) as avg_view_count,
                SUM(view_count) as total_views
            FROM policies
        """)
        overall_stats = cursor.fetchone()
        
        conn.close()
        
        return {
            "overall": {
                "total_policies": overall_stats[0],
                "active_policies": overall_stats[1],
                "average_view_count": round(overall_stats[2] or 0, 2),
                "total_views": overall_stats[3]
            },
            "category_distribution": category_stats,
            "daily_additions": daily_stats,
            "popular_policies": popular_policies
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"분석 데이터 조회 실패: {str(e)}")


@router.post("/policies/reindex")
async def reindex_policies():
    """정책 점수 재계산 및 인덱싱"""
    try:
        crawler = AdvancedPolicyCrawler()
        updated_count = crawler.update_policy_scores()
        removed_count = crawler.clean_and_deduplicate_policies()
        
        return {
            "message": "정책 재인덱싱이 완료되었습니다",
            "updated_policies": updated_count,
            "removed_duplicates": removed_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"재인덱싱 실패: {str(e)}")


@router.get("/policies/quality-check")
async def check_policy_quality():
    """정책 데이터 품질 검사"""
    try:
        recommender = PolicyRecommender()
        conn = recommender.get_db_connection()
        cursor = conn.cursor()
        
        # 중복 가능성이 있는 정책들
        cursor.execute("""
            SELECT title, COUNT(*) as count
            FROM policies
            WHERE is_active = 1
            GROUP BY LOWER(TRIM(title))
            HAVING count > 1
            ORDER BY count DESC
            LIMIT 10
        """)
        potential_duplicates = [{"title": row[0], "count": row[1]} for row in cursor.fetchall()]
        
        # 내용이 너무 짧은 정책들
        cursor.execute("""
            SELECT title, LENGTH(description) as desc_length
            FROM policies
            WHERE is_active = 1 AND LENGTH(description) < 20
            ORDER BY desc_length
            LIMIT 10
        """)
        short_content = [{"title": row[0], "description_length": row[1]} for row in cursor.fetchall()]
        
        # URL이 없는 정책들
        cursor.execute("""
            SELECT title, category
            FROM policies
            WHERE is_active = 1 AND (url IS NULL OR url = '')
            LIMIT 10
        """)
        missing_urls = [{"title": row[0], "category": row[1]} for row in cursor.fetchall()]
        
        # 카테고리가 '기타'인 정책들
        cursor.execute("""
            SELECT title, description
            FROM policies
            WHERE is_active = 1 AND category LIKE '%기타%'
            LIMIT 10
        """)
        uncategorized = [{"title": row[0], "description": row[1][:100]} for row in cursor.fetchall()]
        
        conn.close()
        
        return {
            "quality_issues": {
                "potential_duplicates": len(potential_duplicates),
                "short_content": len(short_content),
                "missing_urls": len(missing_urls),
                "uncategorized": len(uncategorized)
            },
            "details": {
                "potential_duplicates": potential_duplicates,
                "short_content": short_content,
                "missing_urls": missing_urls,
                "uncategorized": uncategorized
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"품질 검사 실패: {str(e)}")


@router.get("/users/policy-preferences")
async def get_user_policy_preferences():
    """사용자별 정책 선호도 분석"""
    try:
        recommender = PolicyRecommender()
        conn = recommender.get_db_connection()
        cursor = conn.cursor()
        
        # 가장 많이 조회된 정책 카테고리
        cursor.execute("""
            SELECT p.category, COUNT(*) as view_count
            FROM policy_views pv
            JOIN policies p ON pv.policy_id = p.id
            WHERE p.is_active = 1
            GROUP BY p.category
            ORDER BY view_count DESC
        """)
        category_preferences = [{"category": row[0], "views": row[1]} for row in cursor.fetchall()]
        
        # 연령대별 선호 카테고리
        cursor.execute("""
            SELECT 
                CASE 
                    WHEN u.age BETWEEN 19 AND 25 THEN '19-25세'
                    WHEN u.age BETWEEN 26 AND 30 THEN '26-30세'
                    WHEN u.age BETWEEN 31 AND 35 THEN '31-35세'
                    WHEN u.age BETWEEN 36 AND 40 THEN '36-40세'
                    ELSE '기타'
                END as age_group,
                p.category,
                COUNT(*) as views
            FROM policy_views pv
            JOIN policies p ON pv.policy_id = p.id
            JOIN user_profiles u ON pv.user_id = u.user_id
            WHERE p.is_active = 1 AND u.age IS NOT NULL
            GROUP BY age_group, p.category
            ORDER BY age_group, views DESC
        """)
        
        age_preferences = {}
        for row in cursor.fetchall():
            age_group = row[0]
            if age_group not in age_preferences:
                age_preferences[age_group] = []
            age_preferences[age_group].append({"category": row[1], "views": row[2]})
        
        conn.close()
        
        return {
            "overall_preferences": category_preferences,
            "age_group_preferences": age_preferences
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"선호도 분석 실패: {str(e)}")


@router.post("/scheduler/start")
async def start_scheduler():
    """스케줄러 시작"""
    try:
        scheduler = get_scheduler()
        if not scheduler.is_running:
            # 백그라운드에서 스케줄러 실행
            import threading
            scheduler_thread = threading.Thread(target=scheduler.run_scheduler, daemon=True)
            scheduler_thread.start()
            return {"message": "스케줄러가 시작되었습니다"}
        else:
            return {"message": "스케줄러가 이미 실행 중입니다"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"스케줄러 시작 실패: {str(e)}")


@router.post("/scheduler/stop")
async def stop_scheduler():
    """스케줄러 중지"""
    try:
        scheduler = get_scheduler()
        scheduler.stop_scheduler()
        return {"message": "스케줄러 중지 요청이 전송되었습니다"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"스케줄러 중지 실패: {str(e)}")