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
    token_data: dict = Depends(verify_token)
):
    """정책 조회 기록"""
    try:
        user_id = token_data.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="유효하지 않은 사용자 정보입니다")
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
    token_data: Optional[dict] = Depends(verify_token)
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


@router.get("/{policy_id}/ai-summary")  
async def get_policy_ai_summary(
    policy_id: int
):
    """정책 AI 요약 생성"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 정책 정보 조회
        cursor.execute("""
            SELECT title, content, target, details, application_period, organization
            FROM policies
            WHERE id = ? AND is_active = 1
        """, (policy_id,))
        
        policy = cursor.fetchone()
        conn.close()
        
        if not policy:
            raise HTTPException(status_code=404, detail="정책을 찾을 수 없습니다")
        
        title, content, target, details_json, period, org = policy
        
        # 지역 코드를 지역명으로 변환하는 함수
        def convert_region_codes_to_names(region_codes):
            if not region_codes:
                return "전국"
            
            # 주요 지역 코드 매핑
            region_map = {
                '11': '서울특별시', '26': '부산광역시', '27': '대구광역시', '28': '인천광역시',
                '29': '광주광역시', '30': '대전광역시', '31': '울산광역시', '36': '세종특별자치시',
                '41': '경기도', '42': '강원도', '43': '충청북도', '44': '충청남도',
                '45': '전라북도', '46': '전라남도', '47': '경상북도', '48': '경상남도',
                '49': '제주특별자치도', '50': '제주특별자치도',
                '50110': '제주시', '50130': '서귀포시',
                '44131': '천안시', '44133': '공주시', '44150': '보령시', '44180': '아산시',
                '44200': '서산시', '44210': '논산시', '44230': '계룡시', '44250': '당진시',
                '44270': '금산군', '44710': '연기군', '44760': '보은군', '44770': '옥천군',
                '44790': '영동군', '44800': '진천군', '44810': '괴산군', '44825': '음성군'
            }
            
            if ',' in region_codes:
                codes = region_codes.split(',')
                regions = []
                for code in codes:
                    code = code.strip()
                    if code in region_map:
                        regions.append(region_map[code])
                    elif code[:2] in region_map:
                        regions.append(region_map[code[:2]])
                return ', '.join(list(set(regions)))
            else:
                code = region_codes.strip()
                if code in region_map:
                    return region_map[code]
                elif code[:2] in region_map:
                    return region_map[code[:2]]
                return "전국"

        # target 필드에서 의미있는 정보만 추출
        def clean_target_info(target_text):
            if not target_text:
                return ""
            
            # 연령대 정보만 추출 (만 XX세, 만 XX~XX세)
            import re
            age_patterns = re.findall(r'만 \d+[~-]?\d*세?', target_text)
            if age_patterns:
                return ', '.join(age_patterns)
            return ""

        # AI 요약을 위한 정책 정보 구성
        cleaned_target = clean_target_info(target)
        
        policy_text = f"""
        정책명: {title}
        시행기관: {org or ''}
        정책 내용: {content or ''}
        """
        
        if cleaned_target:
            policy_text += f"\n지원 대상: {cleaned_target}"
        
        if period:
            policy_text += f"\n신청 기간: {period}"
        
        # 세부 정보가 있으면 추가
        if details_json:
            try:
                details = json.loads(details_json)
                if details.get('explanation'):
                    policy_text += f"\n정책 설명: {details['explanation']}"
                if details.get('income_condition'):
                    policy_text += f"\n소득 조건: {details['income_condition']}"
                if details.get('min_age') and details.get('max_age'):
                    policy_text += f"\n연령 조건: 만 {details['min_age']}세 ~ {details['max_age']}세"
                if details.get('region_code'):
                    region_names = convert_region_codes_to_names(details['region_code'])
                    policy_text += f"\n적용 지역: {region_names}"
            except:
                pass
        
        # Gemini AI 요약 생성 (간단한 요약)
        from ai.policy_chat.gemini_client import GeminiClient
        
        gemini = GeminiClient()
        
        prompt = f"""
        다음 청년 주택 정책을 마크다운 형식으로 간단하고 이해하기 쉽게 요약해주세요:
        
        {policy_text}
        
        다음 형식으로 요약해주세요:
        
        **대상:** 연령대와 주요 조건
        **지원내용:** 핵심 혜택과 금액
        **신청기간:** 기간 또는 상시접수 여부
        **지역:** 해당 지역 (전국이면 생략)
        
        각 항목은 1줄로 간결하게 작성하고, 불필요한 설명은 제외해주세요.
        """
        
        try:
            print(f"🤖 AI 요약 생성 시작: {title}")
            print(f"📝 입력 텍스트: {policy_text[:200]}...")
            
            # LangChain 스트리밍 방식으로 AI 요약 생성
            from langchain.schema import HumanMessage
            
            llm = gemini.get_llm()
            messages = [HumanMessage(content=prompt)]
            
            # astream으로 스트리밍 처리
            summary_parts = []
            async for chunk in llm.astream(messages):
                if hasattr(chunk, 'content'):
                    summary_parts.append(chunk.content)
            
            summary = ''.join(summary_parts)
            
            print(f"✅ AI 요약 완료: {summary[:100]}...")
            return {"summary": summary}
        except Exception as e:
            print(f"❌ AI 요약 생성 실패: {e}")
            print(f"🔧 Gemini 클라이언트 상태 확인 필요")
            # 개선된 폴백 요약 (의미없는 코드 제거)
            fallback_summary = f"이 정책은 {org or '관련 기관'}에서 시행하는 {title} 정책입니다."
            if cleaned_target:
                fallback_summary += f" {cleaned_target}를 대상으로 합니다."
            return {"summary": fallback_summary}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting policy AI summary: {e}")
        raise HTTPException(status_code=500, detail="AI 요약 생성에 실패했습니다")


@router.get("/by-title/{title}")
async def get_policy_by_title(title: str):
    """정책명으로 정책 상세 정보 조회 (챗봇용)"""
    try:
        print(f"Searching for policy with title: '{title}'")
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 정책명으로 유연한 검색 (부분 일치, 공백/특수문자 제거)
        clean_title = title.replace(" ", "").replace("」", "").replace("「", "")
        search_patterns = [
            title,  # 정확한 매칭
            f"%{title}%",  # 부분 매칭
            f"%{clean_title}%",  # 공백/특수문자 제거 후 매칭
        ]
        
        # 여러 패턴으로 검색
        cursor.execute("""
            SELECT id, source, source_id, title, organization, target, 
                   content, application_period, start_date, end_date,
                   application_url, reference_url, category, region, details,
                   view_count, created_at
            FROM policies
            WHERE (title = ? OR title LIKE ? OR REPLACE(REPLACE(title, ' ', ''), '　', '') LIKE ?)
            AND is_active = 1
            ORDER BY 
                CASE 
                    WHEN title = ? THEN 1
                    WHEN title LIKE ? THEN 2
                    ELSE 3
                END,
                view_count DESC
            LIMIT 1
        """, (title, f"%{title}%", f"%{clean_title}%", title, f"%{title}%"))
        
        policy = cursor.fetchone()
        conn.close()
        
        if not policy:
            raise HTTPException(status_code=404, detail="정책을 찾을 수 없습니다")
        
        try:
            details = json.loads(policy[14]) if policy[14] else {}
        except:
            details = {}
            
        return {
            "id": policy[0],
            "source": policy[1],
            "source_id": policy[2],
            "title": policy[3],
            "organization": policy[4],
            "target": policy[5],
            "content": policy[6],
            "application_period": policy[7],
            "start_date": policy[8],
            "end_date": policy[9],
            "application_url": policy[10],
            "reference_url": policy[11],
            "category": policy[12],
            "region": policy[13],
            "details": details,
            "view_count": policy[15],
            "created_at": policy[16]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting policy by title: {e}")
        raise HTTPException(status_code=500, detail="정책 조회에 실패했습니다")


@router.get("/search")
async def search_policies(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=50),
    token_data: Optional[dict] = Depends(verify_token)
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