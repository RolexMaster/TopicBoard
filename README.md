# TopicBoard

토픽 기반 시스템 설계를 보드처럼 협업

## 📋 프로젝트 개요

TopicBoard는 토픽 기반 협업 시스템으로, 다양한 주제별로 보드 형태의 협업 공간을 제공합니다. 칸반 보드 방식을 통해 팀원들이 효율적으로 작업을 관리하고 진행 상황을 추적할 수 있습니다.

## 🚀 주요 기능

### 토픽 관리
- **토픽 생성**: 주제별 협업 공간 생성
- **멤버 관리**: 토픽별 멤버 초대 및 역할 관리 (관리자/멤버/뷰어)
- **카테고리**: 토픽 내 작업 분류를 위한 카테고리 시스템

### 보드 시스템
- **칸반 보드**: To Do, In Progress, Done 등 컬럼 기반 작업 관리
- **드래그 앤 드롭**: 카드 이동을 위한 직관적인 인터페이스
- **카드 관리**: 작업 항목 생성, 수정, 삭제
- **댓글 시스템**: 카드별 댓글을 통한 소통

### 사용자 관리
- **회원가입/로그인**: 기본 사용자 인증 시스템
- **프로필 관리**: 사용자별 활동 내역 확인
- **권한 관리**: 토픽별 접근 권한 제어

## 🛠 기술 스택

- **Backend**: Django 4.2.7
- **API**: Django REST Framework 3.14.0
- **Database**: SQLite (개발용)
- **Frontend**: Bootstrap 5, jQuery
- **Authentication**: Django 기본 인증 시스템
- **Deployment**: Azure Web App (GitHub Actions)

## 📁 프로젝트 구조

```
TopicBoard/
├── topicboard/          # Django 프로젝트 설정
│   ├── settings.py      # 프로젝트 설정
│   ├── urls.py          # 메인 URL 설정
│   └── wsgi.py          # WSGI 설정
├── topics/              # 토픽 관리 앱
│   ├── models.py        # 토픽, 멤버, 카테고리 모델
│   ├── views.py         # 토픽 관련 뷰
│   ├── api_views.py     # 토픽 API 뷰
│   └── serializers.py   # 토픽 시리얼라이저
├── boards/              # 보드 관리 앱
│   ├── models.py        # 보드, 컬럼, 카드 모델
│   ├── views.py         # 보드 관련 뷰
│   ├── api_views.py     # 보드 API 뷰
│   └── serializers.py   # 보드 시리얼라이저
├── users/               # 사용자 관리 앱
│   ├── views.py         # 사용자 인증 뷰
│   └── urls.py          # 사용자 URL 설정
├── templates/           # HTML 템플릿
│   ├── base.html        # 기본 템플릿
│   ├── boards/          # 보드 관련 템플릿
│   └── users/           # 사용자 관련 템플릿
├── static/              # 정적 파일
├── media/               # 업로드 파일
└── requirements.txt     # Python 의존성
```

## 🚀 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd TopicBoard
```

### 2. 가상환경 생성 및 활성화
```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# 또는
venv\Scripts\activate     # Windows
```

### 3. 의존성 설치
```bash
pip install -r requirements.txt
```

### 4. 데이터베이스 마이그레이션
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. 슈퍼유저 생성
```bash
python manage.py createsuperuser
```

### 6. 개발 서버 실행
```bash
python manage.py runserver
```

### 7. 브라우저에서 접속
```
http://localhost:8000
```

## 🔧 기본 계정

- **관리자 계정**: admin / admin123
- **관리자 페이지**: http://localhost:8000/admin/

## 📚 API 문서

### 토픽 API
- `GET /api/topics/` - 토픽 목록
- `POST /api/topics/` - 토픽 생성
- `GET /api/topics/{id}/` - 토픽 상세
- `PUT /api/topics/{id}/` - 토픽 수정
- `DELETE /api/topics/{id}/` - 토픽 삭제

### 보드 API
- `GET /api/boards/` - 보드 목록
- `POST /api/boards/` - 보드 생성
- `GET /api/boards/{id}/` - 보드 상세
- `PUT /api/boards/{id}/` - 보드 수정
- `DELETE /api/boards/{id}/` - 보드 삭제

### 카드 API
- `GET /api/boards/{board_id}/cards/` - 카드 목록
- `POST /api/boards/{board_id}/cards/` - 카드 생성
- `GET /api/boards/{board_id}/cards/{id}/` - 카드 상세
- `PUT /api/boards/{board_id}/cards/{id}/` - 카드 수정
- `DELETE /api/boards/{board_id}/cards/{id}/` - 카드 삭제

## 🎯 사용 방법

### 1. 토픽 생성
1. 로그인 후 "새 토픽 만들기" 클릭
2. 토픽명과 설명 입력
3. 토픽 생성 완료

### 2. 멤버 초대
1. 토픽 상세 페이지에서 "멤버 관리" 클릭
2. 사용자명과 역할 선택하여 멤버 추가

### 3. 보드 생성
1. 토픽 내에서 "새 보드 만들기" 클릭
2. 보드명과 설명 입력
3. 기본 컬럼(To Do, In Progress, Done)이 자동 생성됨

### 4. 카드 생성
1. 보드 페이지에서 "새 카드" 클릭
2. 카드 제목, 설명, 담당자, 우선순위 등 입력
3. 카드가 해당 컬럼에 추가됨

### 5. 카드 이동
1. 보드에서 카드를 드래그하여 다른 컬럼으로 이동
2. 실시간으로 진행 상황 업데이트

## 🔒 보안

- Django 기본 보안 기능 활용
- CSRF 토큰 보호
- 사용자 인증 및 권한 관리
- 토픽별 접근 권한 제어

## 🚀 배포

### Azure Web App 배포
- GitHub Actions를 통한 자동 배포
- Azure Web App 서비스 활용
- PostgreSQL 데이터베이스 사용 (프로덕션)

### 환경 변수 설정
```bash
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.
