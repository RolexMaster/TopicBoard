# ZeroMQ Topic Manager (Python Edition) 🐍

**Python + Yjs 기반 실시간 협업 XML 편집기**

## 📋 개요

ZeroMQ Topic Manager는 .proto 파일 기반으로 정의된 메시지를 사용하는 ZeroMQ 기반 통신 시스템에서 각 응용프로그램이 사용하는 토픽 정보를 XML 문서로 구조화하여 관리하는 도구입니다. 

**Python FastAPI + pycrdt**를 활용하여 여러 사용자가 실시간으로 협업하며 XML 문서를 편집하고 다양한 언어의 코드를 자동 생성할 수 있습니다.

## ✨ 주요 기능

### 🔧 핵심 기능
- **🐍 Python 백엔드**: FastAPI + pycrdt + uvicorn
- **🔄 실시간 협업**: Yjs와 완전 호환되는 pycrdt 사용
- **🌳 트리 UI**: jsTree 기반의 직관적인 계층 구조 편집
- **📝 XML 관리**: lxml 기반 고급 XML 처리
- **⚡ 코드 생성**: Python, C++, Java, C#, Go, Rust 지원
- **🛡️ 충돌 방지**: CRDT 기반 자동 충돌 해결

### 📊 XML 구조
```xml
<Applications xmlns="http://zeromq-topic-manager/schema" version="1.0">
  <Application name="VideoViewer" description="비디오 뷰어 응용프로그램">
    <Topic name="PTZ_CONTROL" proto="ptz_ctl.proto" direction="publish" description="PTZ 제어 명령"/>
    <Topic name="PTZ_STATUS" proto="ptz_info.proto" direction="subscribe" description="PTZ 상태 정보"/>
  </Application>
</Applications>
```

## 🚀 시작하기

### 사전 요구사항
- **Python 3.8+** (추천: Python 3.10+)
- **pip** (Python 패키지 관리자)

### 설치 및 실행

1. **프로젝트 클론**
```bash
git clone <repository-url>
cd zeromq-topic-manager
```

2. **Python 의존성 설치**
```bash
pip install -r requirements.txt
```

3. **Python 서버 시작**
```bash
python main.py
```

또는

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

4. **브라우저에서 접속**
```
http://localhost:8000
```

## 🏗️ 시스템 아키텍처

### 기술 스택
- **Backend**: 
  - 🐍 **Python 3.8+**
  - ⚡ **FastAPI** - 현대적 웹 프레임워크
  - 🔄 **pycrdt** - Yjs 호환 CRDT 라이브러리
  - 📡 **WebSocket** - 실시간 통신
  - 🔍 **lxml** - 고성능 XML 처리
  - ✅ **Pydantic** - 데이터 검증

- **Frontend**: 
  - 🌐 **HTML5, CSS3, JavaScript (ES6+)**
  - 🎨 **Bootstrap 5** - UI 프레임워크
  - 🌳 **jsTree** - 트리 구조 편집
  - 🔄 **Yjs** - 실시간 협업 (JavaScript)
  - ⚡ **WebSocket** - 실시간 통신

### 디렉토리 구조
```
zeromq-topic-manager/
├── main.py                   # 🐍 Python FastAPI 메인 서버
├── requirements.txt          # 📦 Python 의존성
├── models/
│   └── xml_schema.py        # 📄 고급 XML 스키마 모델
├── public/                  # 🌐 프론트엔드 파일들
│   ├── index.html          # 📱 메인 HTML
│   ├── css/
│   │   └── styles.css      # 🎨 커스텀 스타일
│   └── js/
│       ├── app.js          # 🚀 메인 애플리케이션
│       ├── collaboration.js # 🤝 Yjs 협업 관리
│       ├── user_websocket.js # 👥 사용자 상태 관리
│       ├── treeEditor.js   # 🌳 트리 편집기
│       └── xmlManager.js   # 📝 XML 관리 및 코드 생성
└── README.md               # 📚 프로젝트 문서
```

## 🎯 사용법

### 1. 응용프로그램 추가
- 좌측 상단의 **"App"** 버튼 클릭
- 응용프로그램 이름과 설명 입력
- **"추가"** 버튼으로 생성 완료

### 2. 토픽 추가
- 응용프로그램 선택 후 **"Topic"** 버튼 클릭
- 토픽 이름, proto 파일, 방향(publish/subscribe), 설명 입력
- **"추가"** 버튼으로 생성 완료

### 3. 속성 편집
- 트리에서 항목 선택
- 우측 속성 패널에서 정보 수정
- **"저장"** 버튼으로 변경사항 적용

### 4. 코드 생성 (향상된 기능!)
- 상단 코드 생성 버튼(**<>**) 클릭
- 언어 선택: **Python, C++, Java, C#, Go, Rust**
- 대상 응용프로그램, 옵션 선택
- **"코드 생성"** 버튼으로 자동 생성
- 복사 또는 파일 다운로드 가능

### 5. XML 내보내기
- 상단 다운로드 버튼 클릭
- XML 파일 자동 다운로드

## ⌨️ 키보드 단축키

- `Ctrl + S`: XML 저장
- `Ctrl + E`: XML 내보내기
- `Ctrl + G`: 코드 생성 모달 열기
- `Delete`: 선택된 노드 삭제
- `F2`: 응용프로그램 이름 변경

## 🔄 실시간 협업

