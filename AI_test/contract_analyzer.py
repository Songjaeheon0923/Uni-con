import os
from dotenv import load_dotenv
import json
import uuid
import time
import requests
import cv2
from openai import OpenAI
from typing import Dict, Any, List

load_dotenv()

class ContractAnalyzer:
    def __init__(self, ocr_secret_key: str, ocr_api_url: str, openai_api_key: str):
        """
        계약서 분석기 초기화
        
        Args:
            ocr_secret_key: Naver Cloud Platform OCR Secret Key
            ocr_api_url: Naver Cloud Platform OCR API URL
            openai_api_key: OpenAI API Key
        """
        self.ocr_secret_key = ocr_secret_key
        self.ocr_api_url = ocr_api_url
        self.openai_client = OpenAI(api_key=openai_api_key)
        
    def extract_text_from_image(self, image_path: str) -> str:
        """
        이미지에서 OCR을 통해 텍스트 추출
        
        Args:
            image_path: 계약서 이미지 파일 경로
            
        Returns:
            str: 추출된 텍스트
        """
        # 이미지 파일 확장자 확인
        file_extension = os.path.splitext(image_path)[1].lower()
        if file_extension == '.png':
            format_type = 'png'
        elif file_extension in ['.jpg', '.jpeg']:
            format_type = 'jpg'
        else:
            raise ValueError(f"지원하지 않는 이미지 형식: {file_extension}")
            
        request_json = {
            'images': [
                {
                    'format': format_type,
                    'name': 'contract'
                }
            ],
            'requestId': str(uuid.uuid4()),
            'version': 'V2',
            'timestamp': int(round(time.time() * 1000))
        }
        
        payload = {'message': json.dumps(request_json).encode('UTF-8')}
        files = [('file', open(image_path, 'rb'))]
        headers = {'X-OCR-SECRET': self.ocr_secret_key}
        
        try:
            response = requests.post(self.ocr_api_url, headers=headers, data=payload, files=files)
            
            if response.status_code == 200:
                ocr_results = json.loads(response.text)
                all_texts = []
                
                for image_result in ocr_results['images']:
                    for field in image_result['fields']:
                        text = field['inferText']
                        all_texts.append(text)
                
                return ' '.join(all_texts)
            else:
                raise Exception(f"OCR 요청 실패: 상태 코드 {response.status_code}")
                
        except Exception as e:
            raise Exception(f"OCR 처리 중 오류 발생: {str(e)}")
        finally:
            files[0][1].close()
    
    def analyze_contract_with_ai(self, contract_text: str) -> Dict[str, Any]:
        """
        OpenAI API를 통해 계약서 분석
        
        Args:
            contract_text: OCR로 추출한 계약서 텍스트
            
        Returns:
            Dict: 분석 결과 JSON
        """
        prompt = f"""
다음 임대차 계약서를 분석해서 JSON 형식으로 결과를 반환해주세요.

계약서 내용:
{contract_text}

다음 기준으로 분석해주세요:

1. 위험·유의사항 (각 항목을 safe/warning/danger로 분류):
   - 보증금 반환 조건의 모호성
   - 수리·시설 보수 책임의 모호성  
   - 특약 조항의 표현 불명확
   - 자동 연장·우선 갱신권 관련 법적 권리 누락
   - 원상복구 의무 기준 애매성

2. 사용자 확인 필요사항:
   - 관리비에 포함·제외 항목
   - 기타비용의 종류
   - 집주인 정보 확인
   - 계약 해지/연장 통보 방법
   - 전입신고 및 확정일자 가능 여부

다음 JSON 형식으로 응답해주세요:
{{
    "analysis_result": {{
        "overall_score": 85,
        "summary": "전반적인 계약서 평가 요약",
        "risk_items": [
            {{
                "category": "보증금 반환 조건",
                "status": "safe|warning|danger",
                "description": "구체적인 문제점이나 양호한 상태 설명",
                "recommendation": "개선 권장사항 또는 확인사항"
            }}
        ],
        "verification_items": [
            {{
                "category": "관리비 포함 항목",
                "questions": ["확인이 필요한 구체적 질문들"],
                "importance": "high|medium|low",
                "current_status": "계약서에 명시된 내용이나 누락된 내용"
            }}
        ]
    }}
}}

JSON 형식으로만 응답하고, 다른 설명은 포함하지 마세요.
"""
        
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "당신은 임대차 계약서 전문 분석가입니다. 계약서의 위험요소와 확인사항을 정확히 분석하여 JSON 형식으로 제공합니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            ai_response = response.choices[0].message.content.strip()
            
            # JSON 파싱 시도
            try:
                return json.loads(ai_response)
            except json.JSONDecodeError:
                # AI 응답에 JSON이 아닌 내용이 포함된 경우 처리
                json_start = ai_response.find('{')
                json_end = ai_response.rfind('}') + 1
                if json_start != -1 and json_end != 0:
                    json_content = ai_response[json_start:json_end]
                    return json.loads(json_content)
                else:
                    raise Exception("AI 응답에서 유효한 JSON을 찾을 수 없습니다.")
                    
        except Exception as e:
            raise Exception(f"AI 분석 중 오류 발생: {str(e)}")
    
    def analyze_contract(self, image_path: str) -> Dict[str, Any]:
        """
        계약서 이미지를 분석하여 JSON 결과 반환 (메인 함수)
        
        Args:
            image_path: 계약서 이미지 파일 경로
            
        Returns:
            Dict: 분석 결과 JSON
        """
        try:
            # 1. OCR로 텍스트 추출
            print("OCR을 통해 텍스트를 추출하는 중...")
            contract_text = self.extract_text_from_image(image_path)
            
            if not contract_text.strip():
                raise Exception("계약서에서 텍스트를 추출할 수 없습니다.")
            
            print(f"추출된 텍스트 길이: {len(contract_text)} 글자")
            
            # 2. AI로 계약서 분석
            print("AI를 통해 계약서를 분석하는 중...")
            analysis_result = self.analyze_contract_with_ai(contract_text)
            
            # 3. 원본 텍스트도 포함하여 반환
            final_result = {
                "success": True,
                "extracted_text": contract_text,
                "analysis": analysis_result
            }
            
            return final_result
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "analysis": None
            }


