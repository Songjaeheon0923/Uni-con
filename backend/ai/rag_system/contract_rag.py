"""
계약서 분석용 RAG 시스템
임베딩 검색을 통한 관련 법률 정보 제공
"""
import json
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path

from .vector_embedder import VectorEmbedder

# 로거 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ContractRAGSystem:
    """계약서 분석용 RAG 시스템"""
    
    def __init__(self, documents_path: str = "ai/rag_documents"):
        self.embedder = VectorEmbedder(documents_path)
        self.documents_path = Path(documents_path)
        
        # 카테고리별 가중치
        self.category_weights = {
            "legal": 1.2,           # 법률 문서는 높은 가중치
            "templates": 1.1,       # 체크리스트도 중요
            "guidelines": 1.0,      # 가이드라인은 기본 가중치
            "cases": 0.9           # 판례는 참고용
        }
        
        # 임베딩 로드
        self._initialize()
    
    def _initialize(self):
        """RAG 시스템 초기화"""
        if not self.embedder.load_latest_embeddings():
            logger.warning("No pre-generated embeddings found. Please generate embeddings first.")
    
    def analyze_contract_clause(
        self, 
        clause_text: str,
        analysis_type: str = "general"
    ) -> Dict[str, Any]:
        """계약 조항 분석"""
        
        # 분석 타입별 검색 쿼리 생성
        search_queries = self._generate_search_queries(clause_text, analysis_type)
        
        # 각 쿼리로 검색 수행
        all_results = []
        for query in search_queries:
            results = self.embedder.search_similar(query, top_k=3, threshold=0.3)
            all_results.extend(results)
        
        # 결과 정리 및 중복 제거
        processed_results = self._process_search_results(all_results)
        
        # 분석 결과 생성
        analysis = self._generate_analysis(clause_text, processed_results, analysis_type)
        
        return analysis
    
    def _generate_search_queries(self, clause_text: str, analysis_type: str) -> List[str]:
        """분석 타입에 따른 검색 쿼리 생성"""
        
        base_query = clause_text[:200]  # 조항 텍스트 일부
        
        queries = [base_query]
        
        if analysis_type == "risk_assessment":
            queries.extend([
                f"위험 조항 {base_query[:50]}",
                f"불공정 약관 {base_query[:50]}",
                "계약서 위험 요소",
                "임차인 불리한 조항"
            ])
        
        elif analysis_type == "legal_compliance":
            queries.extend([
                f"법령 위반 {base_query[:50]}",
                "주택임대차보호법 위반",
                "민법 임대차 조항",
                "계약서 법적 문제"
            ])
        
        elif analysis_type == "tenant_rights":
            queries.extend([
                "임차인 권리",
                "보증금 보호",
                "계약갱신청구권",
                "임대료 인상 제한"
            ])
        
        elif analysis_type == "standard_check":
            queries.extend([
                "표준 계약서",
                "필수 기재사항",
                "계약서 체크리스트",
                "누락된 조항"
            ])
        
        else:  # general
            queries.extend([
                "계약서 분석",
                "임대차 계약",
                "주의사항",
                "관련 법령"
            ])
        
        return queries[:5]  # 최대 5개 쿼리
    
    def _process_search_results(self, results: List[Dict]) -> List[Dict]:
        """검색 결과 처리 및 정리"""
        
        # 중복 제거 (content 기준)
        seen_content = set()
        unique_results = []
        
        for result in results:
            content_hash = hash(result['content'][:100])
            if content_hash not in seen_content:
                seen_content.add(content_hash)
                unique_results.append(result)
        
        # 카테고리별 가중치 적용
        for result in unique_results:
            category = result['metadata'].get('category', 'unknown')
            weight = self.category_weights.get(category, 1.0)
            result['weighted_score'] = result['similarity_score'] * weight
        
        # 가중 점수로 정렬
        unique_results.sort(key=lambda x: x['weighted_score'], reverse=True)
        
        return unique_results[:10]  # 상위 10개만 반환
    
    def _generate_analysis(
        self, 
        clause_text: str, 
        search_results: List[Dict], 
        analysis_type: str
    ) -> Dict[str, Any]:
        """분석 결과 생성"""
        
        if not search_results:
            return {
                "clause_text": clause_text,
                "analysis_type": analysis_type,
                "risk_level": "unknown",
                "findings": [],
                "recommendations": [],
                "related_laws": [],
                "confidence": 0.0
            }
        
        # 관련 법령 추출
        related_laws = []
        findings = []
        recommendations = []
        risk_indicators = []
        
        for result in search_results:
            metadata = result['metadata']
            content = result['content']
            score = result['weighted_score']
            
            # 카테고리별 분석
            if metadata['category'] == 'legal':
                if 'housing_act' in metadata['subcategory']:
                    related_laws.append("주택임대차보호법")
                elif 'civil_law' in metadata['subcategory']:
                    related_laws.append("민법")
            
            # 위험 조항 탐지
            if 'dangerous' in metadata['file_name'] or '위험' in content:
                risk_indicators.append({
                    "type": "위험조항",
                    "content": content[:200],
                    "confidence": score
                })
            
            # 권리 관련 정보
            if 'rights' in metadata['file_name'] or '권리' in content:
                findings.append({
                    "type": "권리정보",
                    "content": content[:200],
                    "confidence": score
                })
            
            # 체크리스트 항목
            if 'checklist' in metadata['file_name']:
                recommendations.append({
                    "type": "권장사항",
                    "content": content[:200],
                    "confidence": score
                })
        
        # 위험도 평가
        risk_level = self._assess_risk_level(clause_text, risk_indicators)
        
        # 전체 신뢰도 계산
        avg_confidence = sum(r['weighted_score'] for r in search_results) / len(search_results)
        
        return {
            "clause_text": clause_text,
            "analysis_type": analysis_type,
            "risk_level": risk_level,
            "findings": findings,
            "recommendations": recommendations,
            "related_laws": list(set(related_laws)),
            "risk_indicators": risk_indicators,
            "confidence": round(avg_confidence, 3),
            "search_results_count": len(search_results)
        }
    
    def _assess_risk_level(self, clause_text: str, risk_indicators: List[Dict]) -> str:
        """위험도 평가"""
        
        # 위험 키워드 검사
        high_risk_keywords = [
            "보증금 반환 거부", "일방적", "임대인 재량", 
            "언제든", "즉시 퇴거", "위약금"
        ]
        
        medium_risk_keywords = [
            "수리비 부담", "관리비", "현상복구", 
            "특별약정", "별도 협의"
        ]
        
        clause_lower = clause_text.lower()
        
        # 고위험 키워드 체크
        high_risk_count = sum(1 for keyword in high_risk_keywords if keyword in clause_text)
        medium_risk_count = sum(1 for keyword in medium_risk_keywords if keyword in clause_text)
        
        # 위험 지표 점수
        risk_score = len(risk_indicators) * 0.3 + high_risk_count * 0.4 + medium_risk_count * 0.2
        
        if risk_score >= 1.0:
            return "high"
        elif risk_score >= 0.5:
            return "medium"
        else:
            return "low"
    
    def get_contract_recommendations(self, contract_text: str) -> Dict[str, Any]:
        """전체 계약서에 대한 종합 권장사항"""
        
        # 계약서 체크리스트 검색
        checklist_results = self.embedder.search_similar(
            "계약서 체크리스트 필수 확인사항", 
            top_k=5
        )
        
        # 위험 조항 검색
        risk_results = self.embedder.search_similar(
            "위험 조항 불공정 약관", 
            top_k=5
        )
        
        # 임차인 권리 정보 검색
        rights_results = self.embedder.search_similar(
            "임차인 권리 보호", 
            top_k=5
        )
        
        recommendations = {
            "checklist_items": [r['content'][:200] for r in checklist_results],
            "risk_warnings": [r['content'][:200] for r in risk_results],
            "tenant_rights": [r['content'][:200] for r in rights_results],
            "overall_assessment": self._assess_contract_completeness(contract_text)
        }
        
        return recommendations
    
    def _assess_contract_completeness(self, contract_text: str) -> Dict[str, Any]:
        """계약서 완성도 평가"""
        
        # 필수 항목 체크
        required_items = [
            ("당사자 정보", ["임대인", "임차인", "성명", "주소"]),
            ("목적물 표시", ["소재지", "면적", "층"]),
            ("계약 조건", ["보증금", "월세", "계약기간"]),
            ("특약 사항", ["특약", "약정"])
        ]
        
        completeness_score = 0
        missing_items = []
        
        for item_name, keywords in required_items:
            found = any(keyword in contract_text for keyword in keywords)
            if found:
                completeness_score += 25
            else:
                missing_items.append(item_name)
        
        return {
            "completeness_score": completeness_score,
            "missing_items": missing_items,
            "assessment": "완전" if completeness_score >= 75 else "보완필요"
        }


def main():
    """RAG 시스템 테스트"""
    rag_system = ContractRAGSystem()
    
    # 테스트 조항
    test_clause = """
    보증금은 임대인의 사정에 따라 분할하여 반환할 수 있으며, 
    임차인이 이사를 간 후 3개월 이내에 반환한다.
    """
    
    print("🔍 계약 조항 분석 테스트")
    print(f"조항: {test_clause.strip()}")
    
    # 위험 평가
    result = rag_system.analyze_contract_clause(test_clause, "risk_assessment")
    
    print(f"\n📊 분석 결과:")
    print(f"위험도: {result['risk_level']}")
    print(f"신뢰도: {result['confidence']}")
    print(f"관련 법령: {result['related_laws']}")
    print(f"위험 지표: {len(result['risk_indicators'])}개")


if __name__ == "__main__":
    main()