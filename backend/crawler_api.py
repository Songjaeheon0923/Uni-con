from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
import sqlite3
from policy_url_crawler import PolicyURLCrawler
import asyncio
from typing import Optional

router = APIRouter()

class PolicyURLRequest(BaseModel):
    policy_id: int
    title: str
    organization: str

class PolicyURLResponse(BaseModel):
    success: bool
    url: Optional[str]
    message: str

# 전역 크롤러 인스턴스
crawler = PolicyURLCrawler()

@router.post("/policies/crawl-url", response_model=PolicyURLResponse)
async def crawl_policy_url(request: PolicyURLRequest):
    """개별 정책의 URL을 크롤링하여 찾기"""
    try:
        # 백그라운드에서 URL 검색
        url = await asyncio.get_event_loop().run_in_executor(
            None, 
            crawler.find_policy_url, 
            request.title, 
            request.organization
        )
        
        if url:
            # DB에 업데이트
            conn = sqlite3.connect('users.db')
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE policies SET application_url = ?, updated_at = datetime('now') WHERE id = ?",
                (url, request.policy_id)
            )
            conn.commit()
            conn.close()
            
            return PolicyURLResponse(
                success=True,
                url=url,
                message="정책 URL을 성공적으로 찾았습니다."
            )
        else:
            return PolicyURLResponse(
                success=False,
                url=None,
                message="정책 URL을 찾을 수 없습니다."
            )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"크롤링 실패: {str(e)}")

@router.post("/policies/crawl-all-urls")
async def crawl_all_policy_urls(background_tasks: BackgroundTasks):
    """모든 정책의 URL을 백그라운드에서 크롤링"""
    
    def run_crawler():
        try:
            crawler.update_policy_urls_in_db()
        except Exception as e:
            print(f"크롤링 오류: {e}")
    
    background_tasks.add_task(run_crawler)
    
    return {"message": "정책 URL 크롤링이 백그라운드에서 시작되었습니다."}

@router.get("/policies/crawl-status")
async def get_crawl_status():
    """크롤링 상태 확인"""
    try:
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        
        # 전체 정책 수
        cursor.execute("SELECT COUNT(*) FROM policies")
        total_policies = cursor.fetchone()[0]
        
        # URL이 있는 정책 수
        cursor.execute("""
            SELECT COUNT(*) FROM policies 
            WHERE application_url IS NOT NULL 
            AND application_url != '' 
            AND application_url NOT LIKE '%example.com%'
        """)
        policies_with_urls = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "total_policies": total_policies,
            "policies_with_urls": policies_with_urls,
            "completion_rate": round((policies_with_urls / total_policies) * 100, 2) if total_policies > 0 else 0
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"상태 조회 실패: {str(e)}")

# 메인 앱에 라우터 추가하려면:
# from crawler_api import router as crawler_router
# app.include_router(crawler_router, prefix="/api")