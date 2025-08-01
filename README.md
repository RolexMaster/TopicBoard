# ZeroMQ Topic Manager

실시간 협업이 가능한 XML 기반 ZeroMQ 토픽 관리 시스템

## 📋 개요

ZeroMQ Topic Manager는 .proto 파일 기반으로 정의된 메시지를 사용하는 ZeroMQ 기반 통신 시스템에서 각 응용프로그램이 사용하는 토픽 정보를 XML 문서로 구조화하여 관리하는 도구입니다. 여러 사용자가 실시간으로 협업하여 XML 문서를 편집하고 코드를 자동 생성할 수 있습니다.

## ✨ 주요 기능

### 🔧 핵심 기능
- **실시간 협업**: Yjs를 활용한 여러 사용자 동시 편집
- **트리 UI**: jsTree 기반의 직관적인 계층 구조 편집
- **XML 관리**: 구조화된 XML 스키마로 토픽 정보 관리
- **코드 생성**: C++, Python, Java, C# 다중 언어 코드 자동 생성
- **충돌 방지**: 실시간 동기화 및 부분 업데이트 지원

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
- Node.js 16.0 이상
- npm 또는 yarn

### 설치 및 실행

1. **프로젝트 클론**
```bash
git clone <repository-url>
cd zeromq-topic-manager
```

2. **의존성 설치**
```bash
npm install
```

3. **개발 서버 시작**
```bash
npm run dev
```

4. **브라우저에서 접속**
```
http://localhost:3000
```

## 🏗️ 시스템 아키텍처

### 기술 스택
- **Backend**: Node.js, Express, Socket.IO, Yjs WebSocket
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), jQuery
- **UI Framework**: Bootstrap 5, jsTree, Font Awesome
- **실시간 협업**: Yjs, y-websocket
- **XML 처리**: xmlbuilder2, xml2js

### 디렉토리 구조
```
zeromq-topic-manager/
├── server.js                 # 메인 서버 파일
├── package.json              # 프로젝트 설정
├── models/
│   └── XMLSchema.js          # XML 스키마 모델
├── public/
│   ├── index.html           # 메인 HTML 파일
│   ├── css/
│   │   └── styles.css       # 커스텀 스타일
│   └── js/
│       ├── app.js           # 메인 애플리케이션
│       ├── collaboration.js  # 실시간 협업 관리
│       ├── treeEditor.js    # 트리 편집기
│       └── xmlManager.js    # XML 관리 및 코드 생성
└── README.md                # 프로젝트 문서
```

## 🎯 사용법

### 1. 응용프로그램 추가
- 좌측 상단의 "App" 버튼 클릭
- 응용프로그램 이름과 설명 입력
- "추가" 버튼으로 생성 완료

### 2. 토픽 추가
- 응용프로그램 선택 후 "Topic" 버튼 클릭
- 토픽 이름, proto 파일, 방향(publish/subscribe), 설명 입력
- "추가" 버튼으로 생성 완료

### 3. 속성 편집
- 트리에서 항목 선택
- 우측 속성 패널에서 정보 수정
- "저장" 버튼으로 변경사항 적용

### 4. 코드 생성
- 상단 코드 생성 버튼(<>) 클릭
- 언어, 대상 응용프로그램, 옵션 선택
- "코드 생성" 버튼으로 자동 생성
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

### 동시 편집 지원
- 여러 사용자가 동시에 편집 가능
- 실시간 변경사항 동기화
- 사용자별 색상 구분 표시
- 충돌 자동 해결

### 협업 상태 확인
- 우측 상단에서 현재 접속 사용자 수 확인
- 사용자 목록에서 접속자 정보 표시
- 하단 연결 상태 표시기

## 🛠️ 개발 및 확장

### 개발 명령어
```bash
# 개발 서버 (자동 재시작)
npm run dev

# 프로덕션 서버
npm start

# 테스트 실행
npm test

# 빌드
npm run build
```

### 코드 생성 템플릿 추가
새로운 언어 지원을 위해 `public/js/xmlManager.js`의 `generateCode()` 메서드에 case를 추가하고 해당 언어의 생성 함수를 구현하세요.

### XML 스키마 확장
`models/XMLSchema.js`에서 새로운 요소나 속성을 추가할 수 있습니다.

## 🔧 설정

### 서버 포트 변경
```bash
# 환경변수로 설정
PORT=8080 npm start

# 또는 server.js에서 직접 수정
const PORT = process.env.PORT || 3000;
```

### Yjs WebSocket 포트 변경
`server.js`와 `public/js/collaboration.js`에서 포트 번호를 동일하게 수정하세요.

## 🐛 문제 해결

### 연결 문제
1. 방화벽에서 포트 3000, 1234 허용 확인
2. WebSocket 연결 상태 확인
3. 브라우저 개발자 도구에서 네트워크 탭 확인

### 협업 동기화 문제
1. 페이지 새로고침 시도
2. 브라우저 캐시 삭제
3. 다른 브라우저/시크릿 모드에서 테스트

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

**ZeroMQ Topic Manager** - 실시간 협업 XML 편집을 통한 효율적인 토픽 관리
