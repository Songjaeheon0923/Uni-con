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

try:
    from utils.contract_analyzer import analyze_contract_main
except ImportError:
    print("Warning: contract_analyzer module not found. Contract analysis will not work.")
    analyze_contract_main = None

router = APIRouter()


@router.post("/analyze")
async def analyze_contract(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    계약서 이미지를 업로드하여 AI 분석 수행
    
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