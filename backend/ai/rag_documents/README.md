# RAG Documents

이 디렉토리는 계약서 분석을 위한 RAG(Retrieval-Augmented Generation) 시스템에서 사용할 문서들을 저장합니다.

## 디렉토리 구조

```
rag_documents/
├── legal/              # 법률 관련 문서
│   ├── housing_act/    # 주택임대차보호법 관련
│   ├── civil_law/      # 민법 관련
│   └── consumer_law/   # 소비자보호법 관련
├── guidelines/         # 정부 가이드라인
│   ├── molit/          # 국토교통부 자료
│   ├── kab/            # 한국부동산원 자료
│   └── consumer_org/   # 소비자원 자료
├── cases/              # 판례 및 사례
│   ├── court_cases/    # 법원 판례
│   └── arbitration/    # 조정/중재 사례
├── templates/          # 계약서 템플릿 및 체크리스트
│   ├── standard/       # 표준 계약서
│   └── checklists/     # 체크리스트
└── processed/          # 처리된 문서 (벡터화용)
    ├── embeddings/     # 임베딩 파일
    └── chunks/         # 청크 단위로 분할된 텍스트
```

## 파일 형식

- **원본 문서**: `.txt`, `.md`, `.pdf`, `.html`
- **처리된 문서**: `.json`, `.pkl`, `.npy`
- **메타데이터**: `metadata.json`

## 사용 방법

1. 크롤링된 문서를 해당 카테고리 폴더에 저장
2. 전처리 스크립트로 텍스트 추출 및 청킹
3. 임베딩 생성 후 벡터 데이터베이스에 저장
4. 계약서 분석 시 관련 문서 검색 및 활용