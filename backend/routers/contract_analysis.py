from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from fastapi.security import HTTPBearer
from models.user import User
from auth.jwt_handler import get_current_user
from database.connection import get_db_connection
import os
import tempfile
import shutil
from typing import Dict, Any
import sys
import asyncio
import uuid
from datetime import datetime

try:
    from ai.contract_analyzer import analyze_contract_main
except ImportError:
    print("Warning: contract_analyzer module not found. Contract analysis will not work.")
    analyze_contract_main = None

router = APIRouter()

# 분석 상태 저장소 (메모리 기반 - 실제 운영환경에서는 Redis 등 사용 권장)
analysis_status_store = {}

class AnalysisStatus:
    def __init__(self, task_id: str, user_id: int):
        self.task_id = task_id
        self.user_id = user_id
        self.status = "started"
        self.current_stage = "이미지 업로드 완료"
        self.progress = 0
        self.stages = []
        self.result = None
        self.error = None
        self.created_at = datetime.now()
    
    def add_stage(self, stage_name: str, progress: int):
        self.stages.append({
            "stage": stage_name,
            "timestamp": datetime.now().isoformat(),
            "progress": progress
        })
        self.current_stage = stage_name
        self.progress = progress
        print(f"Analysis {self.task_id}: {stage_name} ({progress}%)")
    
    def complete(self, result):
        self.status = "completed"
        self.result = result
        self.progress = 100
        self.add_stage("분석 완료", 100)
    
    def fail(self, error):
        self.status = "failed" 
        self.error = str(error)
        self.add_stage(f"분석 실패: {error}", 0)


@router.post("/analyze-async")
async def start_analysis(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    계약서 분석을 비동기로 시작하고 task_id 반환
    
    Args:
        file: 계약서 이미지 파일 (PNG, JPG)
        current_user: 현재 로그인된 사용자
        
    Returns:
        Dict: task_id와 상태
    """
    
    if analyze_contract_main is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Contract analysis service is not available"
        )
    
    # 파일 형식 검증
    allowed_extensions = ['.png', '.jpg', '.jpeg']
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="지원하지 않는 파일 형식입니다. PNG, JPG 파일만 업로드 가능합니다."
        )
    
    # 고유한 task_id 생성
    task_id = str(uuid.uuid4())
    
    # 분석 상태 초기화
    analysis_status = AnalysisStatus(task_id, current_user.id)
    analysis_status_store[task_id] = analysis_status
    
    # 임시 파일 저장
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_file_path = temp_file.name
    
    # 백그라운드에서 분석 실행
    asyncio.create_task(run_analysis_background(task_id, temp_file_path, current_user.id))
    
    return {
        "success": True,
        "task_id": task_id,
        "status": "started",
        "message": "계약서 분석이 시작되었습니다."
    }


async def run_analysis_background(task_id: str, file_path: str, user_id: int):
    """백그라운드에서 실행되는 분석 작업"""
    analysis_status = analysis_status_store.get(task_id)
    if not analysis_status:
        return
    
    try:
        # 사용자 정보 조회
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM users WHERE id = ?", (user_id,))
        user_data = cursor.fetchone()
        user_name = user_data[0] if user_data else "사용자"
        conn.close()
        
        # 분석 단계별 진행 (각 단계마다 충분한 시간 확보)
        analysis_status.add_stage("이미지 전처리 중", 20)
        await asyncio.sleep(2.0)  # 2초 대기하여 사용자가 확인할 수 있도록
        
        analysis_status.add_stage("텍스트 추출 중", 40) 
        await asyncio.sleep(2.0)  # 2초 대기
        
        analysis_status.add_stage("AI 분석 시작", 60)
        await asyncio.sleep(1.0)  # 1초 대기
        
        analysis_status.add_stage("AI 분석 중", 70)
        
        # 실제 분석 수행
        result = analyze_contract_main(file_path)
        
        if not result.get("success", False):
            analysis_status.fail(result.get('error', 'Unknown error'))
            return
        
        analysis_status.add_stage("분석 결과 검증 중", 85)
        await asyncio.sleep(1.5)  # 1.5초 대기
        
        analysis_status.add_stage("결과 처리 중", 95)
        await asyncio.sleep(1.0)  # 1초 대기
        
        # 분석 결과 가공
        analysis_result = result.get("analysis", {})
        
        if "main_title" not in analysis_result:
            analysis_result["main_title"] = {}
        
        analysis_result["main_title"]["user_name"] = user_name
        analysis_result["main_title"]["score"] = analysis_result.get("score", 0)
        
        if "score" in analysis_result:
            del analysis_result["score"]
        
        final_result = {
            "success": True,
            "user_name": user_name,
            "analysis": analysis_result
        }
        
        analysis_status.complete(final_result)
        
    except Exception as e:
        print(f"Error during background analysis: {e}")
        analysis_status.fail(str(e))
    
    finally:
        # 임시 파일 정리
        if os.path.exists(file_path):
            try:
                os.unlink(file_path)
                print(f"Temporary file deleted: {file_path}")
            except Exception as e:
                print(f"Warning: Could not delete temporary file {file_path}: {e}")


@router.get("/status/{task_id}")
async def get_analysis_status(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    분석 작업의 현재 상태를 조회
    
    Args:
        task_id: 분석 작업 ID
        current_user: 현재 로그인된 사용자
        
    Returns:
        Dict: 분석 상태 정보
    """
    
    analysis_status = analysis_status_store.get(task_id)
    
    if not analysis_status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="분석 작업을 찾을 수 없습니다."
        )
    
    # 사용자 권한 확인
    if analysis_status.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="접근 권한이 없습니다."
        )
    
    response = {
        "task_id": task_id,
        "status": analysis_status.status,
        "current_stage": analysis_status.current_stage,
        "progress": analysis_status.progress,
        "stages": analysis_status.stages
    }
    
    if analysis_status.status == "completed":
        response["result"] = analysis_status.result
    elif analysis_status.status == "failed":
        response["error"] = analysis_status.error
    
    return response


