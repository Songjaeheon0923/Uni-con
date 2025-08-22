import os
from dotenv import load_dotenv
import json
import uuid
import time
import requests
import cv2
from openai import OpenAI
from typing import Dict, Any, List
from pathlib import Path
import sys

# RAG 시스템 import
try:
    from .rag_system.contract_rag import ContractRAGSystem
    RAG_AVAILABLE = True
except ImportError:
    RAG_AVAILABLE = False
    print("Warning: RAG system not available. Basic analysis only.")

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
        
        # RAG 시스템 초기화
        if RAG_AVAILABLE:
            try:
                self.rag_system = ContractRAGSystem("ai/rag_documents")
                print("RAG 시스템이 성공적으로 로드되었습니다.")
            except Exception as e:
                print(f"RAG 시스템 로드 실패: {e}")
                self.rag_system = None
        else:
            self.rag_system = None
        
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
        OpenAI API를 통해 계약서 분석 (RAG 컨텍스트 포함)
        
        Args:
            contract_text: OCR로 추출한 계약서 텍스트
            
        Returns:
            Dict: 분석 결과 JSON
        """
        
        # RAG 시스템에서 관련 법률 정보 수집
        rag_context = self._get_rag_context_for_analysis(contract_text)
        
        prompt = f"""
다음 임대차 계약서를 분석해서 JSON 형식으로 결과를 반환해주세요.

계약서 내용:
{contract_text}

=== 참고할 법률 및 가이드라인 정보 ===
{rag_context}

위 법률 정보를 바탕으로 다음 기준으로 분석해서 실제 앱 화면 구조에 맞는 형식으로 반환해주세요:

1. 서브타이틀: 전체적인 안전도 평가 (예: "대제로 안전하지만 일부 조항 추가 확인 필요")
2. 점수: 계약서의 안전도 점수 (0-100점)
3. 분석 결과: 4~5개의 긍정적인 분석 결과 (체크마크와 함께 표시) - 법률 근거 기반
4. 의심 조항: 1-5개의 주의가 필요한 조항 (경고 아이콘과 함께 표시) - 법률 위반 여부 포함
5. 집주인에게 물어볼 것: 필요에 따라 개수 조정 (물음표 아이콘과 함께 표시) - 법적 권리 기반

다음 JSON 형식으로 응답해주세요 (반드시 제공된 법률 정보를 활용하세요):
{{
    "subtitle": "대체로 안전하지만 일부 조항 추가 확인 필요",
    "score": 73,
    "analysis_results": [
        {{
            "text": "주택임대차보호법 제3조에 따른 필수 기재사항이 모두 포함되어 있습니다.",
            "type": "positive"
        }},
        {{
            "text": "계약갱신청구권 관련 조항이 법령에 부합합니다.",
            "type": "positive"
        }},
        {{
            "text": "보증금 보호 관련 조항이 적절히 명시되어 있습니다.",
            "type": "positive"
        }},
        {{
            "text": "임대료 인상 제한 규정이 준수되고 있습니다.",
            "type": "positive"
        }}
    ],
    "suspicious_clauses": [
        {{
            "text": "관리비 범위 불명확 - 주택임대차보호법 위반 가능성",
            "severity": "warning"
        }},
        {{
            "text": "보증금 반환시기 명시 부족 - 민법 제654조 위반",
            "severity": "high"
        }},
        {{
            "text": "일방적 계약해지 조항 - 불공정약관 해당 가능성",
            "severity": "high"
        }}
    ],
    "questions_for_landlord": [
        {{
            "text": "관리비에 포함되는 구체적 항목을 주택임대차보호법에 따라 명시해주세요."
        }},
        {{
            "text": "보증금은 민법 제654조에 따라 언제까지 반환되나요?"
        }},
        {{
            "text": "계약갱신청구권 행사 시 임대료 인상 한도는 얼마인가요?"
        }},
        {{
            "text": "임차인의 우선변제권 보장을 위한 대항요건 취득은 어떻게 하나요?"
        }}
    ]
}}

위 형식은 형식일 뿐, 직접적인 정보 추출은 이미지에서 가져온 텍트스와 RAG에서만 진행해주세요.

