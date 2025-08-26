"""
FAISS 벡터 스토어를 사용한 정책 임베딩 저장/검색
"""

import logging
import os
import pickle
from typing import List, Dict, Any, Optional
import faiss
import numpy as np
from pathlib import Path

from .policy_embedder import PolicyEmbedder

logger = logging.getLogger(__name__)

class PolicyVectorStore:
    """FAISS 기반 정책 벡터 스토어"""
    
    def __init__(self, store_path: str = "policy_vectors"):
        self.store_path = Path(store_path)
        self.store_path.mkdir(exist_ok=True)
        
        self.embedder = PolicyEmbedder()
        self.dimension = self.embedder.dimension
        
        # FAISS 인덱스와 메타데이터
        self.index = None
        self.policy_metadata = []
        
        # 저장 파일 경로
        self.index_file = self.store_path / "faiss.index"
        self.metadata_file = self.store_path / "metadata.pkl"
        
        # 기존 인덱스 로드
        self._load_index()
    
    def _load_index(self):
        """기존 FAISS 인덱스와 메타데이터 로드"""
        try:
            if self.index_file.exists() and self.metadata_file.exists():
                # FAISS 인덱스 로드
                self.index = faiss.read_index(str(self.index_file))
                
                # 메타데이터 로드
                with open(self.metadata_file, 'rb') as f:
                    self.policy_metadata = pickle.load(f)
                
                logger.info(f"Loaded existing index with {len(self.policy_metadata)} policies")
            else:
                # 새 인덱스 생성
                self.index = faiss.IndexFlatIP(self.dimension)  # 내적 유사도
                self.policy_metadata = []
                logger.info("Created new FAISS index")
                
        except Exception as e:
            logger.error(f"Failed to load index: {e}")
            # 새 인덱스로 폴백
            self.index = faiss.IndexFlatIP(self.dimension)
            self.policy_metadata = []
    
    def _save_index(self):
        """FAISS 인덱스와 메타데이터 저장"""
        try:
            # FAISS 인덱스 저장
            faiss.write_index(self.index, str(self.index_file))
            
            # 메타데이터 저장
            with open(self.metadata_file, 'wb') as f:
                pickle.dump(self.policy_metadata, f)
            
            logger.info("Saved FAISS index and metadata")
            
        except Exception as e:
            logger.error(f"Failed to save index: {e}")
            raise
    
    def add_policies(self, policies: List[Dict[str, Any]]):
        """정책 데이터 추가"""
        if not policies:
            return
        
        logger.info(f"Adding {len(policies)} policies to vector store...")
        
        try:
            # 임베딩 생성
            embeddings = self.embedder.embed_policies(policies)
            
            # numpy 배열로 변환 (FAISS 요구사항)
            embeddings_np = np.array(embeddings, dtype=np.float32)
            
            # 정규화 (내적 유사도를 코사인 유사도로 변환)
            faiss.normalize_L2(embeddings_np)
            
            # FAISS 인덱스에 추가
            self.index.add(embeddings_np)
            
            # 메타데이터 추가
            for policy in policies:
                metadata = {
                    'id': policy.get('id'),
                    'title': policy.get('title'),
                    'organization': policy.get('organization'),
                    'category': policy.get('category'),
                    'target': policy.get('target'),
                    'region': policy.get('region'),
                    'content': policy.get('content', '')[:500],  # 내용은 500자만
                    'details': policy.get('details', {})
                }
                self.policy_metadata.append(metadata)
            
            # 저장
            self._save_index()
            
            logger.info(f"Successfully added {len(policies)} policies")
            
        except Exception as e:
            logger.error(f"Failed to add policies: {e}")
            raise
    
    def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """쿼리로 유사한 정책 검색"""
        if not query.strip():
            return []
        
        try:
            # 쿼리 임베딩
            query_embedding = self.embedder.embed_text(query)
            query_np = np.array([query_embedding], dtype=np.float32)
            
            # 정규화
            faiss.normalize_L2(query_np)
            
            # 검색
            scores, indices = self.index.search(query_np, k)
            
            # 결과 구성
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx < len(self.policy_metadata):
                    metadata = self.policy_metadata[idx].copy()
                    metadata['similarity_score'] = float(score)
                    results.append(metadata)
            
            logger.info(f"Found {len(results)} similar policies for query: {query[:50]}...")
            return results
            
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return []
    
    def get_policy_count(self) -> int:
        """저장된 정책 수 반환"""
        return len(self.policy_metadata)
    
    def clear(self):
        """모든 데이터 삭제"""
        try:
            self.index = faiss.IndexFlatIP(self.dimension)
            self.policy_metadata = []
            
            # 파일 삭제
            if self.index_file.exists():
                self.index_file.unlink()
            if self.metadata_file.exists():
                self.metadata_file.unlink()
            
            logger.info("Cleared vector store")
            
        except Exception as e:
            logger.error(f"Failed to clear vector store: {e}")
            raise

# 전역 인스턴스
policy_vector_store = PolicyVectorStore()