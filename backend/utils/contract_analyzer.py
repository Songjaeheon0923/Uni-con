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

다음 기준으로 분석해서 실제 앱 화면 구조에 맞는 형식으로 반환해주세요:

1. 서브타이틀: 전체적인 안전도 평가 (예: "대제로 안전하지만 일부 조항 추가 확인 필요")
2. 점수: 계약서의 안전도 점수 (0-100점)
3. 분석 결과: 3-4개의 긍정적인 분석 결과 (체크마크와 함께 표시)
4. 의심 조항: 1-4개의 주의가 필요한 조항 (경고 아이콘과 함께 표시)
5. 집주인에게 물어볼 것: 필요에 따라 개수 조정 (물음표 아이콘과 함께 표시)

다음 JSON 형식으로 응답해주세요:
{{
    "subtitle": "대제로 안전하지만 일부 조항 추가 확인 필요",
    "score": 73,
    "analysis_results": [
        {{
            "text": "필수 항목이 모두 기재 완료되어 있습니다.",
            "type": "positive"
        }},
        {{
            "text": "계약 기간·연장 조건이 명확합니다.",
            "type": "positive"
        }},
        {{
            "text": "서명란 이상 없습니다.",
            "type": "positive"
        }}
    ],
    "suspicious_clauses": [
        {{
            "text": "관리비 범위 불명확 (\"기타 비용 포함\")",
            "severity": "warning"
        }},
        {{
            "text": "중도 해지 위약금 기준 미기재",
            "severity": "warning"
        }},
        {{
            "text": "보증금 반환 시점 구체적 기한 없음",
            "severity": "high"
        }}
    ],
    "questions_for_landlord": [
        {{
            "text": "'기타 비용'에 포함되는 항목은 무엇인가요?"
        }},
        {{
            "text": "중도 해지 위약금 계산 방식은 어떻게 되나요?"
        }},
        {{
            "text": "보증금은 퇴거 후 며칠 이내 반환되나요?"
        }},
        {{
            "text": "시설 보수·수리 비용은 누가 부담하나요?"
        }}
    ]
}}

점수는 다음 기준으로 산정해주세요:
- 80점 이상: 안전 (대부분 양호)
- 60-79점: 주의 (일부 확인 필요)
- 60점 미만: 위험 (여러 문제점 존재)

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
            
            # 3. 새로운 형식으로 반환
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