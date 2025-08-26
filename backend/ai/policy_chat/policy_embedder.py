"""
정책 데이터 전용 임베딩 시스템
OpenAI text-embedding-3-small 사용
"""

import logging
from typing import List, Dict, Any
from openai import OpenAI
import numpy as np
import time

from .utils.api_key_manager import api_key_manager

logger = logging.getLogger(__name__)

class PolicyEmbedder:
    """정책 데이터 임베딩 생성"""
    
    def __init__(self):
        self.model = "text-embedding-3-small"
        self.dimension = 1536
        self._client = None
        
    def _get_client(self) -> OpenAI:
        """OpenAI 클라이언트 lazy 초기화"""
        if self._client is None:
            api_key = api_key_manager.get_openai_embedding_key()
            self._client = OpenAI(api_key=api_key)
        return self._client
    
    def embed_text(self, text: str) -> List[float]:
        """단일 텍스트 임베딩"""
        try:
            client = self._get_client()
            response = client.embeddings.create(
                model=self.model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Failed to embed text: {e}")
            raise
    
    def embed_batch(self, texts: List[str], batch_size: int = 100) -> List[List[float]]:
        """배치 임베딩 처리"""
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            try:
                client = self._get_client()
                response = client.embeddings.create(
                    model=self.model,
                    input=batch
                )
                
                batch_embeddings = [data.embedding for data in response.data]
                all_embeddings.extend(batch_embeddings)
                
                logger.info(f"Embedded batch {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}")
                
                # API 레이트 리밋 방지
                time.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Failed to embed batch {i}-{i+batch_size}: {e}")
                raise
        
        return all_embeddings
    
    def embed_policies(self, policies: List[Dict[str, Any]]) -> List[List[float]]:
        """정책 데이터를 임베딩용 텍스트로 변환 후 임베딩"""
        texts = []
        
        for policy in policies:
            # 정책 정보를 구조화된 텍스트로 변환
            text_parts = []
            
            if policy.get('title'):
                text_parts.append(f"제목: {policy['title']}")
            
            if policy.get('organization'):
                text_parts.append(f"기관: {policy['organization']}")
                
            if policy.get('category'):
                text_parts.append(f"분야: {policy['category']}")
                
            if policy.get('target'):
                text_parts.append(f"대상: {policy['target']}")
                
            if policy.get('content'):
                text_parts.append(f"내용: {policy['content']}")
                
            if policy.get('region'):
                text_parts.append(f"지역: {policy['region']}")
            
            # 상세 정보도 포함
            if policy.get('details') and isinstance(policy['details'], dict):
                details = policy['details']
                if details.get('explanation'):
                    text_parts.append(f"설명: {details['explanation']}")
                if details.get('application_method'):
                    text_parts.append(f"신청방법: {details['application_method']}")
                if details.get('income_condition'):
                    text_parts.append(f"소득조건: {details['income_condition']}")
            
            combined_text = "\\n".join(text_parts)
            texts.append(combined_text)
        
        logger.info(f"Converting {len(policies)} policies to embeddings...")
        return self.embed_batch(texts)