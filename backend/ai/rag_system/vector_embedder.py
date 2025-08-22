"""
벡터 임베딩 생성 시스템
한국어 텍스트를 위한 임베딩 생성 및 검색 기능 제공
"""
import os
import json
import pickle
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Tuple
from datetime import datetime
import logging

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    print("Warning: sentence-transformers not installed. Please install with: pip install sentence-transformers")

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    print("Warning: faiss not installed. Please install with: pip install faiss-cpu")

from .document_processor import DocumentProcessor

# 로거 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VectorEmbedder:
    """벡터 임베딩 생성 및 관리 클래스"""
    
    def __init__(
        self, 
        documents_path: str = "ai/rag_documents",
        model_name: str = "all-MiniLM-L6-v2"
    ):
        self.documents_path = Path(documents_path)
        self.processed_path = self.documents_path / "processed"
        self.embeddings_path = self.processed_path / "embeddings"
        self.chunks_path = self.processed_path / "chunks"
        
        # 디렉토리 생성
        self.embeddings_path.mkdir(parents=True, exist_ok=True)
        self.chunks_path.mkdir(parents=True, exist_ok=True)
        
        # 모델 설정
        self.model_name = model_name
        self.model = None
        self.index = None
        self.documents = []
        
        # 메타데이터 경로
        self.metadata_path = self.processed_path / "metadata.json"
        
        # 먼저 기존 임베딩 로드 시도
        if not self.load_latest_embeddings():
            # 기존 임베딩이 없으면 모델 로드
            self._load_model()
        else:
            logger.info("Existing embeddings loaded, model loading skipped for now")
    
    def _load_model(self):
        """임베딩 모델 로드"""
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            logger.error("sentence-transformers not available")
            return
            
        try:
            logger.info(f"Loading model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            # 대안 모델들을 순서대로 시도
            alternative_models = [
                'paraphrase-multilingual-MiniLM-L12-v2',
                'all-MiniLM-L6-v2', 
                'distiluse-base-multilingual-cased'
            ]
            
            for alt_model in alternative_models:
                try:
                    logger.info(f"Trying alternative model: {alt_model}")
                    self.model = SentenceTransformer(alt_model)
                    self.model_name = alt_model
                    logger.info(f"Successfully loaded: {alt_model}")
                    break
                except Exception as e2:
                    logger.error(f"Error loading {alt_model}: {e2}")
                    continue
            
            if not self.model:
                logger.error("All model loading attempts failed")
    
    def process_all_documents(self) -> Dict[str, Any]:
        """모든 문서를 처리하여 임베딩 생성"""
        if not self.model:
            return {"success": False, "error": "Model not available"}
        
        logger.info("Starting document processing...")
        
        # 문서 프로세서 초기화
        processor = DocumentProcessor(str(self.documents_path))
        
        # 모든 문서 파일 가져오기
        document_files = processor.get_all_documents()
        
        if not document_files:
            return {"success": False, "error": "No documents found"}
        
        all_chunks = []
        chunk_metadata = []
        
        # 각 문서 처리
        for doc_file in document_files:
            logger.info(f"Processing: {doc_file}")
            
            try:
                # 문서를 청크로 분할
                chunks = processor.process_document(doc_file)
                
                for chunk_data in chunks:
                    all_chunks.append(chunk_data['content'])
                    chunk_metadata.append(chunk_data['metadata'])
                    
            except Exception as e:
                logger.error(f"Error processing {doc_file}: {e}")
                continue
        
        if not all_chunks:
            return {"success": False, "error": "No valid chunks created"}
        
        logger.info(f"Total chunks created: {len(all_chunks)}")
        
        # 임베딩 생성
        try:
            logger.info("Generating embeddings...")
            embeddings = self.model.encode(
                all_chunks,
                batch_size=32,
                show_progress_bar=True,
                convert_to_numpy=True
            )
            logger.info(f"Generated embeddings shape: {embeddings.shape}")
            
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            return {"success": False, "error": f"Embedding generation failed: {e}"}
        
        # 결과 저장
        result = self._save_embeddings(embeddings, all_chunks, chunk_metadata)
        
        if result["success"]:
            # 메타데이터 업데이트
            self._update_metadata(len(all_chunks), len(document_files))
        
        return result
    
    def _save_embeddings(
        self, 
        embeddings: np.ndarray, 
        chunks: List[str], 
        metadata: List[Dict]
    ) -> Dict[str, Any]:
        """임베딩과 관련 데이터 저장"""
        try:
            # 현재 시간 스탬프
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            # 임베딩 저장 (numpy 형식)
            embeddings_file = self.embeddings_path / f"embeddings_{timestamp}.npy"
            np.save(embeddings_file, embeddings)
            
            # 청크 텍스트 저장
            chunks_file = self.chunks_path / f"chunks_{timestamp}.json"
            with open(chunks_file, 'w', encoding='utf-8') as f:
                json.dump(chunks, f, ensure_ascii=False, indent=2)
            
            # 메타데이터 저장
            metadata_file = self.chunks_path / f"metadata_{timestamp}.json"
            with open(metadata_file, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
            
            # FAISS 인덱스 생성 및 저장
            if FAISS_AVAILABLE:
                try:
                    index = faiss.IndexFlatIP(embeddings.shape[1])  # 코사인 유사도용
                    
                    # L2 정규화 (코사인 유사도를 위해)
                    embeddings_normalized = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
                    index.add(embeddings_normalized.astype('float32'))
                    
                    index_file = self.embeddings_path / f"faiss_index_{timestamp}.index"
                    faiss.write_index(index, str(index_file))
                    
                    logger.info(f"FAISS index saved: {index_file}")
                except Exception as e:
                    logger.warning(f"FAISS index creation failed: {e}")
            
            # 최신 파일 정보 저장
            latest_info = {
                "timestamp": timestamp,
                "embeddings_file": str(embeddings_file),
                "chunks_file": str(chunks_file),
                "metadata_file": str(metadata_file),
                "embedding_shape": embeddings.shape,
                "model_name": self.model_name,
                "total_chunks": len(chunks)
            }
            
            latest_file = self.processed_path / "latest.json"
            with open(latest_file, 'w', encoding='utf-8') as f:
                json.dump(latest_info, f, ensure_ascii=False, indent=2)
            
            logger.info("Embeddings saved successfully")
            return {
                "success": True,
                "timestamp": timestamp,
                "total_chunks": len(chunks),
                "embedding_dimension": embeddings.shape[1],
                "files": latest_info
            }
            
        except Exception as e:
            logger.error(f"Error saving embeddings: {e}")
            return {"success": False, "error": f"Save failed: {e}"}
    
    def load_latest_embeddings(self) -> bool:
        """최신 임베딩 데이터 로드"""
        try:
            latest_file = self.processed_path / "latest.json"
            if not latest_file.exists():
                logger.warning("No latest embeddings found")
                return False
            
            with open(latest_file, 'r', encoding='utf-8') as f:
                latest_info = json.load(f)
            
            # 임베딩 로드
            embeddings = np.load(latest_info["embeddings_file"])
            
            # 청크 텍스트 로드
            with open(latest_info["chunks_file"], 'r', encoding='utf-8') as f:
                chunks = json.load(f)
            
            # 메타데이터 로드
            with open(latest_info["metadata_file"], 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            # FAISS 인덱스 로드
            if FAISS_AVAILABLE:
                index_pattern = f"faiss_index_{latest_info['timestamp']}.index"
                index_files = list(self.embeddings_path.glob(index_pattern))
                if index_files:
                    self.index = faiss.read_index(str(index_files[0]))
            
            # 클래스 변수에 저장
            self.embeddings = embeddings
            self.documents = chunks
            self.document_metadata = metadata
            
            logger.info(f"Loaded embeddings: {embeddings.shape}")
            return True
            
        except Exception as e:
            logger.error(f"Error loading embeddings: {e}")
            return False
    
    def search_similar(
        self, 
        query: str, 
        top_k: int = 5,
        threshold: float = 0.3
    ) -> List[Dict[str, Any]]:
        """유사한 문서 청크 검색"""
        if not hasattr(self, 'embeddings') or not hasattr(self, 'documents'):
            if not self.load_latest_embeddings():
                logger.error("No embeddings available for search")
                return []
        
        # 모델이 없으면 지금 로드
        if not self.model:
            self._load_model()
            if not self.model:
                logger.error("Model loading failed during search")
                return []
        
        try:
            # 쿼리 임베딩 생성
            query_embedding = self.model.encode([query], convert_to_numpy=True)
            query_normalized = query_embedding / np.linalg.norm(query_embedding)
            
            if FAISS_AVAILABLE and self.index:
                # FAISS를 사용한 빠른 검색
                scores, indices = self.index.search(query_normalized.astype('float32'), top_k)
                
                results = []
                for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
                    if score >= threshold:  # 임계값 이상만 반환
                        results.append({
                            "content": self.documents[idx],
                            "metadata": self.document_metadata[idx],
                            "similarity_score": float(score),
                            "rank": i + 1
                        })
                
            else:
                # numpy를 사용한 직접 계산
                embeddings_normalized = self.embeddings / np.linalg.norm(self.embeddings, axis=1, keepdims=True)
                similarities = np.dot(embeddings_normalized, query_normalized.T).flatten()
                
                # 상위 k개 결과 선택
                top_indices = np.argsort(similarities)[::-1][:top_k]
                
                results = []
                for i, idx in enumerate(top_indices):
                    score = similarities[idx]
                    if score >= threshold:
                        results.append({
                            "content": self.documents[idx],
                            "metadata": self.document_metadata[idx],
                            "similarity_score": float(score),
                            "rank": i + 1
                        })
            
            logger.info(f"Search query: '{query}' - Found {len(results)} results")
            return results
            
        except Exception as e:
            logger.error(f"Error during search: {e}")
            return []
    
    def _update_metadata(self, total_chunks: int, total_documents: int):
        """메타데이터 파일 업데이트"""
        try:
            # 기존 메타데이터 로드
            if self.metadata_path.exists():
                with open(self.metadata_path, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
            else:
                metadata = {
                    "version": "1.0.0",
                    "categories": {},
                    "processing_status": {},
                    "embedding_config": {}
                }
            
            # 업데이트
            metadata.update({
                "last_updated": datetime.now().isoformat(),
                "total_documents": total_documents,
                "processing_status": {
                    "raw_documents": total_documents,
                    "processed_documents": total_documents,
                    "total_chunks": total_chunks,
                    "embeddings_generated": total_chunks,
                    "indexed_documents": total_chunks
                },
                "embedding_config": {
                    "model": self.model_name,
                    "chunk_size": 512,
                    "chunk_overlap": 50,
                    "vector_dimension": getattr(self, 'embeddings', np.array([[]])).shape[-1] if hasattr(self, 'embeddings') else 384
                }
            })
            
            # 저장
            with open(self.metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
                
        except Exception as e:
            logger.error(f"Error updating metadata: {e}")


def main():
    """임베딩 생성 실행"""
    embedder = VectorEmbedder()
    
    print("Starting embedding generation...")
    result = embedder.process_all_documents()
    
    if result["success"]:
        print(f"✅ Embeddings generated successfully!")
        print(f"📊 Total chunks: {result['total_chunks']}")
        print(f"📐 Embedding dimension: {result['embedding_dimension']}")
        print(f"⏰ Timestamp: {result['timestamp']}")
        
        # 테스트 검색
        print("\n🔍 Testing search functionality...")
        test_results = embedder.search_similar("보증금 반환", top_k=3)
        
        for i, result in enumerate(test_results, 1):
            print(f"\n{i}. 유사도: {result['similarity_score']:.3f}")
            print(f"   파일: {result['metadata']['file_name']}")
            print(f"   내용: {result['content'][:100]}...")
    
    else:
        print(f"❌ Error: {result['error']}")


if __name__ == "__main__":
    main()