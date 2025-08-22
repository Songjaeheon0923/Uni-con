"""
RAG 시스템용 문서 처리 모듈
"""
import os
import json
from typing import List, Dict, Any
from pathlib import Path


class DocumentProcessor:
    """문서 전처리 및 청킹을 담당하는 클래스"""
    
    def __init__(self, documents_path: str = "rag_documents"):
        self.documents_path = Path(documents_path)
        self.processed_path = self.documents_path / "processed"
        
    def chunk_text(self, text: str, chunk_size: int = 512, overlap: int = 50) -> List[str]:
        """텍스트를 청크 단위로 분할"""
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            
            # 문장 경계에서 자르기 (가능한 경우)
            if end < len(text) and not text[end].isspace():
                last_period = chunk.rfind('.')
                last_newline = chunk.rfind('\n')
                cut_point = max(last_period, last_newline)
                
                if cut_point > start + chunk_size // 2:
                    chunk = text[start:cut_point + 1]
                    end = cut_point + 1
            
            chunks.append(chunk.strip())
            start = end - overlap
            
        return chunks
    
    def extract_metadata(self, file_path: Path) -> Dict[str, Any]:
        """파일로부터 메타데이터 추출"""
        relative_path = file_path.relative_to(self.documents_path)
        category = str(relative_path.parts[0]) if relative_path.parts else "unknown"
        subcategory = str(relative_path.parts[1]) if len(relative_path.parts) > 1 else "unknown"
        
        return {
            "file_path": str(file_path),
            "relative_path": str(relative_path),
            "category": category,
            "subcategory": subcategory,
            "file_name": file_path.name,
            "file_size": file_path.stat().st_size,
            "last_modified": file_path.stat().st_mtime
        }
    
    def process_document(self, file_path: Path) -> List[Dict[str, Any]]:
        """단일 문서를 처리하여 청크와 메타데이터 반환"""
        if not file_path.exists():
            return []
        
        # 텍스트 파일 읽기
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"Error reading file {file_path}: {e}")
            return []
        
        # 텍스트 청킹
        chunks = self.chunk_text(content)
        
        # 메타데이터 추출
        metadata = self.extract_metadata(file_path)
        
        # 청크별 문서 생성
        documents = []
        for i, chunk in enumerate(chunks):
            doc = {
                "content": chunk,
                "metadata": {
                    **metadata,
                    "chunk_id": i,
                    "total_chunks": len(chunks)
                }
            }
            documents.append(doc)
        
        return documents
    
    def get_all_documents(self) -> List[Path]:
        """모든 문서 파일 경로 반환"""
        documents = []
        
        for root, dirs, files in os.walk(self.documents_path):
            # processed 폴더는 제외
            if "processed" in root:
                continue
                
            for file in files:
                if file.endswith(('.md', '.txt')):
                    documents.append(Path(root) / file)
        
        return documents