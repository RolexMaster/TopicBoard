# Azure App Service 배포 가이드

## 🚀 Azure 배포 설정

### 1. Azure Portal 설정

#### Application Settings
Azure Portal > App Service > Configuration > Application settings에서 다음 설정:

| 설정 이름 | 값 | 설명 |
|-----------|-----|------|
| `PORT` | (자동 설정) | Azure가 자동으로 동적 포트 할당 |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` | 배포 시 빌드 활성화 |
| `ENVIRONMENT` | `production` | 프로덕션 환경 설정 |

#### Startup Command
Azure Portal > App Service > Configuration > General settings > Startup Command:
```
python run_server.py
```

또는 직접 uvicorn 사용:
```
python -m uvicorn main:app --host 0.0.0.0 --port $PORT --reload false
```

### 2. 포트 설정 확인

#### 로컬 개발 (포트 8000)
```python
# main.py
port = int(os.environ.get("PORT", 8000))  # 로컬: 8000, Azure: $PORT
```

#### Azure 배포 (동적 포트)
```python
# run_server.py
port = os.environ.get("PORT", "8000")  # Azure가 자동으로 포트 할당
```

### 3. Yjs WebSocket 연결

#### 클라이언트 설정
```javascript
// public/js/collaboration_unified.js
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsHost = window.location.host;  // Azure에서 자동으로 올바른 호스트/포트
const wsUrl = `${wsProtocol}//${wsHost}/yjs-websocket`;
```

#### 서버 설정
```python
# main.py - Azure에서 자동으로 올바른 포트 사용
uvicorn.run(
    "main:app",
    host="0.0.0.0",
    port=port,  # Azure 환경변수 PORT 사용
    reload=False,  # Azure에서는 reload=False
    log_level="info"
)
```

### 4. 정적 파일 서빙

FastAPI에서 정적 파일이 올바르게 마운트되어 있습니다:
```python
app.mount("/static", StaticFiles(directory="public"), name="static")
```

HTML 파일에서 CSS/JS 경로:
- CSS: `/static/css/styles.css`
- JS: `/static/js/*.js`

### 5. 배포 확인 사항

#### ✅ 필수 확인
1. **포트 설정**: Azure 환경변수 `PORT` 사용
2. **정적 파일**: `/static/` 경로로 마운트
3. **WebSocket**: `wss://` 프로토콜 사용 (HTTPS)
4. **Yjs 연결**: 상대 경로 `/yjs-websocket` 사용

#### 🔧 문제 해결

##### 404 에러
```bash
# 정적 파일 경로 확인
curl https://your-app.azurewebsites.net/static/css/styles.css
```

##### WebSocket 연결 실패
```javascript
// 브라우저 개발자 도구에서 확인
console.log('WebSocket URL:', wsUrl);
```

##### 로그 확인
Azure Portal > App Service > Log stream에서 실시간 로그 확인

### 6. 환경별 설정

#### 로컬 개발
```bash
# 포트 8000 사용
python3 main.py
# 또는
python run_server.py
```

#### Azure 배포
```bash
# Azure가 자동으로 포트 할당
# 환경변수 PORT 사용
# HTTPS 자동 적용
```

### 7. 성능 최적화

#### Azure App Service 설정
- **Always On**: `true` (무료 티어에서는 제한적)
- **Platform**: Python 3.9+
- **Stack**: Python

#### 코드 최적화
```python
# Azure에서는 reload=False 사용
reload=False  # 프로덕션에서는 자동 재시작 비활성화

# 로그 레벨 조정
log_level="info"  # 프로덕션에서는 info 또는 warning
```

### 8. 보안 설정

#### HTTPS 강제
Azure App Service에서 자동으로 HTTPS 적용

#### CORS 설정
```python
# main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 9. 모니터링

#### Azure Application Insights
- 성능 모니터링
- 오류 추적
- 사용자 행동 분석

#### 로그 확인
```bash
# Azure Portal에서 실시간 로그 확인
# 또는 Azure CLI 사용
az webapp log tail --name your-app-name --resource-group your-resource-group
```

### 10. 배포 후 테스트

#### 기본 기능 테스트
1. **메인 페이지**: `https://your-app.azurewebsites.net/`
2. **Yjs 테스트**: `https://your-app.azurewebsites.net/test_yjs`
3. **API 테스트**: `https://your-app.azurewebsites.net/api/applications`

#### 실시간 협업 테스트
1. **브라우저 1**: 메인 페이지 접속
2. **브라우저 2**: 메인 페이지 접속
3. **동시 편집**: 실시간 동기화 확인

---

## 🎯 결론

Azure 배포 시에는:
- ✅ **포트**: 환경변수 `PORT` 자동 사용
- ✅ **HTTPS**: 자동 적용
- ✅ **WebSocket**: `wss://` 프로토콜 사용
- ✅ **정적 파일**: `/static/` 경로로 서빙
- ✅ **Yjs 협업**: Python 서버에서 직접 처리

**Node.js 서버 없이도 Python 하나로 모든 기능이 Azure에서 정상 작동합니다!**