@router.post("/analyze")
async def analyze_contract(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    계약서 이미지를 업로드하여 AI 분석 수행 (기존 동기 방식 - 호환성 유지)
    
    Args:
        file: 계약서 이미지 파일 (PNG, JPG)
        current_user: 현재 로그인된 사용자
        
    Returns:
        Dict: 분석 결과 JSON
    """
    
    if analyze_contract_main is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Contract analysis service is not available"
        )
    
    # 파일 형식 검증
    allowed_extensions = ['.png', '.jpg', '.jpeg']
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="지원하지 않는 파일 형식입니다. PNG, JPG 파일만 업로드 가능합니다."
        )
    
    # 사용자 정보 조회
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT name FROM users WHERE id = ?", (current_user.id,))
        user_data = cursor.fetchone()
        
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user_name = user_data[0] or "사용자"  # 이름이 없으면 기본값 사용
        
    except Exception as e:
        print(f"Error retrieving user info: {e}")
        user_name = "사용자"  # 오류 시 기본값 사용
    finally:
        conn.close()
    
    # 임시 파일 저장
    temp_file = None
    try:
        # 임시 파일 생성
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_file_path = temp_file.name
        
        print(f"Analyzing contract for user: {user_name}")
        print(f"Temporary file saved at: {temp_file_path}")
        
        # AI 분석 수행
        result = analyze_contract_main(temp_file_path)
        
        if not result.get("success", False):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"계약서 분석 중 오류가 발생했습니다: {result.get('error', 'Unknown error')}"
            )
        
        # 분석 결과 반환 (extracted_text는 제외)
        analysis_result = result.get("analysis", {})
        
        # 사용자 이름을 main_title에 추가
        if "main_title" not in analysis_result:
            analysis_result["main_title"] = {}
        
        analysis_result["main_title"]["user_name"] = user_name
        analysis_result["main_title"]["score"] = analysis_result.get("score", 0)
        
        # 최상위 score 제거 (main_title에 포함되므로)
        if "score" in analysis_result:
            del analysis_result["score"]
        
        return {
            "success": True,
            "user_name": user_name,
            "analysis": analysis_result
        }
        
    except Exception as e:
        print(f"Error during contract analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"계약서 분석 중 오류가 발생했습니다: {str(e)}"
        )
    
    finally:
        # 임시 파일 정리
        if temp_file and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
                print(f"Temporary file deleted: {temp_file_path}")
            except Exception as e:
                print(f"Warning: Could not delete temporary file {temp_file_path}: {e}")


@router.get("/test")
async def test_contract_analysis(current_user: User = Depends(get_current_user)):
    """
    계약서 분석 기능 테스트용 엔드포인트
    """
    
    if analyze_contract_main is None:
        return {
            "status": "unavailable",
            "message": "Contract analysis service is not available"
        }
    
    # 사용자 정보 조회
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT name FROM users WHERE id = ?", (current_user.id,))
        user_data = cursor.fetchone()
        user_name = user_data[0] if user_data else "테스트 사용자"
        
        return {
            "status": "available",
            "message": "Contract analysis service is ready",
            "user_name": user_name,
            "user_id": current_user.id
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error retrieving user info: {str(e)}"
        }
    finally:
        conn.close()