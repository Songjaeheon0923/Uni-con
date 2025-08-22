#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
벡터 임베딩 생성 실행 스크립트 (간단 버전)
"""
import sys
import os
from pathlib import Path

# 현재 디렉토리를 Python 경로에 추가
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

def main():
    try:
        from ai.rag_system.vector_embedder import VectorEmbedder
        from ai.rag_system.contract_rag import ContractRAGSystem
    except ImportError as e:
        print(f"Import error: {e}")
        print("필요한 패키지를 설치해주세요: pip install sentence-transformers faiss-cpu")
        return

    print("=" * 50)
    print("RAG 시스템 임베딩 생성")
    print("=" * 50)
    
    # 문서 확인
    docs_path = Path("ai/rag_documents")
    if not docs_path.exists():
        print("문서 디렉토리가 없습니다:", docs_path)
        return
    
    doc_files = list(docs_path.glob("**/*.md"))
    print(f"발견된 문서: {len(doc_files)}개")
    
    # 임베딩 생성
    print("\n임베딩 생성 중...")
    embedder = VectorEmbedder(documents_path="ai/rag_documents")
    result = embedder.process_all_documents()
    
    if result["success"]:
        print("성공!")
        print(f"총 청크 수: {result['total_chunks']}")
        print(f"임베딩 차원: {result['embedding_dimension']}")
        
        # 간단한 테스트
        print("\n검색 테스트...")
        test_results = embedder.search_similar("보증금 반환", top_k=2)
        if test_results:
            print(f"검색 결과: {len(test_results)}개")
            for i, r in enumerate(test_results, 1):
                print(f"{i}. {r['metadata']['file_name']} (유사도: {r['similarity_score']:.3f})")
        
        print("\n완료! RAG 시스템을 사용할 수 있습니다.")
    else:
        print(f"실패: {result['error']}")

if __name__ == "__main__":
    main()