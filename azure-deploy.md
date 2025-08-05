# Azure App Service 배포 설정

## 1. Azure Portal 설정

### Application Settings
- `PORT`: Azure가 자동으로 설정 (동적 포트)
- `SCM_DO_BUILD_DURING_DEPLOYMENT`: `true`

### Startup Command
Azure Portal > App Service > Configuration > General settings > Startup Command:
```
python -m uvicorn main:app --host 0.0.0.0 --port $PORT
```

## 2. 정적 파일 서빙 확인

FastAPI에서 정적 파일이 `/static` 경로로 마운트되어 있습니다:
```python
app.mount("/static", StaticFiles(directory="public"), name="static")
```

HTML 파일에서 CSS/JS 파일 경로가 올바르게 설정되어 있습니다:
- CSS: `/static/css/styles.css`
- JS: `/static/js/*.js`

## 3. 문제 해결

### 404 에러 해결
1. 정적 파일 경로가 `/static/`으로 시작하는지 확인
2. `public` 폴더가 프로젝트 루트에 있는지 확인
3. Azure Portal에서 startup command가 올바른지 확인

### 로그 확인
Azure Portal > App Service > Log stream에서 실시간 로그 확인