### 🤝 동시 편집 지원
- **여러 사용자** 동시 편집 가능
- **실시간 변경사항** 즉시 동기화
- **사용자별 색상** 구분 표시
- **CRDT 기반** 자동 충돌 해결

### 📊 협업 상태 확인
- 우측 상단에서 **현재 접속 사용자 수** 확인
- 사용자 목록에서 **접속자 정보** 표시
- 하단 **연결 상태** 실시간 표시

## 🛠️ Python 개발 및 확장

### 개발 명령어
```bash
# 개발 서버 (자동 재시작)
uvicorn main:app --reload

# 프로덕션 서버
python main.py

# 의존성 설치
pip install -r requirements.txt

# 새 의존성 추가 후 저장
pip freeze > requirements.txt
```

### 🧩 모듈 구조

#### `main.py` - 메인 서버
- **FastAPI** 애플리케이션
- **pycrdt** 기반 Yjs 호환 협업
- **WebSocket** 엔드포인트
- **REST API** 라우팅

#### `models/xml_schema.py` - 고급 XML 처리
- **XMLSchemaValidator**: 스키마 검증
- **XMLProcessor**: lxml 기반 XML 처리
- **CodeGenerator**: 다중 언어 코드 생성
- **XMLSchemaManager**: 통합 관리

### 🚀 코드 생성 확장

새로운 언어 지원을 위해 `models/xml_schema.py`의 `CodeGenerator` 클래스에 메서드 추가:

```python
def _generate_new_language_code(self, applications, include_comments, include_examples):
    """새로운 언어 코드 생성"""
    # 구현 로직
    return generated_code
```

### 🔧 XML 스키마 확장

`models/xml_schema.py`에서 새로운 요소나 속성 추가:

```python
def validate_custom_element(self, element: dict) -> List[str]:
    """커스텀 요소 검증"""
    # 검증 로직
    return errors
```

## 🔧 설정

### 서버 포트 변경
```bash
# 환경변수로 설정
PORT=9000 python main.py

# 또는 main.py에서 직접 수정
uvicorn.run("main:app", host="0.0.0.0", port=9000, reload=True)
```

### WebSocket 엔드포인트 변경
`main.py`와 `public/js/collaboration.js`에서 동일하게 수정:

```python
# main.py
@app.websocket("/custom-yjs-websocket")

# public/js/collaboration.js
this.provider = new Y.WebsocketProvider('ws://localhost:8000/custom-yjs-websocket', ...);
```

## 🌟 Python 버전의 장점

### 🚀 성능 및 확장성
- **FastAPI**: 높은 성능의 비동기 웹 프레임워크
- **pycrdt**: C++ 기반 고성능 CRDT 구현
- **lxml**: 빠른 XML 처리
- **Type Hints**: 런타임 오류 사전 방지

### 🔧 개발 경험
- **자동 문서화**: FastAPI의 OpenAPI 자동 생성
- **타입 안전성**: Pydantic 기반 데이터 검증
- **Hot Reload**: 개발 중 자동 서버 재시작
- **디버깅**: Python의 풍부한 디버깅 도구

### 📈 확장 가능성
- **AI/ML 통합**: scikit-learn, TensorFlow 등 쉬운 연동
- **데이터 분석**: pandas, numpy 활용
- **데이터베이스**: SQLAlchemy, MongoDB 등 ORM 지원
- **클라우드**: Docker, Kubernetes 배포 최적화

## 🐛 문제 해결

### 연결 문제
1. **방화벽 확인**: 포트 8000 허용 여부
2. **Python 서버 상태**: `python main.py` 로그 확인
3. **WebSocket 연결**: 브라우저 개발자 도구 네트워크 탭 확인

### 협업 동기화 문제
1. **페이지 새로고침**: F5 또는 Ctrl+R
2. **브라우저 캐시 삭제**: Ctrl+Shift+Delete
3. **pycrdt 버전 확인**: `pip show pycrdt`

### Python 의존성 문제
```bash
# 가상환경 생성 (권장)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 또는
venv\Scripts\activate     # Windows

# 의존성 재설치
pip install -r requirements.txt
```

## 📚 API 문서

Python 서버 실행 후 자동 생성되는 API 문서:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🧪 테스트

```bash
# API 테스트
curl -X GET http://localhost:8000/api/applications

# WebSocket 테스트 (JavaScript 콘솔)
const ws = new WebSocket('ws://localhost:8000/yjs-websocket');
```

## 📝 라이선스

MIT License - 자세한 내용은 LICENSE 파일을 확인하세요.

## 🤝 기여하기

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원

문제나 질문이 있으시면 Issue를 생성해 주세요.

---

## 🔄 Node.js → Python 마이그레이션 완료! 

**이전 버전**: Node.js + Express + Socket.IO  
**현재 버전**: Python + FastAPI + pycrdt + WebSocket

### 주요 개선사항:
- ✅ **Yjs 완전 호환**: pycrdt 사용
- ✅ **향상된 XML 처리**: lxml + xmltodict
- ✅ **타입 안전성**: Pydantic + Type Hints  
- ✅ **자동 API 문서**: FastAPI OpenAPI
- ✅ **확장된 코드 생성**: 6개 언어 지원
- ✅ **모든 기존 기능 유지**: 실시간 협업, 트리 UI, 코드 생성

**ZeroMQ Topic Manager (Python Edition)** - 더 강력하고 확장 가능한 실시간 협업 XML 편집기! 🚀