점수는 다음 기준으로 산정해주세요:
- 80점 이상: 안전 (대부분 양호)
- 60-79점: 주의 (일부 확인 필요)
- 60점 미만: 위험 (여러 문제점 존재)

JSON 형식으로만 응답하고, 다른 설명은 포함하지 마세요.
"""
        
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "당신은 임대차 계약서 전문 분석가입니다. 계약서의 위험요소와 확인사항을 정확히 분석하여 JSON 형식으로 제공합니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1500
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
    
    def _get_rag_context_for_analysis(self, contract_text: str) -> str:
        """
        RAG 시스템에서 계약서 분석용 컨텍스트 수집
        
        Args:
            contract_text: 계약서 텍스트
            
        Returns:
            str: 분석용 법률 컨텍스트
        """
        if not self.rag_system:
            return "RAG 시스템이 사용 불가능합니다."
        
        try:
            # 다양한 관점에서 관련 정보 수집
            contexts = []
            
            # 1. 일반적인 계약서 분석 정보
            general_results = self.rag_system.embedder.search_similar(
                "임대차 계약서 체크리스트 필수 확인사항", top_k=2, threshold=0.4
            )
            
            # 2. 위험 조항 관련 정보  
            risk_results = self.rag_system.embedder.search_similar(
                "위험 조항 불공정 약관 임차인 불리", top_k=2, threshold=0.4
            )
            
            # 3. 법률 근거 정보
            legal_results = self.rag_system.embedder.search_similar(
                "주택임대차보호법 민법 임대차 조항", top_k=2, threshold=0.4
            )
            
            # 4. 계약서 내용 기반 구체적 검색
            contract_specific = self.rag_system.embedder.search_similar(
                contract_text[:150], top_k=1, threshold=0.4
            )
            
            all_results = general_results + risk_results + legal_results + contract_specific
            
            # 중복 제거 및 상위 결과 선택 (토큰 절약을 위해 5개로 제한)
            seen_content = set()
            unique_results = []
            for result in all_results:
                content_hash = hash(result['content'][:100])
                if content_hash not in seen_content and len(unique_results) < 5:
                    seen_content.add(content_hash)
                    unique_results.append(result)
            
            # 컨텍스트 구성
            if unique_results:
                contexts.append("【핵심 법률 정보】")
                for i, result in enumerate(unique_results, 1):
                    file_name = result['metadata'].get('file_name', '').replace('.md', '')
                    content = result['content'][:200]  # 200자로 제한
                    contexts.append(f"{i}. {file_name}: {content}")
                
                contexts.append("\n【분석 요구사항】")
                contexts.append("- 법적 근거를 포함한 구체적 분석")
                contexts.append("- 임차인 권리 보호 관점 적용")
                contexts.append("- JSON 형식 준수")
                
                return "\n".join(contexts)
            else:
                return "관련 법률 정보를 찾을 수 없습니다. 일반적인 계약서 분석을 진행합니다."
                
        except Exception as e:
            print(f"RAG 컨텍스트 수집 중 오류: {e}")
            return "RAG 컨텍스트 수집 중 오류가 발생했습니다. 기본 분석을 진행합니다."
    
    def enhance_with_rag(self, contract_text: str, basic_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        RAG 시스템을 통해 분석 결과 강화 (이제 GPT-4에 통합됨)
        
        Args:
            contract_text: 계약서 텍스트
            basic_analysis: 기본 AI 분석 결과 (이미 RAG 컨텍스트 포함)
            
        Returns:
            Dict: 분석 결과 (RAG가 이미 통합되어 추가 처리 불필요)
        """
        # RAG가 이미 GPT-4 분석 과정에 통합되어 추가 처리 불필요
        print("RAG 컨텍스트가 이미 AI 분석에 통합되어 있습니다.")
        return basic_analysis
    
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
            
            # 3. RAG 시스템 통합 완료 (이미 GPT-4 분석에 포함됨)
            if self.rag_system:
                print("RAG 시스템이 분석에 통합되었습니다.")
            else:
                print("RAG 시스템 없이 기본 GPT-4 분석을 사용합니다.")
            
            # 4. 새로운 형식으로 반환
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