# 사용 예시 함수
def analyze_contract_main(image_path: str) -> Dict[str, Any]:
    """
    계약서 분석 메인 함수 (외부에서 호출용)
    
    Args:
        image_path: 계약서 이미지 파일 경로
        
    Returns:
        Dict: 분석 결과 JSON
    """
    # 설정값들
    OCR_SECRET_KEY = os.getenv("OCR_SECRET_KEY")
    OCR_API_URL = os.getenv("OCR_API_URL")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

    if not all([OCR_SECRET_KEY, OCR_API_URL, OPENAI_API_KEY]):
        raise ValueError("환경변수(.env)에 OCR_SECRET_KEY, OCR_API_URL, OPENAI_API_KEY가 모두 설정되어야 합니다.")

    analyzer = ContractAnalyzer(OCR_SECRET_KEY, OCR_API_URL, OPENAI_API_KEY)
    result = analyzer.analyze_contract(image_path)
    return result


if __name__ == "__main__":
    # 테스트용 실행
    test_image_path = r'C:\project\Uni-con\AI_test\data\ex.png'
    
    if os.path.exists(test_image_path):
        print("계약서 분석을 시작합니다...")
        result = analyze_contract_main(test_image_path)
        
        print("\n=== 분석 결과 ===")
        try:
            print(json.dumps(result, ensure_ascii=False, indent=2))
        except UnicodeEncodeError:
            # 인코딩 문제 발생시 파일로만 저장
            print("한글 출력 인코딩 문제로 인해 콘솔 출력을 생략합니다. 파일에서 확인해주세요.")
        
        # 결과를 파일로 저장
        with open('contract_analysis_result.json', 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print("\n결과가 'contract_analysis_result.json' 파일로 저장되었습니다.")
    else:
        print(f"테스트 이미지 파일을 찾을 수 없습니다: {test_image_path}")